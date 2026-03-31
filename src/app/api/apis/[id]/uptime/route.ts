import { auth } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import { Api } from "@/models/api";
import { ApiLog } from "@/models/api-log";
import { Project } from "@/models/project";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import mongoose from "mongoose";

const SLOT_COUNT = 90;

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

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
        }

        await connectToDatabase();

        // 1. Verify API exists and user owns the parent project
        const api = await Api.findById(id).lean();
        if (!api) {
            return NextResponse.json({ error: "API monitor not found" }, { status: 404 });
        }

        const project = await Project.findOne({ _id: api.projectId, userId: session.user.id });
        if (!project) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // 2. Fetch the last 90 logs directly (now that we store success logs)
        const logs = await ApiLog.find({ apiId: id })
            .sort({ checkedAt: -1 })
            .limit(SLOT_COUNT)
            .select('checkedAt outcome')
            .lean();

        // Reverse to show oldest to newest in the timeline (left to right)
        const timelineLogs = logs.reverse();

        // 3. Map logs to buckets
        // If we have fewer than 90 logs, the rest are "inactive" (at the beginning)
        const buckets = [];
        const paddingCount = Math.max(0, SLOT_COUNT - timelineLogs.length);

        // Add inactive padding for empty slots (before first check)
        for (let i = 0; i < paddingCount; i++) {
            buckets.push({
                timestamp: null,
                status: "inactive"
            });
        }

        // Add actual logs
        for (const log of timelineLogs) {
            buckets.push({
                timestamp: log.checkedAt,
                status: log.outcome === 'success' ? 'success' : 'error'
            });
        }

        return NextResponse.json({
            buckets,
            meta: {
                totalSuccess: api.totalSuccess,
                totalFails: api.totalFails,
                consecutiveFails: api.consecutiveFails,
                interval: api.interval,
                status: api.status,
                createdAt: api.createdAt
            }
        });
    } catch (error: any) {
        console.error("Fetch uptime error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
