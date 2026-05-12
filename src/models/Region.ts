import mongoose, { Schema, model, models } from "mongoose";

const RegionSchema = new Schema(
  {
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    coverage: { type: String, default: "" },
    areas: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Region = models.Region || model("Region", RegionSchema);
export default Region;
