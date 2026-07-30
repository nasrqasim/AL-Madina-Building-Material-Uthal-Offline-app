import { sqlite } from "./db";
import bcrypt from "bcryptjs";
import { BUILDING_CATEGORIES, CATEGORY_SUBCATEGORIES, CATEGORY_BRANDS, SALE_UNITS, SEED_ITEMS } from "./buildingMaterial";
import { COMPANY_NAME, COMPANY_ADDRESS } from "./company";
import {
  UserRecord,
  CategoryRecord,
  BrandRecord,
  UnitRecord,
  ItemRecord,
  PartyRecord,
  InvoiceRecord,
  AccountRecord,
  JournalEntryRecord,
  CashReceiptRecord,
  CashPaymentRecord,
  BankReceiptRecord,
  BankPaymentRecord,
  ShopProfileRecord,
  DeliveryOrderRecord,
  ActivityLogRecord,
  BackupHistoryRecord,
  SettingRecord,
  DraftRecord,
  SyncQueueRecord,
  LocationRecord,
  EmployeeRecord,
  BankRecord,
  OtherIncomeRecord,
  ExpenseRecord,
  SalaryAdvanceRecord,
  SalaryLoanRecord,
  PayrollRunRecord,
  FinalSettlementRecord,
} from "./offline/types";

function serializeField(val: any): any {
  if (val === undefined) return null;
  if (typeof val === "boolean") return val ? 1 : 0;
  if (typeof val === "object" && val !== null) return JSON.stringify(val);
  return val;
}

function deserializeRow(row: any): any {
  if (!row) return null;
  const parsed: any = { ...row };
  for (const key of Object.keys(parsed)) {
    const val = parsed[key];
    if (typeof val === "string" && (val.startsWith("[") || val.startsWith("{"))) {
      try {
        parsed[key] = JSON.parse(val);
      } catch {
        // Keep as string
      }
    }
  }
  // Auto-add _id from id for MongoDB compatibility (frontend uses _id everywhere)
  if (parsed.id && !parsed._id) {
    parsed._id = parsed.id;
  }
  return parsed;
}

export class QueryBuilder<T> {
  constructor(private rows: T[]) {}

  public filter(predicate: (item: T) => boolean): QueryBuilder<T> {
    return new QueryBuilder(this.rows.filter(predicate));
  }

  public and(predicate: (item: T) => boolean): QueryBuilder<T> {
    return this.filter(predicate);
  }

  public reverse(): QueryBuilder<T> {
    return new QueryBuilder([...this.rows].reverse());
  }

  public limit(count: number): QueryBuilder<T> {
    return new QueryBuilder(this.rows.slice(0, count));
  }

  public async toArray(): Promise<T[]> {
    return this.rows;
  }

  public async first(): Promise<T | undefined> {
    return this.rows[0];
  }

  public async count(): Promise<number> {
    return this.rows.length;
  }

  public async delete(): Promise<void> {
    // Delete items matching the current subset
    // Handled at table level
  }
}

export class SQLiteTable<T extends { id?: string | number | undefined }> {
  private _columns: Set<string> | null = null;

  constructor(private tableName: string) {}

  /** Get existing column names for this table (cached) */
  private getColumns(): Set<string> {
    if (!this._columns) {
      const cols = sqlite.prepare(`PRAGMA table_info(${this.tableName})`).all() as any[];
      this._columns = new Set(cols.map((c: any) => c.name));
    }
    return this._columns;
  }

  /** Ensure all keys in the record exist as columns; auto-add missing ones */
  private ensureColumns(keys: string[]): void {
    const existing = this.getColumns();
    for (const key of keys) {
      if (!existing.has(key)) {
        try {
          sqlite.exec(`ALTER TABLE ${this.tableName} ADD COLUMN ${key} TEXT`);
          existing.add(key);
        } catch {
          // Column might already exist from concurrent add
        }
      }
    }
  }

  /** Strip _id and undefined values from a record before writing */
  private sanitize(record: any): any {
    const clean: any = {};
    for (const [k, v] of Object.entries(record)) {
      if (k === "_id") continue; // MongoDB artifact, not stored in SQLite
      if (v === undefined) continue;
      clean[k] = v;
    }
    return clean;
  }

  public async count(): Promise<number> {
    const row = sqlite.prepare(`SELECT COUNT(*) as count FROM ${this.tableName}`).get() as any;
    return row ? row.count : 0;
  }

  public async toArray(): Promise<T[]> {
    const rows = sqlite.prepare(`SELECT * FROM ${this.tableName}`).all();
    return rows.map(deserializeRow);
  }

