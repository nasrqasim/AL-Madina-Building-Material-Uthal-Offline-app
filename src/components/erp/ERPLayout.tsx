"use client";

import { ReactNode, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import CommandPalette from "../dashboard/CommandPalette";
import { useWidgetVisibility, WidgetKey } from "@/components/dashboard/WidgetVisibilityPanel";

interface ERPLayoutProps {
  children: ReactNode;
  user: {
    name: string;
    role: string;
  };
}

export default function ERPLayout({ children, user }: ERPLayoutProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const pathname = usePathname();
  const isDashboard = pathname === "/dashboard";

  // Widget visibility — only active on dashboard
  const { visibility, toggle } = useWidgetVisibility();

  useEffect(() => {
    // Initial theme setup
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const initialTheme = savedTheme || "light";
    setTheme(initialTheme);
    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    
    const handleOpenSearch = () => setIsSearchOpen(true);
    const handleToggleTheme = () => {
      setTheme(prev => {
        const newTheme = prev === "light" ? "dark" : "light";
        localStorage.setItem("theme", newTheme);
        if (newTheme === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
        window.dispatchEvent(new CustomEvent("theme-changed", { detail: newTheme }));
        return newTheme;
      });
    };
    
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("open-search", handleOpenSearch);
    window.addEventListener("toggle-theme", handleToggleTheme);
    
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("open-search", handleOpenSearch);
      window.removeEventListener("toggle-theme", handleToggleTheme);
    };
  }, []);

  // Pass widget visibility down to children via a data attribute on body
  // so the dashboard page can read it via a custom event
  useEffect(() => {
    if (isDashboard) {
      window.dispatchEvent(new CustomEvent("widget-visibility-changed", { detail: visibility }));
    }
  }, [visibility, isDashboard]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
      <CommandPalette isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} userRole={user.role} />
      <Sidebar user={{ name: user.name, role: user.role }} />
      
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <TopBar 
          title="Dashboard" 
          onSearchClick={() => setIsSearchOpen(true)}
          widgetVisibility={isDashboard ? visibility : undefined}
          onWidgetToggle={isDashboard ? toggle : undefined}
          user={{ 
            name: user.name, 
            role: user.role,
            oilshop: "Oilshop" 
          }} 
        />
        
        <main className="flex-1 p-6 overflow-y-auto flex flex-col">
          <div className="flex-1">
            {children}
          </div>
          <footer className="w-full mt-8 pt-4 border-t border-slate-200 dark:border-slate-800 text-center">
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
              © 2026 All Rights Reserved | Powered by{" "}
              <a 
                href="https://roonjha-developer.vercel.app/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-maroon-700 dark:text-maroon-400 hover:text-maroon-900 dark:hover:text-maroon-300 transition-colors font-bold"
              >
                Roonjha Developer
              </a>
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
