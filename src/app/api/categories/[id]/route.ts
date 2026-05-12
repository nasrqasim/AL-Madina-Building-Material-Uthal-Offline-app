import { fail, ok } from "@/lib/api";
import dbConnect from "@/lib/db";
import Category from "@/models/Category";
import Item from "@/models/Item";

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    
    // Check if any items are using this category or sub-category
    const itemsUsing = await Item.findOne({ 
      $or: [
        { mainCategoryId: params.id },
        { subCategoryId: params.id }
      ] 
    });

    if (itemsUsing) {
      return fail("Cannot delete category. There are items associated with it.");
    }

    // If it's a main category, check if it has sub-categories
    const hasSubs = await Category.findOne({ parentId: params.id });
    if (hasSubs) {
      return fail("Cannot delete category. It has sub-categories associated with it.");
    }

    await Category.findByIdAndDelete(params.id);
    return ok({ message: "Deleted successfully" });
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const body = await req.json();
        await dbConnect();
        const row = await Category.findByIdAndUpdate(params.id, body, { new: true });
        return ok(row);
    } catch (e) {
        return fail((e as Error).message);
    }
}