  public async get(id: string | number): Promise<T | undefined> {
    const row = sqlite.prepare(`SELECT * FROM ${this.tableName} WHERE id = ?`).get(id);
    return row ? deserializeRow(row) : undefined;
  }

  public async add(item: T): Promise<string | number> {
    const record = this.sanitize({ ...item });
    if (!record.id) record.id = generateUniqueId();
    const keys = Object.keys(record);
    this.ensureColumns(keys);
    const placeholders = keys.map(() => "?").join(", ");
    const sql = `INSERT INTO ${this.tableName} (${keys.join(", ")}) VALUES (${placeholders})`;
    const values = keys.map(k => serializeField(record[k]));
    sqlite.prepare(sql).run(...values);
    return record.id!;
  }

  public async put(item: T): Promise<string | number> {
    const record = this.sanitize({ ...item });
    if (!record.id) record.id = generateUniqueId();
    const keys = Object.keys(record);
    this.ensureColumns(keys);
    const placeholders = keys.map(() => "?").join(", ");
    const sql = `INSERT OR REPLACE INTO ${this.tableName} (${keys.join(", ")}) VALUES (${placeholders})`;
    const values = keys.map(k => serializeField(record[k]));
    sqlite.prepare(sql).run(...values);
    return record.id!;
  }

  public async update(id: string | number, changes: Partial<T>): Promise<number> {
    const clean = this.sanitize(changes);
    const keys = Object.keys(clean).filter(k => k !== "id");
    if (keys.length === 0) return 0;
    this.ensureColumns(keys);
    const setClause = keys.map(k => `${k} = ?`).join(", ");
    const sql = `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`;
    const values = [...keys.map(k => serializeField(clean[k])), id];
    const info = sqlite.prepare(sql).run(...values);
    return info.changes;
  }

  public async delete(id: string | number): Promise<void> {
    sqlite.prepare(`DELETE FROM ${this.tableName} WHERE id = ?`).run(id);
  }

  public async clear(): Promise<void> {
    sqlite.prepare(`DELETE FROM ${this.tableName}`).run();
  }

  public async bulkAdd(items: T[]): Promise<void> {
    if (!items || items.length === 0) return;
    // Pre-scan all keys for column creation
    const allKeys = new Set<string>();
    for (const item of items) {
      for (const k of Object.keys(item as any)) {
        if (k !== "_id") allKeys.add(k);
      }
    }
    this.ensureColumns(Array.from(allKeys));

    const insertTx = sqlite.transaction((records: T[]) => {
      for (const item of records) {
        const record = this.sanitize({ ...item });
        if (!record.id) record.id = generateUniqueId();
        const keys = Object.keys(record);
        const placeholders = keys.map(() => "?").join(", ");
        const sql = `INSERT INTO ${this.tableName} (${keys.join(", ")}) VALUES (${placeholders})`;
        const values = keys.map(k => serializeField(record[k]));
        sqlite.prepare(sql).run(...values);
      }
    });
    insertTx(items);
  }

  public async bulkPut(items: T[]): Promise<void> {
    if (!items || items.length === 0) return;
    // Pre-scan all keys for column creation
    const allKeys = new Set<string>();
    for (const item of items) {
      for (const k of Object.keys(item as any)) {
        if (k !== "_id") allKeys.add(k);
      }
    }
    this.ensureColumns(Array.from(allKeys));

    const putTx = sqlite.transaction((records: T[]) => {
      for (const item of records) {
        const record = this.sanitize({ ...item });
        if (!record.id) record.id = generateUniqueId();
        const keys = Object.keys(record);
        const placeholders = keys.map(() => "?").join(", ");
        const sql = `INSERT OR REPLACE INTO ${this.tableName} (${keys.join(", ")}) VALUES (${placeholders})`;
        const values = keys.map(k => serializeField(record[k]));
        sqlite.prepare(sql).run(...values);
      }
    });
    putTx(items);
  }

  public filter(predicate: (item: T) => boolean): QueryBuilder<T> {
    const all = sqlite.prepare(`SELECT * FROM ${this.tableName}`).all().map(deserializeRow);
    return new QueryBuilder(all.filter(predicate));
  }

