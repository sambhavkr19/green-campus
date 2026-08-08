import mongoose, { Schema, Document } from 'mongoose';

export interface IDepartment extends Document {
  name: string;
  code: string;
  headOfDepartment?: string;
  totalStudents: number;
  totalFaculty: number;
  sustainabilityScore: number;
  monthlyElectricityKwh: number;
  dailyPlasticBottles: number;
  paperReamsPerMonth: number;
  acHoursPerDay: number;
  greenRank: number;
  createdAt: Date;
  updatedAt: Date;
}

const departmentSchema = new Schema<IDepartment>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    headOfDepartment: { type: String, default: '' },
    totalStudents: { type: Number, default: 0 },
    totalFaculty: { type: Number, default: 0 },
    sustainabilityScore: { type: Number, default: 70, min: 0, max: 100 },
    monthlyElectricityKwh: { type: Number, default: 1200 },
    dailyPlasticBottles: { type: Number, default: 150 },
    paperReamsPerMonth: { type: Number, default: 25 },
    acHoursPerDay: { type: Number, default: 6 },
    greenRank: { type: Number, default: 1 },
  },
  { timestamps: true }
);

export const Department =
  mongoose.models.Department || mongoose.model<IDepartment>('Department', departmentSchema);
export default Department;
