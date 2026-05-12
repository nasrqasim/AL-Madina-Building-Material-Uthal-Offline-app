import mongoose, { Schema, model, models } from "mongoose";

const BankReceiptSchema = new Schema(
  {
    receiptNumber: { type: String, required: true, unique: true },
    date: { type: String, required: true },
    type: { type: String, default: "Customer" },
    party: { type: String, default: "" },
    bankAccount: { type: String, default: "" },
    instrumentNo: { type: String, default: "" },
    amount: { type: Number, default: 0 },
    whtAmount: { type: Number, default: 0 },
    netAmount: { type: Number, default: 0 },
    status: { type: String, enum: ["Draft", "Posted", "Cleared"], default: "Draft" },
  },
  { timestamps: true }
);

const BankReceipt = models.BankReceipt || model("BankReceipt", BankReceiptSchema);
export default BankReceipt;
