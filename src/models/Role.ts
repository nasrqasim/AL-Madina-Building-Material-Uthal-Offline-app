import mongoose, { Schema, model, Document } from "mongoose";

export interface IRole extends Document {
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const RoleSchema = new Schema<IRole>(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, default: "" },
    permissions: [{ type: String }],
    userCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Role = mongoose.models.Role || model<IRole>("Role", RoleSchema);
