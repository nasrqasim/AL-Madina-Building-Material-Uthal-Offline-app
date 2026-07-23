import { fail, ok } from "@/lib/api";
import { offlineDB } from "@/lib/dexie";
import { generateUniqueId } from "@/lib/dexie";

export async function GET() {
  try {
    const years = await offlineDB.settings.toArray();
    const financialYears = years.filter((y: any) => y.key === "financialYear");
    // Sort by startDate descending
    financialYears.sort((a: any, b: any) => new Date(b.value.startDate).getTime() - new Date(a.value.startDate).getTime());
    return ok(financialYears.map((y: any) => y.value));
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

    // If new year is "Current", set others to "Closed" or "Upcoming"
    if (status === "Current") {
      const allSettings = await offlineDB.settings.toArray();
      const financialYears = allSettings.filter((s: any) => s.key === "financialYear");
      for (const fy of financialYears) {
        const fyValue = fy.value as any;
        if (fyValue.status === "Current") {
          fyValue.status = "Closed";
          fyValue.isClosed = true;
          await offlineDB.settings.update(fy.id, { value: fyValue });
        }
      }
    }

    const id = generateUniqueId();
    const newYear = {
      id,
      _id: id,
      key: "financialYear",
      value: {
        name,
        startDate,
        endDate,
        status: status || "Upcoming",
        isClosed: status === "Closed"
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await offlineDB.settings.add(newYear);
    return ok(newYear.value);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export const dynamic = "force-dynamic";
