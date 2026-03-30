import mongoose from "mongoose";

const ProjectSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true
    },
    description: String,
}, {
    timestamps: true
});

export const Project = mongoose.models.Project || mongoose.model("Project", ProjectSchema);