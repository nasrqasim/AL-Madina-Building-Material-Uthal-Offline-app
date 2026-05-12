import mongoose, { Schema, model, models } from "mongoose";

const OpeningBalanceSchema = new Schema(
  {
    type: { type: String, enum: ["Item", "Account"], required: true },
    // For Item balances
    itemId: { type: Schema.Types.ObjectId, ref: "Item" },
    itemName: { type: String, default: "" },
    unit: { type: String, default: "" },
    qty: { type: Number, default: 0 },
    rate: { type: Number, default: 0 },
    // For Account balances
    accountId: { type: Schema.Types.ObjectId, ref: "Account" },
    accountName: { type: String, default: "" },
    balanceType: { type: String, enum: ["Debit", "Credit"], default: "Debit" },
    amount: { type: Number, default: 0 },
    // Common
    financialYearId: { type: Schema.Types.ObjectId, ref: "FinancialYear" },
    posted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const OpeningBalance = models.OpeningBalance || model("OpeningBalance", OpeningBalanceSchema);
export default OpeningBalance;
