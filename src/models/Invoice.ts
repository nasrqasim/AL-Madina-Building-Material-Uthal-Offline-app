import mongoose, { Schema, model, models } from "mongoose";
import "./Job";
import "./Party";
import "./Employee";
import "./Location";
import "./Account";
import "./Item";

const InvoiceLineSchema = new Schema(
  {
    itemId: { type: Schema.Types.ObjectId, ref: "Item" },
    description: { type: String, default: "" },
    qty: { type: Number, default: 0 },
    cartons: { type: Number, default: 0 },
    liters: { type: Number, default: 0 },
    gallons: { type: Number, default: 0 },
    priceType: { type: String, enum: ["retail", "wholesale"], default: "retail" },
    rate: { type: Number, default: 0 },
    ratePerCarton: { type: Number, default: 0 },
    grossAmount: { type: Number, default: 0 },
    discountPercent: { type: Number, default: 0 },
    taxPercent: { type: Number, default: 0 },
    netAmount: { type: Number, default: 0 },
    foreignNetAmount: { type: Number, default: 0 },
  },
  { _id: false }
);

const InvoiceSchema = new Schema(
  {
    invoiceNo: { type: String, required: true, unique: true },
    type: { type: String, enum: ["sale", "sale_return", "purchase", "purchase_return", "quotation", "purchase_order", "grn", "challan", "sale_order", "purchase_requisition", "stock_transfer", "add_stock", "reduce_stock", "branch_transfer", "inward_gp", "outward_gp", "bill_of_materials", "production_order", "non_tax_sale", "non_tax_purchase", "non_tax_sale_return", "non_tax_purchase_return", "import_purchase"], required: true },
    paymentMethod: { type: String, enum: ["Cash", "Card", "Credit", "Bank"], default: "Credit" },
    date: { type: Date, default: Date.now },
    dueDate: { type: Date },
    partyId: { type: Schema.Types.ObjectId, ref: "Party" },
    paymentTerms: { type: String, default: "" },
    employeeId: { type: Schema.Types.ObjectId, ref: "Employee", default: null },
    jobId: { type: Schema.Types.ObjectId, ref: "Job", default: null },
    locationId: { type: Schema.Types.ObjectId, ref: "Location", default: null },
    toLocationId: { type: Schema.Types.ObjectId, ref: "Location", default: null },
    reference: { type: String, default: "" },
    vendorInvNo: { type: String, default: "" },
    vendorInvoiceDate: { type: Date },
    linkToGRN: { type: String, default: "" },
    linkToPO: { type: String, default: "" },
    exchangeRate: { type: Number, default: 0 },
    gdNo: { type: String, default: "" },
    blAwbNo: { type: String, default: "" },
    balance: { type: Number, default: 0 },
    currency: { type: String, default: "PKR" },
    
    // Specific to Oil Shop
    regNo: { type: String, default: "" },
    startKms: { type: Number, default: 0 },
    endKms: { type: Number, default: 0 },
    rangeKms: { type: Number, default: 0 },
    oilGaugeLimit: { type: Number, default: 0 },
    carService: { type: Number, default: 0 },
    carServiceDiscount: { type: Number, default: 0 },
    
    isCreditBill: { type: Boolean, default: true },
    linkedInvoiceId: { type: Schema.Types.ObjectId, ref: "Invoice", default: null },
    lines: { type: [InvoiceLineSchema], default: [] },
    
    subTotal: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    whtPercent: { type: Number, default: 0 },
    whtAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    
    amountReceived: { type: Number, default: 0 },
    paymentAccountId: { type: Schema.Types.ObjectId, ref: "Account", default: null },
    
    notes: { type: String, default: "" },
    
    // Purchase Requisition specific
    requestedBy: { type: String, default: "" },
    department: { type: String, default: "" },
    priority: { type: String, enum: ["Low", "Medium", "High", "Urgent"], default: "Medium" },
    totalEstimate: { type: Number, default: 0 },

    // Inward Gate Pass specific
    purpose: { type: String, default: "" },
    vehicleNo: { type: String, default: "" },
    driverName: { type: String, default: "" },
    driverCnic: { type: String, default: "" },
    vendor: { type: String, default: "" },
    destination: { type: String, default: "" },

    // Bill of Materials specific
    bomName: { type: String, default: "" },
    version: { type: String, default: "" },
    itemId: { type: Schema.Types.ObjectId, ref: "Item" },

    // Production Order specific
    plannedQty: { type: Number, default: 0 },
    actualQty: { type: Number, default: 0 },
    bomId: { type: Schema.Types.ObjectId, ref: "Invoice" },
    useAdvance: { type: Boolean, default: false },
    advanceAmountUsed: { type: Number, default: 0 },
    status: { type: String, enum: ["draft", "posted", "approved", "cancelled", "paid", "received", "accepted", "sent", "delivered", "dispatched", "completed", "invoiced", "Submitted", "Approved", "Rejected", "Draft", "Verified", "Pending", "Dispatched", "Active", "Planned", "In-Progress", "Completed", "Cancelled", "Posted", "Received"], default: "posted" },
  },
  { timestamps: true }
);

const Invoice = models.Invoice || model("Invoice", InvoiceSchema);
export default Invoice;
