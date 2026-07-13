"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, LogOut } from "lucide-react";
import { ERPNavItem } from "@/types/erp";
import { erpModules } from "./nav";
import { COMPANY_SHORT, COMPANY_TAGLINE } from "@/lib/company";
import CompanyLogo from "./CompanyLogo";
import { useState, memo, useMemo, useEffect } from "react";

// Move utility function outside to prevent re-creation
const isChildActive = (item: ERPNavItem, pathname: string): boolean => {
  if (pathname === item.href) return true;
  if (item.submenu) {
    return item.submenu.some(sub => isChildActive(sub, pathname));
  }
  return false;
};

const MenuItem = memo(({ item, depth = 0, pathname }: { item: ERPNavItem; depth?: number; pathname: string }) => {
  const isActive = useMemo(() => isChildActive(item, pathname), [item, pathname]);
  const [isOpen, setIsOpen] = useState(isActive);
  
  // Keep open state synced if route changes
  useEffect(() => {
    if (isActive) setIsOpen(true);
  }, [isActive]);

  const Icon = item.icon;
  const hasSubmenu = item.submenu && item.submenu.length > 0;
  
  const isReportCategory = depth === 1 && item.submenu && item.submenu.length > 0;

  return (
    <div>
      {hasSubmenu ? (
        <button
          type="button"
          onClick={() => {
            console.log("Toggling submenu for:", item.title);
            setIsOpen(!isOpen);
          }}

          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
            isActive && depth === 0 ? "bg-maroon-800 text-white" : "hover:bg-slate-900 hover:text-white"
          } ${depth > 0 ? "text-sm" : "font-medium"} ${isReportCategory ? "text-amber-400" : ""}`}
          style={{ paddingLeft: depth > 0 ? `${depth * 1.5 + 0.75}rem` : "0.75rem" }}
        >
          <div className="flex items-center gap-3">
            {Icon && <Icon size={20} />}
            <span className={depth > 0 ? "text-xs" : "text-sm"}>{item.title}</span>
          </div>
          <ChevronRight size={14} className={`transition-transform ${isOpen ? "rotate-90" : ""}`} />
        </button>
      ) : (
        <Link
          href={item.href}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
            pathname === item.href ? "bg-maroon-800 text-white" : "hover:bg-slate-900 hover:text-white"
          } ${depth > 0 ? "text-sm" : "font-medium"}`}
          style={{ paddingLeft: depth > 0 ? `${depth * 1.5 + 0.75}rem` : "0.75rem" }}
        >
          {Icon && <Icon size={20} />}
          <span className={depth > 0 ? "text-xs" : "text-sm"}>{item.title}</span>
        </Link>
      )}

      {isOpen && hasSubmenu && (
        <div className="mt-1 space-y-1">
          {item.submenu?.map((sub) => (
            <MenuItem key={sub.title} item={sub} depth={depth + 1} pathname={pathname} />
          ))}
        </div>
      )}
    </div>
  );
});

MenuItem.displayName = "MenuItem";

interface SidebarProps {
  user: {
    name: string;
    role: string;
  };
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  
  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-slate-950 text-slate-300 flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <CompanyLogo size={32} />
          <div>
            <h1 className="text-white font-bold leading-none uppercase">{COMPANY_SHORT}</h1>
            <p className="text-[10px] text-slate-500 tracking-tighter">{COMPANY_TAGLINE}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
        {erpModules
          .filter((item) => {
            const r = (user?.role || "").toLowerCase().replace(/\s+/g, "");
            const isSuperAdmin = r === "superadmin" || r === "admin";
            const isSalesUser = r === "salesuser" || r === "sales_user";
            
            if (isSuperAdmin) return true;
            if (isSalesUser) {
              const allowedMainTitles = ["Dashboard", "Sales", "Maintain", "WhatsApp Center", "Reports"];
              return allowedMainTitles.includes(item.title);
            }
            return !item.roles || item.roles.includes(user?.role as any);
          })
          .map((item) => {
            const r = (user?.role || "").toLowerCase().replace(/\s+/g, "");
            const isSalesUser = r === "salesuser" || r === "sales_user";
            
            if (isSalesUser && item.submenu) {
              let filteredSubmenu = item.submenu;
              if (item.title === "Maintain") {
                filteredSubmenu = item.submenu.filter((sub) => 
                  ["Customers", "Customer Balances"].includes(sub.title)
                );
              } else if (item.title === "Sales") {
                filteredSubmenu = item.submenu.filter((sub) => 
                  ["Sale Invoice", "Sale Return", "POS Counter Sale"].includes(sub.title)
                );
              } else if (item.title === "Reports") {
                filteredSubmenu = item.submenu
                  .filter((sub) => ["Sale Reports", "Inventory Reports"].includes(sub.title))
                  .map((sub) => {
                    if (sub.title === "Sale Reports" && sub.submenu) {
                      return {
                        ...sub,
                        submenu: sub.submenu.filter((s) => s.title === "Customer Balances")
                      };
                    }
                    if (sub.title === "Inventory Reports" && sub.submenu) {
                      return {
                        ...sub,
                        submenu: sub.submenu.filter((s) => s.title === "Inventory Balances")
                      };
                    }
                    return sub;
                  });
              }
              return (
                <MenuItem 
                  key={item.title} 
                  item={{ ...item, submenu: filteredSubmenu }} 
                  pathname={pathname} 
                />
              );
            }
            return <MenuItem key={item.title} item={item} pathname={pathname} />;
          })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-slate-800 bg-slate-950">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-xs font-bold text-white uppercase">
              {user?.name?.charAt(0) || "U"}
            </div>
            <div>
              <p className="text-xs font-bold text-white leading-none">{user?.name || "User"}</p>
              <p className="text-[10px] text-slate-500 mt-1 uppercase font-black tracking-widest">{user?.role || "Guest"}</p>
            </div>
          </div>
          <button className="text-slate-500 hover:text-white transition-colors">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
