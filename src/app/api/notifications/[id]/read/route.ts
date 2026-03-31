import { auth } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import { Notification } from "@/models/notification";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

/**
 * PATCH /api/notifications/[id]/read
 * Marks a specific notification as read.
 */
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
        await connectToDatabase();

        const notification = await Notification.findOneAndUpdate(
            { _id: id, userId: session.user.id },
            { $set: { isRead: true } },
            { new: true }
        );

        if (!notification) {
            return NextResponse.json({ error: "Notification not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, notification });
    } catch (error: any) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
