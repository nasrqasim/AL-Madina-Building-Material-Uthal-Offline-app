"use client";

import { useState, useEffect } from "react";
import ERPModal from "../ui/ERPModal";
import { Save, Briefcase, Users, Calendar, DollarSign, FileText } from "lucide-react";

interface JobModalProps {
  isOpen: boolean;
  onClose: () => void;
  job?: any;
  onSave?: (data: any) => void;
}

export default function JobModal({ isOpen, onClose, job, onSave }: JobModalProps) {
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    customer: "",
    status: "Active",
    startDate: "",
    endDate: "",
    budget: 0,
    isActive: "Yes",
    description: "",
  });

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (job) {
      setFormData({
        code: job.code || "",
        name: job.name || "",
        customer: job.customer || "",
        status: job.status || "Active",
        startDate: job.startDate || today,
        endDate: job.endDate || today,
        budget: job.budget || 0,
        isActive: job.status === "Active" ? "Yes" : "No",
        description: job.description || "",
      });
    } else {
      setFormData({
        code: `JOB-${Math.floor(1000 + Math.random() * 9000)}`,
        name: "",
        customer: "",
        status: "Active",
        startDate: today,
        endDate: today,
        budget: 0,
        isActive: "Yes",
        description: "",
      });
    }
  }, [job, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSave) {
      onSave(formData);
    }
    onClose();
  };

  return (
    <ERPModal
      isOpen={isOpen}
      onClose={onClose}
      title={job ? "Edit Job" : "Add New Job"}
      size="xl"
      footer={
        <div className="flex justify-end gap-3 w-full">
          <button onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 rounded-xl transition-all">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 px-8 py-2.5 bg-maroon-800 text-white rounded-xl text-sm font-black hover:bg-maroon-900 transition-all shadow-xl shadow-maroon-900/20"
          >
            Save
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="p-2 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Job Code</label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 focus:ring-4 focus:ring-maroon-800/5 outline-none transition-all dark:text-white"
              placeholder="JOB-0001"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Job Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 focus:ring-4 focus:ring-maroon-800/5 outline-none transition-all dark:text-white"
              placeholder="salesman"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Customer</label>
            <select
              value={formData.customer}
              onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 outline-none transition-all dark:text-white"
            >
              <option value="">Select Customer (Optional)</option>
              <option>Al-Noor Traders</option>
              <option>Bilal Lubricants</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 outline-none transition-all dark:text-white"
            >
              <option>Active</option>
              <option>Completed</option>
              <option>On Hold</option>
              <option>Cancelled</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Start Date</label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 focus:ring-4 focus:ring-maroon-800/5 outline-none transition-all dark:text-white"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">End Date</label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 focus:ring-4 focus:ring-maroon-800/5 outline-none transition-all dark:text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Budget Amount (PKR)</label>
            <input
              type="number"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 focus:ring-4 focus:ring-maroon-800/5 outline-none transition-all dark:text-white"
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Active</label>
            <select
              value={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 outline-none transition-all dark:text-white"
            >
              <option>Yes</option>
              <option>No</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-slate-900 dark:bg-slate-900 focus:ring-4 focus:ring-maroon-800/5 outline-none transition-all min-h-[100px] resize-none dark:text-white"
            placeholder="Enter job description"
          />
        </div>
      </form>
    </ERPModal>
  );
}
