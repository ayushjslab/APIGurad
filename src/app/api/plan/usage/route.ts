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

        const plan = await getOrCreatePlan(session.user.id);

        // Count actual resources to show current usage
        const userProjectIds = await Project.find({ userId: session.user.id }).distinct('_id');
        const apiCount = await Api.countDocuments({ projectId: { $in: userProjectIds } });
        const projectCount = userProjectIds.length;

        return NextResponse.json({
            plan: plan.plan,
            apiCredits: plan.apiCredits,
            projectCredits: plan.projectCredits,
            totalChecks: plan.totalChecks,
            usedChecks: plan.usedChecks,
            currentApis: apiCount,
            currentProjects: projectCount
        });
    } catch (error: any) {
        console.error("Fetch usage error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
