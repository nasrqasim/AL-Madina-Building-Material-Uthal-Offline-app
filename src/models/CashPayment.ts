import mongoose, { Schema, model, models } from "mongoose";

const ContraLineSchema = new Schema(
  {
    accountId: { type: Schema.Types.ObjectId, ref: "Account", default: null },
    accountTitle: { type: String, default: "" },
    description: { type: String, default: "" },
    amount: { type: Number, default: 0 },
  },
  { _id: false }
);

const CashPaymentSchema = new Schema(
  {
    voucherNo: { type: String, required: true, unique: true },
    paymentType: { type: String, enum: ["party", "petty"], default: "party" },
    date: { type: String, required: true },
    partyId: { type: Schema.Types.ObjectId, ref: "Party", default: null },
    /** @deprecated legacy string id/name — use partyId */
    vendor: { type: String, default: "" },
    cashAccountId: { type: Schema.Types.ObjectId, ref: "Account", default: null },
    cashAccountTitle: { type: String, default: "" },
    /** @deprecated legacy */
    cashAccount: { type: String, default: "" },
    reference: { type: String, default: "" },
    narration: { type: String, default: "" },
    jobId: { type: Schema.Types.ObjectId, ref: "Job", default: null },
    amount: { type: Number, default: 0 },
    whtRate: { type: Number, default: 0 },
    whtAmount: { type: Number, default: 0 },
    netPaid: { type: Number, default: 0 },
    notes: { type: String, default: "" },
    status: { type: String, enum: ["Draft", "Posted"], default: "Posted" },
    mode: { type: String, default: "Party" },
    partyPaymentType: { type: String, default: "" },
    isRefund: { type: Boolean, default: false },
    contraLines: { type: [ContraLineSchema], default: [] },
  },
  { timestamps: true }
);

const CashPayment = models.CashPayment || model("CashPayment", CashPaymentSchema);
export default CashPayment;
