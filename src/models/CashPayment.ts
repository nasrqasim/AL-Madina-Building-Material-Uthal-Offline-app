import mongoose, { Schema, model, models } from "mongoose";

const CashPaymentSchema = new Schema(
  {
    voucherNo: { type: String, required: true, unique: true },
    date: { type: String, required: true },
    mode: { type: String, default: "Party" },
    vendor: { type: String, default: "" },
    cashAccount: { type: String, default: "" },
    amount: { type: Number, default: 0 },
    wht: { type: Number, default: 0 },
    netPaid: { type: Number, default: 0 },
    status: { type: String, enum: ["Draft", "Posted"], default: "Draft" },
  },
  { timestamps: true }
);

const CashPayment = models.CashPayment || model("CashPayment", CashPaymentSchema);
export default CashPayment;
