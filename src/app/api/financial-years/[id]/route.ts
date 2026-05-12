import { fail, ok } from "@/lib/api";
import dbConnect from "@/lib/db";
import { FinancialYear } from "@/models/FinancialYear";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    
    await dbConnect();
    const updatedYear = await FinancialYear.findByIdAndUpdate(id, body, { new: true });
    
    return ok(updatedYear);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    await dbConnect();
    await FinancialYear.findByIdAndDelete(id);
    return ok({ message: "Financial year deleted successfully" });
  } catch (e) {
    return fail((e as Error).message);
  }
}
