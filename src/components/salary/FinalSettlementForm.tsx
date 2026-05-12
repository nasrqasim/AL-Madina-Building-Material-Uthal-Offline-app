import { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  X, 
  Save, 
  CheckCircle2, 
  Plus,
  Trash2,
  Printer
} from "lucide-react";
import { printPage } from "@/lib/excel";

interface SettlementLine {
  id: string;
  description: string;
  amount: number;
}

export default function FinalSettlementForm({ onClose, initialData }: any) {
  const [earnings, setEarnings] = useState<SettlementLine[]>(initialData?.earnings || [
    { id: "1", description: "Last Month / Days Salary", amount: 0 },
    { id: "2", description: "Gratuity", amount: 0 },
    { id: "3", description: "Leave Encashment", amount: 0 },
    { id: "4", description: "Notice Pay", amount: 0 },
    { id: "5", description: "Bonus / Goodwill / Other", amount: 0 },
  ]);

  const [deductions, setDeductions] = useState<SettlementLine[]>(initialData?.deductionLines || []);

  const [formData, setFormData] = useState({
    voucherNo: initialData?.voucherNo || `FF-${Date.now()}`,
    date: initialData?.date || new Date().toISOString().split("T")[0],
    employee: initialData?.employee || "",
    leavingDate: initialData?.leavingDate || new Date().toISOString().split("T")[0],
    reason: initialData?.reason || "Resignation",
    notes: initialData?.notes || "",
    status: initialData?.status || "Draft"
  });

  const [isSaving, setIsSaving] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/employees").then(r => r.json()).then(data => {
      if (data.ok) setEmployees(data.data);
    });
  }, []);

  const addEarning = () => setEarnings([...earnings, { id: Date.now().toString(), description: "", amount: 0 }]);
  const removeEarning = (id: string) => setEarnings(earnings.filter(e => e.id !== id));
  
  const addDeduction = () => setDeductions([...deductions, { id: Date.now().toString(), description: "", amount: 0 }]);
  const removeDeduction = (id: string) => setDeductions(deductions.filter(d => d.id !== id));

  const updateLine = (list: SettlementLine[], setList: (l: SettlementLine[]) => void, id: string, field: "description" | "amount", value: any) => {
    setList(list.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const totalEarnings = earnings.reduce((sum, e) => sum + e.amount, 0);
  const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
  const netPayable = totalEarnings - totalDeductions;

  const handleSubmit = async (submitStatus: string) => {
    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        grossPay: totalEarnings,
        deductions: totalDeductions,
        netPayable: netPayable,
        status: submitStatus,
        earnings,
        deductionLines: deductions
      };
      
      const url = initialData?._id ? `/api/salary-settlements/${initialData._id}` : "/api/salary-settlements";
      const method = initialData?._id ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.ok) {
        onClose();
      } else {
        alert(json.message || "Failed to save");
      }
    } catch (e) {
      console.error(e);
      alert("Error saving record");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 min-h-screen">
      <div className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-slate-600 dark:text-slate-300" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Final Settlement (F&F)</h1>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 rounded-lg">Cancel</button>
          <button type="button" onClick={() => handleSubmit("Draft")} disabled={isSaving} className="px-4 py-2 text-sm font-bold text-white bg-maroon-800 hover:bg-maroon-900 rounded-lg flex items-center shadow-lg transition-all disabled:opacity-50">
            <Save size={16} className="mr-2" /> Save Draft
          </button>
          <button type="button" onClick={() => handleSubmit("Approved")} disabled={isSaving} className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center shadow-lg transition-all disabled:opacity-50">
            <CheckCircle2 size={16} className="mr-2" /> Save & Post
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8 pb-24">
        <section className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Doc Date *</label>
              <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-bold" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Salary Staff *</label>
              <select 
                value={formData.employee} 
                onChange={(e) => setFormData({...formData, employee: e.target.value})}
                className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-bold" required
              >
                <option value="">-- Select Staff --</option>
                {employees.map(emp => (
                  <option key={emp._id} value={emp.name}>{emp.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Last Working Day *</label>
              <input type="date" value={formData.leavingDate} onChange={(e) => setFormData({...formData, leavingDate: e.target.value})} className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-bold" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Reason</label>
              <select value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})} className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-bold">
                <option value="Resignation">Resignation</option>
                <option value="Termination">Termination</option>
                <option value="Retirement">Retirement</option>
                <option value="Contract End">Contract End</option>
              </select>
            </div>
          </div>
        </section>

        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Earnings</h3>
            <button onClick={addEarning} className="p-2 text-white bg-maroon-800 rounded-lg hover:bg-maroon-900 transition-colors">
              <Plus size={16} />
            </button>
          </div>
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50/50">
              <tr>
                <th className="px-6 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-12 text-center">#</th>
                <th className="px-6 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Description</th>
                <th className="px-6 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-40 text-right">Amount</th>
                <th className="px-6 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {earnings.map((e, i) => (
                <tr key={e.id}>
                  <td className="px-6 py-3 text-sm font-bold text-slate-400 dark:text-slate-500 text-center">{i + 1}</td>
                  <td className="px-6 py-3">
                    <input value={e.description} onChange={(val) => updateLine(earnings, setEarnings, e.id, "description", val.target.value)} className="w-full bg-transparent text-sm font-medium focus:outline-none" />
                  </td>
                  <td className="px-6 py-3">
                    <input type="number" value={e.amount} onChange={(val) => updateLine(earnings, setEarnings, e.id, "amount", parseFloat(val.target.value) || 0)} className="w-full bg-transparent text-sm font-black text-right focus:outline-none" />
                  </td>
                  <td className="px-6 py-3 text-center">
                    <button onClick={() => removeEarning(e.id)} className="p-1 text-slate-300 hover:text-rose-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-50 dark:bg-slate-800/50/50 font-black">
                <td colSpan={2} className="px-6 py-4 text-right text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 dark:text-slate-500">Total Earnings:</td>
                <td className="px-6 py-4 text-right text-sm text-emerald-600">{totalEarnings.toLocaleString()}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Deductions</h3>
            <button onClick={addDeduction} className="p-2 text-white bg-maroon-800 rounded-lg hover:bg-maroon-900 transition-colors">
              <Plus size={16} />
            </button>
          </div>
          <table className="w-full text-left">
            <tbody className="divide-y divide-slate-50">
              {deductions.map((d, i) => (
                <tr key={d.id}>
                  <td className="px-6 py-3 text-sm font-bold text-slate-400 dark:text-slate-500 text-center w-12">{i + 1}</td>
                  <td className="px-6 py-3">
                    <input value={d.description} onChange={(val) => updateLine(deductions, setDeductions, d.id, "description", val.target.value)} className="w-full bg-transparent text-sm font-medium focus:outline-none" />
                  </td>
                  <td className="px-6 py-3 w-40">
                    <input type="number" value={d.amount} onChange={(val) => updateLine(deductions, setDeductions, d.id, "amount", parseFloat(val.target.value) || 0)} className="w-full bg-transparent text-sm font-black text-right focus:outline-none" />
                  </td>
                  <td className="px-6 py-3 text-center w-12">
                    <button onClick={() => removeDeduction(d.id)} className="p-1 text-slate-300 hover:text-rose-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-6 bg-maroon-800 text-white flex justify-between items-center">
            <span className="text-lg font-black uppercase tracking-widest underline">Net Payable</span>
            <div className="text-3xl font-black">Rs.{netPayable.toLocaleString()}</div>
        </section>
      </div>
    </div>
  );
}
