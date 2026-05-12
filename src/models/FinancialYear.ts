import mongoose, { Schema, model, Document } from "mongoose";

export interface IFinancialYear extends Document {
  name: string;
  startDate: Date;
  endDate: Date;
  status: "Current" | "Closed" | "Upcoming";
  isClosed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FinancialYearSchema = new Schema<IFinancialYear>(
  {
    name: { type: String, required: true, unique: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: ["Current", "Closed", "Upcoming"], default: "Upcoming" },
    isClosed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const FinancialYear = mongoose.models.FinancialYear || model<IFinancialYear>("FinancialYear", FinancialYearSchema);
