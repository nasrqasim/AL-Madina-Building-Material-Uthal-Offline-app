"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export type PartyLike = {
  _id?: string;
  name?: string;
  companyName?: string;
  type?: string;
  code?: string;
  phone?: string;
  mobile?: string;
  address?: string;
  city?: string;
  area?: string;
  balance?: number;
  debit?: number;
  credit?: number;
  creditLimit?: number;
  creditDays?: number;
  ntn?: string;
};

export type AccountLike = {
  _id?: string;
  title?: string;
  name?: string;
  code?: string;
  type?: string;
  openingBalance?: number;
};

interface PartyDetailsCardProps {
  party?: PartyLike | null;
  account?: AccountLike | null;
  title?: string;
  emptyMessage?: string;
  /** When set, refetches party with recalculated balance from server */
  refreshLive?: boolean;
}

function fmt(n: number) {
  return Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function PartyDetailsCard({
  party,
  account,
  title = "Selection Details",
  emptyMessage = "Select a party or account to view live balance and contact details.",
  refreshLive = true,
}: PartyDetailsCardProps) {
  const [liveParty, setLiveParty] = useState<PartyLike | null>(null);
  const [loading, setLoading] = useState(false);

  const partyId = party?._id;

  useEffect(() => {
    if (!refreshLive || !partyId) {
      setLiveParty(null);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/parties/${partyId}?refresh=1`);
        const json = await res.json();
        if (!cancelled && json.ok) setLiveParty(json.data);
      } catch {
        if (!cancelled) setLiveParty(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [partyId, refreshLive]);

  const display = liveParty || party;

  if (!display && !account) {
    return (
      <div className="bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-center">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{title}</p>
        <p className="text-sm text-slate-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm sticky top-24">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
        {loading && <Loader2 size={14} className="animate-spin text-maroon-800" />}
      </div>

      {display && (
        <div className="space-y-3">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase">Name</p>
            <p className="text-sm font-black text-slate-900 dark:text-white">{display.companyName || display.name}</p>
            {display.name && display.companyName && display.name !== display.companyName && (
              <p className="text-xs text-slate-500">{display.name}</p>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            {display.type && (
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-maroon-100 text-maroon-800">
                {display.type}
              </span>
            )}
            {display.code && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-600">{display.code}</span>
            )}
          </div>
          <div className="p-3 rounded-xl bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900">
            <p className="text-[10px] font-black text-yellow-800 uppercase">Live Balance</p>
            <p className={`text-2xl font-black font-mono ${Number(display.balance) >= 0 ? "text-rose-600" : "text-emerald-600"}`}>
              Rs. {fmt(Math.abs(Number(display.balance) || 0))}
            </p>
            <p className="text-[10px] text-yellow-700 mt-1">
              {display.type === "Customer"
                ? Number(display.balance) >= 0
                  ? "Receivable from customer"
                  : "Customer credit balance"
                : Number(display.balance) >= 0
                  ? "Payable to vendor"
                  : "Vendor advance"}
            </p>
            {refreshLive && !loading && liveParty && (
              <p className="text-[9px] text-yellow-600 mt-1 uppercase font-bold">Updated from ledger</p>
            )}
          </div>
          {(display.debit != null || display.credit != null) && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <span className="text-[9px] font-black text-emerald-700 uppercase">Debit</span>
                <p className="font-black text-emerald-800">{fmt(Number(display.debit) || 0)}</p>
              </div>
              <div className="p-2 bg-rose-50 rounded-lg">
                <span className="text-[9px] font-black text-rose-700 uppercase">Credit</span>
                <p className="font-black text-rose-800">{fmt(Number(display.credit) || 0)}</p>
              </div>
            </div>
          )}
          {display.creditLimit != null && Number(display.creditLimit) > 0 && (
            <div className="p-2 bg-slate-50 rounded-lg text-xs">
              <span className="text-[9px] font-black text-slate-500 uppercase">Credit Limit</span>
              <p className="font-black text-slate-800">Rs. {fmt(Number(display.creditLimit))}</p>
              {display.creditDays != null && (
                <p className="text-[10px] text-slate-500 mt-0.5">{display.creditDays} days</p>
              )}
            </div>
          )}
          {(display.phone || display.mobile) && (
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase">Phone</p>
              <p className="text-sm font-bold">{display.mobile || display.phone}</p>
            </div>
          )}
          {(display.address || display.city || display.area) && (
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase">Address</p>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                {[display.address, display.area, display.city].filter(Boolean).join(", ")}
              </p>
            </div>
          )}
          {display.ntn && (
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase">NTN</p>
              <p className="text-xs font-mono font-bold">{display.ntn}</p>
            </div>
          )}
        </div>
      )}

      {account && (
        <div className={`space-y-3 ${display ? "mt-4 pt-4 border-t border-slate-200 dark:border-slate-700" : ""}`}>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase">Cash / Bank Account</p>
            <p className="text-sm font-black">{account.title}</p>
            {account.code && <p className="text-xs font-mono text-slate-500">{account.code}</p>}
          </div>
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200">
            <p className="text-[10px] font-black text-blue-800 uppercase">Account Balance</p>
            <p className="text-xl font-black text-blue-700 font-mono">Rs. {fmt(Number(account.openingBalance) || 0)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
