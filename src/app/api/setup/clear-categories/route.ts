import { offlineDB } from "@/lib/dexie";

export async function POST() {
  try {
    console.log("Clearing all categories from IndexedDB...");
    
    // Clear all categories from IndexedDB
    const count = await offlineDB.categories.count();
    await offlineDB.categories.clear();
    
    console.log(`Cleared ${count} categories from IndexedDB`);
    
    return Response.json({ 
      ok: true,
      count, 
      message: `Successfully cleared ${count} categories from database`
    });
  } catch (e) {
    console.error("API Error [clear-categories POST]:", e);
    return Response.json({ 
      ok: false,
      message: (e as Error).message 
    }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
