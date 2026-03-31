import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Api } from "@/models/api";
import { ApiLog } from "@/models/api-log";
import { Project } from "@/models/project";
import { Plan } from "@/models/plan";
import { getOrCreatePlan } from "@/lib/plan-utils";
import { Notification } from "@/models/notification";

const MAX_CONSECUTIVE_FAILS = 5;
const REQUEST_TIMEOUT_MS = 50_000; // 15 second timeout per API

export async function GET(req: NextRequest) {

    await connectToDatabase();

    // 1. Load all monitors that are NOT disabled
    const monitors = await Api.find({ status: { $ne: "disabled" } }).lean();

    if (monitors.length === 0) {
        return NextResponse.json({ message: "No active monitors", checked: 0 });
    }

    // 2. Resolve owner for each monitor and group them
    // This is necessary because limits are per-user (Plan)
    const monitorGroups: Record<string, any[]> = {};
    const projectCache: Record<string, string> = {}; // projectId -> userId

    for (const monitor of monitors) {
        let userId = projectCache[monitor.projectId.toString()];
        if (!userId) {
            const project = await Project.findById(monitor.projectId).select('userId').lean();
            if (project) {
                userId = project.userId.toString();
                projectCache[monitor.projectId.toString()] = userId;
            }
        }

        if (userId) {
            if (!monitorGroups[userId]) monitorGroups[userId] = [];
            monitorGroups[userId].push(monitor);
        }
    }

    // 3. Process each user group
    let totalHealthy = 0, totalFailed = 0, totalDisabled = 0, totalChecked = 0;

    // We process users in parallel but keep monitors within a user group manageable
    const userSummary = await Promise.all(Object.entries(monitorGroups).map(async ([userId, userMonitors]) => {
        const plan = await getOrCreatePlan(userId);

        // If user is out of credits, skip all their monitors
        if (plan.usedChecks >= plan.totalChecks) {
            return { checked: 0, healthy: 0, failed: 0, disabled: 0, skipped: userMonitors.length };
        }

        // Only run as many checks as they have remaining
        const remaining = plan.totalChecks - plan.usedChecks;
        const toCheck = userMonitors.slice(0, remaining);
        const skippedDueToLimit = userMonitors.length - toCheck.length;

        const results = await Promise.allSettled(
            toCheck.map((monitor) => checkMonitor(monitor, userId))
        );

        let healthy = 0, failed = 0, disabled = 0;
        for (const r of results) {
            if (r.status === "fulfilled") {
                if (r.value.newStatus === "healthy") healthy++;
                else if (r.value.newStatus === "disabled") disabled++;
                else failed++;
            } else {
                failed++;
            }
        }

        // Update plan usage
        await Plan.findByIdAndUpdate(plan._id, { $inc: { usedChecks: toCheck.length } });

        return { checked: toCheck.length, healthy, failed, disabled, skipped: skippedDueToLimit };
    }));

    for (const s of userSummary) {
        totalChecked += s.checked;
        totalHealthy += s.healthy;
        totalFailed += s.failed;
        totalDisabled += s.disabled;
    }

    return NextResponse.json({
        checked: totalChecked,
        healthy: totalHealthy,
        failed: totalFailed,
        disabled: totalDisabled,
        timestamp: new Date().toISOString(),
        userGroups: Object.keys(monitorGroups).length
    });
}

// ─── Core Check Logic ──────────────────────────────────────────────────────────

interface MonitorDoc {
    _id: any;
    name: string;
    projectId: any;
    url: string;
    method: string;
    headers?: Record<string, string>;
    body?: any;
    expectedStatus: number;
    expectedResponseStructure?: any;
    consecutiveFails: number;
    totalSuccess: number;
    totalFails: number;
    status: string;
}

interface CheckResult {
    apiId: string;
    newStatus: "healthy" | "down" | "disabled";
}

