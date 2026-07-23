import { offlineDB, generateUniqueId } from "../dexie";
import { InvoiceRecord, ItemRecord } from "./types";
import {
  recalculatePartyBalance,
  generateInvoiceJournalEntries,
  postCashReceiptJournalEntries,
  postCashPaymentJournalEntries,
  postBankReceiptJournalEntries,
  postBankPaymentJournalEntries,
  updateInventoryFromInvoice,
  getCustomerAdvanceStats,
  postPartyOpeningBalanceJournalEntry,
} from "./postingService";

/** One-time migration: ensure all existing parties have opening balance journal entries */
let hasMigratedOpeningBalances = false;
async function migratePartyOpeningBalances() {
  if (hasMigratedOpeningBalances) return;
  hasMigratedOpeningBalances = true;
  try {
    const parties = await offlineDB.parties.toArray();
    for (const party of parties) {
      const opBal = Number(party.openingBalance) || 0;
      if (opBal === 0) continue;
      const voucherNo = `OPBAL-${party.code || party._id || party.id}`;
      const existing = await offlineDB.journalEntries
        .where("voucherNo")
        .equals(voucherNo)
        .count();
      if (existing === 0) {
        await postPartyOpeningBalanceJournalEntry(party);
      }
    }
    console.log("Migration: Party opening balance journal entries synced.");
  } catch (e) {
    console.error("Migration error:", e);
  }
}

/** Helper to wrap data in a mock fetch Response object. */
function mockResponse(data: any, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    statusText: status === 200 ? "OK" : "Error",
    headers: { "Content-Type": "application/json" },
  });
}

/** Route matching utility. */
function matchRoute(urlPath: string, pattern: string): Record<string, string> | null {
  const urlParts = urlPath.split("?")[0].split("/").filter(Boolean);
  const patternParts = pattern.split("/").filter(Boolean);
  
  if (urlParts.length !== patternParts.length) return null;
  
  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(":")) {
      params[patternParts[i].slice(1)] = urlParts[i];
    } else if (patternParts[i] !== urlParts[i]) {
      return null;
    }
  }
  return params;
}

/** Parse query parameters. */
function getQueryParams(urlStr: string): Record<string, string> {
  try {
    const search = urlStr.split("?")[1] || "";
    const params = new URLSearchParams(search);
    const result: Record<string, string> = {};
    params.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  } catch (e) {
    return {};
  }
}

/** Global flag to prevent double intercepting */
let isIntercepted = false;

