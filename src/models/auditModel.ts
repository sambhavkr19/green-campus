import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditRecord extends Document {
  department: string;
  monthlyElectricityKwh: number;
  dailyPlasticBottles: number;
  paperReamsPerMonth: number;
  acHoursPerDay: number;
  calculatedEcoScore: number;
  estimatedMonthlyCo2Kg: number;
  aiRecommendations: string[];
  submittedBy: mongoose.Types.ObjectId;
  userName: string;
  createdAt: Date;
}

const auditSchema = new Schema<IAuditRecord>(
  {
    department: {
      type: String,
      required: true,
    },
    monthlyElectricityKwh: {
      type: Number,
      required: true,
    },
    dailyPlasticBottles: {
      type: Number,
      required: true,
    },
    paperReamsPerMonth: {
      type: Number,
      required: true,
    },
    acHoursPerDay: {
      type: Number,
      required: true,
    },
    calculatedEcoScore: {
      type: Number,
      required: true,
    },
    estimatedMonthlyCo2Kg: {
      type: Number,
      required: true,
    },
    aiRecommendations: {
      type: [String],
      default: [],
    },
    submittedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const AuditRecord = mongoose.model<IAuditRecord>('AuditRecord', auditSchema);
export default AuditRecord;