async function checkMonitor(monitor: MonitorDoc, userId: string): Promise<CheckResult> {
    const start = Date.now();
    let httpStatus: number | undefined;
    let responseBody = "";
    let errorMessage: string | undefined;
    let outcome: "success" | "error" = "error";
    let statusMatched = false;
    let structureMatched: boolean | undefined;

    try {
        // Build fetch options
        const fetchOptions: RequestInit = {
            method: monitor.method,
            headers: {
                "Content-Type": "application/json",
                ...(monitor.headers ?? {}),
            },
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        };

        if (monitor.body && ["POST", "PUT", "PATCH"].includes(monitor.method)) {
            fetchOptions.body = typeof monitor.body === "string"
                ? monitor.body
                : JSON.stringify(monitor.body);
        }

        console.log(fetchOptions, monitor.url);

        const response = await fetch(monitor.url, fetchOptions);
        httpStatus = response.status;
        statusMatched = httpStatus === monitor.expectedStatus;

        const rawText = await response.text().catch(() => "");

        // Validate JSON structure if configured
        if (monitor.expectedResponseStructure) {
            try {
                const parsed = JSON.parse(rawText);
                structureMatched = keysMatch(monitor.expectedResponseStructure, parsed);
            } catch {
                structureMatched = false;
            }
        } else {
            structureMatched = true; // no structure requirement — always passes
        }

        const isSuccess = statusMatched && structureMatched;
        outcome = isSuccess ? "success" : "error";

        if (!isSuccess) {
            // Truncate response body to 4KB max when storing errors
            responseBody = rawText.slice(0, 4096);
            errorMessage = !statusMatched
                ? `Expected status ${monitor.expectedStatus}, got ${httpStatus}`
                : "Response structure did not match expected schema";
        }
    } catch (err: any) {
        errorMessage = err?.message ?? "Unknown fetch error";
        httpStatus = undefined;
        outcome = "error";
    }

    const responseTimeMs = Date.now() - start;
    const isSuccess = outcome === "success";

    // ─── Compute new consecutive fail count ────────────────────────────────────
    const newConsecutiveFails = isSuccess ? 0 : (monitor.consecutiveFails ?? 0) + 1;
    const shouldDisable = newConsecutiveFails >= MAX_CONSECUTIVE_FAILS;

    const newStatus = shouldDisable
        ? "disabled"
        : isSuccess
            ? "healthy"
            : "down";

    // ─── Persist ApiLog ────────────────────────────────────────────────────────
    const logEntry: any = {
        apiId: monitor._id,
        projectId: monitor.projectId,
        checkedAt: new Date(),
        outcome,
        httpStatus,
        responseTimeMs,
        statusMatched,
        structureMatched,
    };

    if (!isSuccess) {
        // Detailed log for failures (add error/body)
        Object.assign(logEntry, {
            ...(errorMessage ? { errorMessage } : {}),
            ...(responseBody ? { responseBody } : {}),
        });
    }

    // ─── Update Api document ───────────────────────────────────────────────────
    const updatePayload: Record<string, any> = {
        status: newStatus,
        lastChecked: new Date(),
        consecutiveFails: newConsecutiveFails,
        $inc: {
            totalSuccess: isSuccess ? 1 : 0,
            totalFails: isSuccess ? 0 : 1,
        },
    };

    if (httpStatus !== undefined) updatePayload.lastStatusCode = httpStatus;
    if (responseTimeMs) updatePayload.lastResponseTime = responseTimeMs;

    if (shouldDisable) {
        updatePayload.disabledAt = new Date();
        updatePayload.disabledReason = `Auto-disabled after ${MAX_CONSECUTIVE_FAILS} consecutive failures`;
    }

    // ─── Update Database ────────────────────────────────────────────────────────
    const dbOps: any[] = [
        Api.findByIdAndUpdate(monitor._id, updatePayload),
        ApiLog.create(logEntry) // Always save logs now
    ];

    // ─── Trigger Notifications for Status Changes ──────────────────────────────
    // We notify if it was healthy and now is down or disabled
    if (monitor.status === 'healthy' && (newStatus === 'down' || newStatus === 'disabled')) {
        dbOps.push(Notification.create({
            userId,
            type: 'error',
            title: `Monitor Down: ${monitor.name}`,
            message: `Your monitor for ${monitor.url} is now ${newStatus}. ${errorMessage || ''}`,
            link: `/logs/${monitor._id}`,
        }));
    } else if (newStatus === 'disabled' && monitor.status !== 'disabled') {
        // Specifically notify about auto-disabling if not already notified
        dbOps.push(Notification.create({
            userId,
            type: 'warning',
            title: `Monitor Auto-Disabled: ${monitor.name}`,
            message: `Monitor for ${monitor.url} has been auto-disabled after ${MAX_CONSECUTIVE_FAILS} consecutive failures.`,
            link: `/logs/${monitor._id}`,
        }));
    }

    await Promise.all(dbOps);

    return { apiId: monitor._id.toString(), newStatus };
}

// ─── Utility: Recursive key match ─────────────────────────────────────────────
/**
 * Checks that all keys in `expected` exist in `actual` (shallow+deep).
 * Doesn't require values to match, only structure (keys).
 */
function keysMatch(expected: any, actual: any): boolean {
    if (typeof expected !== "object" || expected === null) return true;
    if (typeof actual !== "object" || actual === null) return false;

    for (const key of Object.keys(expected)) {
        if (!(key in actual)) return false;
        if (typeof expected[key] === "object" && expected[key] !== null) {
            if (!keysMatch(expected[key], actual[key])) return false;
        }
    }
    return true;
}
