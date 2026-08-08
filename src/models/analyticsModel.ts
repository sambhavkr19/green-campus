import mongoose, { Schema, Document } from 'mongoose';

export interface IAnalytics extends Document {
  metricName: string;
  category: 'energy' | 'recycling' | 'carbon' | 'engagement' | 'complaints';
  value: number;
  unit: string;
  department?: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  date: Date;
  metadata?: Record<string, any>;
}

const analyticsSchema = new Schema<IAnalytics>(
  {
    metricName: { type: String, required: true },
    category: {
      type: String,
      enum: ['energy', 'recycling', 'carbon', 'engagement', 'complaints'],
      required: true,
    },
    value: { type: Number, required: true },
    unit: { type: String, required: true },
    department: { type: String, default: 'All Campus' },
    period: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
      default: 'monthly',
    },
    date: { type: Date, default: Date.now, index: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export const Analytics =
  mongoose.models.Analytics || mongoose.model<IAnalytics>('Analytics', analyticsSchema);
export default Analytics;
