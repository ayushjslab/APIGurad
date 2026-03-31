import { auth } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import { Plan } from "@/models/plan";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

/**
 * POST /api/plan/upgrade
 * Upgrades the user's plan to 'paid'.
 * This is a simplified version for now.
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

        // Update the plan to paid and increase credits
        const plan = await Plan.findOneAndUpdate(
            { userId: session.user.id },
            {
                $set: {
                    plan: 'paid',
                    projectCredits: 10,
                    apiCredits: 100,
                    totalChecks: 50000
                }
            },
            { new: true, upsert: true }
        );

        return NextResponse.json({
            success: true,
            message: "Plan upgraded successfully!",
            plan: plan.plan
        });
    } catch (error: any) {
        console.error("Plan upgrade error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
