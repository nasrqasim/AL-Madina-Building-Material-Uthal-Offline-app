"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  ChevronRight, 
  ChevronDown, 
  Folder, 
  FileText, 
  Plus, 
  Edit2, 
  Trash2,
  Search,
  ListTree,
  Printer,
  Calendar,
  Clock,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import AccountModal from "./AccountModal";
import JVModal from "./JVModal";
import { printListDocument } from "@/lib/excel";

interface AccountNode {
  _id?: string;
  code: string;
  name: string;
  type: "group" | "ledger";
  balance?: number;
  children?: AccountNode[];
  rawAccount?: any;
}

const TreeNode = ({ 
  node, 
  depth = 0, 
  onEdit, 
  onDelete, 
  onSelect, 
  activeId 
}: { 
  node: AccountNode; 
  depth?: number; 
  onEdit: (acc: any) => void; 
  onDelete: (id: string) => void;
  onSelect?: (node: AccountNode) => void;
  activeId?: string;
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  const handleClick = (e: React.MouseEvent) => {
    if (node.type === "ledger") {
      e.stopPropagation();
      onSelect?.(node);
    } else {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className="select-none">
      <div 
        className={`flex items-center group py-2 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-all ${
          depth === 0 ? "mt-4" : "mt-0.5"
        } ${
          activeId === node._id 
            ? "bg-maroon-50/50 dark:bg-maroon-900/10 border-l-4 border-maroon-800 text-maroon-800 dark:text-maroon-400 font-bold" 
            : "dark:bg-slate-800/50 dark:hover:bg-slate-850"
        }`}
        style={{ paddingLeft: `${depth * 20 + 12}px` }}
        onClick={handleClick}
      >
        <div className="flex items-center gap-2 flex-1">
          {hasChildren ? (
            isOpen ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />
          ) : (
            <div className="w-3.5" />
          )}
          
          <div className={`p-1.5 rounded-lg ${
            node.type === "group" 
              ? "bg-maroon-50 dark:bg-maroon-900/30 text-maroon-800 dark:text-maroon-400" 
              : "bg-slate-100 dark:bg-slate-800 text-slate-500"
          }`}>
            {node.type === "group" ? <Folder size={14} /> : <FileText size={14} />}
          </div>
          
          <span className="text-[10px] font-mono font-bold text-slate-400 mr-2">{node.code}</span>
          <span className="text-xs">{node.name}</span>
          
          {node.balance !== undefined && (
            <span className="ml-auto text-xs font-black text-slate-500">
              PKR {node.balance.toLocaleString()}
            </span>
          )}
        </div>

        {node.type === "ledger" && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-4" onClick={e => e.stopPropagation()}>
            <button onClick={() => onEdit(node.rawAccount)} className="p-1 text-slate-400 hover:text-blue-600 rounded">
              <Edit2 size={12} />
            </button>
            <button onClick={() => node._id && onDelete(node._id)} className="p-1 text-slate-400 hover:text-rose-600 rounded">
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>

      {isOpen && hasChildren && (
        <div className="animate-in fade-in slide-in-from-top-1 duration-200">
          {node.children!.map((child, idx) => (
            <TreeNode 
              key={child._id || idx} 
              node={child} 
              depth={depth + 1} 
              onEdit={onEdit} 
              onDelete={onDelete} 
              onSelect={onSelect}
              activeId={activeId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function COATreeView() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [treeData, setTreeData] = useState<AccountNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Detail Ledger states
  const [activeAccount, setActiveAccount] = useState<AccountNode | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerSearchQuery, setLedgerSearchQuery] = useState("");
  const [isJVModalOpen, setIsJVModalOpen] = useState(false);
  const [editingJV, setEditingJV] = useState<any>(null);
  const [parties, setParties] = useState<any[]>([]);

  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/accounts");
      const json = await res.json();
      if (json.ok) {
        setAccounts(json.data);
        
        // Group accounts by type for the tree view
        const grouped: Record<string, any[]> = {};
        json.data.forEach((acc: any) => {
          const type = (acc.type || "Unknown").toUpperCase();
          if (!grouped[type]) grouped[type] = [];
          grouped[type].push(acc);
        });

        const tree: AccountNode[] = Object.keys(grouped).map((type, idx) => ({
          _id: `group-${idx}`,
          code: "",
          name: type,
          type: "group",
          children: grouped[type].map(acc => ({
            _id: acc._id,
            code: acc.code || "",
            name: acc.title || acc.name || "",
            type: "ledger",
            balance: acc.currentBalance ?? acc.openingBalance ?? 0,
            rawAccount: acc
          }))
        }));
        
        setTreeData(tree);

        // Update selected account metadata if it is active
        if (activeAccount) {
          const updated = json.data.find((a: any) => a.code === activeAccount.code);
          if (updated) {
            setActiveAccount({
              _id: updated._id,
              code: updated.code,
              name: updated.title || updated.name,
              type: "ledger",
              balance: updated.currentBalance ?? updated.openingBalance ?? 0,
              rawAccount: updated
            });
          }
        }
      }
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  const fetchParties = async () => {
    try {
      const res = await fetch("/api/parties");
      const json = await res.json();
      if (json.ok) setParties(json.data);
    } catch (e) { console.error(e); }
  };

  const fetchLedgerEntries = async (accountCode: string) => {
    setLedgerLoading(true);
    try {
      const res = await fetch(`/api/journal-entries?accountCode=${accountCode}`);
      const json = await res.json();
      if (json.ok) {
        setLedgerEntries(json.data);
      }
    } catch (e) { console.error(e); } finally { setLedgerLoading(false); }
  };

  useEffect(() => { 
    fetchAccounts(); 
    fetchParties();
  }, []);

  useEffect(() => {
    if (accounts.length > 0 && typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const accountCode = params.get("accountCode");
      if (accountCode) {
        const matched = accounts.find((a: any) => a.code === accountCode);
        if (matched) {
          setActiveAccount({
            _id: matched._id,
            code: matched.code,
            name: matched.title || matched.name,
            type: "ledger",
            balance: matched.currentBalance ?? matched.openingBalance ?? 0,
            rawAccount: matched
          });
        }
      }
    }
  }, [accounts]);

  useEffect(() => {
    if (activeAccount) {
      fetchLedgerEntries(activeAccount.code);
    }
  }, [activeAccount?.code]);

  const handleEdit = (acc: any) => { setSelectedAccount(acc); setIsModalOpen(true); };
  
  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this account?")) {
      await fetch(`/api/accounts/${id}`, { method: "DELETE" });
      if (activeAccount?._id === id) setActiveAccount(null);
      fetchAccounts();
    }
  };

  const handleSave = async (data: any) => {
    if (selectedAccount?._id) {
      await fetch(`/api/accounts/${selectedAccount._id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    } else {
      await fetch("/api/accounts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    }
    fetchAccounts();
    setIsModalOpen(false);
  };

  const handleSaveJV = async (payload: any) => {
    if (editingJV) {
      await fetch(`/api/journal-entries/${editingJV._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } else {
      await fetch("/api/journal-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    }
    setEditingJV(null);
    fetchAccounts();
    if (activeAccount) fetchLedgerEntries(activeAccount.code);
  };

  const handleDeleteJV = async (id: string) => {
    if (confirm("Are you sure you want to delete this entry?")) {
      await fetch(`/api/journal-entries/${id}`, { method: "DELETE" });
      fetchAccounts();
      if (activeAccount) fetchLedgerEntries(activeAccount.code);
    }
  };

  // Determine running balance nature
  const isDebitNature = (acc: any) => {
    if (!acc) return true;
    const type = String(acc.type || "").toLowerCase();
    return ["cash", "bank", "expense", "receivable", "asset"].includes(type);
  };

  // Compute entries with running balances and filter by search
  const computedEntries = useMemo(() => {
    if (!activeAccount) return [];
    let balance = activeAccount.rawAccount?.openingBalance || 0;
    const debitNature = isDebitNature(activeAccount.rawAccount);
    
    // Sort chronologically to compute running balance correctly
    const sorted = [...ledgerEntries].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const mapped = sorted.map(entry => {
      if (debitNature) {
        balance += (entry.debit || 0) - (entry.credit || 0);
      } else {
        balance += (entry.credit || 0) - (entry.debit || 0);
      }
      return { ...entry, runningBalance: balance };
    });

    // Reverse to show latest first in table
    const reversed = mapped.reverse();

    if (!ledgerSearchQuery.trim()) return reversed;

    const q = ledgerSearchQuery.toLowerCase();
    return reversed.filter(
      (e) =>
        e.voucherNo?.toLowerCase().includes(q) ||
        e.remarks?.toLowerCase().includes(q) ||
        e.partyId?.name?.toLowerCase().includes(q) ||
        e.partyId?.companyName?.toLowerCase().includes(q)
    );
  }, [ledgerEntries, activeAccount, ledgerSearchQuery]);

  // Compute totals
  const totals = useMemo(() => {
    return computedEntries.reduce(
      (acc, curr) => {
        acc.debits += curr.debit || 0;
        acc.credits += curr.credit || 0;
        return acc;
      },
      { debits: 0, credits: 0 }
    );
  }, [computedEntries]);

  // Print ledger table
  const handlePrintLedger = () => {
    if (!activeAccount) return;
    printListDocument({
      title: `${activeAccount.code} — ${activeAccount.name} Ledger`,
      columns: [
        { header: "Date", key: "dateFormatted" },
        { header: "Voucher #", key: "voucherNo" },
        { header: "Remarks / Party", key: "remarksWithParty" },
        { header: "Debit (+)", key: "debitFormatted" },
        { header: "Credit (-)", key: "creditFormatted" },
        { header: "Balance", key: "balanceFormatted" },
      ],
      rows: computedEntries.map((e) => ({
        dateFormatted: new Date(e.date).toLocaleDateString(),
        voucherNo: e.voucherNo,
        remarksWithParty: `${e.remarks || ""} ${
          e.partyId ? `(${e.partyId.name})` : ""
        }`.trim(),
        debitFormatted: e.debit > 0 ? `PKR ${e.debit.toLocaleString()}` : "-",
        creditFormatted: e.credit > 0 ? `PKR ${e.credit.toLocaleString()}` : "-",
        balanceFormatted: `PKR ${e.runningBalance.toLocaleString()}`,
      })),
      totals: {
        dateFormatted: "Total",
        voucherNo: "",
        remarksWithParty: "",
        debitFormatted: `PKR ${totals.debits.toLocaleString()}`,
        creditFormatted: `PKR ${totals.credits.toLocaleString()}`,
        balanceFormatted: `PKR ${(activeAccount.balance || 0).toLocaleString()}`,
      },
    });
  };

  return (
    <div className="space-y-6">
      <AccountModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} account={selectedAccount} onSave={handleSave} />
      <JVModal 
        isOpen={isJVModalOpen} 
        onClose={() => { setIsJVModalOpen(false); setEditingJV(null); }} 
        activeAccount={activeAccount} 
        allAccounts={accounts} 
        parties={parties} 
        onSave={handleSaveJV} 
        editingJV={editingJV} 
      />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            <button className="p-2 bg-white dark:bg-slate-900 text-maroon-800 dark:text-maroon-400 rounded-lg shadow-sm">
              <ListTree size={18} />
            </button>
          </div>
          <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-2" />
          <span className="text-sm font-bold text-slate-500">
            {isLoading ? "Loading..." : `${accounts.length} Accounts`}
          </span>
        </div>
        
        <button 
          onClick={() => { setSelectedAccount(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-6 py-2.5 bg-maroon-800 text-white rounded-xl font-black text-sm shadow-xl shadow-maroon-900/20 hover:bg-maroon-900 transition-all"
        >
          <Plus size={18} />
          New Account
        </button>
      </div>

      {/* Main Grid: Split Screen Tree and Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
        
        {/* Left Column: Accounts Tree */}
        <div className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 transition-all duration-300 ${
          activeAccount ? "lg:col-span-5" : "lg:col-span-12"
        }`}>
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Account Tree</h3>
          <div className="overflow-y-auto max-h-[650px] pr-2">
            {treeData.length > 0 ? treeData.map(node => (
              <TreeNode 
                key={node._id} 
                node={node} 
                onEdit={handleEdit} 
                onDelete={handleDelete} 
                onSelect={setActiveAccount}
                activeId={activeAccount?._id}
              />
            )) : !isLoading && (
              <div className="text-center py-20 text-slate-500 font-bold">No accounts found in database.</div>
            )}
          </div>
        </div>

        {/* Right Column: Ledger Detail Table */}
        {activeAccount && (
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex flex-col justify-between transition-all duration-300">
            
            {/* Header / Filter Toolbar */}
            <div className="space-y-4">
              <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                    {activeAccount.code}
                  </span>
                  <h4 className="text-base font-black text-slate-900 dark:text-white mt-1">
                    {activeAccount.name}
                  </h4>
                  <p className="text-xs text-slate-400 font-medium mt-0.5 capitalize">
                    Category: {activeAccount.rawAccount?.type} Ledger
                  </p>
                </div>
                
                <div className="text-right">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Current Balance</span>
                  <span className="text-xl font-black text-maroon-800">
                    PKR {(activeAccount.balance || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Action row */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input
                    type="text"
                    value={ledgerSearchQuery}
                    onChange={(e) => setLedgerSearchQuery(e.target.value)}
                    placeholder="Search ledger entries..."
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-4 focus:ring-maroon-800/5 focus:outline-none font-bold transition-all"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrintLedger}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors"
                  >
                    <Printer size={14} /> Print List
                  </button>
                  <button
                    onClick={() => { setEditingJV(null); setIsJVModalOpen(true); }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-maroon-800 text-white text-xs font-black rounded-xl hover:bg-maroon-900 transition-colors shadow-lg shadow-maroon-800/10"
                  >
                    <Plus size={14} /> Add Entry
                  </button>
                </div>
              </div>
            </div>

            {/* Table Container */}
            <div className="overflow-x-auto border border-slate-200/50 dark:border-slate-800 rounded-2xl mt-4 flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Voucher #</th>
                    <th className="px-4 py-3">Remarks / Party</th>
                    <th className="px-4 py-3 text-right">Debit (+)</th>
                    <th className="px-4 py-3 text-right">Credit (-)</th>
                    <th className="px-4 py-3 text-right">Balance</th>
                    <th className="px-4 py-3 text-center w-16">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-bold">
                  {ledgerLoading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400">Loading ledger entries...</td>
                    </tr>
                  ) : computedEntries.length > 0 ? (
                    computedEntries.map((row) => (
                      <tr key={row._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                        <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">
                          {new Date(row.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3.5 text-blue-600 font-bold whitespace-nowrap">
                          {row.voucherNo}
                        </td>
                        <td className="px-4 py-3.5 text-slate-700 dark:text-slate-200">
                          <div>{row.remarks || "-"}</div>
                          {row.partyId && (
                            <span className="inline-flex text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-550 px-1.5 py-0.5 rounded font-black mt-1">
                              {row.partyId.type?.toUpperCase()}: {row.partyId.name} {row.partyId.companyName ? `(${row.partyId.companyName})` : ""}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right text-emerald-600">
                          {row.debit > 0 ? row.debit.toLocaleString() : "-"}
                        </td>
                        <td className="px-4 py-3.5 text-right text-rose-600">
                          {row.credit > 0 ? row.credit.toLocaleString() : "-"}
                        </td>
                        <td className="px-4 py-3.5 text-right text-slate-900 dark:text-white font-black">
                          {row.runningBalance.toLocaleString()}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => { setEditingJV(row); setIsJVModalOpen(true); }}
                              className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all"
                              title="Edit"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              onClick={() => handleDeleteJV(row._id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-all"
                              title="Delete"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400 font-bold">No ledger entries found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer Totals */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl mt-4 border border-slate-200/50 dark:border-slate-800 flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-wider">
              <span>Totals</span>
              <div className="flex gap-6">
                <span>Total Debit: <span className="text-emerald-600 font-black">PKR {totals.debits.toLocaleString()}</span></span>
                <span>Total Credit: <span className="text-rose-600 font-black">PKR {totals.credits.toLocaleString()}</span></span>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
