import dns from "dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import dbConnect from "../src/lib/db";
import Invoice from "../src/models/Invoice";
import Item from "../src/models/Item";
import { lineStockQty } from "../src/lib/itemUnits";
import mongoose from "mongoose";

const IN_TYPES = new Set([
  "purchase",
  "import_purchase",
  "non_tax_purchase",
  "sale_return",
  "non_tax_sale_return",
  "add_stock",
  "grn",
  "challan", // wait, challan was in OUT_TYPES, but check IN_TYPES
]);

const OUT_TYPES = new Set([
  "sale",
  "non_tax_sale",
  "pos",
  "pos_counter_sale",
  "purchase_return",
  "non_tax_purchase_return",
  "reduce_stock",
]);

function resolveLineItemId(line: { itemId?: unknown }): string {
  const id = line.itemId;
  if (!id) return "";
  if (typeof id === "object" && id !== null && "_id" in (id as object)) {
    return String((id as { _id: unknown })._id);
  }
  return String(id);
}

async function test() {
  await dbConnect();
  
  const itemId = "6a0a1fab8aa497c8fe315be5"; // item with transactions
  const itemOid = new mongoose.Types.ObjectId(itemId);

  const invoices = await Invoice.find({
    status: { $nin: ["cancelled", "Cancelled"] },
    "lines.itemId": itemOid,
  })
    .select("invoiceNo type date lines locationId reference createdAt")
    .populate("locationId", "name")
    .sort({ date: 1, createdAt: 1 })
    .lean();

  console.log(`Found ${invoices.length} invoices for item ${itemId}`);

  const rows: any[] = [];
  for (const inv of invoices) {
    const invType = String(inv.type || "");
    const isIn = IN_TYPES.has(invType);
    const isOut = OUT_TYPES.has(invType);
    console.log(`Invoice: ${inv.invoiceNo}, Type: ${inv.type}, isIn: ${isIn}, isOut: ${isOut}`);
    if (!isIn && !isOut) continue;

    for (const line of inv.lines || []) {
      const lineItemId = resolveLineItemId(line);
      if (lineItemId !== itemId) continue;

      const qty = lineStockQty(line);
      console.log(`  Line match! qty = ${qty}`);
      if (qty <= 0) continue;

      rows.push({
        date: inv.date,
        refNo: inv.invoiceNo || "",
        type: invType.replace(/_/g, " ").toUpperCase(),
        location: (inv.locationId as any)?.name || "Main Warehouse",
        in: isIn ? qty : 0,
        out: isOut ? qty : 0,
        rate: Number(line.rate) || 0,
        total: Number(line.netAmount) || qty * (Number(line.rate) || 0),
      });
    }
  }

  console.log(`Generated rows count: ${rows.length}`);
  console.log("Rows data:", rows);
  
  process.exit(0);
}

test().catch(e => {
  console.error(e);
  process.exit(1);
});
