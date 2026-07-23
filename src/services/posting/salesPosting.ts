import { offlineDB } from "@/lib/dexie";
import { generateUniqueId } from "@/lib/dexie";

type SalesInput = {
  invoiceNo: string;
  partyId: string;
  regNo?: string;
  startKms?: number;
  endKms?: number;
  oilGaugeLimit?: number;
  lines: Array<{
    itemId: string;
    qty?: number;
    cartons?: number;
    rate?: number;
    ratePerCarton?: number;
    discountPercent?: number;
  }>;
  paymentMethod?: string;
};

export async function postSalesInvoice(input: SalesInput) {
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
        stockQtyCartons: (item.stockQtyCartons || 0) - line.qty,
        updatedAt: new Date().toISOString()
      });
    }
  }

  if (input.paymentMethod !== "Cash" && input.paymentMethod !== "Card") {
    const party = await offlineDB.parties.get(input.partyId) as any;
    if (party) {
      await offlineDB.parties.update(input.partyId, { 
        balance: (party.balance || 0) + total,
        updatedAt: new Date().toISOString()
      });
    }
  }

  const invoiceId = generateUniqueId();
  const invoice = {
    id: invoiceId,
    invoiceNo: input.invoiceNo,
    type: "sale",
    partyId: input.partyId,
    regNo: input.regNo ?? "",
    startKms: input.startKms ?? 0,
    endKms: input.endKms ?? 0,
    rangeKms: (input.endKms ?? 0) - (input.startKms ?? 0),
    oilGaugeLimit: input.oilGaugeLimit ?? 0,
    lines,
    totalAmount: total,
    status: "posted",
    paymentMethod: input.paymentMethod || "Credit",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  await offlineDB.invoices.add(invoice as any);

  const isCash = input.paymentMethod === "Cash" || input.paymentMethod === "Card";
  const isBank = input.paymentMethod === "Bank" || input.paymentMethod === "Online";
  const assetCode = isCash ? "1111" : isBank ? "1110" : "1100";
  const assetTitle = isCash ? "Cash" : isBank ? "Bank" : "Accounts Receivable";
  
  await offlineDB.journalEntries.bulkAdd([
    { 
      id: generateUniqueId(),
      invoiceId,
      accountCode: assetCode, 
      accountTitle: assetTitle, 
      debit: total, 
      credit: 0, 
      remarks: `Sales invoice posted (${input.paymentMethod || "Credit"})`,
      createdAt: new Date().toISOString()
    },
    { 
      id: generateUniqueId(),
      invoiceId,
      accountCode: "4100", 
      accountTitle: "Sales", 
      debit: 0, 
      credit: total, 
      remarks: "Sales invoice posted",
      createdAt: new Date().toISOString()
    }
  ] as any);

  if (input.regNo) {
    await offlineDB.vehicleLogs.add({
      id: generateUniqueId(),
      regNo: input.regNo,
      invoiceId,
      startKms: input.startKms ?? 0,
      endKms: input.endKms ?? 0,
      createdAt: new Date().toISOString()
    } as any);
  }

  return invoice;
}

export async function postSaleReturn(input: { invoiceNo: string; partyId: string; linkedInvoiceId: string; lines: SalesInput["lines"]; paymentMethod?: string }) {
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
        stockQtyCartons: (item.stockQtyCartons || 0) + (line.cartons || 0),
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
    type: "sale_return",
    partyId: input.partyId,
    linkedInvoiceId: input.linkedInvoiceId,
    lines,
    totalAmount: total,
    status: "posted",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  await offlineDB.invoices.add(invoice as any);

  const isCash = input.paymentMethod === "Cash" || input.paymentMethod === "Card";
  const isBank = input.paymentMethod === "Bank" || input.paymentMethod === "Online";
  const assetCode = isCash ? "1111" : isBank ? "1110" : "1100";
  const assetTitle = isCash ? "Cash" : isBank ? "Bank" : "Accounts Receivable";

  await offlineDB.journalEntries.bulkAdd([
    { 
      id: generateUniqueId(),
      invoiceId,
      accountCode: "4100", 
      accountTitle: "Sales Return", 
      debit: total, 
      credit: 0, 
      remarks: "Sales return posted",
      createdAt: new Date().toISOString()
    },
    { 
      id: generateUniqueId(),
      invoiceId,
      accountCode: assetCode, 
      accountTitle: assetTitle, 
      debit: 0, 
      credit: total, 
      remarks: "Sales return posted",
      createdAt: new Date().toISOString()
    }
  ] as any);

  return invoice;
}
