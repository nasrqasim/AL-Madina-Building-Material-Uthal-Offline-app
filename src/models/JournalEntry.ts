import mongoose, { Schema, model, models } from "mongoose";

const JournalEntrySchema = new Schema(
  {
    date: { type: Date, default: Date.now },
    invoiceId: { type: Schema.Types.ObjectId, ref: "Invoice", default: null },
    voucherNo: { type: String, default: "" },
    accountCode: { type: String, required: true },
    accountTitle: { type: String, required: true },
    debit: { type: Number, default: 0 },
    credit: { type: Number, default: 0 },
    remarks: { type: String, default: "" },
    partyId: { type: Schema.Types.ObjectId, ref: "Party", default: null },
    partyType: { type: String, default: "" },
  },
  { timestamps: true }
);

const JournalEntry = models.JournalEntry || model("JournalEntry", JournalEntrySchema);
export default JournalEntry;
