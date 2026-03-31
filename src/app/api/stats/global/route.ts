import { auth } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import { Api } from "@/models/api";
import { ApiLog } from "@/models/api-log";
import { Project } from "@/models/project";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

export async function GET(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();
        const userId = session.user.id;

        // 1. Get user project IDs
        const projects = await Project.find({ userId }).select('_id').lean();
        const projectIds = projects.map(p => p._id);

        // 2. Trend Analysis (Last 7 Days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const trendData = await ApiLog.aggregate([
            {
                $match: {
                    projectId: { $in: projectIds },
                    checkedAt: { $gte: sevenDaysAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$checkedAt" } },
                    success: { $sum: { $cond: [{ $eq: ["$outcome", "success"] }, 1, 0] } },
                    failure: { $sum: { $cond: [{ $eq: ["$outcome", "error"] }, 1, 0] } }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        // 3. Latency Distribution
        const latencyDistribution = await ApiLog.aggregate([
            {
                $match: {
                    projectId: { $in: projectIds },
                    checkedAt: { $gte: sevenDaysAgo },
                    responseTimeMs: { $exists: true }
                }
            },
            {
                $bucket: {
                    groupBy: "$responseTimeMs",
                    boundaries: [0, 100, 300, 500, 1000, 5000],
                    default: "Other",
                    output: {
                        count: { $sum: 1 }
                    }
                }
            }
        ]);

        const latencyLabels: Record<any, string> = {
            0: "< 100ms",
            100: "100-300ms",
            300: "300-500ms",
            500: "500-1000ms",
            1000: "> 1s",
            "Other": "Slow/Timeout"
        };

        const formattedLatency = latencyDistribution.map(item => ({
            label: latencyLabels[item._id] || item._id,
            count: item.count
        }));

        // 4. Status Breakdown (Current)
        const statusDistribution = await Api.aggregate([
            { $match: { projectId: { $in: projectIds } } },
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        // 5. Performance Leaders (Fastest/Slowest)
        const performanceLeaders = await Api.find({
            projectId: { $in: projectIds },
            lastResponseTime: { $exists: true, $ne: null }
        })
            .sort({ lastResponseTime: 1 })
            .limit(5)
            .select('name lastResponseTime status')
            .lean();

        const performanceSlowest = await Api.find({
            projectId: { $in: projectIds },
            lastResponseTime: { $exists: true, $ne: null }
        })
            .sort({ lastResponseTime: -1 })
            .limit(5)
            .select('name lastResponseTime status')
            .lean();

        return NextResponse.json({
            trend: trendData.map(d => ({
                date: new Date(d._id).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                success: d.success,
                failure: d.failure
            })),
            latency: formattedLatency,
            status: statusDistribution.map(s => ({
                name: s._id.charAt(0).toUpperCase() + s._id.slice(1),
                value: s.count
            })),
            performance: {
                fastest: performanceLeaders,
                slowest: performanceSlowest
            }
        });

    } catch (error: any) {
        console.error("Global stats error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
