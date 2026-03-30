import { auth } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import { Api } from "@/models/api";
import { Project } from "@/models/project";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

export async function PATCH(
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
        const body = await req.json();

        await connectToDatabase();

        // Find the API and verify project ownership
        const api = await Api.findById(id);
        if (!api) {
            return NextResponse.json({ error: "API monitor not found" }, { status: 404 });
        }

        const project = await Project.findOne({ _id: api.projectId, userId: session.user.id });
        if (!project) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Prepare update data
        const updateData: any = {
            name: body.name,
            url: body.url,
            method: body.method,
            expectedStatus: parseInt(body.expectedStatus) || 200,
        };

        if (body.headers) {
            const headerMap: Record<string, string> = {};
            body.headers.forEach((h: { key: string; value: string }) => {
                if (h.key) headerMap[h.key] = h.value;
            });
            updateData.headers = headerMap;
        }

        if (body.body) {
            try {
                updateData.body = JSON.parse(body.body);
            } catch (e) {
                return NextResponse.json({ error: "Invalid JSON in Request Body" }, { status: 400 });
            }
        } else {
            updateData.body = null;
        }

        if (body.expectedResponseStructure) {
            try {
                updateData.expectedResponseStructure = JSON.parse(body.expectedResponseStructure);
            } catch (e) {
                return NextResponse.json({ error: "Invalid JSON in Expected Structure" }, { status: 400 });
            }
        }

        const updatedApi = await Api.findByIdAndUpdate(id, updateData, { new: true });

        return NextResponse.json(updatedApi);
    } catch (error: any) {
        console.error("API update error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(
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

        await connectToDatabase();

        // Find the API
        const api = await Api.findById(id);
        if (!api) {
            return NextResponse.json({ error: "API monitor not found" }, { status: 404 });
        }

        // Verify project belongs to user
        const project = await Project.findOne({ _id: api.projectId, userId: session.user.id });
        if (!project) {
            return NextResponse.json({ error: "Unauthorized to delete this monitor" }, { status: 403 });
        }

        await Api.findByIdAndDelete(id);

        return NextResponse.json({ message: "API monitor deleted successfully" });
    } catch (error: any) {
        console.error("API delete error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
