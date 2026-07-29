import type BetterSqlite3 from "better-sqlite3";
import fs from "fs";
import path from "path";
import { getDatabaseFilePath } from "./dataDir";

// Lazy singleton - database is only opened on first access
// The native better-sqlite3 module is NOT loaded at import time,
// only when the database is first accessed at runtime.
let _sqlite: BetterSqlite3.Database | null = null;

function getSqliteInstance(): BetterSqlite3.Database {
  if (typeof window !== "undefined") {
    throw new Error("SQLite database cannot be accessed directly from client-side code.");
  }
  if (!_sqlite) {
    const Database = eval("require")("better-sqlite3");
    const dbPath = getDatabaseFilePath();
    _sqlite = new Database(dbPath) as BetterSqlite3.Database;
    _sqlite!.pragma("journal_mode = WAL");
    _sqlite!.pragma("foreign_keys = ON");
    _sqlite!.pragma("synchronous = NORMAL");
    // Run schema creation on first open using direct instance
    initSQLiteSchema(_sqlite!);
  }
  return _sqlite!;
}

// Proxy object that lazily initializes the database on first property access
export const sqlite: BetterSqlite3.Database = new Proxy({} as BetterSqlite3.Database, {
  get(_target, prop, receiver) {
    const instance = getSqliteInstance();
    const value = (instance as any)[prop];
    if (typeof value === "function") {
      return value.bind(instance);
    }
    return value;
  }
});

