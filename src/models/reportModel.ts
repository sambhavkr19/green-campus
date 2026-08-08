import mongoose, { Schema, Document } from 'mongoose';

export interface IReport extends Document {
  title: string;
  category: 'waste' | 'energy' | 'water' | 'pollution' | 'other';
  reporterId?: Schema.Types.ObjectId | string;
  reporterName: string;
  department: string;
  location: string;
  description: string;
  photoUrl?: string;
  status: 'Pending' | 'In Progress' | 'Resolved' | 'Rejected';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  upvotes: number;
  assignedTo?: string;
  resolutionNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const reportSchema = new Schema<IReport>(
  {
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['waste', 'energy', 'water', 'pollution', 'other'],
      default: 'waste',
    },
    reporterId: { type: Schema.Types.ObjectId, ref: 'User' },
    reporterName: { type: String, required: true },
    department: { type: String, required: true },
    location: { type: String, required: true },
    description: { type: String, required: true },
    photoUrl: { type: String, default: '' },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Resolved', 'Rejected'],
      default: 'Pending',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    upvotes: { type: Number, default: 0 },
    assignedTo: { type: String, default: '' },
    resolutionNotes: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Report = mongoose.models.Report || mongoose.model<IReport>('Report', reportSchema);
export default Report;
