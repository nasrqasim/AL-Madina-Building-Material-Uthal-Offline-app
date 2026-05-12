"use client";

import { useState, useEffect } from "react";
import { 
  ChevronRight, 
  ChevronDown, 
  Folder, 
  FileText, 
  Plus, 
  Edit2, 
  Trash2,
  Search,
  RefreshCcw,
  LayoutGrid,
  ListTree
} from "lucide-react";
import AccountModal from "./AccountModal";

interface AccountNode {
  _id?: string;
  code: string;
  name: string;
  type: "group" | "ledger";
  balance?: number;
  children?: AccountNode[];
  rawAccount?: any;
}

const TreeNode = ({ node, depth = 0, onEdit, onDelete }: { node: AccountNode; depth?: number; onEdit: (acc: any) => void; onDelete: (id: string) => void }) => {
  const [isOpen, setIsOpen] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="select-none">
      <div 
        className={`flex items-center group py-2 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 dark:hover:bg-slate-800 cursor-pointer transition-all ${depth === 0 ? "mt-4" : "mt-0.5"}`}
        style={{ paddingLeft: `${depth * 24 + 12}px` }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 flex-1">
          {hasChildren ? (
            isOpen ? <ChevronDown size={16} className="text-slate-400 dark:text-slate-500" /> : <ChevronRight size={16} className="text-slate-400 dark:text-slate-500" />
          ) : (
            <div className="w-4" />
          )}
          
          <div className={`p-1.5 rounded-lg ${node.type === "group" ? "bg-maroon-50 dark:bg-maroon-900/30 text-maroon-800 dark:text-maroon-400" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"}`}>
            {node.type === "group" ? <Folder size={16} /> : <FileText size={16} />}
          </div>
          
          <span className={`text-xs font-black tracking-widest text-slate-400 dark:text-slate-500 mr-2`}>{node.code}</span>
          <span className={`text-sm ${node.type === "group" ? "font-black text-slate-900 dark:text-white" : "font-bold text-slate-600 dark:text-slate-300"}`}>
            {node.name}
          </span>
          
          {node.balance !== undefined && (
            <span className="ml-auto text-xs font-black text-slate-400 dark:text-slate-500 group-hover:text-maroon-800 transition-colors">
              PKR {node.balance.toLocaleString()}
            </span>
          )}
        </div>

        {node.type === "ledger" && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-4" onClick={e => e.stopPropagation()}>
            <button onClick={() => onEdit(node.rawAccount)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all">
              <Edit2 size={14} />
            </button>
            <button onClick={() => node._id && onDelete(node._id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-all">
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {isOpen && hasChildren && (
        <div className="animate-in fade-in slide-in-from-top-1 duration-200">
          {node.children!.map((child, idx) => (
            <TreeNode key={child._id || idx} node={child} depth={depth + 1} onEdit={onEdit} onDelete={onDelete} />
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
            balance: acc.openingBalance || 0,
            rawAccount: acc
          }))
        }));
        
        setTreeData(tree);
      }
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchAccounts(); }, []);

  const handleEdit = (acc: any) => { setSelectedAccount(acc); setIsModalOpen(true); };
  
  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this account?")) {
      await fetch(`/api/accounts/${id}`, { method: "DELETE" });
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

  return (
    <div className="space-y-6">
      <AccountModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} account={selectedAccount} onSave={handleSave} />
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
        
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search accounts..." 
            className="w-full pl-12 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold focus:ring-4 focus:ring-maroon-800/5 transition-all"
          />
        </div>
        
        <button 
          onClick={() => { setSelectedAccount(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-6 py-2.5 bg-maroon-800 text-white rounded-xl font-black text-sm shadow-xl shadow-maroon-900/20 hover:bg-maroon-900 transition-all"
        >
          <Plus size={18} />
          New Account
        </button>
      </div>

      {/* Tree Container */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[600px] p-6 transition-colors duration-300">
        <div className="max-w-4xl mx-auto">
          {treeData.length > 0 ? treeData.map(node => (
            <TreeNode key={node._id} node={node} onEdit={handleEdit} onDelete={handleDelete} />
          )) : !isLoading && (
            <div className="text-center py-20 text-slate-500 font-bold">No accounts found in database.</div>
          )}
        </div>
      </div>
    </div>
  );
}
