import Invoice from "@/models/Invoice";

export async function getPopulatedInvoice(id: string) {
  return Invoice.findById(id)
    .populate("partyId", "companyName name type")
    .populate("employeeId", "name")
    .populate("jobId", "title name")
    .populate("locationId", "name")
    .populate("paymentAccountId", "title code")
    .populate("linkedInvoiceId", "invoiceNo")
    .populate("lines.itemId", "name code")
    .lean();
}
