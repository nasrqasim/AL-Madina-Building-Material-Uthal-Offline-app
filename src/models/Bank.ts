import mongoose, { Schema, model, models } from "mongoose";

const BankSchema = new Schema(
  {
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    accountNo: { type: String, default: "" },
    accountTitle: { type: String, default: "" },
    type: { type: String, default: "Current Account" },
    balance: { type: Number, default: 0 },
    branch: { type: String, default: "" },
    isDefault: { type: Boolean, default: false },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
  },
  { timestamps: true }
);

const Bank = models.Bank || model("Bank", BankSchema);
export default Bank;
