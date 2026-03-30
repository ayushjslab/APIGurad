import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Api } from "@/models/api";
import { ApiLog } from "@/models/api-log";

const MAX_CONSECUTIVE_FAILS = 5;
const REQUEST_TIMEOUT_MS = 15_000; // 15 second timeout per API

/**
 * POST /api/monitor/run
 *
 * The monitoring engine entry-point.
 * Authenticated via `x-cron-secret` header (not user session — this is called by GitHub Actions).
 * 
 * Flow:
 *  1. Validate secret
 *  2. Load all non-disabled API monitors
 *  3. Fan-out all checks in parallel (Promise.allSettled — fair, no starvation)
 *  4. Persist result in ApiLog + update Api document
 *  5. Return summary
 */
export async function POST(req: NextRequest) {
    const cronSecret = req.headers.get("x-cron-secret");
    if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    // Load all monitors that are NOT disabled
    const monitors = await Api.find({ status: { $ne: "disabled" } }).lean();

    if (monitors.length === 0) {
        return NextResponse.json({ message: "No active monitors", checked: 0 });
    }

    // Fan-out: check all monitors in parallel
    const results = await Promise.allSettled(
        monitors.map((monitor) => checkMonitor(monitor))
    );

    // Tally results
    let healthy = 0, failed = 0, disabled = 0;
    for (const r of results) {
        if (r.status === "fulfilled") {
            if (r.value.newStatus === "healthy") healthy++;
            else if (r.value.newStatus === "disabled") disabled++;
            else failed++;
        } else {
            failed++; // Promise itself rejected (shouldn't happen as checkMonitor catches internally)
        }
    }

    return NextResponse.json({
        checked: monitors.length,
        healthy,
        failed,
        disabled,
        timestamp: new Date().toISOString(),
    });
}

// ─── Core Check Logic ──────────────────────────────────────────────────────────

interface MonitorDoc {
    _id: any;
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
}

interface CheckResult {
    apiId: string;
    newStatus: "healthy" | "down" | "disabled";
}

async function checkMonitor(monitor: MonitorDoc): Promise<CheckResult> {
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
    const logEntry = {
        apiId: monitor._id,
        projectId: monitor.projectId,
        checkedAt: new Date(),
        outcome,
        httpStatus,
        responseTimeMs,
        statusMatched,
        structureMatched,
        ...(errorMessage ? { errorMessage } : {}),
        ...(responseBody ? { responseBody } : {}),
    };

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

    // Run both DB operations concurrently
    await Promise.all([
        ApiLog.create(logEntry),
        Api.findByIdAndUpdate(monitor._id, updatePayload),
    ]);

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
