import { auth } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import { Project } from "@/models/project";
import { Plan } from "@/models/plan";
import { getOrCreatePlan } from "@/lib/plan-utils";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        await connectToDatabase();
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const projects = await Project.find({ userId: session.user.id }).sort({ createdAt: -1 });
        return NextResponse.json(projects);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await connectToDatabase();
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { name, description } = await req.json();

        if (!name) {
            return NextResponse.json({ error: "Project name is required" }, { status: 400 });
        }

        const plan = await getOrCreatePlan(session.user.id);
        const currentProjects = await Project.countDocuments({ userId: session.user.id });

        if (currentProjects >= plan.projectCredits) {
            return NextResponse.json({
                error: `Project limit reached. Your current plan allows only ${plan.projectCredits} project(s).`
            }, { status: 403 });
        }

        const project = await Project.create({
            userId: session.user.id,
            name,
            description,
        });

        return NextResponse.json(project, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
