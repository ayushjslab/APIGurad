import mongoose, { Schema } from "mongoose";

const PlanSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    plan: {
        type: String,
        enum: ["free", "paid"],
        default: "free"
    },
    apiCredits: {
        type: Number,
        default: 5
    },
    projectCredits: {
        type: Number,
        default: 1
    },
    totalChecks: {
        type: Number,
        default: 100
    },
    usedChecks: {
        type: Number,
        default: 0
    },
}, { timestamps: true });

export const Plan = mongoose.models.Plan || mongoose.model("Plan", PlanSchema);