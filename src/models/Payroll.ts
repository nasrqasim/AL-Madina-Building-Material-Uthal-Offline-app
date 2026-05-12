import mongoose, { Schema, model, models } from "mongoose";

const PayrollStaffSchema = new Schema(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
    basicSalary: { type: Number, default: 0 },
    allowances: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    advances: { type: Number, default: 0 },
    loans: { type: Number, default: 0 },
    netSalary: { type: Number, default: 0 },
  },
  { _id: false }
);

const PayrollSchema = new Schema(
  {
    voucherNo: { type: String, required: true, unique: true },
    month: { type: String, required: true }, // e.g., "2026-04"
    date: { type: Date, default: Date.now },
    workingDays: { type: Number, default: 26 },
    staff: { type: [PayrollStaffSchema], default: [] },
    totalAmount: { type: Number, default: 0 },
    status: { type: String, enum: ["draft", "posted"], default: "draft" },
  },
  { timestamps: true }
);

const Payroll = models.Payroll || model("Payroll", PayrollSchema);
export default Payroll;
