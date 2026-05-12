"use client";

import { useState, useEffect } from "react";
import { X, User, Mail, Shield, Key, Calendar, CheckCircle2, AlertCircle } from "lucide-react";

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user?: any;
}

export default function UserModal({ isOpen, onClose, onSuccess, user }: UserModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
    role: "dataentry",
    financialYear: "2025-2026",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        username: user.username || "",
        password: "", // Don't populate password
        role: user.role || "dataentry",
        financialYear: user.financialYear || "2025-2026",
      });
    } else {
      setFormData({
        name: "",
        email: "",
        username: "",
        password: "",
        role: "dataentry",
        financialYear: "2025-2026",
      });
    }
  }, [user, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.ok) {
        onSuccess();
        onClose();
      } else {
        setError(data.message || "Something went wrong");
      }
    } catch (err) {
      setError("Failed to save user");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-maroon-800 text-white rounded-xl">
              <User size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">{user ? "Edit User" : "Add New User"}</h2>
              <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest">Team Permissions</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 rounded-full transition-colors text-slate-400 dark:text-slate-500">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center gap-3 text-sm font-bold">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-maroon-500/5 focus:border-maroon-500 outline-none transition-all font-bold text-slate-800 dark:text-slate-100"
                  placeholder="e.g. John Doe"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-maroon-500/5 focus:border-maroon-500 outline-none transition-all font-bold text-slate-800 dark:text-slate-100"
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Username (for Login)</label>
              <div className="relative">
                <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
                <input
                  required
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-maroon-500/5 focus:border-maroon-500 outline-none transition-all font-bold text-slate-800 dark:text-slate-100"
                  placeholder="johndoe123"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Password</label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
                <input
                  required={!user}
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-maroon-500/5 focus:border-maroon-500 outline-none transition-all font-bold text-slate-800 dark:text-slate-100"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Role</label>
              <div className="relative">
                <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-maroon-500/5 focus:border-maroon-500 outline-none transition-all font-bold text-slate-800 dark:text-slate-100 appearance-none cursor-pointer"
                >
                  <option value="admin">Administrator</option>
                  <option value="superadmin">Super Admin</option>
                  <option value="salesman">Salesman</option>
                  <option value="dataentry">Data Entry</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Financial Year</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
                <select
                  value={formData.financialYear}
                  onChange={(e) => setFormData({ ...formData, financialYear: e.target.value })}
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-maroon-500/5 focus:border-maroon-500 outline-none transition-all font-bold text-slate-800 dark:text-slate-100 appearance-none cursor-pointer"
                >
                  <option value="2025-2026">2025-2026</option>
                  <option value="2024-2025">2024-2025</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button
              disabled={isLoading}
              type="submit"
              className="w-full py-4 bg-maroon-800 text-white rounded-2xl font-black shadow-lg shadow-maroon-900/20 hover:bg-maroon-700 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <CheckCircle2 size={20} />
              )}
              {user ? "Update User" : "Create User Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
