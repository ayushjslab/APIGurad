import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
    userId: string;
    type: 'error' | 'success' | 'warning' | 'info';
    title: string;
    message: string;
    link?: string;
    isRead: boolean;
    createdAt: Date;
}

const NotificationSchema: Schema = new Schema({
    userId: { type: String, required: true, index: true },
    type: {
        type: String,
        enum: ['error', 'success', 'warning', 'info'],
        default: 'info'
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String },
    isRead: { type: Boolean, default: false, index: true },
    createdAt: { type: Date, default: Date.now, index: true },
});

// Auto-expire notifications after 30 days to keep DB clean
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

export const Notification = mongoose.models.Notification || mongoose.model<INotification>("Notification", NotificationSchema);
