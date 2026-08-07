import mongoose, { Schema, Document } from 'mongoose';

export interface IRecyclingDeposit extends Document {
  user: mongoose.Types.ObjectId;
  userName: string;
  itemType: 'EWaste' | 'Plastic' | 'Paper' | 'Metal' | 'Glass';
  weightKg: number;
  location: string;
  status: 'Pending' | 'Verified' | 'Rejected';
  pointsEarned: number;
  co2SavedKg: number;
  verifiedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const recyclingSchema = new Schema<IRecyclingDeposit>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    itemType: {
      type: String,
      enum: ['EWaste', 'Plastic', 'Paper', 'Metal', 'Glass'],
      required: true,
    },
    weightKg: {
      type: Number,
      required: true,
      min: [0.1, 'Weight must be at least 0.1 kg'],
    },
    location: {
      type: String,
      default: 'UIET Building Recycling Hub, CSJMU',
    },
    status: {
      type: String,
      enum: ['Pending', 'Verified', 'Rejected'],
      default: 'Pending',
    },
    pointsEarned: {
      type: Number,
      default: 0,
    },
    co2SavedKg: {
      type: Number,
      default: 0,
    },
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

const RecyclingDeposit = mongoose.model<IRecyclingDeposit>('RecyclingDeposit', recyclingSchema);
export default RecyclingDeposit;
