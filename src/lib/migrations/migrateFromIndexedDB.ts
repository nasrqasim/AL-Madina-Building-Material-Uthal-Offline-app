import { sqlite } from "../db";
import { sqliteDB } from "../sqlite";

export interface MigrationPayload {
  users?: any[];
  categories?: any[];
  brands?: any[];
  units?: any[];
  items?: any[];
  parties?: any[];
  invoices?: any[];
  accounts?: any[];
  journalEntries?: any[];
  cashReceipts?: any[];
  cashPayments?: any[];
  bankReceipts?: any[];
  bankPayments?: any[];
  shopProfiles?: any[];
  deliveryOrders?: any[];
  activityLogs?: any[];
  settings?: any[];
  locations?: any[];
  employees?: any[];
  banks?: any[];
  otherIncomes?: any[];
  expenses?: any[];
  salaryAdvances?: any[];
  salaryLoans?: any[];
  payrolls?: any[];
  salarySettlements?: any[];
}

export async function migrateIndexedDBPayloadToSQLite(payload: MigrationPayload): Promise<{
  success: boolean;
  migratedCounts: Record<string, number>;
}> {
  const migratedCounts: Record<string, number> = {};

  const tableMap: Array<{ key: keyof MigrationPayload; table: any }> = [
    { key: "users", table: sqliteDB.users },
    { key: "categories", table: sqliteDB.categories },
    { key: "brands", table: sqliteDB.brands },
    { key: "units", table: sqliteDB.units },
    { key: "items", table: sqliteDB.items },
    { key: "parties", table: sqliteDB.parties },
    { key: "invoices", table: sqliteDB.invoices },
    { key: "accounts", table: sqliteDB.accounts },
    { key: "journalEntries", table: sqliteDB.journalEntries },
    { key: "cashReceipts", table: sqliteDB.cashReceipts },
    { key: "cashPayments", table: sqliteDB.cashPayments },
    { key: "bankReceipts", table: sqliteDB.bankReceipts },
    { key: "bankPayments", table: sqliteDB.bankPayments },
    { key: "shopProfiles", table: sqliteDB.shopProfiles },
    { key: "deliveryOrders", table: sqliteDB.deliveryOrders },
    { key: "activityLogs", table: sqliteDB.activityLogs },
    { key: "settings", table: sqliteDB.settings },
    { key: "locations", table: sqliteDB.locations },
    { key: "employees", table: sqliteDB.employees },
    { key: "banks", table: sqliteDB.banks },
    { key: "otherIncomes", table: sqliteDB.otherIncomes },
    { key: "expenses", table: sqliteDB.expenses },
    { key: "salaryAdvances", table: sqliteDB.salaryAdvances },
    { key: "salaryLoans", table: sqliteDB.salaryLoans },
    { key: "payrolls", table: sqliteDB.payrolls },
    { key: "salarySettlements", table: sqliteDB.salarySettlements },
  ];

  for (const { key, table } of tableMap) {
    const records = payload[key];
    if (records && Array.isArray(records) && records.length > 0) {
      await table.bulkPut(records);
      migratedCounts[key as string] = records.length;
    } else {
      migratedCounts[key as string] = 0;
    }
  }

  return {
    success: true,
    migratedCounts
  };
}
