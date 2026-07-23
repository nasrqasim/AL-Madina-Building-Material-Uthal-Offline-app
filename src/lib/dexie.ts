import Dexie, { Table } from "dexie";
import bcrypt from "bcryptjs";
import { BUILDING_CATEGORIES, CATEGORY_SUBCATEGORIES, CATEGORY_BRANDS, SALE_UNITS, SEED_ITEMS } from "./buildingMaterial";
import { COMPANY_NAME, COMPANY_ADDRESS, DEFAULT_COMPANY_FORM } from "./company";
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

class ERPDexie extends Dexie {
  drafts!: Table<DraftRecord, number>;
  syncQueue!: Table<SyncQueueRecord, number>;
  users!: Table<UserRecord, string>;
  categories!: Table<CategoryRecord, string>;
  brands!: Table<BrandRecord, string>;
  units!: Table<UnitRecord, string>;
  items!: Table<ItemRecord, string>;
  parties!: Table<PartyRecord, string>;
  invoices!: Table<InvoiceRecord, string>;
  accounts!: Table<AccountRecord, string>;
  journalEntries!: Table<JournalEntryRecord, string>;
  cashReceipts!: Table<CashReceiptRecord, string>;
  cashPayments!: Table<CashPaymentRecord, string>;
  bankReceipts!: Table<BankReceiptRecord, string>;
  bankPayments!: Table<BankPaymentRecord, string>;
  shopProfiles!: Table<ShopProfileRecord, string>;
  deliveryOrders!: Table<DeliveryOrderRecord, string>;
  activityLogs!: Table<ActivityLogRecord, string>;
  backupHistories!: Table<BackupHistoryRecord, string>;
  settings!: Table<SettingRecord, string>;
  locations!: Table<LocationRecord, string>;
  employees!: Table<EmployeeRecord, string>;
  banks!: Table<BankRecord, string>;
  otherIncomes!: Table<OtherIncomeRecord, string>;
  vehicleLogs!: Table<any, string>;
  expenses!: Table<ExpenseRecord, string>;
  salaryAdvances!: Table<SalaryAdvanceRecord, string>;
  salaryLoans!: Table<SalaryLoanRecord, string>;
  payrolls!: Table<PayrollRunRecord, string>;
  salarySettlements!: Table<FinalSettlementRecord, string>;

  constructor() {
    super("buildingMaterialERP");
    
    this.version(1).stores({
      drafts: "++id,module,createdAt",
      syncQueue: "++id,status,createdAt",
      users: "id, _id, username, role",
      categories: "id, _id, name, type, parentId",
      brands: "id, _id, name, categoryId",
      units: "id, _id, name",
      items: "id, _id, code, name, mainCategoryId, subCategoryId, brandId, barcode",
      parties: "id, _id, code, name, type",
      invoices: "id, _id, invoiceNo, type, date, partyId, deliveryStatus, status",
      accounts: "id, _id, code, type",
      journalEntries: "id, _id, date, accountCode, partyId, voucherNo",
      cashReceipts: "id, _id, receiptNumber, date, partyId",
      cashPayments: "id, _id, voucherNo, date, partyId",
      bankReceipts: "id, _id, receiptNumber, date",
      bankPayments: "id, _id, voucherNo, date",
      shopProfiles: "id, _id",
      deliveryOrders: "id, _id, deliveryNo, invoiceId, partyId, date, status",
      activityLogs: "id, _id, userId, action, module",
      backupHistories: "id, _id",
      settings: "id, _id, key",
      locations: "id, _id, name",
      employees: "id, _id, name",
      banks: "id, _id, name",
      otherIncomes: "id, _id, date, incomeType, paymentMethod",
      vehicleLogs: "id, _id, regNo, invoiceId",
    });

    this.version(2).stores({
      journalEntries: "id, _id, date, accountCode, partyId, voucherNo, invoiceId",
    });

    this.version(3).stores({
      otherIncomes: "id, _id, date, incomeType, paymentMethod",
    });

    this.version(4).stores({
      expenses: "id, _id, voucherNo, date, category, status",
      salaryAdvances: "id, _id, voucherNo, date, employee, status",
      salaryLoans: "id, _id, voucherNo, date, employee, status",
      payrolls: "id, _id, voucherNo, date, month, status",
      salarySettlements: "id, _id, voucherNo, date, employee, status",
    });
  }
}

