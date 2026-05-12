import mongoose, { Schema, model, models } from "mongoose";

const VehicleLogSchema = new Schema(
  {
    regNo: { type: String, required: true, index: true },
    invoiceId: { type: Schema.Types.ObjectId, ref: "Invoice", required: true },
    startKms: { type: Number, default: 0 },
    endKms: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const VehicleLog = models.VehicleLog || model("VehicleLog", VehicleLogSchema);
export default VehicleLog;