// Initialize Schema
export function initSQLiteSchema(targetDb?: BetterSqlite3.Database) {
  const db = targetDb || sqlite;
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      username TEXT UNIQUE NOT NULL,
      email TEXT,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      financialYear TEXT,
      isActive INTEGER DEFAULT 1,
      createdAt TEXT,
      updatedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT,
      type TEXT NOT NULL,
      parentId TEXT,
      defaultUnit TEXT,
      createdAt TEXT,
      updatedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS brands (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT,
      categoryId TEXT,
      createdAt TEXT,
      updatedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS units (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT,
      symbol TEXT,
      createdAt TEXT,
      updatedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      mainCategoryId TEXT,
      subCategoryId TEXT,
      brandId TEXT,
      model TEXT,
      color TEXT,
      design TEXT,
      size TEXT,
      thickness TEXT,
      length TEXT,
      width TEXT,
      weight TEXT,
      grade TEXT,
      pattern TEXT,
      finish TEXT,
      quality TEXT,
      unit TEXT,
      saleUnits TEXT, -- JSON array
      hsCode TEXT,
      barcode TEXT,
      qrCode TEXT,
      location TEXT,
      rack TEXT,
      godown TEXT,
      warehouse TEXT,
      purchaseRate REAL DEFAULT 0,
      wholesaleRate REAL DEFAULT 0,
      retailRate REAL DEFAULT 0,
      dealerRate REAL DEFAULT 0,
      contractRate REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      taxPercent REAL DEFAULT 0,
      openingStock REAL DEFAULT 0,
      stockQty REAL DEFAULT 0,
      reservedStock REAL DEFAULT 0,
      damagedStock REAL DEFAULT 0,
      reorderLevel REAL DEFAULT 0,
      maxStock REAL DEFAULT 0,
      images TEXT, -- JSON array
      remarks TEXT,
      litersInCtn REAL DEFAULT 0,
      gallonsInCtn REAL DEFAULT 0,
      stockQtyCartons REAL DEFAULT 0,
      createdAt TEXT,
      updatedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS parties (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      companyName TEXT,
      contactPerson TEXT,
      email TEXT,
      code TEXT,
      type TEXT NOT NULL,
      address TEXT,
      region TEXT,
      area TEXT,
      postalCode TEXT,
      city TEXT,
      country TEXT,
      phone TEXT,
      mobile TEXT,
      ntn TEXT,
      strn TEXT,
      gst TEXT,
      balance REAL DEFAULT 0,
      creditLimit REAL DEFAULT 0,
      creditDays INTEGER DEFAULT 0,
      openingBalance REAL DEFAULT 0,
      debit REAL DEFAULT 0,
      credit REAL DEFAULT 0,
      manualDebit REAL DEFAULT 0,
      manualCredit REAL DEFAULT 0,
      category TEXT,
      vendorType TEXT,
      bankName TEXT,
      accountNo TEXT,
      branch TEXT,
      paymentTerms INTEGER DEFAULT 0,
      whtApplicable INTEGER DEFAULT 0,
      status TEXT,
      isActive INTEGER DEFAULT 1,
      notes TEXT,
      advanceBalance REAL DEFAULT 0,
      payable REAL DEFAULT 0,
      totalPurchase REAL DEFAULT 0,
      totalPaid REAL DEFAULT 0,
      lastPurchaseDate TEXT,
      lastPaymentDate TEXT,
      createdAt TEXT,
      updatedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      invoiceNo TEXT NOT NULL,
      type TEXT NOT NULL,
      paymentMethod TEXT,
      date TEXT NOT NULL,
      dueDate TEXT,
      partyId TEXT,
      paymentTerms TEXT,
      employeeId TEXT,
      jobId TEXT,
      locationId TEXT,
      toLocationId TEXT,
      reference TEXT,
      vendorInvNo TEXT,
      vendorInvoiceDate TEXT,
      linkToGRN TEXT,
      linkToPO TEXT,
      exchangeRate REAL DEFAULT 1,
      balance REAL DEFAULT 0,
      currency TEXT,
      regNo TEXT,
      startKms REAL DEFAULT 0,
      endKms REAL DEFAULT 0,
      rangeKms REAL DEFAULT 0,
      isCreditBill INTEGER DEFAULT 0,
      linkedInvoiceId TEXT,
      lines TEXT, -- JSON array of InvoiceLineRecord
      subtotal REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      discountAmount REAL DEFAULT 0,
      taxAmount REAL DEFAULT 0,
      whtPercent REAL DEFAULT 0,
      whtAmount REAL DEFAULT 0,
      total REAL DEFAULT 0,
      netTotal REAL DEFAULT 0,
      receivedAmount REAL DEFAULT 0,
      dueAmount REAL DEFAULT 0,
      paymentStatus TEXT,
      paymentAccountId TEXT,
      notes TEXT,
      useAdvance INTEGER DEFAULT 0,
      advanceAmountUsed REAL DEFAULT 0,
      deliveryStatus TEXT,
      status TEXT,
      createdAt TEXT,
      updatedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      openingBalance REAL DEFAULT 0,
      currentBalance REAL DEFAULT 0,
      createdAt TEXT,
      updatedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS journal_entries (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      voucherNo TEXT,
      invoiceId TEXT,
      accountCode TEXT,
      accountTitle TEXT,
      partyId TEXT,
      partyType TEXT,
      debit REAL DEFAULT 0,
      credit REAL DEFAULT 0,
      description TEXT,
      remarks TEXT,
      createdAt TEXT,
      updatedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS cash_receipts (
      id TEXT PRIMARY KEY,
      receiptNumber TEXT NOT NULL,
      receiptType TEXT,
      date TEXT NOT NULL,
      partyId TEXT,
      cashAccountId TEXT,
      cashAccountTitle TEXT,
      reference TEXT,
      narration TEXT,
      employeeId TEXT,
      jobId TEXT,
      amount REAL DEFAULT 0,
      whtAmount REAL DEFAULT 0,
      netAmount REAL DEFAULT 0,
      notes TEXT,
      remarks TEXT,
      status TEXT,
      partyReceiptType TEXT,
      contraLines TEXT,
      partyLines TEXT,
      paymentMethod TEXT,
      createdAt TEXT,
      updatedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS cash_payments (
      id TEXT PRIMARY KEY,
      voucherNo TEXT NOT NULL,
      date TEXT NOT NULL,
      partyId TEXT,
      vendor TEXT,
      cashAccountId TEXT,
      amount REAL DEFAULT 0,
      wht REAL DEFAULT 0,
      netPaid REAL DEFAULT 0,
      reference TEXT,
      narration TEXT,
      notes TEXT,
      remarks TEXT,
      status TEXT,
      isRefund INTEGER DEFAULT 0,
      partyPaymentType TEXT,
      paymentMethod TEXT,
      createdAt TEXT,
      updatedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS bank_receipts (
      id TEXT PRIMARY KEY,
      receiptNumber TEXT NOT NULL,
      date TEXT NOT NULL,
      party TEXT,
      bankId TEXT,
      partyId TEXT,
      amount REAL DEFAULT 0,
      instrumentNo TEXT,
      chequeNo TEXT,
      chequeDate TEXT,
      status TEXT,
      narration TEXT,
      createdAt TEXT,
      updatedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS bank_payments (
      id TEXT PRIMARY KEY,
      voucherNo TEXT NOT NULL,
      date TEXT NOT NULL,
      vendor TEXT,
      bankId TEXT,
      partyId TEXT,
      amount REAL DEFAULT 0,
      instrumentNo TEXT,
      chequeNo TEXT,
      chequeDate TEXT,
      status TEXT,
      narration TEXT,
      createdAt TEXT,
      updatedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS shop_profiles (
      id TEXT PRIMARY KEY,
      name TEXT,
      companyName TEXT,
      tradeName TEXT,
      address TEXT,
      city TEXT,
      province TEXT,
      country TEXT,
      postalCode TEXT,
      phone TEXT,
      mobile TEXT,
      email TEXT,
      website TEXT,
      ntn TEXT,
      gstRegistration TEXT,
      stn TEXT,
      strn TEXT,
      fiscalYearStart TEXT,
      currency TEXT,
      logo TEXT,
      terms TEXT,
      amountDecimalPlaces TEXT,
      quantityDecimalPlaces TEXT,
      createdAt TEXT,
      updatedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS delivery_orders (
      id TEXT PRIMARY KEY,
      deliveryNo TEXT NOT NULL,
      invoiceId TEXT,
      partyId TEXT,
      date TEXT NOT NULL,
      lines TEXT, -- JSON
      status TEXT,
      notes TEXT,
      createdAt TEXT,
      updatedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id TEXT PRIMARY KEY,
      userId TEXT,
      action TEXT NOT NULL,
      module TEXT NOT NULL,
      details TEXT,
      entityId TEXT,
      createdAt TEXT,
      updatedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS backup_histories (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      size INTEGER DEFAULT 0,
      recordCount INTEGER DEFAULT 0,
      type TEXT NOT NULL,
      createdAt TEXT,
      updatedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      key TEXT UNIQUE NOT NULL,
      value TEXT, -- JSON
      createdAt TEXT,
      updatedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS locations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT,
      address TEXT,
      isGodown INTEGER DEFAULT 0,
      isWarehouse INTEGER DEFAULT 0,
      createdAt TEXT,
      updatedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT,
      designation TEXT,
      department TEXT,
      phone TEXT,
      salary REAL DEFAULT 0,
      status TEXT,
      createdAt TEXT,
      updatedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS banks (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      accountNumber TEXT,
      branch TEXT,
      bankCode TEXT,
      balance REAL DEFAULT 0,
      createdAt TEXT,
      updatedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS other_incomes (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      incomeType TEXT,
      amount REAL DEFAULT 0,
      paymentMethod TEXT,
      reference TEXT,
      notes TEXT,
      createdAt TEXT,
      updatedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS vehicle_logs (
      id TEXT PRIMARY KEY,
      regNo TEXT,
      invoiceId TEXT,
      driver TEXT,
      kms REAL DEFAULT 0,
      date TEXT,
      createdAt TEXT,
      updatedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      voucherNo TEXT NOT NULL,
      date TEXT NOT NULL,
      category TEXT,
      amount REAL DEFAULT 0,
      paymentAccountId TEXT,
      status TEXT,
      notes TEXT,
      createdAt TEXT,
      updatedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS salary_advances (
      id TEXT PRIMARY KEY,
      voucherNo TEXT NOT NULL,
      date TEXT NOT NULL,
      employee TEXT,
      amount REAL DEFAULT 0,
      status TEXT,
      notes TEXT,
      createdAt TEXT,
      updatedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS salary_loans (
      id TEXT PRIMARY KEY,
      voucherNo TEXT NOT NULL,
      date TEXT NOT NULL,
      employee TEXT,
      amount REAL DEFAULT 0,
      status TEXT,
      notes TEXT,
      createdAt TEXT,
      updatedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS payrolls (
      id TEXT PRIMARY KEY,
      voucherNo TEXT NOT NULL,
      date TEXT NOT NULL,
      month TEXT,
      totalAmount REAL DEFAULT 0,
      status TEXT,
      notes TEXT,
      createdAt TEXT,
      updatedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS salary_settlements (
      id TEXT PRIMARY KEY,
      voucherNo TEXT NOT NULL,
      date TEXT NOT NULL,
      employee TEXT,
      amount REAL DEFAULT 0,
      status TEXT,
      notes TEXT,
      createdAt TEXT,
      updatedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS drafts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      module TEXT,
      data TEXT,
      createdAt TEXT
    );

    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT,
      entity TEXT,
      data TEXT,
      status TEXT,
      createdAt TEXT
    );

    -- Create Indexes for fast querying
    CREATE INDEX IF NOT EXISTS idx_items_code ON items(code);
    CREATE INDEX IF NOT EXISTS idx_items_name ON items(name);
    CREATE INDEX IF NOT EXISTS idx_items_barcode ON items(barcode);
    CREATE INDEX IF NOT EXISTS idx_parties_code ON parties(code);
    CREATE INDEX IF NOT EXISTS idx_parties_name ON parties(name);
    CREATE INDEX IF NOT EXISTS idx_parties_type ON parties(type);
    CREATE INDEX IF NOT EXISTS idx_invoices_no ON invoices(invoiceNo);
    CREATE INDEX IF NOT EXISTS idx_invoices_type ON invoices(type);
    CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(date);
    CREATE INDEX IF NOT EXISTS idx_invoices_party ON invoices(partyId);
    CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON journal_entries(date);
    CREATE INDEX IF NOT EXISTS idx_journal_entries_acc ON journal_entries(accountCode);
    CREATE INDEX IF NOT EXISTS idx_journal_entries_party ON journal_entries(partyId);
    CREATE INDEX IF NOT EXISTS idx_journal_entries_voucher ON journal_entries(voucherNo);
    CREATE INDEX IF NOT EXISTS idx_cash_receipts_date ON cash_receipts(date);
    CREATE INDEX IF NOT EXISTS idx_cash_payments_date ON cash_payments(date);
    CREATE INDEX IF NOT EXISTS idx_bank_receipts_date ON bank_receipts(date);
    CREATE INDEX IF NOT EXISTS idx_bank_payments_date ON bank_payments(date);
  `);
}

// Schema is auto-initialized lazily when the database is first accessed
