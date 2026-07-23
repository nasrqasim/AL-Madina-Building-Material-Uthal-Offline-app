import { ok } from "@/lib/api";
import { offlineDB } from "@/lib/dexie";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");

    const allInvoices = await offlineDB.invoices.toArray();

    // Filter by date range if specified
    let filteredInvoices = allInvoices.filter((inv: any) => inv.status === "posted");
    if (fromDate || toDate) {
      filteredInvoices = filteredInvoices.filter((inv: any) => {
        const invDate = new Date(inv.date);
        if (fromDate && invDate < new Date(fromDate)) return false;
        if (toDate && invDate > new Date(toDate)) return false;
        return true;
      });
    }

    // Group by month/year and type
    const groupedData: Record<string, any> = {};
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    filteredInvoices.forEach((inv: any) => {
      const date = new Date(inv.date);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      const period = `${monthNames[month - 1]} ${year}`;
      const key = `${period}_${inv.type}`;

      if (!groupedData[key]) {
        groupedData[key] = {
          period,
          type: inv.type,
          salesAmount: 0,
          purchaseAmount: 0,
          taxOutput: 0,
          taxInput: 0,
          wht: 0
        };
      }

      const isSale = ["sale", "non_tax_sale"].includes(inv.type);
      const isPurchase = ["purchase", "non_tax_purchase", "import_purchase"].includes(inv.type);

      if (isSale) {
        groupedData[key].salesAmount += inv.subTotal || 0;
      }
      if (isPurchase) {
        groupedData[key].purchaseAmount += inv.subTotal || 0;
      }
      if (inv.type === "sale") {
        groupedData[key].taxOutput += inv.taxAmount || 0;
      }
      if (["purchase", "import_purchase"].includes(inv.type)) {
        groupedData[key].taxInput += inv.taxAmount || 0;
      }
      groupedData[key].wht += inv.whtAmount || 0;
    });

    // Aggregate by period (month/year)
    const monthlySummary: Record<string, any> = {};
    Object.values(groupedData).forEach((row: any) => {
      if (!monthlySummary[row.period]) {
        monthlySummary[row.period] = {
          period: row.period,
          sales: row.salesAmount,
          output: row.taxOutput,
          purchase: row.purchaseAmount,
          input: row.taxInput,
          net: row.taxOutput - row.taxInput,
          wht: row.wht
        };
      } else {
        monthlySummary[row.period].sales += row.salesAmount;
        monthlySummary[row.period].output += row.taxOutput;
        monthlySummary[row.period].purchase += row.purchaseAmount;
        monthlySummary[row.period].input += row.taxInput;
        monthlySummary[row.period].net += row.taxOutput - row.taxInput;
        monthlySummary[row.period].wht += row.wht;
      }
    });

    const finalRows = Object.values(monthlySummary).sort((a: any, b: any) => {
      const [aMonth, aYear] = a.period.split(' ');
      const [bMonth, bYear] = b.period.split(' ');
      const monthOrder = monthNames.indexOf(aMonth) - monthNames.indexOf(bMonth);
      if (monthOrder !== 0) return monthOrder;
      return parseInt(aYear) - parseInt(bYear);
    });

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
