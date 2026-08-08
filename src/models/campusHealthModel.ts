import mongoose, { Schema, Document } from 'mongoose';

export interface ICampusHealth extends Document {
  recordedAt: Date;
  overallHealthScore: number;
  airQualityIndex: number;
  noiseLevelDb: number;
  solarGenerationKwh: number;
  wasteRecycledKg: number;
  waterSavedLiters: number;
  activeGreenStudents: number;
  notes?: string;
}

const campusHealthSchema = new Schema<ICampusHealth>(
  {
    recordedAt: { type: Date, default: Date.now, index: true },
    overallHealthScore: { type: Number, required: true, min: 0, max: 100 },
    airQualityIndex: { type: Number, required: true },
    noiseLevelDb: { type: Number, required: true },
    solarGenerationKwh: { type: Number, default: 0 },
    wasteRecycledKg: { type: Number, default: 0 },
    waterSavedLiters: { type: Number, default: 0 },
    activeGreenStudents: { type: Number, default: 0 },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

export const CampusHealth =
  mongoose.models.CampusHealth || mongoose.model<ICampusHealth>('CampusHealth', campusHealthSchema);
export default CampusHealth;
