import mongoose, { Schema, model, models } from "mongoose";

export interface IMessageLog extends mongoose.Document {
  recipientName: string;
  recipientPhone: string;
  type: string;
  referenceId?: string;
  status: "Sent" | "Failed" | "Delivered";
  errorMessage?: string;
  sentBy?: string;
}

const MessageLogSchema = new Schema<IMessageLog>(
  {
    recipientName: { type: String, required: true },
    recipientPhone: { type: String, required: true },
    type: { type: String, required: true }, // "Statement", "Invoice", "Reminder"
    referenceId: { type: String },
    status: { type: String, enum: ["Sent", "Failed", "Delivered"], default: "Sent" },
    errorMessage: { type: String },
    sentBy: { type: String },
  },
  { timestamps: true }
);

const MessageLog = models.MessageLog || model<IMessageLog>("MessageLog", MessageLogSchema);

export default MessageLog;
