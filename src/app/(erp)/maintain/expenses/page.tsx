"use client";

import { useState, useEffect } from "react";
import ERPPageHeader from "@/components/erp/ui/ERPPageHeader";
import ERPModal from "@/components/erp/ui/ERPModal";
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Eye, 
  Printer, 
  FileSpreadsheet, 
  Receipt, 
  Calendar, 
  Filter, 
  DollarSign, 
  Save, 
  FileCheck,
  CheckCircle,
  Clock,
  AlertCircle
} from "lucide-react";
import { exportToExcel, printPage } from "@/lib/excel";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [banks, setBanks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewExpense, setViewExpense] = useState<any>(null);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedType, setSelectedType] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    voucherNo: "",
    date: new Date().toISOString().split("T")[0],
    category: "Utility",
    expenseType: "Operating",
    name: "",
    description: "",
    paidFrom: "Cash",
    bankAccount: "",
    amount: 0,
    referenceNo: "",
    notes: "",
    attachment: "",
    status: "Paid",
  });

  const fetchExpenses = async () => {
    setIsLoading(true);
    try {
      const [resExp, resBanks] = await Promise.all([
        fetch("/api/expenses"),
        fetch("/api/banks")
      ]);
      const jsonExp = await resExp.json();
      const jsonBanks = await resBanks.json();
      if (jsonExp.ok) setExpenses(jsonExp.data || []);
      if (jsonBanks.ok) setBanks(jsonBanks.data || []);
    } catch (e) {
      console.error("Error loading expenses:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleOpenModal = (expense?: any) => {
    if (expense) {
      setSelectedExpense(expense);
      setFormData({
        voucherNo: expense.voucherNo || "",
        date: expense.date || new Date().toISOString().split("T")[0],
        category: expense.category || "Utility",
        expenseType: expense.expenseType || "Operating",
        name: expense.name || "",
        description: expense.description || "",
        paidFrom: expense.paidFrom || "Cash",
        bankAccount: expense.bankAccount || "",
        amount: expense.amount || 0,
        referenceNo: expense.referenceNo || "",
        notes: expense.notes || "",
        attachment: expense.attachment || "",
        status: expense.status || "Paid",
      });
    } else {
      setSelectedExpense(null);
      setFormData({
        voucherNo: `EXP-${Date.now().toString().slice(-6)}`,
        date: new Date().toISOString().split("T")[0],
        category: "Utility",
        expenseType: "Operating",
        name: "",
        description: "",
        paidFrom: "Cash",
        bankAccount: "",
        amount: 0,
        referenceNo: "",
        notes: "",
        attachment: "",
        status: "Paid",
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveExpense = async (saveStatus?: string) => {
    if (!formData.name || formData.amount <= 0) {
      alert("Please provide a valid Expense Name and Amount.");
      return;
    }

    const payload = {
      ...formData,
      status: saveStatus || formData.status,
    };

    try {
      const url = selectedExpense ? `/api/expenses/${selectedExpense._id}` : "/api/expenses";
      const method = selectedExpense ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.ok) {
        setIsModalOpen(false);
        fetchExpenses();
      } else {
        alert(json.message || "Failed to save expense");
      }
    } catch (e) {
      console.error(e);
      alert("An error occurred while saving the expense.");
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense voucher?")) return;
    setExpenses(prev => prev.filter(item => item._id !== id));
    try {
      await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    } catch (e) {
      console.error(e);
    }
  };

  // Filtering
  const filteredExpenses = expenses.filter(exp => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = 
      (exp.voucherNo || "").toLowerCase().includes(q) ||
      (exp.name || "").toLowerCase().includes(q) ||
      (exp.category || "").toLowerCase().includes(q) ||
      (exp.description || "").toLowerCase().includes(q) ||
      (exp.referenceNo || "").toLowerCase().includes(q);

    const matchesCategory = selectedCategory === "All" || exp.category === selectedCategory;
    const matchesType = selectedType === "All" || exp.expenseType === selectedType;
    const matchesStatus = selectedStatus === "All" || exp.status === selectedStatus;

    const expDate = (exp.date || "").split("T")[0];
    const matchesStartDate = !startDate || expDate >= startDate;
    const matchesEndDate = !endDate || expDate <= endDate;

    return matchesSearch && matchesCategory && matchesType && matchesStatus && matchesStartDate && matchesEndDate;
  });

  // Category Totals
  const totalAmount = filteredExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalPaid = filteredExpenses.filter(item => item.status === "Paid").reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalUnpaid = filteredExpenses.filter(item => item.status === "Unpaid").reduce((sum, item) => sum + Number(item.amount || 0), 0);

  return (
    <div className="space-y-6">
      <ERPPageHeader
        title="Business Expenses"
        description="Record, categorize, and track operational and administrative expenses offline."
        actions={[
          { label: "Print", onClick: printPage, icon: Printer },
          { label: "Export Excel", onClick: () => exportToExcel(filteredExpenses, "ExpensesList.xlsx"), icon: FileSpreadsheet },
        ]}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Filtered Expenses</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              PKR {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h3>
          </div>
          <div className="w-12 h-12 bg-maroon-800/10 text-maroon-800 rounded-2xl flex items-center justify-center font-bold">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Paid Outflow</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">
              PKR {totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h3>
          </div>
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 rounded-2xl flex items-center justify-center font-bold">
            <CheckCircle size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending / Unpaid</p>
            <h3 className="text-2xl font-black text-rose-600 mt-1">
              PKR {totalUnpaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h3>
          </div>
          <div className="w-12 h-12 bg-rose-100 dark:bg-rose-950/30 text-rose-600 rounded-2xl flex items-center justify-center font-bold">
            <AlertCircle size={24} />
          </div>
        </div>
      </div>

      {/* Action Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
          Expense Vouchers ({filteredExpenses.length})
        </h2>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-6 py-3 bg-maroon-800 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-maroon-900 transition-all shadow-lg shadow-maroon-800/20"
        >
          <Plus size={16} />
          Add New Expense
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search voucher, expense name, category, or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-maroon-800/20 font-medium"
            />
          </div>

          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20"
            >
              <option value="All">All Categories</option>
              <option value="Utility">Utility (Electricity, Water)</option>
              <option value="Rent">Shop / Godown Rent</option>
              <option value="Salaries">Salaries & Wages</option>
              <option value="Fuel">Fuel & Carriage</option>
              <option value="Refreshments">Tea & Refreshments</option>
              <option value="Maintenance">Repair & Maintenance</option>
              <option value="Supplies">Office Supplies & Stationery</option>
              <option value="Miscellaneous">Miscellaneous</option>
            </select>
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-maroon-800/20"
            >
              <option value="All">All Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Partial">Partial</option>
              <option value="Draft">Draft</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 items-center pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-500">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-slate-400" />
            <span>From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
            />
          </div>
          <div className="flex items-center gap-2">
            <span>To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
            />
          </div>
          {(startDate || endDate || searchTerm || selectedCategory !== "All" || selectedStatus !== "All") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("All");
                setSelectedType("All");
                setSelectedStatus("All");
                setStartDate("");
                setEndDate("");
              }}
              className="text-maroon-800 hover:underline font-bold ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-slate-400 font-bold">Loading Expenses from Local Database...</div>
        ) : filteredExpenses.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Voucher #</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Expense Category</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Expense Name</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Paid From</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredExpenses.map((expense) => (
                  <tr key={expense._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-maroon-800 transition-colors">
                        {expense.voucherNo}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{expense.date}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2.5 py-1 rounded-md text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        {expense.category || "General"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-100">{expense.name}</div>
                      {expense.description && (
                        <div className="text-[10px] text-slate-400 font-medium truncate max-w-xs">{expense.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        {expense.paidFrom} {expense.bankAccount ? `(${expense.bankAccount})` : ""}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-xs font-black text-maroon-800">
                        PKR {Number(expense.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          expense.status === "Paid"
                            ? "bg-emerald-100 text-emerald-700"
                            : expense.status === "Unpaid"
                            ? "bg-rose-100 text-rose-700"
                            : expense.status === "Partial"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {expense.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setViewExpense(expense)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                          title="View Details"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => handleOpenModal(expense)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition-all"
                          title="Edit Expense"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(expense._id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all"
                          title="Delete Expense"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
              <Receipt size={28} className="text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium text-sm">No expense records found.</p>
            <p className="text-xs text-slate-400 mt-0.5">Click &quot;Add New Expense&quot; to record business expenditures.</p>
          </div>
        )}
      </div>

      {/* Expense Modal (Add / Edit) */}
      <ERPModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedExpense ? "Edit Expense Voucher" : "Add Expense Voucher"}
        size="lg"
        footer={
          <div className="flex justify-between w-full items-center">
            <button
              type="button"
              onClick={() => handleSaveExpense("Draft")}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Save Draft
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveExpense()}
                className="flex items-center gap-1.5 px-6 py-2 bg-maroon-800 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-maroon-900 transition-all shadow-md shadow-maroon-800/20"
              >
                <Save size={15} />
                Save & Post
              </button>
            </div>
          </div>
        }
      >
        <form onSubmit={(e) => { e.preventDefault(); handleSaveExpense(); }} className="space-y-4 pr-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expense Voucher No</label>
              <input
                type="text"
                value={formData.voucherNo}
                onChange={(e) => setFormData({ ...formData, voucherNo: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expense Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
              >
                <option value="Utility">Utility (Electricity, Water)</option>
                <option value="Rent">Shop / Godown Rent</option>
                <option value="Salaries">Salaries & Wages</option>
                <option value="Fuel">Fuel & Carriage</option>
                <option value="Refreshments">Tea & Refreshments</option>
                <option value="Maintenance">Repair & Maintenance</option>
                <option value="Supplies">Office Supplies & Stationery</option>
                <option value="Miscellaneous">Miscellaneous</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expense Type</label>
              <select
                value={formData.expenseType}
                onChange={(e) => setFormData({ ...formData, expenseType: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
              >
                <option value="Operating">Operating</option>
                <option value="Administrative">Administrative</option>
                <option value="Financial">Financial</option>
                <option value="Direct">Direct</option>
                <option value="Indirect">Indirect</option>
              </select>
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expense Title / Name *</label>
              <input
                type="text"
                placeholder="e.g. Monthly Electricity Bill July"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                required
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</label>
              <input
                type="text"
                placeholder="Detailed details regarding this payment..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Paid From</label>
              <select
                value={formData.paidFrom}
                onChange={(e) => setFormData({ ...formData, paidFrom: e.target.value as any })}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
              >
                <option value="Cash">Cash</option>
                <option value="Bank">Bank</option>
              </select>
            </div>

            {formData.paidFrom === "Bank" && (
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bank Account</label>
                <select
                  value={formData.bankAccount}
                  onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                >
                  <option value="">Select Bank Account</option>
                  {banks.map((b) => (
                    <option key={b._id} value={b.name}>
                      {b.name} {b.accountNo ? `(${b.accountNo})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount (PKR) *</label>
              <input
                type="number"
                min="0"
                step="any"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black text-maroon-800"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reference No / Bill #</label>
              <input
                type="text"
                placeholder="e.g. Bill # 98124"
                value={formData.referenceNo}
                onChange={(e) => setFormData({ ...formData, referenceNo: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
              >
                <option value="Paid">Paid</option>
                <option value="Unpaid">Unpaid</option>
                <option value="Partial">Partial</option>
                <option value="Draft">Draft</option>
              </select>
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Notes</label>
              <textarea
                rows={2}
                placeholder="Additional comments or remarks..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium"
              />
            </div>
          </div>
        </form>
      </ERPModal>

      {/* View Details Modal */}
      {viewExpense && (
        <ERPModal
          isOpen={!!viewExpense}
          onClose={() => setViewExpense(null)}
          title={`Expense Voucher Details: ${viewExpense.voucherNo}`}
          size="md"
          footer={
            <button
              onClick={() => setViewExpense(null)}
              className="px-6 py-2 bg-maroon-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-maroon-900"
            >
              Close
            </button>
          }
        >
          <div className="space-y-4 text-xs font-medium text-slate-700 dark:text-slate-300">
            <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Voucher No</p>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">{viewExpense.voucherNo}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</p>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">{viewExpense.date}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</p>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">{viewExpense.category}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</p>
                <p className="font-bold text-emerald-600 mt-0.5">{viewExpense.status}</p>
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-2">
              <div>
                <span className="font-black text-slate-500 uppercase tracking-wider text-[10px]">Title: </span>
                <span className="font-bold text-slate-900 dark:text-white">{viewExpense.name}</span>
              </div>
              {viewExpense.description && (
                <div>
                  <span className="font-black text-slate-500 uppercase tracking-wider text-[10px]">Description: </span>
                  <span>{viewExpense.description}</span>
                </div>
              )}
              <div>
                <span className="font-black text-slate-500 uppercase tracking-wider text-[10px]">Paid From: </span>
                <span>{viewExpense.paidFrom} {viewExpense.bankAccount ? `(${viewExpense.bankAccount})` : ""}</span>
              </div>
              <div>
                <span className="font-black text-slate-500 uppercase tracking-wider text-[10px]">Amount: </span>
                <span className="font-black text-maroon-800 text-sm">PKR {Number(viewExpense.amount).toLocaleString()}</span>
              </div>
              {viewExpense.referenceNo && (
                <div>
                  <span className="font-black text-slate-500 uppercase tracking-wider text-[10px]">Ref #: </span>
                  <span>{viewExpense.referenceNo}</span>
                </div>
              )}
              {viewExpense.notes && (
                <div>
                  <span className="font-black text-slate-500 uppercase tracking-wider text-[10px]">Notes: </span>
                  <span>{viewExpense.notes}</span>
                </div>
              )}
            </div>
          </div>
        </ERPModal>
      )}
    </div>
  );
}
