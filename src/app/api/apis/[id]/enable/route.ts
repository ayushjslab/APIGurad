import { auth } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import { Api } from "@/models/api";
import { Project } from "@/models/project";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

/**
 * PATCH /api/apis/[id]/enable
 * Manual re-enable of a disabled API monitor by the project owner.
 * Resets consecutive fail counter and status back to "pending".
 */
export async function PATCH(
    _req: NextRequest,
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

        const api = await Api.findById(id);
        if (!api) {
            return NextResponse.json({ error: "API monitor not found" }, { status: 404 });
        }

        // Verify project ownership
        const project = await Project.findOne({ _id: api.projectId, userId: session.user.id });
        if (!project) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        if (api.status !== "disabled") {
            return NextResponse.json({ error: "Monitor is not disabled" }, { status: 400 });
        }

        // Reset all failure state
        const updated = await Api.findByIdAndUpdate(id, {
            $set: {
                status: "pending",
                consecutiveFails: 0,
                disabledAt: null,
                disabledReason: null,
            }
        }, { new: true });

        return NextResponse.json(updated);
    } catch (error: any) {
        console.error("Re-enable error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
