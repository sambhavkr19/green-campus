import mongoose, { Schema, Document } from 'mongoose';

export interface IInitiative extends Document {
  title: string;
  description: string;
  category: 'TreePlantation' | 'EWasteCollection' | 'EnergyAudit' | 'WasteManagement' | 'AwarenessCampaign';
  location: string;
  organizer: mongoose.Types.ObjectId;
  targetParticipants: number;
  currentParticipants: mongoose.Types.ObjectId[];
  status: 'Upcoming' | 'Active' | 'Completed';
  createdAt: Date;
}

const initiativeSchema = new Schema<IInitiative>(
  {
    title: {
      type: String,
      required: [true, 'Initiative title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Initiative description is required'],
    },
    category: {
      type: String,
      enum: ['TreePlantation', 'EWasteCollection', 'EnergyAudit', 'WasteManagement', 'AwarenessCampaign'],
      required: true,
    },
    location: {
      type: String,
      default: 'CSJMU Campus, Kanpur',
    },
    organizer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    targetParticipants: {
      type: Number,
      default: 50,
    },
    currentParticipants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    status: {
      type: String,
      enum: ['Upcoming', 'Active', 'Completed'],
      default: 'Upcoming',
    },
  },
  {
    timestamps: true,
  }
);

const Initiative = mongoose.model<IInitiative>('Initiative', initiativeSchema);
export default Initiative;
