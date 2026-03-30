import mongoose, { Schema } from "mongoose";

/**
 * ApiLog — stores the result of every individual health check.
 * - On SUCCESS: records timing + status codes only (light footprint)
 * - On ERROR:   also stores the error body/message for debugging
 */
const ApiLogSchema = new mongoose.Schema({
    apiId: {
        type: Schema.Types.ObjectId,
        ref: "Api",
        required: true,
        index: true
    },
    projectId: {
        type: Schema.Types.ObjectId,
        ref: "Project",
        required: true,
        index: true
    },
    checkedAt: {
        type: Date,
        default: Date.now,
        index: true
    },

    // ─── Result ────────────────────────────────────────────────────────────────
    outcome: {
        type: String,
        enum: ["success", "error"],
        required: true
    },
    httpStatus: Number,          // actual HTTP status code received
    responseTimeMs: Number,      // round-trip time in milliseconds

    // ─── Validation ────────────────────────────────────────────────────────────
    statusMatched: Boolean,      // did status match expectedStatus?
    structureMatched: Boolean,   // did body match expectedResponseStructure?

    // ─── Error Details (stored only on failure) ────────────────────────────────
    errorMessage: String,        // network error, timeout, etc.
    responseBody: String,        // raw response body (truncated to 4KB on error)
}, {
    timestamps: false, // checkedAt is our timestamp
});

// TTL index — auto-expire logs after 30 days to keep DB lean
ApiLogSchema.index({ checkedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

// Compound index for querying logs by API + time range
ApiLogSchema.index({ apiId: 1, checkedAt: -1 });

export const ApiLog = mongoose.models.ApiLog || mongoose.model("ApiLog", ApiLogSchema);
