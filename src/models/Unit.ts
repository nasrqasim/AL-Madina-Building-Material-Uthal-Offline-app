import mongoose, { Schema, model, models } from "mongoose";

const UnitSchema = new Schema(
  {
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    type: { type: String, default: "Quantity" },
    description: { type: String, default: "" },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
  },
  { timestamps: true }
);

if (models.Unit) {
  delete models.Unit;
}
const Unit = model("Unit", UnitSchema);
export default Unit;
