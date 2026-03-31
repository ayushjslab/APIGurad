import { auth } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import { Notification } from "@/models/notification";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

/**
 * GET /api/notifications
 * Fetches paginated notifications for the current user.
 */
export async function GET(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get("limit") || "20");
        const page = parseInt(searchParams.get("page") || "1");
        const unreadOnly = searchParams.get("unreadOnly") === "true";
        const skip = (page - 1) * limit;

        await connectToDatabase();

        const query: any = { userId: session.user.id };
        if (unreadOnly) query.isRead = false;

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Notification.countDocuments(query);
        const unreadCount = await Notification.countDocuments({ userId: session.user.id, isRead: false });

        return NextResponse.json({
            notifications,
            unreadCount,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error: any) {
        console.error("Notifications fetch error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

/**
 * POST /api/notifications
 * Mark all as read for the current user.
 */
export async function POST(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();

        await Notification.updateMany(
            { userId: session.user.id, isRead: false },
            { $set: { isRead: true } }
        );

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
