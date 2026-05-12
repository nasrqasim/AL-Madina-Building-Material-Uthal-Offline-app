import mongoose, { Schema, model, models } from "mongoose";

const JobSchema = new Schema(
  {
    code: { type: String, required: true, unique: true },
    jobNumber: { type: String, unique: true },
    name: { type: String, required: true },
    customer: { type: String, default: "" },
    startDate: { type: String, default: "" },
    endDate: { type: String, default: "" },
    budget: { type: Number, default: 0 },
    description: { type: String, default: "" },
    status: { type: String, enum: ["Active", "Completed", "On Hold", "Cancelled"], default: "Active" },
  },
  { timestamps: true }
);

const Job = models.Job || model("Job", JobSchema);
export default Job;
