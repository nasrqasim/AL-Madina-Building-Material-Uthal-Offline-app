import { fail, ok } from "@/lib/api";
import { offlineDB } from "@/lib/dexie";

export async function POST() {
  try {
    // Get all items first to see what exists
    const allItems = await offlineDB.items.toArray();
    console.log("All items in database:", allItems.map(i => ({ code: i.code, name: i.name, id: i.id })));
    
    // Get all categories to find cement category
    const categories = await offlineDB.categories.toArray();
    console.log("All categories:", categories.map(c => ({ name: c.name, _id: c._id, type: c.type })));
    
    const cementCategory = categories.find(c => 
      (c.name || "").toLowerCase().includes("cement") && c.type === "main"
    );
    
    if (!cementCategory) {
      return fail("Cement category not found. Please create it first.");
    }
    
    console.log("Found cement category:", cementCategory.name, "ID:", cementCategory._id);
    
    // Find all items that contain "cement" in their name
    const cementItems = allItems.filter(item => 
      (item.name || "").toLowerCase().includes("cement")
    );
    
    console.log("Found cement items:", cementItems.map(i => ({ name: i.name, code: i.code, id: i.id })));
    
    let updatedCount = 0;
    
    for (const item of cementItems) {
      console.log("Updating item:", item.name, "with category:", cementCategory._id, "item ID:", item.id);
      
      await offlineDB.items.update(item.id, {
        mainCategoryId: cementCategory._id,
        updatedAt: new Date().toISOString()
      });
      
      updatedCount++;
    }
    
    if (updatedCount === 0) {
      return fail(`No cement items found. Make sure items have "cement" in their name.`);
    }
    
    return ok({ 
      count: updatedCount, 
      message: `Successfully assigned ${updatedCount} cement items to Cement category`,
      categoryId: cementCategory._id
    });
  } catch (e) {
    console.error("API Error [assign-cement-category POST]:", e);
    return fail((e as Error).message);
  }
}

export const dynamic = "force-dynamic";
