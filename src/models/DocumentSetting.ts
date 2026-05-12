import mongoose, { Schema, model, Document } from "mongoose";

export interface IDocumentSetting extends Document {
  type: string;
  prefix: string;
  suffix: string;
  nextNo: number;
  padding: number;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSettingSchema = new Schema<IDocumentSetting>(
  {
    type: { type: String, required: true, unique: true },
    prefix: { type: String, default: "" },
    suffix: { type: String, default: "" },
    nextNo: { type: Number, default: 1 },
    padding: { type: Number, default: 4 },
  },
  { timestamps: true }
);

export const DocumentSetting = mongoose.models.DocumentSetting || model<IDocumentSetting>("DocumentSetting", DocumentSettingSchema);
