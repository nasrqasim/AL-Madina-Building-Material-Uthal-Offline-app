import mongoose, { Schema, model, models } from "mongoose";

const SalaryAdvanceSchema = new Schema(
  {
    voucherNo: { type: String, required: true, unique: true },
    date: { type: String, required: true },
    employee: { type: String, required: true },
    department: { type: String, default: "" },
    amount: { type: Number, default: 0 },
    deductionMonth: { type: String, default: "" },
    status: { type: String, enum: ["Pending", "Approved", "Paid"], default: "Pending" },
  },
  { timestamps: true }
);

const SalaryAdvance = models.SalaryAdvance || model("SalaryAdvance", SalaryAdvanceSchema);
export default SalaryAdvance;
