import { offlineDB } from "@/lib/dexie";

export async function enqueueSync(endpoint: string, payload: Record<string, unknown>, method: "POST" | "PUT" = "POST") {
  await offlineDB.syncQueue.add({
    endpoint,
    method,
    payload,
    status: "pending",
    retries: 0,
    createdAt: new Date().toISOString(),
  });
}

export async function runSyncQueue() {
  const pending = await offlineDB.syncQueue.where("status").anyOf(["pending", "failed"]).toArray();
  for (const job of pending) {
    if (!job.id) continue;
    try {
      await offlineDB.syncQueue.update(job.id, { status: "syncing" });
      const res = await fetch(job.endpoint, {
        method: job.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(job.payload),
      });
      if (!res.ok) throw new Error(`Sync failed (${res.status})`);
      await offlineDB.syncQueue.update(job.id, { status: "done", lastError: undefined });
    } catch (e) {
      await offlineDB.syncQueue.update(job.id, {
        status: "failed",
        retries: job.retries + 1,
        lastError: (e as Error).message,
      });
    }
  }
}
