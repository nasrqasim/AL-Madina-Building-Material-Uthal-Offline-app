"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Search } from "lucide-react";
import { filterAndSortItems } from "@/lib/itemUnits";
import type { PartyLike } from "./PartyDetailsCard";

interface PartyLookupSelectProps {
  parties: PartyLike[];
  value: string;
  onChange: (partyId: string, party: PartyLike | null) => void;
  partyType: "Customer" | "Vendor";
  onPartyTypeChange?: (type: "Customer" | "Vendor") => void;
  onPreview?: (party: PartyLike | null) => void;
  label?: string;
  required?: boolean;
  showTypeToggle?: boolean;
}

export default function PartyLookupSelect({
  parties,
  value,
  onChange,
  partyType,
  onPartyTypeChange,
  onPreview,
  label = "Party",
  required,
  showTypeToggle = true,
}: PartyLookupSelectProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const byType = (parties || []).filter((p) => p.type === partyType);
    if (!query.trim()) return byType;
    return filterAndSortItems(
      byType.map((p) => ({
        _id: p._id || "",
        code: p.code || "",
        name: p.name || p.companyName || "",
      })),
      query
    ).map((f) => byType.find((p) => p._id === f._id)!);
  }, [parties, partyType, query]);

  const selected = (parties || []).find((p) => p._id === value) || null;

  useEffect(() => {
    if (selected) {
      setQuery(selected.companyName || selected.name || "");
      onPreview?.(selected);
    }
  }, [selected?._id]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.children[activeIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
    onPreview?.(filtered[activeIndex] ?? null);
  }, [activeIndex, open, filtered]);

  const pick = (party: PartyLike) => {
    onChange(party._id || "", party);
    setQuery(party.companyName || party.name || "");
    setOpen(false);
    onPreview?.(party);
  };

  return (
    <div className="space-y-2" ref={wrapRef}>
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {showTypeToggle && onPartyTypeChange && (
        <div className="flex gap-2 mb-1">
          {(["Customer", "Vendor"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                onPartyTypeChange(t);
                onChange("", null);
                setQuery("");
                onPreview?.(null);
              }}
              className={`px-3 py-1 text-[10px] font-black rounded-lg uppercase ${
                partyType === t ? "bg-maroon-800 text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
        <input
          type="text"
          value={query}
          placeholder={`Search ${partyType.toLowerCase()}...`}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActiveIndex(0);
            if (!e.target.value.trim()) {
              onChange("", null);
              onPreview?.(null);
            }
          }}
          onFocus={() => {
            setOpen(true);
            setActiveIndex(0);
          }}
          onKeyDown={(e) => {
            if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
              setOpen(true);
              return;
            }
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActiveIndex((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter" && filtered[activeIndex]) {
              e.preventDefault();
              pick(filtered[activeIndex]);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          className="w-full pl-9 pr-3 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-maroon-800/20"
        />
        {open && (
          <div
            ref={listRef}
            className="absolute z-50 mt-1 w-full max-h-52 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl"
          >
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-xs text-slate-400 text-center">No {partyType.toLowerCase()} found</div>
            ) : (
              filtered.map((p, idx) => (
                <button
                  key={p._id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    pick(p);
                  }}
                  onMouseEnter={() => setActiveIndex(idx)}
                  className={`w-full text-left px-3 py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0 ${
                    idx === activeIndex ? "bg-maroon-800 text-white" : "hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <div className="text-sm font-bold truncate">{p.companyName || p.name}</div>
                  <div className={`text-[10px] flex justify-between gap-2 ${idx === activeIndex ? "text-white/80" : "text-slate-500"}`}>
                    <span className="truncate">{p.code || p.phone || ""}</span>
                    <span className="font-black shrink-0">Bal: Rs. {Number(p.balance || 0).toLocaleString()}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