/** Initialize window.fetch override to run all API calls against Dexie client-side database. */
export function setupMockApi() {
  if (typeof window === "undefined" || isIntercepted) return;

  // Check if IndexedDB is available
  if (!window.indexedDB) {
    console.warn("IndexedDB not available, using server API for all requests");
    return;
  }

  const originalFetch = window.fetch;
  isIntercepted = true;

  // Run one-time migration for party opening balances
  migratePartyOpeningBalances();

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const urlStr = typeof input === "string" ? input : (input instanceof URL ? input.href : input.url);
    
    // Bypass non-api requests
    if (!urlStr.includes("/api/")) {
      return originalFetch(input, init);
    }
    
    // Check for bypass header
    if (init?.headers && typeof init.headers === 'object') {
      const headers = init.headers as Record<string, string>;
      if (headers['X-Bypass-Mock'] === 'true') {
        delete headers['X-Bypass-Mock'];
        return originalFetch(input, init);
      }
    }

    // Extract path, e.g., "/api/items"
    let path = "";
    try {
      if (urlStr.startsWith("http://") || urlStr.startsWith("https://")) {
        const urlObj = new URL(urlStr);
        path = urlObj.pathname;
      } else {
        path = urlStr.split("?")[0];
      }
    } catch (e) {
      path = urlStr.split("?")[0];
    }

    const method = init?.method?.toUpperCase() || "GET";
    const query = getQueryParams(urlStr);
    
    // Parse request body
    let body: any = null;
    if (init?.body && typeof init.body === "string") {
      try {
        body = JSON.parse(init.body);
      } catch (e) {
        body = null;
      }
    }

    try {
      console.log(`Mock API Intercepted: [${method}] ${path}`, { query, body });
      
      // ==========================================
      // 1. ITEMS (PRODUCTS) CRUD
      // ==========================================
      if (path === "/api/items" && method === "GET") {
        const items = await offlineDB.items.toArray();
        return mockResponse({ ok: true, data: items });
      }

      if (path === "/api/items" && method === "POST") {
        const id = generateUniqueId();
        const newItem = {
          ...body,
          id,
          _id: id,
          stockQty: Number(body.stockQtyCartons || body.stockQty || 0), // align cartons/qty
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await offlineDB.items.add(newItem);
        return mockResponse({ ok: true, data: newItem });
      }

      let params = matchRoute(path, "/api/items/:id");
      if (params && method === "PUT") {
        const id = params.id;
        const oldItem = await offlineDB.items.get(id);
        if (!oldItem) return mockResponse({ ok: false, message: "Item not found" }, 404);

        const updatedItem = {
          ...oldItem,
          ...body,
          updatedAt: new Date().toISOString(),
        };
        await offlineDB.items.put(updatedItem);
        return mockResponse({ ok: true, data: updatedItem });
      }

      if (params && method === "DELETE") {
        await offlineDB.items.delete(params.id);
        return mockResponse({ ok: true });
      }

      // ==========================================
      // 2. PARTIES (CUSTOMERS/VENDORS) CRUD
      // ==========================================
      if (path === "/api/parties" && method === "GET") {
        let parties = await offlineDB.parties.toArray();
        if (query.type) {
          parties = parties.filter(p => p.type?.toLowerCase() === query.type.toLowerCase());
        }
        if (query.q) {
          const q = query.q.toLowerCase();
          parties = parties.filter(p => 
            (p.name || "").toLowerCase().includes(q) || 
            (p.companyName || "").toLowerCase().includes(q) ||
            (p.code || "").toLowerCase().includes(q)
          );
        }
        return mockResponse({ ok: true, data: parties });
      }

      if (path === "/api/parties" && method === "POST") {
        const id = generateUniqueId();
        const newParty = {
          ...body,
          id,
          _id: id,
          balance: Number(body.openingBalance || 0),
          debit: 0,
          credit: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await offlineDB.parties.add(newParty);
        await recalculatePartyBalance(id);
        return mockResponse({ ok: true, data: newParty });
      }

      params = matchRoute(path, "/api/parties/:id");
      if (params && method === "PUT") {
        const id = params.id;
        const oldParty = await offlineDB.parties.get(id);
        if (!oldParty) return mockResponse({ ok: false, message: "Party not found" }, 404);

        const updatedParty = {
          ...oldParty,
          ...body,
          updatedAt: new Date().toISOString(),
        };
        await offlineDB.parties.put(updatedParty);
        await recalculatePartyBalance(id);
        return mockResponse({ ok: true, data: updatedParty });
      }

      if (params && method === "DELETE") {
        await offlineDB.parties.delete(params.id);
        return mockResponse({ ok: true });
      }

      // Search endpoint helper
      if (path === "/api/parties/search" && method === "GET") {
        const q = (query.q || "").toLowerCase();
        let parties = await offlineDB.parties.toArray();
        if (q) {
          parties = parties.filter(p => 
            (p.name || "").toLowerCase().includes(q) || 
            (p.companyName || "").toLowerCase().includes(q) ||
            (p.phone || "").toLowerCase().includes(q) ||
            (p.code || "").toLowerCase().includes(q)
          );
        }
        return mockResponse({ ok: true, data: parties });
      }

      // ==========================================
      // 3. ACCOUNTS (CHART OF ACCOUNTS)
      // ==========================================
      if (path === "/api/accounts" && method === "GET") {
        const accounts = await offlineDB.accounts.toArray();
        const journalEntries = await offlineDB.journalEntries.toArray();
        
        const rows = [];
        for (const acc of accounts) {
          const jvs = journalEntries.filter(j => j.accountCode === acc.code);
          const debits = jvs.reduce((s, j) => s + (j.debit || 0), 0);
          const credits = jvs.reduce((s, j) => s + (j.credit || 0), 0);
          
          let balance = acc.openingBalance || 0;
          const isDebit = ["cash", "bank", "expense", "receivable", "asset"].includes(String(acc.type || "").toLowerCase());
          if (isDebit) {
            balance += debits - credits;
          } else {
            balance += credits - debits;
          }
          
          rows.push({
            ...acc,
            currentBalance: balance
          });
        }
        
        // Sort by code
        rows.sort((a, b) => (a.code || "").localeCompare(b.code || ""));
        return mockResponse({ ok: true, data: rows });
      }

      if (path === "/api/accounts" && method === "POST") {
        const id = generateUniqueId();
        
        const accountRecord = {
          id,
          _id: id,
          code: body.code,
          title: body.title,
          type: body.type,
          openingBalance: Number(body.openingBalance) || 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        await offlineDB.accounts.add(accountRecord);
        return mockResponse({ ok: true, data: accountRecord }, 201);
      }

      // ==========================================
      // 4. CATEGORIES AND UNITS
      // ==========================================
      if (path === "/api/categories" && method === "GET") {
        const categories = await offlineDB.categories.toArray();
        return mockResponse({ ok: true, data: categories });
      }

      if (path === "/api/categories" && method === "POST") {
        const id = generateUniqueId();
        const newCat = {
          ...body,
          id,
          _id: id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await offlineDB.categories.add(newCat);
        return mockResponse({ ok: true, data: newCat });
      }

      params = matchRoute(path, "/api/categories/:id");
      if (params && method === "DELETE") {
        await offlineDB.categories.delete(params.id);
        return mockResponse({ ok: true });
      }

      // Clear all categories
      if (path === "/api/setup/clear-categories" && method === "POST") {
        const count = await offlineDB.categories.count();
        await offlineDB.categories.clear();
        return mockResponse({ ok: true, count, message: `Cleared ${count} categories` });
      }

      // Building materials setup
      if (path === "/api/setup/building-materials" && method === "POST") {
        // This is a complex operation - let it fall through to server
        return originalFetch(input, init);
      }

      if (path === "/api/units" && method === "GET") {
        const units = await offlineDB.units.toArray();
        return mockResponse({ ok: true, data: units });
      }

      if (path === "/api/units" && method === "POST") {
        const id = generateUniqueId();
        const newUnit = {
          ...body,
          id,
          _id: id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await offlineDB.units.add(newUnit);
        return mockResponse({ ok: true, data: newUnit });
      }

      // ==========================================
      // 4. INVOICES / SALES / PURCHASES CRUD
      // ==========================================
      if (path === "/api/sales" && method === "GET") {
        let invoices = await offlineDB.invoices.toArray();
        // Filter for sales types only (matching the server API)
        invoices = invoices.filter(inv => 
          ["sale", "sale_order", "quotation", "non_tax_sale", "pos_counter_sale", "sale_return", "non_tax_sale_return"].includes(inv.type)
        );
        if (query.partyId) {
          invoices = invoices.filter(inv => inv.partyId === query.partyId);
        }
        return mockResponse({ ok: true, data: invoices });
      }

      if (path === "/api/invoices" && method === "GET") {
        let invoices = await offlineDB.invoices.toArray();
        if (query.type) {
          invoices = invoices.filter(inv => inv.type === query.type);
        }
        if (query.partyId) {
          invoices = invoices.filter(inv => inv.partyId === query.partyId);
        }
        return mockResponse({ ok: true, data: invoices });
      }

      if (path === "/api/invoices" && method === "POST") {
        const id = generateUniqueId();
        
        // Compute delivery status on creation
        const lines = body.lines || [];
        let deliveryStatus = body.deliveryStatus || "posted";
        if (["sale", "non_tax_sale"].includes(body.type)) {
          const hasDeliveryDetails = lines.some((l: any) => l.qty > 0 && l.deliveredQty !== undefined);
          if (hasDeliveryDetails) {
            const allDelivered = lines.every((l: any) => Number(l.deliveredQty) >= Number(l.qty));
            const anyDelivered = lines.some((l: any) => Number(l.deliveredQty) > 0);
            deliveryStatus = allDelivered ? "fully_delivered" : (anyDelivered ? "partially_delivered" : "pending_delivery");
          }
        }

        const newInvoice: InvoiceRecord = {
          ...body,
          id,
          _id: id,
          deliveryStatus,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await offlineDB.invoices.add(newInvoice);

        // Adjust stock counts & generate postings
        if (newInvoice.status !== "draft" && newInvoice.type !== "draft") {
          await updateInventoryFromInvoice(newInvoice);
          await generateInvoiceJournalEntries(newInvoice);
        }

        return mockResponse({ ok: true, data: newInvoice });
      }

      params = matchRoute(path, "/api/invoices/:id");
      if (params && method === "GET") {
        const invoice = await offlineDB.invoices.get(params.id);
        if (!invoice) return mockResponse({ ok: false, message: "Invoice not found" }, 404);
        return mockResponse({ ok: true, data: invoice });
      }

      if (params && method === "PUT") {
        const id = params.id;
        const oldInvoice = await offlineDB.invoices.get(id);
        if (!oldInvoice) return mockResponse({ ok: false, message: "Invoice not found" }, 404);

        // 1. Reverse old inventory impacts
        if (oldInvoice.status !== "draft" && oldInvoice.type !== "draft") {
          await updateInventoryFromInvoice(oldInvoice, true);
        }

        const updatedInvoice: InvoiceRecord = {
          ...oldInvoice,
          ...body,
          updatedAt: new Date().toISOString(),
        };

        await offlineDB.invoices.put(updatedInvoice);

        // 2. Apply new postings and stock counts
        if (updatedInvoice.status !== "draft" && updatedInvoice.type !== "draft") {
          await updateInventoryFromInvoice(updatedInvoice);
          await generateInvoiceJournalEntries(updatedInvoice);
        }

        return mockResponse({ ok: true, data: updatedInvoice });
      }

      if (params && method === "DELETE") {
        const oldInvoice = await offlineDB.invoices.get(params.id);
        if (oldInvoice) {
          if (oldInvoice.status !== "draft" && oldInvoice.type !== "draft") {
            await updateInventoryFromInvoice(oldInvoice, true);
          }
          await offlineDB.invoices.delete(params.id);
          // Recalculate party balance
          if (oldInvoice.partyId) {
            await recalculatePartyBalance(oldInvoice.partyId);
          }
        }
        return mockResponse({ ok: true });
      }

      // Fetch invoice payments (balance check / advance check)
      params = matchRoute(path, "/api/invoices/:id/payment");
      if (params && method === "GET") {
        const inv = await offlineDB.invoices.get(params.id);
        if (!inv) return mockResponse({ ok: false, message: "Invoice not found" }, 404);
        
        let stats = { totalAdvance: 0, totalUsed: 0, totalRefunded: 0, remainingAdvance: 0 };
        if (inv.partyId) {
          stats = await getCustomerAdvanceStats(inv.partyId);
        }
        return mockResponse({ ok: true, data: stats });
      }

      // ==========================================
      // 5. CASH / BANK RECEIPTS & PAYMENTS
      // ==========================================
      if (path === "/api/cash-receipts" && method === "GET") {
        const receipts = await offlineDB.cashReceipts.toArray();
        return mockResponse({ ok: true, data: receipts });
      }

      if (path === "/api/cash-receipts" && method === "POST") {
        const id = generateUniqueId();
        const partyId = body.partyId || body.customerId || body.party || "";
        const amount = Number(body.amount || body.totalAmount || 0);
        const newReceipt = {
          receiptNumber: body.receiptNumber || body.voucherNo || `CRV-${Date.now().toString().slice(-6)}`,
          status: "Posted",
          ...body,
          partyId,
          amount,
          id,
          _id: id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await offlineDB.cashReceipts.add(newReceipt);
        await postCashReceiptJournalEntries(newReceipt);
        return mockResponse({ ok: true, data: newReceipt });
      }

      if (path === "/api/cash-payments" && method === "GET") {
        const payments = await offlineDB.cashPayments.toArray();
        return mockResponse({ ok: true, data: payments });
      }

      if (path === "/api/cash-payments" && method === "POST") {
        const id = generateUniqueId();
        const partyId = body.partyId || body.vendorId || body.vendor || body.customerId || "";
        const amount = Number(body.amount || body.totalAmount || 0);
        const newPayment = {
          voucherNo: body.voucherNo || body.receiptNumber || `CPV-${Date.now().toString().slice(-6)}`,
          status: "Posted",
          ...body,
          partyId,
          amount,
          id,
          _id: id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await offlineDB.cashPayments.add(newPayment);
        await postCashPaymentJournalEntries(newPayment);
        return mockResponse({ ok: true, data: newPayment });
      }

      if (path === "/api/bank-receipts" && method === "GET") {
        const receipts = await offlineDB.bankReceipts.toArray();
        return mockResponse({ ok: true, data: receipts });
      }

      if (path === "/api/bank-receipts" && method === "POST") {
        const id = generateUniqueId();
        const partyId = body.partyId || body.customerId || body.party || "";
        const amount = Number(body.amount || body.totalAmount || 0);
        const newReceipt = {
          receiptNumber: body.receiptNumber || body.voucherNo || `BRV-${Date.now().toString().slice(-6)}`,
          status: "Posted",
          ...body,
          partyId,
          party: partyId,
          amount,
          id,
          _id: id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await offlineDB.bankReceipts.add(newReceipt);
        await postBankReceiptJournalEntries(newReceipt);
        return mockResponse({ ok: true, data: newReceipt });
      }

      if (path === "/api/bank-payments" && method === "GET") {
        const payments = await offlineDB.bankPayments.toArray();
        return mockResponse({ ok: true, data: payments });
      }

      if (path === "/api/bank-payments" && method === "POST") {
        const id = generateUniqueId();
        const partyId = body.partyId || body.vendorId || body.vendor || body.customerId || "";
        const amount = Number(body.amount || body.totalAmount || 0);
        const newPayment = {
          voucherNo: body.voucherNo || body.receiptNumber || `BPV-${Date.now().toString().slice(-6)}`,
          status: "Posted",
          ...body,
          partyId,
          vendor: partyId,
          amount,
          id,
          _id: id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await offlineDB.bankPayments.add(newPayment);
        await postBankPaymentJournalEntries(newPayment);
        return mockResponse({ ok: true, data: newPayment });
      }

      // ==========================================
      // 6. DASHBOARD STATISTICS
      // ==========================================
      if (path === "/api/dashboard" && method === "GET") {
        const invoices = await offlineDB.invoices.toArray();
        const activeInvoices = invoices.filter(i => i.status !== "cancelled");

        const todayStr = new Date().toISOString().split("T")[0];
        
        let todaySales = 0;
        let todayPurchases = 0;
        let todayExpense = 0;
        
        activeInvoices.forEach(inv => {
          const invDate = (inv.date || "").split("T")[0];
          if (invDate === todayStr) {
            const amount = Number(inv.totalAmount) || 0;
            if (["sale", "pos", "non_tax_sale"].includes(inv.type)) todaySales += amount;
            if (["purchase", "non_tax_purchase", "import_purchase"].includes(inv.type)) todayPurchases += amount;
          }
        });

        // Sum receipts / payments
        const cashRecs = await offlineDB.cashReceipts.toArray();
        const bankRecs = await offlineDB.bankReceipts.toArray();
        const cashPays = await offlineDB.cashPayments.toArray();
        const bankPays = await offlineDB.bankPayments.toArray();

        let todayCollection = 0;
        cashRecs.forEach(r => {
          if ((r.date || "").split("T")[0] === todayStr && r.status === "Posted") todayCollection += (Number(r.amount) || 0);
        });
        bankRecs.forEach(r => {
          if ((r.date || "").split("T")[0] === todayStr && r.status === "Posted") todayCollection += (Number(r.amount) || 0);
        });

        // Expenses
        cashPays.forEach(p => {
          if ((p.date || "").split("T")[0] === todayStr && p.status === "Posted") todayExpense += (Number(p.amount) || 0);
        });
        bankPays.forEach(p => {
          if ((p.date || "").split("T")[0] === todayStr && p.status === "Posted") todayExpense += (Number(p.amount) || 0);
        });

        const parties = await offlineDB.parties.toArray();
        const customers = parties.filter(p => p.type === "Customer");
        const vendors = parties.filter(p => p.type === "Vendor");
        const items = await offlineDB.items.toArray();

        // Receivables and Payables
        let totalReceivable = 0;
        let totalPayable = 0;
        customers.forEach(c => { if (c.balance > 0) totalReceivable += c.balance; });
        vendors.forEach(v => { if (v.balance > 0) totalPayable += v.balance; });

        // Low stock count
        const lowStockCount = items.filter(i => (i.stockQtyCartons || 0) < (i.reorderLevel || 5)).length;

        // Pending Deliveries count
        const pendingDeliveries = activeInvoices.filter(
          inv => ["sale", "non_tax_sale"].includes(inv.type) && ["pending_delivery", "partially_delivered"].includes(inv.deliveryStatus || "")
        ).length;

        // Draft invoices count
        const draftInvoices = invoices.filter(inv => inv.status === "draft").length;

        // Cash / Bank book balances
        const journalEntries = await offlineDB.journalEntries.toArray();
        let cashBal = 0;
        let bankBal = 0;
        
        journalEntries.forEach(entry => {
          // Cash codes: 1000, 1111
          if (["1000", "1111"].includes(entry.accountCode)) {
            cashBal += (entry.debit - entry.credit);
          }
          // Bank codes: 1010, 1110
          if (["1010", "1110"].includes(entry.accountCode)) {
            bankBal += (entry.debit - entry.credit);
          }
        });

        // Total Stock value
        const stockValue = items.reduce((acc, i) => acc + ((i.stockQtyCartons || 0) * (i.purchaseRate || 0)), 0);

        return mockResponse({
          ok: true,
          data: {
            todaySales,
            todayPurchases,
            todayCollection,
            todayExpense,
            cash: cashBal,
            bank: bankBal,
            customers: customers.length,
            vendors: vendors.length,
            products: items.length,
            lowStockCount,
            pendingDeliveries,
            draftInvoices,
            totalReceivable,
            totalPayable,
            stockValue,
          }
        });
      }

      // ==========================================
      // 8. BANKS CRUD
      // ==========================================
      if (path === "/api/banks" && method === "GET") {
        const banks = await offlineDB.banks.toArray();
        banks.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return mockResponse({ ok: true, data: banks });
      }

      if (path === "/api/banks" && method === "POST") {
        const id = generateUniqueId();
        
        if (body.isDefault) {
          const allBanks = await offlineDB.banks.toArray();
          for (const bank of allBanks) {
            await offlineDB.banks.update(bank.id, { isDefault: false });
          }
        }
        
        const newBank = {
          ...body,
          id,
          _id: id,
          code: body.code || `BANK-${Date.now()}`,
          name: body.name || "",
          accountNo: body.accountNo || "",
          accountTitle: body.accountTitle || "",
          type: body.type || "Current Account",
          branch: body.branch || "",
          balance: Number(body.balance) || 0,
          status: body.status || "Active",
          isDefault: body.isDefault || false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await offlineDB.banks.add(newBank);
        return mockResponse({ ok: true, data: newBank }, 201);
      }

      params = matchRoute(path, "/api/banks/:id");
      if (params && method === "PUT") {
        const id = params.id;
        const oldBank = await offlineDB.banks.get(id);
        if (!oldBank) return mockResponse({ ok: false, message: "Bank not found" }, 404);

        if (body.isDefault) {
          const allBanks = await offlineDB.banks.toArray();
          for (const bank of allBanks) {
            if (bank.id !== id) {
              await offlineDB.banks.update(bank.id, { isDefault: false });
            }
          }
        }

        const updatedBank = {
          ...oldBank,
          ...body,
          updatedAt: new Date().toISOString(),
        };
        await offlineDB.banks.put(updatedBank);
        return mockResponse({ ok: true, data: updatedBank });
      }

      if (params && method === "DELETE") {
        await offlineDB.banks.delete(params.id);
        return mockResponse({ ok: true, message: "Bank deleted successfully" });
      }

      // ==========================================
      // 9. OTHER INCOME CRUD
      // ==========================================
      if (path === "/api/other-incomes" && method === "GET") {
        let incomes = await offlineDB.otherIncomes.toArray();

        // Apply filters
        if (query.search) {
          const searchLower = query.search.toLowerCase();
          incomes = incomes.filter(inc => 
            (inc.title || "").toLowerCase().includes(searchLower) ||
            (inc.description || "").toLowerCase().includes(searchLower)
          );
        }

        if (query.incomeType) {
          incomes = incomes.filter(inc => inc.incomeType === query.incomeType);
        }

        if (query.paymentMethod) {
          incomes = incomes.filter(inc => inc.paymentMethod === query.paymentMethod);
        }

        if (query.fromDate || query.toDate) {
          incomes = incomes.filter(inc => {
            const incDate = new Date(inc.date);
            if (query.fromDate && incDate < new Date(query.fromDate)) return false;
            if (query.toDate && incDate > new Date(query.toDate)) return false;
            return true;
          });
        }

        // Sort by date descending
        incomes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return mockResponse({ ok: true, data: incomes });
      }

      if (path === "/api/other-incomes" && method === "POST") {
        const id = generateUniqueId();
        
        const incomeRecord = {
          id,
          _id: id,
          title: body.title,
          description: body.description || "",
          amount: Number(body.amount) || 0,
          incomeType: body.incomeType || "One Time",
          paymentMethod: body.paymentMethod || "Cash",
          reference: body.reference || "",
          date: body.date || new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        await offlineDB.otherIncomes.add(incomeRecord);

        // Create corresponding Journal Entries
        const voucherNo = `INC-${id}`;
        const isCash = incomeRecord.paymentMethod === "Cash";
        const assetCode = isCash ? "1111" : "1110";
        const assetTitle = isCash ? "Cash Hand" : "Bank Account";

        const journalEntries = [
          {
            id: generateUniqueId(),
            _id: generateUniqueId(),
            voucherNo,
            date: incomeRecord.date,
            accountCode: assetCode,
            accountTitle: assetTitle,
            debit: incomeRecord.amount,
            credit: 0,
            remarks: incomeRecord.description || incomeRecord.title,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: generateUniqueId(),
            _id: generateUniqueId(),
            voucherNo,
            date: incomeRecord.date,
            accountCode: "40002001",
            accountTitle: "Other Income",
            debit: 0,
            credit: incomeRecord.amount,
            remarks: incomeRecord.description || incomeRecord.title,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];

        await offlineDB.journalEntries.bulkAdd(journalEntries);

        return mockResponse({ ok: true, data: incomeRecord }, 201);
      }

      params = matchRoute(path, "/api/other-incomes/:id");
      if (params && method === "DELETE") {
        await offlineDB.otherIncomes.delete(params.id);
        return mockResponse({ ok: true, message: "Other income deleted successfully" });
      }

      // ==========================================
      // 10B. EXPENSES MODULE CRUD & ACCOUNTING
      // ==========================================
      if (path === "/api/expenses" && method === "GET") {
        const expenses = await offlineDB.expenses.toArray();
        return mockResponse({ ok: true, data: expenses });
      }

      if (path === "/api/expenses" && method === "POST") {
        const id = generateUniqueId();
        const voucherNo = body.voucherNo || `EXP-${Date.now().toString().slice(-6)}`;
        const expenseRecord = {
          ...body,
          id,
          _id: id,
          voucherNo,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await offlineDB.expenses.add(expenseRecord);

        // Auto post Journal Entry if Paid
        if (body.status === "Paid") {
          const isBank = body.paidFrom === "Bank";
          const paymentCode = isBank ? (body.bankAccount || "1010") : "1000";
          const paymentTitle = isBank ? "Bank Account" : "Cash";

          const journalEntries = [
            {
              id: generateUniqueId(),
              date: body.date || new Date().toISOString(),
              voucherNo,
              accountCode: "5200",
              accountTitle: `Expense - ${body.category || "General"} (${body.name || ""})`,
              debit: Number(body.amount || 0),
              credit: 0,
              remarks: body.description || body.notes || `Paid Expense: ${body.name}`,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: generateUniqueId(),
              date: body.date || new Date().toISOString(),
              voucherNo,
              accountCode: paymentCode,
              accountTitle: paymentTitle,
              debit: 0,
              credit: Number(body.amount || 0),
              remarks: body.description || body.notes || `Paid Expense: ${body.name}`,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ];
          await offlineDB.journalEntries.bulkAdd(journalEntries);
        }

        return mockResponse({ ok: true, data: expenseRecord }, 201);
      }

      params = matchRoute(path, "/api/expenses/:id");
      if (params && method === "PUT") {
        const existing = await offlineDB.expenses.get(params.id);
        if (!existing) return mockResponse({ ok: false, message: "Expense not found" }, 404);

        const updated = {
          ...existing,
          ...body,
          updatedAt: new Date().toISOString(),
        };
        await offlineDB.expenses.put(updated);
        return mockResponse({ ok: true, data: updated });
      }

      if (params && method === "DELETE") {
        await offlineDB.expenses.delete(params.id);
        return mockResponse({ ok: true, message: "Expense deleted successfully" });
      }

      // ==========================================
      // 10A2. SALARY EMPLOYEES CRUD
      // ==========================================
      if (path === "/api/employees" && method === "GET") {
        const employees = await offlineDB.employees.toArray();
        return mockResponse({ ok: true, data: employees });
      }

      if (path === "/api/employees" && method === "POST") {
        const id = generateUniqueId();
        const newEmployee = {
          ...body,
          id,
          _id: id,
          code: body.code || `STF-${Math.floor(Date.now() / 1000)}`,
          status: body.status || (body.isActive ? "Active" : "Inactive"),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await offlineDB.employees.add(newEmployee);
        return mockResponse({ ok: true, data: newEmployee }, 201);
      }

      params = matchRoute(path, "/api/employees/:id");
      if (params && method === "PUT") {
        const id = params.id;
        const existing = await offlineDB.employees.get(id);
        if (!existing) return mockResponse({ ok: false, message: "Employee not found" }, 404);

        const updated = {
          ...existing,
          ...body,
          status: body.status || (body.isActive !== undefined ? (body.isActive ? "Active" : "Inactive") : existing.status),
          updatedAt: new Date().toISOString(),
        };
        await offlineDB.employees.put(updated);
        return mockResponse({ ok: true, data: updated });
      }

      if (params && method === "DELETE") {
        await offlineDB.employees.delete(params.id);
        return mockResponse({ ok: true, message: "Employee deleted successfully" });
      }

      // ==========================================
      // 10C. SALARY ADVANCES API
      // ==========================================
      if (path === "/api/salary-advances" && method === "GET") {
        const advances = await offlineDB.salaryAdvances.toArray();
        return mockResponse({ ok: true, data: advances });
      }

      if (path === "/api/salary-advances" && method === "POST") {
        const id = generateUniqueId();
        const voucherNo = body.voucherNo || `ADV-${Date.now().toString().slice(-6)}`;
        const record = {
          ...body,
          id,
          _id: id,
          voucherNo,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await offlineDB.salaryAdvances.add(record);

        if (body.status === "Paid" || body.status === "Approved") {
          const isBank = body.paidFrom === "Bank";
          const paymentCode = isBank ? "1010" : "1000";
          const paymentTitle = isBank ? "Bank Account" : "Cash";

          await offlineDB.journalEntries.bulkAdd([
            {
              id: generateUniqueId(),
              date: body.date || new Date().toISOString(),
              voucherNo,
              accountCode: "1120",
              accountTitle: `Salary Advance - ${body.employee}`,
              debit: Number(body.amount || 0),
              credit: 0,
              remarks: `Salary Advance issued to ${body.employee}`,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: generateUniqueId(),
              date: body.date || new Date().toISOString(),
              voucherNo,
              accountCode: paymentCode,
              accountTitle: paymentTitle,
              debit: 0,
              credit: Number(body.amount || 0),
              remarks: `Salary Advance issued to ${body.employee}`,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ]);
        }

        return mockResponse({ ok: true, data: record }, 201);
      }

      params = matchRoute(path, "/api/salary-advances/:id");
      if (params && method === "PUT") {
        const existing = await offlineDB.salaryAdvances.get(params.id);
        if (!existing) return mockResponse({ ok: false, message: "Record not found" }, 404);
        const updated = { ...existing, ...body, updatedAt: new Date().toISOString() };
        await offlineDB.salaryAdvances.put(updated);
        return mockResponse({ ok: true, data: updated });
      }

      if (params && method === "DELETE") {
        await offlineDB.salaryAdvances.delete(params.id);
        return mockResponse({ ok: true, message: "Advance deleted successfully" });
      }

      // ==========================================
      // 10D. SALARY LOANS API
      // ==========================================
      if (path === "/api/salary-loans" && method === "GET") {
        const loans = await offlineDB.salaryLoans.toArray();
        return mockResponse({ ok: true, data: loans });
      }

      if (path === "/api/salary-loans" && method === "POST") {
        const id = generateUniqueId();
        const voucherNo = body.voucherNo || `LOAN-${Date.now().toString().slice(-6)}`;
        const record = {
          ...body,
          id,
          _id: id,
          voucherNo,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await offlineDB.salaryLoans.add(record);

        if (body.status === "Active" || body.status === "Approved") {
          const isBank = body.paidFrom === "Bank";
          const paymentCode = isBank ? "1010" : "1000";
          const paymentTitle = isBank ? "Bank Account" : "Cash";

          await offlineDB.journalEntries.bulkAdd([
            {
              id: generateUniqueId(),
              date: body.date || new Date().toISOString(),
              voucherNo,
              accountCode: "1125",
              accountTitle: `Salary Loan Asset - ${body.employee}`,
              debit: Number(body.amount || 0),
              credit: 0,
              remarks: `Salary Loan disbursed to ${body.employee}`,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: generateUniqueId(),
              date: body.date || new Date().toISOString(),
              voucherNo,
              accountCode: paymentCode,
              accountTitle: paymentTitle,
              debit: 0,
              credit: Number(body.amount || 0),
              remarks: `Salary Loan disbursed to ${body.employee}`,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ]);
        }

        return mockResponse({ ok: true, data: record }, 201);
      }

      params = matchRoute(path, "/api/salary-loans/:id");
      if (params && method === "PUT") {
        const existing = await offlineDB.salaryLoans.get(params.id);
        if (!existing) return mockResponse({ ok: false, message: "Record not found" }, 404);
        const updated = { ...existing, ...body, updatedAt: new Date().toISOString() };
        await offlineDB.salaryLoans.put(updated);
        return mockResponse({ ok: true, data: updated });
      }

      if (params && method === "DELETE") {
        await offlineDB.salaryLoans.delete(params.id);
        return mockResponse({ ok: true, message: "Loan deleted successfully" });
      }

      if (path === "/api/salary-loans/repay" && method === "POST") {
        const voucherNo = body.voucherNo || `LREC-${Date.now().toString().slice(-6)}`;
        const isBank = body.paymentMethod === "Bank";
        const recvCode = isBank ? "1110" : "1111";
        const recvTitle = isBank ? "Bank Account" : "Cash Hand";
        const amount = Number(body.amount || 0);

        await offlineDB.journalEntries.bulkAdd([
          {
            id: generateUniqueId(),
            date: body.date || new Date().toISOString(),
            voucherNo,
            accountCode: recvCode,
            accountTitle: recvTitle,
            debit: amount,
            credit: 0,
            remarks: body.remarks || `Loan repayment received from ${body.employee}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: generateUniqueId(),
            date: body.date || new Date().toISOString(),
            voucherNo,
            accountCode: "1125",
            accountTitle: `Salary Loan Asset - ${body.employee}`,
            debit: 0,
            credit: amount,
            remarks: body.remarks || `Loan repayment received from ${body.employee}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]);

        if (body.loanId && !body.loanId.startsWith("EMP-")) {
          const loan: any = await offlineDB.salaryLoans.get(body.loanId);
          if (loan) {
            const totalRepaid = (Number(loan.totalRepaid) || 0) + amount;
            const updatedLoan = {
              ...loan,
              totalRepaid,
              status: totalRepaid >= Number(loan.amount || 0) ? "Completed" : "Active"
            };
            await offlineDB.salaryLoans.put(updatedLoan);
          }
        }

        return mockResponse({ ok: true, message: "Loan repayment recorded successfully" });
      }

      // ==========================================
      // 10E. PAYROLL RUNS API
      // ==========================================
      if (path === "/api/payrolls/pay-staff" && method === "POST") {
        const voucherNo = body.voucherNo || `SPAY-${Date.now().toString().slice(-6)}`;
        const isBank = body.paymentMethod === "Bank";
        const payCode = isBank ? "1110" : "1111";
        const payTitle = isBank ? "Bank Account" : "Cash Hand";
        const amount = Number(body.amount || 0);

        await offlineDB.journalEntries.bulkAdd([
          {
            id: generateUniqueId(),
            date: body.date || new Date().toISOString(),
            voucherNo,
            accountCode: "6100",
            accountTitle: `Staff Salary Expense - ${body.employeeName}`,
            debit: amount,
            credit: 0,
            remarks: body.remarks || `Salary paid to ${body.employeeName}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: generateUniqueId(),
            date: body.date || new Date().toISOString(),
            voucherNo,
            accountCode: payCode,
            accountTitle: payTitle,
            debit: 0,
            credit: amount,
            remarks: body.remarks || `Salary paid to ${body.employeeName}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]);

        return mockResponse({ ok: true, message: "Staff salary paid successfully" });
      }
      if (path === "/api/payrolls" && method === "GET") {
        const payrolls = await offlineDB.payrolls.toArray();
        return mockResponse({ ok: true, data: payrolls });
      }

      if (path === "/api/payrolls" && method === "POST") {
        const id = generateUniqueId();
        const voucherNo = body.voucherNo || `PAY-${Date.now().toString().slice(-6)}`;
        const record = {
          ...body,
          id,
          _id: id,
          voucherNo,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await offlineDB.payrolls.add(record);

        if (body.status === "posted") {
          const totalAmt = Number(body.totalAmount || 0);
          await offlineDB.journalEntries.bulkAdd([
            {
              id: generateUniqueId(),
              date: body.date || new Date().toISOString(),
              voucherNo,
              accountCode: "5300",
              accountTitle: `Salary Expense (${body.month || ""})`,
              debit: totalAmt,
              credit: 0,
              remarks: `Payroll run posted for ${body.month}`,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: generateUniqueId(),
              date: body.date || new Date().toISOString(),
              voucherNo,
              accountCode: "1000",
              accountTitle: "Cash",
              debit: 0,
              credit: totalAmt,
              remarks: `Payroll run posted for ${body.month}`,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ]);
        }

        return mockResponse({ ok: true, data: record }, 201);
      }

      params = matchRoute(path, "/api/payrolls/:id");
      if (params && method === "PUT") {
        const existing = await offlineDB.payrolls.get(params.id);
        if (!existing) return mockResponse({ ok: false, message: "Record not found" }, 404);
        const updated = { ...existing, ...body, updatedAt: new Date().toISOString() };
        await offlineDB.payrolls.put(updated);
        return mockResponse({ ok: true, data: updated });
      }

      if (params && method === "DELETE") {
        await offlineDB.payrolls.delete(params.id);
        return mockResponse({ ok: true, message: "Payroll run deleted successfully" });
      }

      // ==========================================
      // 10F. FINAL SETTLEMENTS API
      // ==========================================
      if (path === "/api/salary-settlements" && method === "GET") {
        const settlements = await offlineDB.salarySettlements.toArray();
        return mockResponse({ ok: true, data: settlements });
      }

      if (path === "/api/salary-settlements" && method === "POST") {
        const id = generateUniqueId();
        const voucherNo = body.voucherNo || `SETTL-${Date.now().toString().slice(-6)}`;
        const record = {
          ...body,
          id,
          _id: id,
          voucherNo,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await offlineDB.salarySettlements.add(record);

        if (body.status === "Paid") {
          const isBank = body.paidFrom === "Bank";
          const paymentCode = isBank ? "1010" : "1000";
          const paymentTitle = isBank ? "Bank Account" : "Cash";
          const netPay = Number(body.netPayable || body.grossPay || 0);

          await offlineDB.journalEntries.bulkAdd([
            {
              id: generateUniqueId(),
              date: body.date || new Date().toISOString(),
              voucherNo,
              accountCode: "5300",
              accountTitle: `Final Settlement - ${body.employee}`,
              debit: netPay,
              credit: 0,
              remarks: `Final settlement paid to ${body.employee}`,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: generateUniqueId(),
              date: body.date || new Date().toISOString(),
              voucherNo,
              accountCode: paymentCode,
              accountTitle: paymentTitle,
              debit: 0,
              credit: netPay,
              remarks: `Final settlement paid to ${body.employee}`,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ]);
        }

        return mockResponse({ ok: true, data: record }, 201);
      }

      params = matchRoute(path, "/api/salary-settlements/:id");
      if (params && method === "PUT") {
        const existing = await offlineDB.salarySettlements.get(params.id);
        if (!existing) return mockResponse({ ok: false, message: "Record not found" }, 404);
        const updated = { ...existing, ...body, updatedAt: new Date().toISOString() };
        await offlineDB.salarySettlements.put(updated);
        return mockResponse({ ok: true, data: updated });
      }

      if (params && method === "DELETE") {
        await offlineDB.salarySettlements.delete(params.id);
        return mockResponse({ ok: true, message: "Settlement deleted successfully" });
      }

      // ==========================================
      // 11. FINANCIAL AND LEDGER REPORTS
      // ==========================================
      if (path === "/api/reports/trial-balance" && method === "GET") {
        const fromDate = query.fromDate;
        const toDate = query.toDate;

        const accounts = await offlineDB.accounts.toArray();
        const jEntries = await offlineDB.journalEntries.toArray();

        // Filter journal entries
        const filteredEntries = jEntries.filter(entry => {
          const entryDate = entry.date.split("T")[0];
          if (fromDate && entryDate < fromDate) return false;
          if (toDate && entryDate > toDate) return false;
          return true;
        });

        const totals: Record<string, { debit: number; credit: number }> = {};
        accounts.forEach(a => {
          totals[a.code] = { debit: 0, credit: 0 };
        });

        filteredEntries.forEach(entry => {
          if (!totals[entry.accountCode]) {
            totals[entry.accountCode] = { debit: 0, credit: 0 };
          }
          totals[entry.accountCode].debit += (entry.debit || 0);
          totals[entry.accountCode].credit += (entry.credit || 0);
        });

        const reportData = accounts.map(acc => {
          const bal = totals[acc.code] || { debit: 0, credit: 0 };
          return {
            _id: acc.id,
            code: acc.code,
            title: acc.title,
            type: acc.type,
            debit: bal.debit,
            credit: bal.credit,
          };
        }).filter(r => r.debit > 0 || r.credit > 0);

        return mockResponse({ ok: true, data: reportData });
      }

      if (path === "/api/reports/profit-loss" && method === "GET") {
        const fromDate = query.fromDate;
        const toDate = query.toDate;

        const jEntries = await offlineDB.journalEntries.toArray();
        const accounts = await offlineDB.accounts.toArray();
        const accountMap = new Map(accounts.map(a => [a.code, a]));

        // Filter journal entries
        const filteredEntries = jEntries.filter(entry => {
          const entryDate = entry.date.split("T")[0];
          if (fromDate && entryDate < fromDate) return false;
          if (toDate && entryDate > toDate) return false;
          return true;
        });

        // Group balances by code
        const groupBalances: Record<string, { debit: number; credit: number; title: string }> = {};
        filteredEntries.forEach(entry => {
          if (!groupBalances[entry.accountCode]) {
            groupBalances[entry.accountCode] = { debit: 0, credit: 0, title: entry.accountTitle };
          }
          groupBalances[entry.accountCode].debit += (entry.debit || 0);
          groupBalances[entry.accountCode].credit += (entry.credit || 0);
        });

        // Dynamic COGS calculation
        const items = await offlineDB.items.toArray();
        const invoices = await offlineDB.invoices.toArray();
        const activeInvoices = invoices.filter(inv => inv.status !== "cancelled");

        const OUT_TYPES = new Set(["sale", "non_tax_sale", "pos", "challan"]);
        const OUT_RETURN_TYPES = new Set(["purchase_return", "non_tax_purchase_return"]);

        let totalCogs = 0;
        items.forEach(item => {
          let qtyOut = 0;
          activeInvoices.forEach(inv => {
            const invDate = (inv.date || "").split("T")[0];
            if (fromDate && invDate < fromDate) return;
            if (toDate && invDate > toDate) return;

            const isOut = OUT_TYPES.has(inv.type);
            const isOutReturn = OUT_RETURN_TYPES.has(inv.type);
            if (!isOut && !isOutReturn) return;

            (inv.lines || []).forEach((line) => {
              if (line.itemId === item.id) {
                const qty = line.cartons || line.qty || 0;
                if (isOut) qtyOut += qty;
                if (isOutReturn) qtyOut -= qty;
              }
            });
          });
          totalCogs += qtyOut * (item.purchaseRate || 0);
        });

        const report = {
          revenue: [] as any[],
          expenses: [] as any[],
          totalRevenue: 0,
          totalExpenses: 0,
          netProfit: 0
        };

        Object.entries(groupBalances).forEach(([code, bal]) => {
          // Skip raw purchases code since we replace with COGS
          if (code === "5100") return;

          const acc = accountMap.get(code);
          let type = acc ? acc.type.toLowerCase() : "";
          if (!type) {
            if (code.startsWith("4")) type = "income";
            else if (code.startsWith("5")) type = "expense";
            else return;
          }

          if (type === "income" || type === "revenue") {
            const netAmount = bal.credit - bal.debit;
            if (netAmount !== 0) {
              report.revenue.push({ title: bal.title, amount: netAmount });
              report.totalRevenue += netAmount;
            }
          } else if (type === "expense") {
            const netAmount = bal.debit - bal.credit;
            if (netAmount !== 0) {
              report.expenses.push({ title: bal.title, amount: netAmount });
              report.totalExpenses += netAmount;
            }
          }
        });

        if (totalCogs > 0) {
          report.expenses.push({ title: "Cost of Goods Sold (COGS)", amount: totalCogs });
          report.totalExpenses += totalCogs;
        }

        report.netProfit = report.totalRevenue - report.totalExpenses;

        return mockResponse({ ok: true, data: report });
      }

      if (path === "/api/reports/inventory-ledger" && method === "GET") {
        const fromDate = query.fromDate;
        const toDate = query.toDate;
        const itemId = query.itemId;

        if (!itemId) {
          return mockResponse({ ok: false, message: "itemId is required" }, 400);
        }

        const invoices = await offlineDB.invoices.toArray();
        const activeInvoices = invoices.filter(inv => inv.status !== "cancelled");
        
        const lines: any[] = [];
        activeInvoices.forEach(inv => {
          const invDate = (inv.date || "").split("T")[0];
          if (fromDate && invDate < fromDate) return;
          if (toDate && invDate > toDate) return;

          (inv.lines || []).forEach(line => {
            if (line.itemId === itemId) {
              const qty = line.cartons || line.qty || 0;
              const rate = line.rate || 0;
              const isSale = ["sale", "pos", "non_tax_sale", "purchase_return"].includes(inv.type);
              
              lines.push({
                date: invDate,
                voucherNo: inv.invoiceNo,
                reference: inv.reference || "",
                type: inv.type,
                inQty: isSale ? 0 : qty,
                outQty: isSale ? qty : 0,
                rate: rate,
                amount: qty * rate,
              });
            }
          });
        });

        // Sort by date
        lines.sort((a, b) => a.date.localeCompare(b.date));

        // Calculate running balances
        let runningStock = 0;
        const item = await offlineDB.items.get(itemId);
        const openingStock = item ? (item.openingStock || 0) : 0;
        runningStock = openingStock;

        const results = lines.map(line => {
          runningStock = runningStock + line.inQty - line.outQty;
          return {
            ...line,
            balance: runningStock,
          };
        });

        return mockResponse({
          ok: true,
          data: {
            openingStock,
            entries: results,
          }
        });
      }

      // Default fallback for unhandled /api/ routes
      return mockResponse({ ok: true, message: "Offline first route matched (mocked)" });

    } catch (e: any) {
      console.error(`Mock API Error: ${path}`, e);
      return mockResponse({ ok: false, message: e.message || "Internal server error" }, 500);
    }
  };
}
