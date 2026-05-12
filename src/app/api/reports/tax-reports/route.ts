import { ok } from "@/lib/api";
import dbConnect from "@/lib/db";
import Invoice from "@/models/Invoice";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");

    await dbConnect();

    const match: any = { status: "posted" };
    if (fromDate || toDate) {
      match.date = {};
      if (fromDate) match.date.$gte = new Date(fromDate);
      if (toDate) match.date.$lte = new Date(toDate);
    }

    const invoices = await Invoice.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            month: { $month: "$date" },
            year: { $year: "$date" },
            type: "$type"
          },
          salesAmount: { $sum: { $cond: [{ $in: ["$type", ["sale", "non_tax_sale"]] }, "$subTotal", 0] } },
          purchaseAmount: { $sum: { $cond: [{ $in: ["$type", ["purchase", "non_tax_purchase", "import_purchase"]] }, "$subTotal", 0] } },
          taxOutput: { $sum: { $cond: [{ $eq: ["$type", "sale"] }, "$taxAmount", 0] } },
          taxInput: { $sum: { $cond: [{ $in: ["$type", ["purchase", "import_purchase"]] }, "$taxAmount", 0] } },
          wht: { $sum: "$whtAmount" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    const reportData = invoices.map(inv => {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return {
        period: `${monthNames[inv._id.month - 1]} ${inv._id.year}`,
        sales: inv.salesAmount,
        output: inv.taxOutput,
        purchase: inv.purchaseAmount,
        input: inv.taxInput,
        net: inv.taxOutput - inv.taxInput,
        wht: inv.wht
      };
    });

    // Aggregate monthly
    const monthlySummary: Record<string, any> = {};
    reportData.forEach(row => {
      if (!monthlySummary[row.period]) {
        monthlySummary[row.period] = { ...row };
      } else {
        monthlySummary[row.period].sales += row.sales;
        monthlySummary[row.period].output += row.output;
        monthlySummary[row.period].purchase += row.purchase;
        monthlySummary[row.period].input += row.input;
        monthlySummary[row.period].net += row.net;
        monthlySummary[row.period].wht += row.wht;
      }
    });

    const finalRows = Object.values(monthlySummary);

    const totals = finalRows.reduce((acc: any, curr: any) => ({
      sales: acc.sales + curr.sales,
      output: acc.output + curr.output,
      purchase: acc.purchase + curr.purchase,
      input: acc.input + curr.input,
      net: acc.net + curr.net,
      wht: acc.wht + curr.wht
    }), { sales: 0, output: 0, purchase: 0, input: 0, net: 0, wht: 0 });

    return ok({
      rows: finalRows,
      totals
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
