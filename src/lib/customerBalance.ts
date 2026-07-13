/** Customer balance display helpers for building material shop */

export interface CustomerBalanceView {
  receivable: number;
  advanceFromBalance: number;
  advanceAvailable: number;
  label: string;
  colorClass: string;
  formatted: string;
}

/**
 * Party.balance: positive = customer owes (receivable), negative = overpaid (advance credit).
 * advanceStats.remainingAdvance tracks explicit advance deposits separately.
 */
export function getCustomerBalanceView(
  balance: number,
  advanceStats?: { remainingAdvance?: number } | null
): CustomerBalanceView {
  const receivable = balance > 0 ? balance : 0;
  const advanceFromBalance = balance < 0 ? Math.abs(balance) : 0;
  const advanceAvailable = Math.max(
    Number(advanceStats?.remainingAdvance ?? 0),
    advanceFromBalance
  );

  if (advanceAvailable > 0 && receivable === 0) {
    return {
      receivable: 0,
      advanceFromBalance,
      advanceAvailable,
      label: "Advance",
      colorClass: "text-emerald-600",
      formatted: `Rs. ${advanceAvailable.toLocaleString()} (Advance)`,
    };
  }
  if (receivable > 0 && advanceAvailable === 0) {
    return {
      receivable,
      advanceFromBalance,
      advanceAvailable,
      label: "Receivable",
      colorClass: "text-rose-600",
      formatted: `Rs. ${receivable.toLocaleString()} (Receivable)`,
    };
  }
  if (receivable > 0 && advanceAvailable > 0) {
    return {
      receivable,
      advanceFromBalance,
      advanceAvailable,
      label: "Mixed",
      colorClass: "text-amber-600",
      formatted: `Recv: Rs.${receivable.toLocaleString()} | Adv: Rs.${advanceAvailable.toLocaleString()}`,
    };
  }
  return {
    receivable: 0,
    advanceFromBalance: 0,
    advanceAvailable: 0,
    label: "Settled",
    colorClass: "text-slate-500",
    formatted: "Rs. 0",
  };
}
