import { auth } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import { Api } from "@/models/api";
import { ApiLog } from "@/models/api-log";
import { Project } from "@/models/project";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

/**
 * GET /api/logs/[id]
 * Fetches historical logs for a specific API monitor.
 * Secured by session and project ownership.
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get("limit") || "50");
        const page = parseInt(searchParams.get("page") || "1");
        const skip = (page - 1) * limit;

        await connectToDatabase();

        // 1. Verify API exists and user owns the parent project
        const api = await Api.findById(id);
        if (!api) {
            return NextResponse.json({ error: "API monitor not found" }, { status: 404 });
        }

        const project = await Project.findOne({ _id: api.projectId, userId: session.user.id });
        if (!project) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // 2. Fetch logs with pagination
        const logs = await ApiLog.find({ apiId: id })
            .sort({ checkedAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await ApiLog.countDocuments({ apiId: id });

        // 3. Optional: Fetch timeline data (last 90 checks)
        let timeline = null;
        if (searchParams.get("includeTimeline") === "true") {
            const rawTimeline = await ApiLog.find({ apiId: id })
                .sort({ checkedAt: -1 })
                .limit(90)
                .select("checkedAt outcome")
                .lean();

            // Map to the same format as the old uptime endpoint
            timeline = rawTimeline.reverse().map(log => ({
                timestamp: log.checkedAt,
                status: log.outcome === "success" ? "success" : "error"
            }));

            // Add inactive padding if needed
            if (timeline.length < 90) {
                const padding = Array(90 - timeline.length).fill({
                    timestamp: null,
                    status: "inactive"
                });
                timeline = [...padding, ...timeline];
            }
        }

        return NextResponse.json({
            logs,
            timeline,
            meta: {
                status: api.status,
                totalSuccess: api.totalSuccess,
                totalFails: api.totalFails,
                consecutiveFails: api.consecutiveFails,
                interval: api.interval,
            },
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error: any) {
        console.error("Fetch logs error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
