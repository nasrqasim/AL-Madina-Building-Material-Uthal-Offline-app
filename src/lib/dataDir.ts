import fs from "fs";
import path from "path";

/**
 * Returns the base data directory for Al Madina ERP.
 * In desktop Electron mode, ALMADINA_DATA_DIR points to Documents/AlMadina ERP or AppData.
 * Falls back to process.cwd() for local development.
 */
export function getBaseDataDir(): string {
  const base = process.env.ALMADINA_DATA_DIR || path.join(process.cwd(), "database");
  if (!fs.existsSync(base)) {
    fs.mkdirSync(base, { recursive: true });
  }

  // Ensure standard ERP subfolders exist
  const subDirs = ["backups", "exports", "imports", "logs", "reports"];
  for (const sub of subDirs) {
    const p = path.join(base, sub);
    if (!fs.existsSync(p)) {
      fs.mkdirSync(p, { recursive: true });
    }
  }

  return base;
}

export function getDatabaseFilePath(): string {
  return path.join(getBaseDataDir(), "almadina.sqlite");
}

export function getBackupsDirectory(): string {
  const p = path.join(getBaseDataDir(), "backups");
  if (!fs.existsSync(p)) {
    fs.mkdirSync(p, { recursive: true });
  }
  return p;
}
