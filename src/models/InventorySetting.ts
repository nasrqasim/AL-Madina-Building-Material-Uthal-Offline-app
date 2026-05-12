import mongoose, { Schema, model, Document } from "mongoose";

export interface IInventorySetting extends Document {
  valuationMethod: string;
  allowNegativeStock: boolean;
  autoAdjustShrinkage: boolean;
  enableBatchTracking: boolean;
  reorderAlerts: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const InventorySettingSchema = new Schema<IInventorySetting>(
  {
    valuationMethod: { type: String, default: "Weighted Average" },
    allowNegativeStock: { type: Boolean, default: false },
    autoAdjustShrinkage: { type: Boolean, default: true },
    enableBatchTracking: { type: Boolean, default: false },
    reorderAlerts: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const InventorySetting = mongoose.models.InventorySetting || model<IInventorySetting>("InventorySetting", InventorySettingSchema);
