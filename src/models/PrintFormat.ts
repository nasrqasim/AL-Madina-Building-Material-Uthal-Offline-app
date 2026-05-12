import mongoose, { Schema, model, Document } from "mongoose";

export interface IPrintFormat extends Document {
  formatName: string;
  themeColor: string;
  headerFont: string;
  showLogo: boolean;
  logoSize: string;
  paperSize: string;
  footerText: string;
  showBankDetails: boolean;
  showSignature: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PrintFormatSchema = new Schema<IPrintFormat>(
  {
    formatName: { type: String, required: true, unique: true },
    themeColor: { type: String, default: "#800000" },
    headerFont: { type: String, default: "Inter" },
    showLogo: { type: Boolean, default: true },
    logoSize: { type: String, default: "medium" },
    paperSize: { type: String, default: "A4" },
    footerText: { type: String, default: "Thank you for your business!" },
    showBankDetails: { type: Boolean, default: true },
    showSignature: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const PrintFormat = mongoose.models.PrintFormat || model<IPrintFormat>("PrintFormat", PrintFormatSchema);
