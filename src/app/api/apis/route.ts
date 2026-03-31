import { auth } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import { Api } from "@/models/api";
import { Project } from "@/models/project";
import { getOrCreatePlan } from "@/lib/plan-utils";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

export async function POST(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const {
            projectId,
            name,
            url,
            method,
            headers: apiHeaders,
            body: apiBody,
            expectedStatus,
            expectedResponseStructure,
            interval
        } = body;

        if (!projectId || !name || !url) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        await connectToDatabase();

        // Verify project belongs to user
        const project = await Project.findOne({ _id: projectId, userId: session.user.id });
        if (!project) {
            return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 });
        }

        const plan = await getOrCreatePlan(session.user.id);

        // Count all APIs across all projects owned by this user
        const userProjectIds = await Project.find({ userId: session.user.id }).distinct('_id');
        const apiCount = await Api.countDocuments({ projectId: { $in: userProjectIds } });

        if (apiCount >= plan.apiCredits) {
            return NextResponse.json({
                error: `Monitor limit reached. Your current plan allows only ${plan.apiCredits} monitor(s).`
            }, { status: 403 });
        }

        // Convert headers array to object for storage
        const headerMap: Record<string, string> = {};
        if (Array.isArray(apiHeaders)) {
            apiHeaders.forEach((h: { key: string; value: string }) => {
                if (h.key) {
                    headerMap[h.key] = h.value;
                }
            });
        }

        const newApi = await Api.create({
            projectId,
            name,
            url,
            method,
            headers: headerMap,
            body: apiBody ? JSON.parse(apiBody) : null,
            expectedStatus: parseInt(expectedStatus) || 200,
            expectedResponseStructure: expectedResponseStructure ? JSON.parse(expectedResponseStructure) : null,
            status: 'pending',
            interval: interval || '5min'
        });

        return NextResponse.json(newApi, { status: 201 });
    } catch (error: any) {
        console.error("API creation error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
export async function GET(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const projectId = searchParams.get("projectId");

        if (!projectId) {
            return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
        }

        await connectToDatabase();

        // Verify project belongs to user
        const project = await Project.findOne({ _id: projectId, userId: session.user.id });
        if (!project) {
            return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 });
        }

        const apis = await Api.find({ projectId }).sort({ createdAt: -1 });

        return NextResponse.json(apis);
    } catch (error: any) {
        console.error("API fetch error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