  public where(field: string) {
    return {
      equals: (val: any) => {
        const rows = sqlite.prepare(`SELECT * FROM ${this.tableName} WHERE ${field} = ?`).all(serializeField(val)).map(deserializeRow);
        return new QueryBuilder<T>(rows);
      },
      equalsIgnoreCase: (val: string) => {
        const rows = sqlite.prepare(`SELECT * FROM ${this.tableName} WHERE LOWER(${field}) = LOWER(?)`).all(val).map(deserializeRow);
        return new QueryBuilder<T>(rows);
      },
      between: (lower: any, upper: any, includeLower = true, includeUpper = true) => {
        const opLower = includeLower ? ">=" : ">";
        const opUpper = includeUpper ? "<=" : "<";
        const sql = `SELECT * FROM ${this.tableName} WHERE ${field} ${opLower} ? AND ${field} ${opUpper} ?`;
        const rows = sqlite.prepare(sql).all(serializeField(lower), serializeField(upper)).map(deserializeRow);
        return new QueryBuilder<T>(rows);
      },
      anyOf: (values: any[]) => {
        if (!values || values.length === 0) return new QueryBuilder<T>([]);
        const placeholders = values.map(() => "?").join(", ");
        const sql = `SELECT * FROM ${this.tableName} WHERE ${field} IN (${placeholders})`;
        const rows = sqlite.prepare(sql).all(...values.map(serializeField)).map(deserializeRow);
        return new QueryBuilder<T>(rows);
      }
    };
  }
}

class ERPSQLite {
  drafts = new SQLiteTable<DraftRecord>("drafts");
  syncQueue = new SQLiteTable<SyncQueueRecord>("sync_queue");
  users = new SQLiteTable<UserRecord>("users");
  categories = new SQLiteTable<CategoryRecord>("categories");
  brands = new SQLiteTable<BrandRecord>("brands");
  units = new SQLiteTable<UnitRecord>("units");
  items = new SQLiteTable<ItemRecord>("items");
  parties = new SQLiteTable<PartyRecord>("parties");
  invoices = new SQLiteTable<InvoiceRecord>("invoices");
  accounts = new SQLiteTable<AccountRecord>("accounts");
  journalEntries = new SQLiteTable<JournalEntryRecord>("journal_entries");
  cashReceipts = new SQLiteTable<CashReceiptRecord>("cash_receipts");
  cashPayments = new SQLiteTable<CashPaymentRecord>("cash_payments");
  bankReceipts = new SQLiteTable<BankReceiptRecord>("bank_receipts");
  bankPayments = new SQLiteTable<BankPaymentRecord>("bank_payments");
  shopProfiles = new SQLiteTable<ShopProfileRecord>("shop_profiles");
  deliveryOrders = new SQLiteTable<DeliveryOrderRecord>("delivery_orders");
  activityLogs = new SQLiteTable<ActivityLogRecord>("activity_logs");
  backupHistories = new SQLiteTable<BackupHistoryRecord>("backup_histories");
  settings = new SQLiteTable<SettingRecord>("settings");
  locations = new SQLiteTable<LocationRecord>("locations");
  employees = new SQLiteTable<EmployeeRecord>("employees");
  banks = new SQLiteTable<BankRecord>("banks");
  otherIncomes = new SQLiteTable<OtherIncomeRecord>("other_incomes");
  vehicleLogs = new SQLiteTable<any>("vehicle_logs");
  expenses = new SQLiteTable<ExpenseRecord>("expenses");
  salaryAdvances = new SQLiteTable<SalaryAdvanceRecord>("salary_advances");
  salaryLoans = new SQLiteTable<SalaryLoanRecord>("salary_loans");
  payrolls = new SQLiteTable<PayrollRunRecord>("payrolls");
  salarySettlements = new SQLiteTable<FinalSettlementRecord>("salary_settlements");

  public async transaction(mode: string, tables: any[], callback: () => Promise<any> | any): Promise<any> {
    return await callback();
  }
}

export const sqliteDB = new ERPSQLite();
export const offlineDB = sqliteDB;

