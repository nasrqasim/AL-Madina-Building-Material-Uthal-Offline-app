import mongoose, { Schema, model, models } from "mongoose";

const CashReceiptSchema = new Schema(
  {
    receiptNumber: { type: String, required: true, unique: true },
    date: { type: String, required: true },
    type: { type: String, default: "Customer" },
    party: { type: String, default: "" },
    cashAccount: { type: String, default: "" },
    amount: { type: Number, default: 0 },
    whtAmount: { type: Number, default: 0 },
    netAmount: { type: Number, default: 0 },
    status: { type: String, enum: ["Draft", "Posted"], default: "Draft" },
  },
  { timestamps: true }
);

const CashReceipt = models.CashReceipt || model("CashReceipt", CashReceiptSchema);
export default CashReceipt;
