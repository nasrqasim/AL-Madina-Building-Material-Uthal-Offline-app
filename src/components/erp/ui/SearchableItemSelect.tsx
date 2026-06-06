"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { filterAndSortItems } from "@/lib/itemUnits";

interface ItemOption {
  _id: string;
  code?: string;
  name?: string;
}

interface SearchableItemSelectProps {
  items: ItemOption[];
  value: string;
  onChange: (itemId: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchableItemSelect({
  items,
  value,
  onChange,
  placeholder = "Search item code or name...",
  className = "",
}: SearchableItemSelectProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(() => items.find((i) => i._id === value), [items, value]);

  useEffect(() => {
    if (selected) {
      setQuery(`${selected.code || ""} — ${selected.name || ""}`.trim());
    }
  }, [selected?._id]);

  const filtered = useMemo(() => {
    if (!query.trim() || (selected && query.includes(selected.name || ""))) {
      return filterAndSortItems(items, query.trim() ? query : "");
    }
    return filterAndSortItems(items, query);
  }, [items, query, selected]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.children[activeIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  const pick = (item: ItemOption) => {
    onChange(item._id);
    setQuery(`${item.code || ""} — ${item.name || ""}`.trim());
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <input
        type="text"
        value={query}
        placeholder={placeholder}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setActiveIndex(0);
          if (!e.target.value.trim()) onChange("");
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
        className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20"
      />
      {open && (
        <div
          ref={listRef}
          className="absolute z-50 mt-1 w-full max-h-56 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl"
        >
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-xs text-slate-400">No items found</div>
          ) : (
            filtered.slice(0, 100).map((item, idx) => (
              <button
                key={item._id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(item);
                }}
                onMouseEnter={() => setActiveIndex(idx)}
                className={`w-full text-left px-3 py-2 text-xs border-b border-slate-100 dark:border-slate-800 last:border-0 ${
                  idx === activeIndex
                    ? "bg-maroon-800 text-white"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200"
                }`}
              >
                <span className="font-mono opacity-70 mr-2">{item.code}</span>
                {item.name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
