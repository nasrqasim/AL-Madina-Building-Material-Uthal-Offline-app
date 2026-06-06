import { fail, ok } from "@/lib/api";
import dbConnect from "@/lib/db";
import JournalEntry from "@/models/JournalEntry";
import CashPayment from "@/models/CashPayment";
import CashReceipt from "@/models/CashReceipt";
import { recalculatePartyBalance } from "@/services/posting/invoicePostingHelper";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();
    await dbConnect();

    // Find the original journal entry to get its voucherNo and date
    const original = await JournalEntry.findById(id);
    if (!original) return fail("Journal entry not found");

    const oldVoucherNo = original.voucherNo;

    // Delete existing entries with the same voucherNo
    await JournalEntry.deleteMany({ voucherNo: oldVoucherNo });

    // Re-create new journal entries (debit and credit)
    const newEntries = Array.isArray(body.entries) ? body.entries : [body];
    const created = await JournalEntry.create(newEntries);

    // Sync CashPayment or CashReceipt if party is involved
    const partyId = body.partyId;
    const partyType = body.partyType; // "customer" or "vendor"

    // Clean up old cash records
    const oldPayment = await CashPayment.findOneAndDelete({ voucherNo: oldVoucherNo });
    if (oldPayment?.partyId) {
      await recalculatePartyBalance(String(oldPayment.partyId));
    }
    const oldReceipt = await CashReceipt.findOneAndDelete({ receiptNumber: oldVoucherNo });
    if (oldReceipt?.partyId) {
      await recalculatePartyBalance(String(oldReceipt.partyId));
    }

    // Create new cash record if party is selected
    if (partyId && partyType) {
      const amount = Number(body.amount) || 0;
      const date = body.date || new Date().toISOString().split("T")[0];
      const remarks = body.remarks || "";
      const voucherNo = body.voucherNo || oldVoucherNo;

      if (partyType === "vendor") {
        await CashPayment.create({
          voucherNo,
          paymentType: "party",
          date,
          partyId,
          vendor: String(partyId),
          amount,
          narration: remarks,
          status: "Posted",
        });
        await recalculatePartyBalance(String(partyId));
      } else if (partyType === "customer") {
        await CashReceipt.create({
          receiptNumber: voucherNo,
          receiptType: "party",
          date,
          partyId,
          amount,
          narration: remarks,
          status: "Posted",
        });
        await recalculatePartyBalance(String(partyId));
      }
    }

    return ok(created);
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    await dbConnect();

    const entry = await JournalEntry.findById(id);
    if (!entry) return fail("Journal entry not found");

    const voucherNo = entry.voucherNo;

    // Delete all journal entries with the same voucherNo
    await JournalEntry.deleteMany({ voucherNo });

    // Clean up cash records if any
    const payment = await CashPayment.findOneAndDelete({ voucherNo });
    if (payment?.partyId) {
      await recalculatePartyBalance(String(payment.partyId));
    }
    const receipt = await CashReceipt.findOneAndDelete({ receiptNumber: voucherNo });
    if (receipt?.partyId) {
      await recalculatePartyBalance(String(receipt.partyId));
    }

    return ok({ message: "Deleted successfully" });
  } catch (e) {
    return fail((e as Error).message);
  }
}

export const dynamic = "force-dynamic";
