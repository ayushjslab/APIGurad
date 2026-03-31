import { auth } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import { Plan } from "@/models/plan";
import { Api } from "@/models/api";
import { Project } from "@/models/project";
import { getOrCreatePlan } from "@/lib/plan-utils";
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
        const plan = await getOrCreatePlan(userId);

        // 1. Fetch all projects for the user
        const projects = await Project.find({ userId }).lean();
        const projectIds = projects.map(p => p._id);

        // 2. Fetch all APIs for these projects
        const apis = await Api.find({ projectId: { $in: projectIds } }).lean();

        // 3. Calculate Monitor Status Distribution
        const statusDistribution = {
            healthy: 0,
            down: 0,
            disabled: 0,
            pending: 0
        };

        let totalSuccess = 0;
        let totalFails = 0;

        apis.forEach(api => {
            const status = api.status as keyof typeof statusDistribution;
            if (statusDistribution[status] !== undefined) {
                statusDistribution[status]++;
            }
            totalSuccess += (api.totalSuccess || 0);
            totalFails += (api.totalFails || 0);
        });

        // 4. Map projects to their monitor health summary
        const projectsWithStats = projects.map(project => {
            const projectApis = apis.filter(a => a.projectId.toString() === project._id.toString());
            return {
                _id: project._id,
                name: project.name,
                createdAt: project.createdAt,
                monitorCount: projectApis.length,
                healthyCount: projectApis.filter(a => a.status === 'healthy').length,
                failingCount: projectApis.filter(a => a.status === 'down').length,
            };
        });

        return NextResponse.json({
            plan: {
                name: plan.plan,
                apiCredits: plan.apiCredits,
                projectCredits: plan.projectCredits,
                totalChecks: plan.totalChecks,
                usedChecks: plan.usedChecks,
                currentApis: apis.length,
                currentProjects: projects.length
            },
            stats: {
                totalMonitors: apis.length,
                totalProjects: projects.length,
                totalSuccess,
                totalFails,
                statusDistribution
            },
            projects: projectsWithStats
        });
    } catch (error: any) {
        console.error("Dashboard stats error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
