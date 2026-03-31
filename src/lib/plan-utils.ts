import { Plan } from "@/models/plan";
import mongoose from "mongoose";

/**
 * Ensures a Plan document exists for the user and returns it.
 * Uses default values for new plans.
 */
export async function getOrCreatePlan(userId: string) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error("Invalid User ID");
    }

    let plan = await Plan.findOne({ userId });

    if (!plan) {
        plan = await Plan.create({
            userId,
            plan: "free",
            apiCredits: 5,
            projectCredits: 1,
            totalChecks: 100,
            usedChecks: 0
        });
    }

    return plan;
}
