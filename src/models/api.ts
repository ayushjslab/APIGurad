import mongoose, { Schema } from "mongoose";

const ApiSchema = new mongoose.Schema({
    projectId: {
        type: Schema.Types.ObjectId,
        ref: "Project",
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true
    },
    url: {
        type: String,
        required: true
    },
    method: {
        type: String,
        enum: ["GET", "POST", "PUT", "DELETE", "PATCH"],
        default: "GET"
    },
    headers: {
        type: Map,
        of: String,
        default: {}
    },
    body: {
        type: Schema.Types.Mixed,
        default: null
    },
    expectedStatus: {
        type: Number,
        default: 200
    },
    expectedResponseStructure: {
        type: Schema.Types.Mixed,
        default: null
    },
    // ─── Health Status ─────────────────────────────────────────────────────────
    status: {
        type: String,
        enum: ["healthy", "degraded", "down", "pending", "disabled"],
        default: "pending"
    },
    lastResponseTime: Number,   // ms
    lastChecked: Date,
    lastStatusCode: Number,     // last HTTP status received from the endpoint

    // ─── Failure Tracking ──────────────────────────────────────────────────────
    consecutiveFails: {
        type: Number,
        default: 0
    },
    totalSuccess: {
        type: Number,
        default: 0
    },
    totalFails: {
        type: Number,
        default: 0
    },

    // ─── Auto-disable Metadata ─────────────────────────────────────────────────
    disabledAt: Date,
    disabledReason: String,     // human-readable e.g. "5 consecutive failures"
}, {
    timestamps: true
});

// Index for the monitor runner — fetch all active monitors efficiently
ApiSchema.index({ status: 1, projectId: 1 });

export const Api = mongoose.models.Api || mongoose.model("Api", ApiSchema);