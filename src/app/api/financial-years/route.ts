import { fail, ok } from "@/lib/api";
import dbConnect from "@/lib/db";
import { FinancialYear } from "@/models/FinancialYear";

export async function GET() {
  try {
    await dbConnect();
    const years = await FinancialYear.find({}).sort({ startDate: -1 });
    return ok(years);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, startDate, endDate, status } = body;

    if (!name || !startDate || !endDate) {
      return fail("Missing required fields");
    }

    await dbConnect();

    // If new year is "Current", set others to "Closed" or "Upcoming"
    if (status === "Current") {
      await FinancialYear.updateMany({ status: "Current" }, { status: "Closed", isClosed: true });
    }

    const newYear = await FinancialYear.create({
      name,
      startDate,
      endDate,
      status: status || "Upcoming",
      isClosed: status === "Closed"
    });

    return ok(newYear);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export const dynamic = "force-dynamic";