export const offlineDB = new ERPDexie();

// Helper function to generate unique ID
export function generateUniqueId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function makeId(prefix: string, label: string): string {
  return prefix + label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

// Function to seed database with initial records
export async function seedOfflineDatabase() {
  try {
    // ───────────────────────────── 1. Users ─────────────────────────────
    const userCount = await offlineDB.users.count();
    if (userCount === 0) {
      const superadminPassword = await bcrypt.hash("admin123", 10);
      const adminPassword = await bcrypt.hash("NajeebOil@Shop", 10);
      
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
          name: "Najeeb Ahmed",
          username: "najeebahmed@gmail.com",
          email: "najeebahmed@gmail.com",
          password: adminPassword,
          role: "admin",
          financialYear: "2025-2026",
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ];
      await offlineDB.users.bulkAdd(defaultUsers);
      console.log("Offline DB: Seeded users.");
    }

    // ───────────────────────── 2. Categories (Main + Sub) ──────────────
    const catCount = await offlineDB.categories.count();
    if (catCount === 0) {
      const allCats: CategoryRecord[] = [];

      for (const mainName of BUILDING_CATEGORIES) {
        const mainId = makeId("cat_", mainName);
        allCats.push({
          id: mainId,
          _id: mainId,
          name: mainName,
          code: mainName.toUpperCase().replace(/\s+/g, "_"),
          type: "main",
          parentId: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        // Sub-categories
        const subs = CATEGORY_SUBCATEGORIES[mainName] || [];
        for (const subName of subs) {
          const subId = makeId("cat_sub_", subName);
          allCats.push({
            id: subId,
            _id: subId,
            name: subName,
            code: subName.toUpperCase().replace(/\s+/g, "_"),
            type: "sub",
            parentId: mainId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      }

      await offlineDB.categories.bulkAdd(allCats);
      console.log(`Offline DB: Seeded ${allCats.length} categories (main + sub).`);
    }

    // ───────────────────────── 3. Brands ───────────────────────────────
    const brandCount = await offlineDB.brands.count();
    if (brandCount === 0) {
      const allBrands: BrandRecord[] = [];
      const seenBrands = new Set<string>();

      for (const mainName of BUILDING_CATEGORIES) {
        const mainCatId = makeId("cat_", mainName);
        const brands = CATEGORY_BRANDS[mainName] || [];
        for (const brandName of brands) {
          const brandKey = `${mainName}__${brandName}`;
          if (seenBrands.has(brandKey)) continue;
          seenBrands.add(brandKey);

          const brandId = makeId("brand_", `${mainName}_${brandName}`);
          allBrands.push({
            id: brandId,
            _id: brandId,
            name: brandName,
            categoryId: mainCatId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      }

      await offlineDB.brands.bulkAdd(allBrands);
      console.log(`Offline DB: Seeded ${allBrands.length} brands.`);
    }

    // ───────────────────────── 4. Units ────────────────────────────────
    const unitCount = await offlineDB.units.count();
    if (unitCount === 0) {
      const allUnits: UnitRecord[] = SALE_UNITS.map(name => ({
        id: makeId("unit_", name),
        _id: makeId("unit_", name),
        name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      await offlineDB.units.bulkAdd(allUnits);
      console.log(`Offline DB: Seeded ${allUnits.length} selling units.`);
    }

    // ───────────────────────── 5. Sample Items ─────────────────────────
    const itemCount = await offlineDB.items.count();
    if (itemCount === 0) {
      const allItems: ItemRecord[] = SEED_ITEMS.map((si, idx) => {
        const code = `ITEM-${String(idx + 1).padStart(4, "0")}`;
        const itemId = makeId("item_", si.name);
        const mainCatId = makeId("cat_", si.category);
        const subCatId = makeId("cat_sub_", si.subCategory);

        return {
          id: itemId,
          _id: itemId,
          code,
          name: si.name,
          mainCategoryId: mainCatId,
          subCategoryId: subCatId,
          brandId: si.brand,
          model: "",
          color: "",
          design: "",
          size: si.size,
          thickness: "",
          length: "",
          width: "",
          weight: "",
          grade: "",
          pattern: "",
          finish: "",
          quality: "",
          unit: si.unit,
          hsCode: "",
          barcode: "",
          qrCode: "",
          purchaseRate: si.purchaseRate,
          wholesaleRate: si.wholesaleRate,
          retailRate: si.retailRate,
          dealerRate: 0,
          contractRate: 0,
          discount: 0,
          taxPercent: 0,
          stockQtyCartons: si.openingStock,
          reorderLevel: 10,
          maxStock: 10000,
          location: "",
          rack: "",
          godown: "",
          warehouse: "",
          remarks: "",
          status: "Active",
          // Legacy compat fields
          rate: si.retailRate,
          litersInCtn: 0,
          gallonsInCtn: 0,
          category: si.category,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as any;
      });

      await offlineDB.items.bulkAdd(allItems);
      console.log(`Offline DB: Seeded ${allItems.length} building material items.`);
    }

    // ───────────────────────── 6. Default Customer ─────────────────────
    const partyCount = await offlineDB.parties.count();
    if (partyCount === 0) {
      const walkIn: PartyRecord = {
        id: "party_walkin",
        _id: "party_walkin",
        code: "CUST-0001",
        name: "Walk-in Cash Customer",
        companyName: "Walk-in Cash Customer",
        type: "Customer",
        phone: "",
        address: "",
        city: "Uthal",
        email: "",
        ntn: "",
        gst: "",
        creditLimit: 0,
        balance: 0,
        debit: 0,
        credit: 0,
        advanceBalance: 0,
        openingBalance: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await offlineDB.parties.add(walkIn);
      console.log("Offline DB: Seeded default walk-in customer.");
    }

    // ───────────────────────── 7. Shop Profile ─────────────────────────
    const profileCount = await offlineDB.shopProfiles.count();
    if (profileCount === 0) {
      const defaultProfile: ShopProfileRecord = {
        id: "profile_default",
        companyName: COMPANY_NAME,
        tradeName: COMPANY_NAME,
        address: COMPANY_ADDRESS,
        phone: "0300-1234567",
        email: "contact@almadina.com",
        currency: "PKR",
        ntn: "1234567-8",
        gstRegistration: "9876543-21",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await offlineDB.shopProfiles.add(defaultProfile);
      console.log("Offline DB: Seeded shop profile.");
    }

    // ───────────────────────── 8. Chart of Accounts ────────────────────
    const accountCount = await offlineDB.accounts.count();
    if (accountCount === 0) {
      const defaultAccounts: AccountRecord[] = [
        { id: "acc_1000", code: "1000", title: "Cash", type: "cash", openingBalance: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: "acc_1111", code: "1111", title: "Cash Hand", type: "cash", openingBalance: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: "acc_1010", code: "1010", title: "Bank", type: "bank", openingBalance: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: "acc_1110", code: "1110", title: "Bank Account", type: "bank", openingBalance: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: "acc_1100", code: "1100", title: "Accounts Receivable", type: "receivable", openingBalance: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: "acc_2100", code: "2100", title: "Accounts Payable", type: "payable", openingBalance: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: "acc_2120", code: "2120", title: "Customer Advance Liability", type: "receivable", openingBalance: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: "acc_4100", code: "4100", title: "Sales", type: "income", openingBalance: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: "acc_4101", code: "4101", title: "Sales Return", type: "income", openingBalance: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: "acc_5100", code: "5100", title: "Purchases", type: "expense", openingBalance: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: "acc_5101", code: "5101", title: "Purchase Return", type: "expense", openingBalance: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: "acc_5200", code: "5200", title: "Daily Expense", type: "expense", openingBalance: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: "acc_5300", code: "5300", title: "Salary Expense", type: "expense", openingBalance: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: "acc_1120", code: "1120", title: "Salary Advance Asset", type: "asset", openingBalance: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: "acc_1125", code: "1125", title: "Salary Loan Asset", type: "asset", openingBalance: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: "acc_tax", code: "Tax on Purchased Items", title: "Tax on Purchased Items", type: "expense", openingBalance: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      ];
      await offlineDB.accounts.bulkAdd(defaultAccounts);
      console.log("Offline DB: Seeded chart of accounts.");
    }
  } catch (error) {
    console.error("Error seeding offline database:", error);
  }
}
