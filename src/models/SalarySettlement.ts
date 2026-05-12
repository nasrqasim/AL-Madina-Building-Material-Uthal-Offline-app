import mongoose, { Schema, model, models } from "mongoose";

const SalarySettlementSchema = new Schema(
  {
    voucherNo: { type: String, required: true, unique: true },
    date: { type: String, required: true },
    employee: { type: String, required: true },
    leavingDate: { type: String, default: "" },
    grossPay: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    netPayable: { type: Number, default: 0 },
    status: { type: String, enum: ["Draft", "Approved", "Paid"], default: "Draft" },
  },
  { timestamps: true }
);

const SalarySettlement = models.SalarySettlement || model("SalarySettlement", SalarySettlementSchema);
export default SalarySettlement;
