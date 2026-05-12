import mongoose, { Schema, model, models } from "mongoose";

const JournalLineSchema = new Schema(
  {
    accountId: { type: Schema.Types.ObjectId, ref: "Account", required: true },
    narration: { type: String, default: "" },
    debit: { type: Number, default: 0 },
    credit: { type: Number, default: 0 },
  },
  { _id: false }
);

const JournalSchema = new Schema(
  {
    voucherNo: { type: String, required: true, unique: true },
    date: { type: Date, default: Date.now },
    type: { type: String, default: "Journal" },
    employeeId: { type: Schema.Types.ObjectId, ref: "Employee", default: null },
    jobId: { type: Schema.Types.ObjectId, ref: "Job", default: null },
    reference: { type: String, default: "" },
    narration: { type: String, default: "" },
    lines: { type: [JournalLineSchema], default: [] },
    totalDebit: { type: Number, default: 0 },
    totalCredit: { type: Number, default: 0 },
    notes: { type: String, default: "" },
    status: { type: String, enum: ["draft", "posted"], default: "draft" },
  },
  { timestamps: true }
);

const Journal = models.Journal || model("Journal", JournalSchema);
export default Journal;
