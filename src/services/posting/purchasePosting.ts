import { offlineDB } from "@/lib/dexie";
import { generateUniqueId } from "@/lib/dexie";

type PurchaseInput = {
  invoiceNo: string;
  partyId: string;
  lines: Array<{
    itemId: string;
    qty?: number;
    cartons?: number;
    rate?: number;
    ratePerCarton?: number;
    discountPercent?: number;
  }>;
};

export async function postPurchaseInvoice(input: PurchaseInput) {
  let total = 0;
  const lines = input.lines.map((line) => {
    const qty = line.qty ?? line.cartons ?? 0;
    const rate = line.rate ?? line.ratePerCarton ?? 0;
    const grossAmount = qty * rate;
    const discountPercent = line.discountPercent ?? 0;
    const netAmount = grossAmount - (grossAmount * discountPercent) / 100;
    total += netAmount;
    return { ...line, qty, rate, grossAmount, discountPercent, netAmount };
  });

  for (const line of lines) {
    const item = await offlineDB.items.get(line.itemId) as any;
    if (item) {
      await offlineDB.items.update(line.itemId, { 
        stockQtyCartons: (item.stockQtyCartons || 0) + line.qty, 
        purchaseRate: line.rate,
        updatedAt: new Date().toISOString()
      });
    }
  }
  const party = await offlineDB.parties.get(input.partyId) as any;
  if (party) {
    await offlineDB.parties.update(input.partyId, { 
      balance: (party.balance || 0) + total,
      updatedAt: new Date().toISOString()
    });
  }

  const invoiceId = generateUniqueId();
  const invoice = {
    id: invoiceId,
    invoiceNo: input.invoiceNo,
    type: "purchase",
    partyId: input.partyId,
    lines,
    totalAmount: total,
    status: "posted",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  await offlineDB.invoices.add(invoice as any);

  await offlineDB.journalEntries.bulkAdd([
    { 
      id: generateUniqueId(),
      invoiceId,
      accountCode: "1200", 
      accountTitle: "Inventory", 
      debit: total, 
      credit: 0, 
      remarks: "Purchase posted",
      createdAt: new Date().toISOString()
    },
    { 
      id: generateUniqueId(),
      invoiceId,
      accountCode: "2100", 
      accountTitle: "Accounts Payable", 
      debit: 0, 
      credit: total, 
      remarks: "Purchase posted",
      createdAt: new Date().toISOString()
    }
  ] as any);
  return invoice;
}

export async function postPurchaseReturn(input: { invoiceNo: string; partyId: string; linkedInvoiceId: string; lines: PurchaseInput["lines"] }) {
  let total = 0;
  const lines = input.lines.map((line) => {
    const grossAmount = (line.cartons || 0) * (line.ratePerCarton || 0);
    const discountPercent = line.discountPercent ?? 0;
    const netAmount = grossAmount - (grossAmount * discountPercent) / 100;
    total += netAmount;
    return { ...line, grossAmount, discountPercent, netAmount };
  });

  for (const line of lines) {
    const item = await offlineDB.items.get(line.itemId) as any;
    if (item) {
      await offlineDB.items.update(line.itemId, { 
        stockQtyCartons: (item.stockQtyCartons || 0) - (line.cartons || 0),
        updatedAt: new Date().toISOString()
      });
    }
  }
  const party = await offlineDB.parties.get(input.partyId) as any;
  if (party) {
    await offlineDB.parties.update(input.partyId, { 
      balance: (party.balance || 0) - total,
      updatedAt: new Date().toISOString()
    });
  }

  const invoiceId = generateUniqueId();
  const invoice = {
    id: invoiceId,
    invoiceNo: input.invoiceNo,
    type: "purchase_return",
    partyId: input.partyId,
    linkedInvoiceId: input.linkedInvoiceId,
    lines,
    totalAmount: total,
    status: "posted",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  await offlineDB.invoices.add(invoice as any);

  await offlineDB.journalEntries.bulkAdd([
    { 
      id: generateUniqueId(),
      invoiceId,
      accountCode: "2100", 
      accountTitle: "Accounts Payable", 
      debit: total, 
      credit: 0, 
      remarks: "Purchase return posted",
      createdAt: new Date().toISOString()
    },
    { 
      id: generateUniqueId(),
      invoiceId,
      accountCode: "1200", 
      accountTitle: "Inventory", 
      debit: 0, 
      credit: total, 
      remarks: "Purchase return posted",
      createdAt: new Date().toISOString()
    }
  ] as any);
  return invoice;
}
