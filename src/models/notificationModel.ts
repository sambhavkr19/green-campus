import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  recipientId: Schema.Types.ObjectId | string;
  title: string;
  message: string;
  type: 'initiative' | 'recycling' | 'report' | 'audit' | 'system' | 'points';
  isRead: boolean;
  linkUrl?: string;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['initiative', 'recycling', 'report', 'audit', 'system', 'points'],
      default: 'system',
    },
    isRead: { type: Boolean, default: false },
    linkUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Notification =
  mongoose.models.Notification || mongoose.model<INotification>('Notification', notificationSchema);
export default Notification;
