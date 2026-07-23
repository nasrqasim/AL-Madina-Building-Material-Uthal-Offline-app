import { fail, ok } from "@/lib/api";
import { offlineDB } from "@/lib/dexie";

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    // Check if any items are using this category or sub-category
    const allItems = await offlineDB.items.toArray();
    const itemsUsing = allItems.find((item: any) =>
      item.mainCategoryId === params.id || item.subCategoryId === params.id
    );

    if (itemsUsing) {
      return fail("Cannot delete category. There are items associated with it.");
    }

    // If it's a main category, check if it has sub-categories
    const allCategories = await offlineDB.categories.toArray();
    const hasSubs = allCategories.find((cat: any) => cat.parentId === params.id);
    if (hasSubs) {
      return fail("Cannot delete category. It has sub-categories associated with it.");
    }

    await offlineDB.categories.delete(params.id);
    return ok({ message: "Deleted successfully" });
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const body = await req.json();
        const updatedCategory = {
          name: body.name,
          parentId: body.parentId,
          updatedAt: new Date().toISOString()
        };
        await offlineDB.categories.update(params.id, updatedCategory);
        const row = await offlineDB.categories.get(params.id);
        return ok(row);
    } catch (e) {
        return fail((e as Error).message);
    }
}