export function generateUniqueId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function makeId(prefix: string, label: string): string {
  return prefix + label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

export async function seedOfflineDatabase() {
  try {
    const userCount = await sqliteDB.users.count();
    if (userCount === 0) {
      const superadminPassword = bcrypt.hashSync("admin123", 10);
      const adminPassword = bcrypt.hashSync("NajeebOil@Shop", 10);

      const defaultUsers: UserRecord[] = [
        {
          id: "usr_superadmin",
          name: "Super Administrator",
          username: "superadmin",
          email: "superadmin@pos.com",
          password: superadminPassword,
          role: "superadmin",
          financialYear: "2025-2026",
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "usr_admin",
          name: "Administrator",
          username: "admin",
          email: "admin@pos.com",
          password: adminPassword,
          role: "admin",
          financialYear: "2025-2026",
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "usr_shopadmin",
          name: "Al Madina Shop Admin",
          username: "almadinashop",
          email: "Almadinabuildingmaterialuthalshop@gmail.com",
          password: bcrypt.hashSync("Shop#Almadina@Akram", 10),
          role: "superadmin",
          financialYear: "2025-2026",
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      await sqliteDB.users.bulkAdd(defaultUsers);
    } else {
      // Ensure the shop admin account exists
      const shopAdmin = await sqliteDB.users.where("email").equalsIgnoreCase("Almadinabuildingmaterialuthalshop@gmail.com").first();
      if (!shopAdmin) {
        await sqliteDB.users.add({
          id: "usr_shopadmin",
          name: "Al Madina Shop Admin",
          username: "almadinashop",
          email: "Almadinabuildingmaterialuthalshop@gmail.com",
          password: bcrypt.hashSync("Shop#Almadina@Akram", 10),
          role: "superadmin",
          financialYear: "2025-2026",
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }

    const catCount = await sqliteDB.categories.count();
    if (catCount === 0) {
      const mainCategories: CategoryRecord[] = BUILDING_CATEGORIES.map(name => ({
        id: makeId("cat_main_", name),
        name,
        type: "main",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      await sqliteDB.categories.bulkAdd(mainCategories);

      const subCategories: CategoryRecord[] = [];
      for (const mainCatName of Object.keys(CATEGORY_SUBCATEGORIES)) {
        const parentId = makeId("cat_main_", mainCatName);
        for (const subName of CATEGORY_SUBCATEGORIES[mainCatName]) {
          subCategories.push({
            id: makeId("cat_sub_", `${mainCatName}_${subName}`),
            name: subName,
            type: "sub",
            parentId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      }

      if (subCategories.length > 0) {
        await sqliteDB.categories.bulkAdd(subCategories);
      }
    }

    const brandCount = await sqliteDB.brands.count();
    if (brandCount === 0) {
      const allBrands: BrandRecord[] = [];
      for (const mainCatName of Object.keys(CATEGORY_BRANDS)) {
        const categoryId = makeId("cat_main_", mainCatName);
        for (const bName of CATEGORY_BRANDS[mainCatName]) {
          allBrands.push({
            id: makeId("brand_", `${mainCatName}_${bName}`),
            name: bName,
            categoryId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      }

      if (allBrands.length > 0) {
        await sqliteDB.brands.bulkAdd(allBrands);
      }
    }

    const unitCount = await sqliteDB.units.count();
    if (unitCount === 0) {
      const allUnits: UnitRecord[] = SALE_UNITS.map(name => ({
        id: makeId("unit_", name),
        name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      await sqliteDB.units.bulkAdd(allUnits);
    }

    const itemCount = await sqliteDB.items.count();
    if (itemCount === 0 && SEED_ITEMS.length > 0) {
      const itemsToInsert: ItemRecord[] = SEED_ITEMS.map((item, idx) => ({
        id: `item_${idx + 1}`,
        code: `ITEM-${String(1000 + idx).padStart(4, '0')}`,
        name: item.name,
        mainCategoryId: item.category ? makeId("cat_main_", item.category) : undefined,
        subCategoryId: item.subCategory && item.category ? makeId("cat_sub_", `${item.category}_${item.subCategory}`) : undefined,
        brandId: item.brand && item.category ? makeId("brand_", `${item.category}_${item.brand}`) : undefined,
        unit: item.unit || "Pcs",
        size: item.size || "",
        purchaseRate: item.purchaseRate || 0,
        wholesaleRate: item.wholesaleRate || item.retailRate || 0,
        retailRate: item.retailRate || 0,
        openingStock: item.openingStock || 0,
        stockQty: item.openingStock || 0,
        stockQtyCartons: item.openingStock || 0,
        reorderLevel: 5,
        status: "Active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      await sqliteDB.items.bulkAdd(itemsToInsert);
    }

    const shopCount = await sqliteDB.shopProfiles.count();
    if (shopCount === 0) {
      const defaultProfile: ShopProfileRecord = {
        id: "shop_default",
        companyName: COMPANY_NAME,
        address: COMPANY_ADDRESS,
        phone: "+92 300 1234567",
        email: "info@almadina.com",
        ntn: "1234567-8",
        stn: "9876543-2",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await sqliteDB.shopProfiles.add(defaultProfile);
    }
  } catch (error) {
    console.error("Failed to seed SQLite database:", error);
  }
}

// Seed is called on first API request, not at import time
