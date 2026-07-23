import { fail, ok } from "@/lib/api";
import { offlineDB } from "@/lib/dexie";

export async function POST() {
  try {
    // Get all items
    const items = await offlineDB.items.toArray();
    console.log("Total items:", items.length);
    
    // Get all categories
    const categories = await offlineDB.categories.toArray();
    console.log("Total categories:", categories.length);
    
    const mainCategories = categories.filter(c => c.type === "main");
    const subCategories = categories.filter(c => c.type === "sub");
    
    console.log("Main categories:", mainCategories.map(c => ({ name: c.name, _id: c._id })));
    
    let updatedCount = 0;
    
    for (const item of items) {
      const itemName = (item.name || "").toLowerCase();
      let assignedMainCatId = null;
      let assignedSubCatId = null;
      
      // Try to match item name with category names
      for (const cat of mainCategories) {
        const catName = (cat.name || "").toLowerCase();
        if (itemName.includes(catName) || catName.includes(itemName)) {
          assignedMainCatId = cat._id;
          
          // Try to find matching sub-category
          const matchingSubCats = subCategories.filter(sc => 
            sc.parentId === cat._id && 
            (itemName.includes((sc.name || "").toLowerCase()) || (sc.name || "").toLowerCase().includes(itemName))
          );
          
          if (matchingSubCats.length > 0) {
            assignedSubCatId = matchingSubCats[0]._id;
          }
          
          break;
        }
      }
      
      // If no match found, try to assign based on common keywords
      if (!assignedMainCatId) {
        const keywords = [
          { keyword: "cement", catName: "Cement" },
          { keyword: "steel", catName: "Steel" },
          { keyword: "iron", catName: "Steel" },
          { keyword: "t iron", catName: "T Iron" },
          { keyword: "t-iron", catName: "T Iron" },
          { keyword: "girder", catName: "Girders" },
          { keyword: "girders", catName: "Girders" },
          { keyword: "marble", catName: "Marble" },
          { keyword: "tile", catName: "Tiles" },
          { keyword: "tiles", catName: "Tiles" },
          { keyword: "bond", catName: "Bond" },
          { keyword: "chokhat", catName: "Chokhat" },
          { keyword: "door", catName: "Door Patti" },
          { keyword: "door patti", catName: "Door Patti" },
          { keyword: "gate", catName: "Fancy Gates" },
          { keyword: "fancy gate", catName: "Fancy Gates" },
          { keyword: "wash basin", catName: "Wash Basin" },
          { keyword: "basin", catName: "Wash Basin" },
          { keyword: "window", catName: "Windows" },
          { keyword: "windows", catName: "Windows" },
          { keyword: "scatting", catName: "Scatting" },
          { keyword: "sand", catName: "Sand" },
          { keyword: "gravel", catName: "Gravel" },
          { keyword: "brick", catName: "Bricks" },
          { keyword: "paint", catName: "Paint" },
          { keyword: "wood", catName: "Wood" },
          { keyword: "pipe", catName: "Pipes" },
          { keyword: "electrical", catName: "Electrical" },
          { keyword: "wire", catName: "Electrical" },
          { keyword: "glass", catName: "Glass" },
          { keyword: "aluminum", catName: "Aluminum" },
          { keyword: "hardware", catName: "Hardware" },
        ];
        
        for (const kw of keywords) {
          if (itemName.includes(kw.keyword)) {
            const matchingCat = mainCategories.find(c => 
              (c.name || "").toLowerCase().includes(kw.catName.toLowerCase())
            );
            if (matchingCat) {
              assignedMainCatId = matchingCat._id;
              break;
            }
          }
        }
      }
      
      // Update item if category was assigned
      if (assignedMainCatId && (!item.mainCategoryId || String(item.mainCategoryId) !== String(assignedMainCatId))) {
        const updateData: any = {
          mainCategoryId: assignedMainCatId,
          updatedAt: new Date().toISOString()
        };
        
        if (assignedSubCatId) {
          updateData.subCategoryId = assignedSubCatId;
        }
        
        await offlineDB.items.update(item.id, updateData);
        updatedCount++;
      }
    }
    
    return ok({ count: updatedCount, message: `Auto-assigned categories to ${updatedCount} items` });
  } catch (e) {
    console.error("API Error [auto-assign-categories POST]:", e);
    return fail((e as Error).message);
  }
}

export const dynamic = "force-dynamic";
