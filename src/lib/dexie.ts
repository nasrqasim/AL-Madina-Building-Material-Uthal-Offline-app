import Dexie, { Table } from "dexie";

export interface DraftRecord {
  id?: number;
  module: "sales" | "purchase" | "expense";
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface SyncQueueRecord {
  id?: number;
  endpoint: string;
  method: "POST" | "PUT";
  payload: Record<string, unknown>;
  status: "pending" | "syncing" | "failed" | "done";
  retries: number;
  lastError?: string;
  createdAt: string;
}

class ERPDexie extends Dexie {
  drafts!: Table<DraftRecord, number>;
  syncQueue!: Table<SyncQueueRecord, number>;

  constructor() {
    super("oilshopERP");
    this.version(1).stores({
      drafts: "++id,module,createdAt",
      syncQueue: "++id,status,createdAt",
    });
  }
}

export const offlineDB = new ERPDexie();
