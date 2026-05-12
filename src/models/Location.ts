import mongoose, { Schema, model, models } from "mongoose";

const LocationSchema = new Schema(
  {
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    type: { type: String, default: "Warehouse" },
    city: { type: String, default: "" },
    address: { type: String, default: "" },
    contact: { type: String, default: "" },
    phone: { type: String, default: "" },
    isDefault: { type: Boolean, default: false },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
  },
  { timestamps: true }
);

const Location = models.Location || model("Location", LocationSchema);
export default Location;
