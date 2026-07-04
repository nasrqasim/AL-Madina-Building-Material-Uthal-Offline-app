import mongoose, { Schema, model, models } from "mongoose";

const BankPaymentSchema = new Schema(
  {
    voucherNo: { type: String, required: true, unique: true },
    date: { type: String, required: true },
    mode: { type: String, default: "Party" },
    vendor: { type: String, default: "" },
    bankAccount: { type: String, default: "" },
    chequeNo: { type: String, default: "" },
    chequeDate: { type: String, default: "" },
    amount: { type: Number, default: 0 },
    wht: { type: Number, default: 0 },
    netPaid: { type: Number, default: 0 },
    status: { type: String, enum: ["Draft", "Posted", "Cleared"], default: "Draft" },
    partyPaymentType: { type: String, default: "" },
    isRefund: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const BankPayment = models.BankPayment || model("BankPayment", BankPaymentSchema);
export default BankPayment;
