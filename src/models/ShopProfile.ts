import mongoose, { Schema, model, models } from "mongoose";

const ShopProfileSchema = new Schema(
  {
    logo: { type: String, default: "" },
    companyName: { type: String, required: true },
    tradeName: { type: String, default: "" },
    address: { type: String, default: "" },
    city: { type: String, default: "" },
    province: { type: String, default: "" },
    country: { type: String, default: "Pakistan" },
    postalCode: { type: String, default: "" },
    phone: { type: String, default: "" },
    mobile: { type: String, default: "" },
    email: { type: String, default: "" },
    website: { type: String, default: "" },
    ntn: { type: String, default: "" },
    gstRegistration: { type: String, default: "" },
    stn: { type: String, default: "" },
    fiscalYearStart: { type: String, default: "July" },
    currency: { type: String, default: "PKR (Rs.)" },
    amountDecimalPlaces: { type: String, default: "2 - Standard (0.00)" },
    quantityDecimalPlaces: { type: String, default: "2 - Standard (0.00)" },
  },
  { timestamps: true }
);

const ShopProfile = models.ShopProfile || model("ShopProfile", ShopProfileSchema);
export default ShopProfile;
