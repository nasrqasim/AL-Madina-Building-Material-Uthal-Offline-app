import mongoose, { Schema, model, models } from "mongoose";

const SalaryLoanSchema = new Schema(
  {
    voucherNo: { type: String, required: true, unique: true },
    date: { type: String, required: true },
    employee: { type: String, required: true },
    amount: { type: Number, default: 0 },
    installments: { type: Number, default: 1 },
    monthlyDeduction: { type: Number, default: 0 },
    status: { type: String, enum: ["Pending", "Approved", "Active", "Completed"], default: "Pending" },
  },
  { timestamps: true }
);

const SalaryLoan = models.SalaryLoan || model("SalaryLoan", SalaryLoanSchema);
export default SalaryLoan;
