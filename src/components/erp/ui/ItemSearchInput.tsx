"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { filterAndSortItems } from "@/lib/itemUnits";

interface AvailableItem {
  _id: string;
  code: string;
  name: string;
  category?: string;
  purchaseRate?: number;
  saleRate?: number;
  stockQtyCartons?: number;
  unit?: string;
}

interface ItemSearchInputProps {
  value: string;                       // displayed text (code or name)
  availableItems: AvailableItem[];     // pre-fetched items list
  onSelect: (item: AvailableItem) => void;
  onChange?: (val: string) => void;   // raw text change (optional)
  placeholder?: string;
  className?: string;
  showSaleRate?: boolean;             // show saleRate instead of purchaseRate
  onActiveItemChange?: (item: AvailableItem | null) => void;
}

export default function ItemSearchInput({
  value,
  availableItems,
  onSelect,
  onChange,
  placeholder = "Search item...",
  className = "",
  showSaleRate = false,
  onActiveItemChange,
}: ItemSearchInputProps) {
  const [query, setQuery] = useState(value || "");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync external value changes
  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return (availableItems || []).slice(0, 80);
    return filterAndSortItems(availableItems, q).slice(0, 80);
  }, [availableItems, query]);

  const positionDropdown = useCallback(() => {
    if (!inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const dropHeight = Math.min(320, filtered.length * 80 + 16);
    const showAbove = spaceBelow < dropHeight && rect.top > dropHeight;

    setDropdownStyle({
      position: "fixed",
      top: showAbove ? rect.top - dropHeight - 4 : rect.bottom + 4,
      left: rect.left,
      width: Math.max(rect.width, 420),
      maxHeight: 320,
      zIndex: 99999,
    });
  }, [filtered.length]);

  const handleFocus = () => {
    positionDropdown();
    setOpen(true);
    setActiveIndex(0);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setActiveIndex(0);
    if (onChange) onChange(val);
    positionDropdown();
    setOpen(true);
  };

  const handleSelect = (item: AvailableItem) => {
    setQuery(item.code || item.name);
    setOpen(false);
    onSelect(item);
  };

  useEffect(() => {
    if (!open || !onActiveItemChange) return;
    onActiveItemChange(filtered[activeIndex] ?? null);
  }, [activeIndex, filtered, open, onActiveItemChange]);

  useEffect(() => {
    if (!open || !dropdownRef.current) return;
    const el = dropdownRef.current.children[activeIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[activeIndex]) handleSelect(filtered[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        inputRef.current && !inputRef.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Reposition on scroll/resize
  useEffect(() => {
    if (!open) return;
    const reposition = () => positionDropdown();
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open, positionDropdown]);

  const dropdown = open && (
    <div
      ref={dropdownRef}
      style={dropdownStyle}
      className="bg-slate-900 text-white border border-slate-700 rounded-xl shadow-2xl overflow-y-auto py-2"
    >
      {filtered.length === 0 ? (
        <div className="px-4 py-6 text-center text-slate-400 text-sm font-bold">
          {availableItems.length === 0 ? "Loading items..." : "No items found"}
        </div>
      ) : (
        filtered.slice(0, 80).map((item, idx) => (
          <div
            key={item._id}
            className={`px-4 py-3 cursor-pointer border-b border-slate-800 transition-all select-none ${
              idx === activeIndex ? "bg-maroon-800 text-white" : "hover:bg-slate-800"
            }`}
            onMouseDown={(e) => { e.preventDefault(); handleSelect(item); }}
            onMouseEnter={() => {
              setActiveIndex(idx);
              if (onActiveItemChange) onActiveItemChange(item);
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.code}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-800 rounded text-slate-400">{item.category || "Item"}</span>
                </div>
                <div className="text-sm font-black truncate mb-1">{item.name}</div>
                <div className="flex gap-4 text-[10px]">
                  <div className="flex flex-col">
                    <span className="uppercase text-slate-500 font-black">Stock</span>
                    <span className="font-black text-emerald-400">{item.stockQtyCartons ?? 0} ctns</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="uppercase text-slate-500 font-black">Unit</span>
                    <span className="font-black text-blue-400">{item.unit || "PCS"}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="uppercase text-slate-500 font-black">Price</span>
                    <span className="font-black text-yellow-400">
                      Rs. {showSaleRate ? (item.saleRate ?? 0) : (item.purchaseRate ?? 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <>
      <input
        ref={inputRef}
        type="text"
        value={query}
        placeholder={placeholder}
        onChange={handleChange}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        className={`w-full bg-transparent text-sm font-bold focus:outline-none border-b border-transparent focus:border-maroon-800/30 py-2 transition-all ${className}`}
      />
      {typeof document !== "undefined" && open && createPortal(dropdown, document.body)}
    </>
  );
}
