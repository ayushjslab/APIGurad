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
    status: {
        type: String,
        enum: ["healthy", "degraded", "down", "pending"],
        default: "pending"
    },
    lastResponseTime: Number,
    lastChecked: Date,
}, {
    timestamps: true
});

export const Api = mongoose.models.Api || mongoose.model("Api", ApiSchema);