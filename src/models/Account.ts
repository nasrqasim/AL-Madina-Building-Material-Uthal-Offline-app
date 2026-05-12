import mongoose, { Schema, model, models } from "mongoose";

const AccountSchema = new Schema(
  {
    code: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    type: { type: String, enum: ["cash", "bank", "expense", "receivable", "payable", "income", "equity", "asset"], required: true },
    openingBalance: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Account = models.Account || model("Account", AccountSchema);
export default Account;
