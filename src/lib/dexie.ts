// SQLite Migration Compatibility Proxy
// Re-exports all database operations from SQLite engine (src/lib/sqlite.ts)

export {
  sqliteDB as offlineDB,
  sqliteDB,
  generateUniqueId,
  seedOfflineDatabase,
  SQLiteTable
} from "./sqlite";
