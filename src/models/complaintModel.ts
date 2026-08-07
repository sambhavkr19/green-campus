import mongoose, { Schema, Document } from 'mongoose';

export interface IVoiceComplaint extends Document {
  title: string;
  location: string;
  description: string;
  photoUrl?: string;
  audioData?: string; // Base64 Data URI for recorded voice complaint
  audioDurationSec?: number;
  aiAnalysis?: string;
  upvotes: number;
  upvotedBy: string[];
  status: 'Reported' | 'In Progress' | 'Resolved';
  submittedBy: mongoose.Types.ObjectId;
  studentName: string;
  department: string;
  createdAt: Date;
}

const complaintSchema = new Schema<IVoiceComplaint>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      default: 'CSJMU Campus Garden',
    },
    description: {
      type: String,
      required: true,
    },
    photoUrl: {
      type: String,
      default: '',
    },
    audioData: {
      type: String,
      default: '',
    },
    audioDurationSec: {
      type: Number,
      default: 0,
    },
    aiAnalysis: {
      type: String,
      default: '',
    },
    upvotes: {
      type: Number,
      default: 1,
    },
    upvotedBy: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['Reported', 'In Progress', 'Resolved'],
      default: 'Reported',
    },
    submittedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    studentName: {
      type: String,
      required: true,
    },
    department: {
      type: String,
      default: 'Student Body',
    },
  },
  {
    timestamps: true,
  }
);

const VoiceComplaint = mongoose.model<IVoiceComplaint>('VoiceComplaint', complaintSchema);
export default VoiceComplaint;
