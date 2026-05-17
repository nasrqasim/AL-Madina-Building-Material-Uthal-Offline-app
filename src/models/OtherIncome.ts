import mongoose, { Schema, model, models } from "mongoose";

const OtherIncomeSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    amount: { type: Number, required: true },
    incomeType: { type: String, enum: ["Monthly", "Yearly", "One Time"], required: true },
    paymentMethod: { type: String, enum: ["Cash", "Bank", "Online"], required: true },
    reference: { type: String, default: "" },
    date: { type: Date, required: true, default: Date.now },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null }
  },
  { timestamps: true }
);

const OtherIncome = models.OtherIncome || model("OtherIncome", OtherIncomeSchema);
export default OtherIncome;
