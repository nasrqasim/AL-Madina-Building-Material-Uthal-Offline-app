import mongoose, { Schema, model, models } from "mongoose";

const ContraLineSchema = new Schema({
  accountId: { type: Schema.Types.ObjectId, ref: "Account", default: null },
  accountTitle: { type: String, default: "" },
  description: { type: String, default: "" },
  amount: { type: Number, default: 0 },
}, { _id: false });

const PartyLineSchema = new Schema({
  partyId: { type: Schema.Types.ObjectId, ref: "Party", default: null },
  partyName: { type: String, default: "" },
  amount: { type: Number, default: 0 },
  invoiceRef: { type: String, default: "" },
}, { _id: false });

const CashReceiptSchema = new Schema(
  {
    receiptNumber: { type: String, required: true, unique: true },
    receiptType: { type: String, enum: ["party", "petty", "multi"], default: "party" },
    date: { type: String, required: true },
    partyId: { type: Schema.Types.ObjectId, ref: "Party", default: null },
    cashAccountId: { type: Schema.Types.ObjectId, ref: "Account", default: null },
    cashAccountTitle: { type: String, default: "" },
    reference: { type: String, default: "" },
    narration: { type: String, default: "" },
    employeeId: { type: Schema.Types.ObjectId, ref: "Employee", default: null },
    jobId: { type: Schema.Types.ObjectId, ref: "Job", default: null },
    amount: { type: Number, default: 0 },
    whtAmount: { type: Number, default: 0 },
    netAmount: { type: Number, default: 0 },
    notes: { type: String, default: "" },
    status: { type: String, enum: ["Draft", "Posted"], default: "Draft" },
    partyReceiptType: { type: String, enum: ["Standard", "Advance", "Deposit", "Extra Cash"], default: "Standard" },
    // Petty Receipt
    contraLines: { type: [ContraLineSchema], default: [] },
    // Multi-Party Receipt
    partyLines: { type: [PartyLineSchema], default: [] },
  },
  { timestamps: true }
);

const CashReceipt = models.CashReceipt || model("CashReceipt", CashReceiptSchema);
export default CashReceipt;
