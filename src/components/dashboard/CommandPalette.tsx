"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Search, X, Clock, ChevronRight, FileText, LayoutGrid, Package, Settings, Users, BarChart3, Database } from "lucide-react";
import { erpModules } from "@/components/erp/nav";
import { useRouter } from "next/navigation";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Flatten the menu for search - ensured deep indexing for all 3 levels
  const allItems = erpModules.flatMap(module => {
    const items = [{ title: module.title, href: module.href, category: "Menu", icon: module.icon }];
    if (module.submenu) {
      module.submenu.forEach(sub => {
        items.push({ title: sub.title, href: sub.href, category: module.title, icon: sub.icon || module.icon });
        if (sub.submenu) {
          sub.submenu.forEach(deepSub => {
            items.push({ 
              title: deepSub.title, 
              href: deepSub.href, 
              category: `${module.title} > ${sub.title}`, 
              icon: deepSub.icon || sub.icon || module.icon 
            });
          });
        }
      });
    }
    return items;
  });

  const filteredItems = query === "" 
    ? allItems.slice(0, 6) // Popular items
    : allItems.filter(item => 
        item.title.toLowerCase().includes(query.toLowerCase()) || 
        item.category.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 20); // Show more results

  const handleSelect = useCallback((href: string) => {
    router.push(href);
    onClose();
    setQuery("");
  }, [router, onClose]);

  useEffect(() => {
    if (isOpen) {
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredItems.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          handleSelect(filteredItems[selectedIndex].href);
        }
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, handleSelect, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300" 
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl shadow-maroon-900/20 border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200 origin-top">
        {/* Search Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4">
          <Search size={22} className="text-maroon-800" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search pages, customers, reports... (try 'sale' or 'ledgr')"
            className="flex-1 bg-transparent border-none outline-none text-lg font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:text-slate-500"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
          />
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-black text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase">ESC</kbd>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 rounded-xl transition-colors">
              <X size={20} className="text-slate-400 dark:text-slate-500" />
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto p-4 custom-scrollbar">
          {filteredItems.length > 0 ? (
            <div className="space-y-6">
              <div className="space-y-1">
                <p className="px-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
                  {query === "" ? "Recent & Suggested" : "Search Results"}
                </p>
                {filteredItems.map((item, idx) => {
                  const Icon = item.icon || FileText;
                  return (
                    <button
                      key={`${item.href}-${idx}`}
                      onClick={() => handleSelect(item.href)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border ${
                        selectedIndex === idx 
                          ? "bg-maroon-50 border-maroon-100 text-maroon-900 shadow-sm translate-x-1" 
                          : "bg-transparent border-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2.5 rounded-xl ${selectedIndex === idx ? "bg-white dark:bg-slate-900 text-maroon-800 shadow-sm" : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"}`}>
                          <Icon size={18} />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-black">{item.title}</p>
                          <p className={`text-[10px] font-bold uppercase tracking-wider ${selectedIndex === idx ? "text-maroon-400" : "text-slate-400 dark:text-slate-500"}`}>
                            {item.category}
                          </p>
                        </div>
                      </div>
                      <ChevronRight size={16} className={selectedIndex === idx ? "text-maroon-400" : "text-slate-300"} />
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-full mb-4">
                <Search size={32} className="opacity-20" />
              </div>
              <p className="text-sm font-bold uppercase tracking-widest">No results found for &quot;{query}&quot;</p>
              <p className="text-xs font-medium opacity-60 mt-1">Try searching for modules like &apos;Sale&apos;, &apos;Purchase&apos;, or &apos;Payroll&apos;</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-[9px] font-black shadow-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-[9px] font-black shadow-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">↓</kbd>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Navigate</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-[9px] font-black shadow-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">ENTER</kbd>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Open</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-[9px] font-black shadow-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">ESC</kbd>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Close</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
