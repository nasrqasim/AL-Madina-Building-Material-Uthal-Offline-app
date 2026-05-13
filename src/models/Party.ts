import mongoose, { Schema, model, models } from "mongoose";

export interface IParty extends mongoose.Document {
  name: string;
  companyName?: string;
  contactPerson?: string;
  email?: string;
  code: string;
  type: "Customer" | "Vendor";
  address?: string;
  region?: string;
  area?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  ntn?: string;
  strn?: string;
  balance: number;
  creditLimit: number;
  creditDays?: number;
  openingBalance: number;
  status?: string;
  notes?: string;
}

const PartySchema = new Schema<IParty>(
  {
    name: { type: String, required: true }, // Keeping name as required for backward compatibility, mapped to companyName
    companyName: String,
    contactPerson: String,
    email: String,
    code: { type: String, required: true, unique: true },
    type: { type: String, enum: ["Customer", "Vendor"], required: true },
    address: String,
    region: String,
    area: String,
    postalCode: String,
    country: { type: String, default: "Pakistan" },
    phone: String,
    ntn: String,
    strn: String,
    balance: { type: Number, default: 0 },
    creditLimit: { type: Number, default: 0 },
    creditDays: { type: Number, default: 30 },
    openingBalance: { type: Number, default: 0 },
    category: { type: String, enum: ["Urgent/COD", "Short term", "Long term"], default: "Short term" },
    status: { type: String, default: "Active" },
    notes: String,
  },
  { timestamps: true }
);

const Party = models.Party || model<IParty>("Party", PartySchema);

export default Party;
