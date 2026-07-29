import fs from "fs";
import path from "path";
import { sqlite } from "./db";
import { sqliteDB } from "./sqlite";
import { getBackupsDirectory, getDatabaseFilePath } from "./dataDir";

export interface BackupResult {
  filename: string;
  filepath: string;
  size: number;
  recordCount: number;
  timestamp: string;
}

export async function createDatabaseBackup(type: "manual" | "auto" = "manual"): Promise<BackupResult> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 16);
  const filename = `almadina_${timestamp}_${type}.sqlite`;
  const backupsDir = getBackupsDirectory();
  const filepath = path.join(backupsDir, filename);

  // Use SQLite online backup API via better-sqlite3
  await sqlite.backup(filepath);

  const stats = fs.statSync(filepath);
  
  // Calculate total record count across tables
  const tables = [
    "users", "categories", "brands", "units", "items", "parties", "invoices",
    "accounts", "journal_entries", "cash_receipts", "cash_payments", "bank_receipts",
    "bank_payments", "shop_profiles", "delivery_orders", "activity_logs",
    "settings", "locations", "employees", "banks", "other_incomes", "expenses",
    "salary_advances", "salary_loans", "payrolls", "salary_settlements"
  ];

  let totalRecords = 0;
  for (const table of tables) {
    try {
      const res = sqlite.prepare(`SELECT COUNT(*) as cnt FROM ${table}`).get() as any;
      totalRecords += res ? res.cnt : 0;
    } catch {
      // Table might not exist yet
    }
  }

  // Record backup history in database
  try {
    await sqliteDB.backupHistories.add({
      id: `bkp_${Date.now()}`,
      filename,
      size: stats.size,
      recordCount: totalRecords,
      type,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error("Failed to log backup history:", err);
  }

  return {
    filename,
    filepath,
    size: stats.size,
    recordCount: totalRecords,
    timestamp: new Date().toISOString()
  };
}

export async function restoreDatabaseBackup(backupFilename: string): Promise<boolean> {
  const backupsDir = getBackupsDirectory();
  const filepath = path.join(backupsDir, backupFilename);
  if (!fs.existsSync(filepath)) {
    throw new Error(`Backup file not found: ${backupFilename}`);
  }

  const dbPath = getDatabaseFilePath();

  // Pre-flight check on backup file integrity
  const Database = eval("require")("better-sqlite3");
  const backupDb = new Database(filepath);
  const integrity = backupDb.pragma("integrity_check");
  backupDb.close();

  if (!integrity || integrity[0]?.integrity_check !== "ok") {
    throw new Error("Backup file failed integrity check.");
  }

  // Safety copy of current database before restore
  const safetyBackupPath = path.join(backupsDir, `pre_restore_safety_${Date.now()}.sqlite`);
  await sqlite.backup(safetyBackupPath);

  // Close current SQLite connections and replace file safely
  sqlite.close();
  fs.copyFileSync(filepath, dbPath);

  // Re-open main SQLite database
  const newSqlite = new Database(dbPath);
  newSqlite.pragma("journal_mode = WAL");
  newSqlite.pragma("foreign_keys = ON");

  return true;
}

export function checkDatabaseHealth() {
  const dbPath = getDatabaseFilePath();
  const stats = fs.existsSync(dbPath) ? fs.statSync(dbPath) : { size: 0 };
  
  const integrityResult = sqlite.pragma("integrity_check") as any[];
  const isHealthy = integrityResult && integrityResult.length > 0 && (integrityResult[0] as any)?.integrity_check === "ok";

  const tables = [
    "users", "categories", "brands", "units", "items", "parties", "invoices",
    "accounts", "journal_entries", "cash_receipts", "cash_payments", "bank_receipts",
    "bank_payments", "shop_profiles", "delivery_orders", "activity_logs",
    "settings", "locations", "employees", "banks", "other_incomes", "expenses",
    "salary_advances", "salary_loans", "payrolls", "salary_settlements"
  ];

  const tableCounts: Record<string, number> = {};
  let totalRecords = 0;

  for (const table of tables) {
    try {
      const res = sqlite.prepare(`SELECT COUNT(*) as cnt FROM ${table}`).get() as any;
      const count = res ? res.cnt : 0;
      tableCounts[table] = count;
      totalRecords += count;
    } catch {
      tableCounts[table] = 0;
    }
  }

  return {
    status: isHealthy ? "Healthy" : "Corrupted",
    integrity: integrityResult,
    databaseSizeBytes: stats.size,
    databaseSizeMB: (stats.size / (1024 * 1024)).toFixed(2),
    totalRecords,
    tableCounts,
    lastChecked: new Date().toISOString()
  };
}

export function optimizeDatabase() {
  sqlite.exec("VACUUM;");
  sqlite.exec("REINDEX;");
  sqlite.exec("ANALYZE;");
  return { success: true, message: "Database vacuumed, reindexed, and optimized." };
}
