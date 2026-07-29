"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import ERPPageHeader from "@/components/erp/ui/ERPPageHeader";
import PaySalaryModal from "@/components/salary/PaySalaryModal";
import {
  ArrowLeft, User, DollarSign, Calendar, CheckCircle2, Clock, AlertCircle,
  CreditCard, TrendingDown, TrendingUp, Wallet, FileText, ChevronDown, ChevronUp
} from "lucide-react";

export default function EmployeeLedgerPage() {
  const params = useParams();
  const router = useRouter();
  const employeeId = params?.id as string;

  const [employee, setEmployee] = useState<any>(null);
  const [salaryPayments, setSalaryPayments] = useState<any[]>([]);
  const [advances, setAdvances] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [loanRepayments, setLoanRepayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  const fetchData = async () => {
    setIsLoading(true);
    try {
      let empData = null;
      try {
        const empRes = await fetch(`/api/employees/${employeeId}`);
        const empJson = await empRes.json();
        if (empJson.ok && empJson.data) empData = empJson.data;
      } catch (_) {}

      setEmployee(empData);

      const targetEmpName = (empData?.name || "").trim().toLowerCase();
      const targetEmpId = empData?._id || empData?.id || employeeId;

      // ── Fetch salary payments from API ──
      const allPayments: any[] = [];
      try {
        const cpRes = await fetch("/api/cash-payments");
        const cpJson = await cpRes.json();
        const allCashPays = cpJson.ok ? (cpJson.data || []) : [];
        allCashPays.forEach((cp: any) => {
          const isSalVoucher = (cp.voucherNo || "").startsWith("SAL-");
          const narration = (cp.narration || cp.notes || "").toLowerCase();
          if (isSalVoucher && targetEmpName && narration.includes(targetEmpName)) {
            if (!allPayments.some((p: any) => p.voucherNo === cp.voucherNo)) {
              allPayments.push({
                id: cp.voucherNo,
                voucherNo: cp.voucherNo,
                employeeId: targetEmpId,
                employeeName: empData?.name || "",
                amount: Number(cp.amount) || 0,
                paymentMethod: "Cash",
                date: cp.date || cp.createdAt,
                remarks: cp.notes || cp.narration || "Salary Payment",
                status: "Paid"
              });
            }
          }
        });
      } catch (_) {}

      setSalaryPayments(allPayments);

      // ── Fetch advances from API ──
      let empAdvances: any[] = [];
      try {
        const advRes = await fetch("/api/salary-advances");
        const advJson = await advRes.json();
        empAdvances = (advJson.ok ? (advJson.data || []) : []).filter((a: any) => {
          const aEmpName = (a.employee || "").trim().toLowerCase();
          return a.employeeId === employeeId || (targetEmpName && aEmpName.includes(targetEmpName));
        });
      } catch (_) {}
      setAdvances(empAdvances);

      // ── Fetch loans from API ──
      let empLoans: any[] = [];
      try {
        const loanRes = await fetch("/api/salary-loans");
        const loanJson = await loanRes.json();
        empLoans = (loanJson.ok ? (loanJson.data || []) : []).filter((l: any) => {
          const lEmpName = (l.employee || "").trim().toLowerCase();
          return l.employeeId === employeeId || (targetEmpName && lEmpName.includes(targetEmpName));
        });
      } catch (_) {}
      setLoans(empLoans);

      // ── Loan repayments ──
      setLoanRepayments([]);

    } catch (e) {
      console.error("Ledger fetchData error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (employeeId) fetchData();
  }, [employeeId]);

  const basicSalary = Number(employee?.basicSalary) || Number(employee?.salary) || 0;

  // Build monthly ledger
  const monthlyLedger = useMemo(() => {
    const months: Record<string, {
      month: string;
      label: string;
      basicSalary: number;
      totalPaid: number;
      remaining: number;
      status: "Fully Paid" | "Partially Paid" | "Unpaid";
      payments: any[];
      advances: any[];
      loans: any[];
      loanRepayments: any[];
    }> = {};

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    // Create entries for all 12 months of selected year
    for (let m = 0; m < 12; m++) {
      const key = `${filterYear}-${String(m + 1).padStart(2, "0")}`;
      months[key] = {
        month: key,
        label: `${monthNames[m]} ${filterYear}`,
        basicSalary,
        totalPaid: 0,
        remaining: basicSalary,
        status: "Unpaid",
        payments: [],
        advances: [],
        loans: [],
        loanRepayments: [],
      };
    }

    // Map salary payments to months
    salaryPayments.forEach(p => {
      const d = p.date || p.createdAt || "";
      const dt = new Date(d);
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
      if (months[key]) {
        months[key].payments.push(p);
        months[key].totalPaid += Number(p.amount) || 0;
      }
    });

    // Map advances to months
    advances.forEach(a => {
      const d = a.date || a.createdAt || "";
      const dt = new Date(d);
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
      if (months[key]) months[key].advances.push(a);
    });

    // Map loans to months
    loans.forEach(l => {
      const d = l.date || l.createdAt || "";
      const dt = new Date(d);
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
      if (months[key]) months[key].loans.push(l);
    });

    // Map loan repayments to months
    loanRepayments.forEach(r => {
      const d = r.date || r.createdAt || "";
      const dt = new Date(d);
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
      if (months[key]) months[key].loanRepayments.push(r);
    });

    // Calculate remaining and status
    Object.values(months).forEach(m => {
      m.remaining = Math.max(0, m.basicSalary - m.totalPaid);
      if (m.totalPaid > 0 && (m.totalPaid >= m.basicSalary || m.basicSalary === 0)) {
        m.status = "Fully Paid";
      } else if (m.totalPaid > 0) {
        m.status = "Partially Paid";
      } else {
        m.status = "Unpaid";
      }
    });

    return Object.values(months).sort((a, b) => b.month.localeCompare(a.month));
  }, [salaryPayments, advances, loans, loanRepayments, basicSalary, filterYear]);

  // Summary stats
  const totalSalaryPaid = salaryPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const totalAdvances = advances.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
  const totalLoans = loans.reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
  const totalLoanRepaid = loanRepayments.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const outstandingLoan = totalLoans - totalLoanRepaid;

  const statusColors: Record<string, string> = {
    "Fully Paid": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    "Partially Paid": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    "Unpaid": "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
  };

  const statusIcons: Record<string, any> = {
    "Fully Paid": <CheckCircle2 size={14} className="text-emerald-500" />,
    "Partially Paid": <Clock size={14} className="text-amber-500" />,
    "Unpaid": <AlertCircle size={14} className="text-slate-400" />,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-10 h-10 border-4 border-maroon-800 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <AlertCircle size={48} className="text-rose-500" />
        <p className="text-slate-500 font-bold">Employee not found</p>
        <button onClick={() => router.back()} className="px-4 py-2 bg-maroon-800 text-white rounded-xl font-bold">Go Back</button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
        >
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white tracking-tight">
            Employee Ledger
          </h1>
          <p className="text-xs text-slate-400 font-medium">View complete salary, advance & loan history</p>
        </div>
      </div>

      {/* Employee Profile Card */}
      <div className="bg-gradient-to-br from-maroon-800 via-maroon-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
              <User size={28} className="text-white/80" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-wide">{employee.name}</h2>
              <p className="text-xs text-white/60 font-bold">{employee.code || "—"} • {employee.designation || "Staff"} {employee.department ? `• ${employee.department}` : ""}</p>
              <p className="text-xs text-white/40 font-medium mt-0.5">
                {employee.phone ? `📞 ${employee.phone}` : ""} {employee.cnic ? `• 🪪 ${employee.cnic}` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10 text-center">
              <p className="text-[10px] text-white/50 font-black uppercase tracking-widest">Basic Salary</p>
              <p className="text-xl font-black font-mono">PKR {basicSalary.toLocaleString()}</p>
            </div>
            <button
              onClick={() => setIsPayModalOpen(true)}
              className="px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-lg flex items-center gap-2"
            >
              <DollarSign size={16} /> Pay Salary
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center">
              <DollarSign size={16} className="text-emerald-600" />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Salary Paid</span>
          </div>
          <p className="text-lg font-black text-emerald-700 dark:text-emerald-400 font-mono">PKR {totalSalaryPaid.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-amber-50 dark:bg-amber-900/20 rounded-lg flex items-center justify-center">
              <TrendingDown size={16} className="text-amber-600" />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Advances</span>
          </div>
          <p className="text-lg font-black text-amber-700 dark:text-amber-400 font-mono">PKR {totalAdvances.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-rose-50 dark:bg-rose-900/20 rounded-lg flex items-center justify-center">
              <CreditCard size={16} className="text-rose-600" />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Loans</span>
          </div>
          <p className="text-lg font-black text-rose-700 dark:text-rose-400 font-mono">PKR {totalLoans.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <TrendingUp size={16} className="text-blue-600" />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loan Outstanding</span>
          </div>
          <p className="text-lg font-black text-blue-700 dark:text-blue-400 font-mono">PKR {Math.max(0, outstandingLoan).toLocaleString()}</p>
        </div>
      </div>

      {/* Year Filter */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-3 shadow-sm">
        <h3 className="text-sm font-black text-slate-700 dark:text-white flex items-center gap-2">
          <Calendar size={16} /> Monthly Salary Ledger
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterYear(y => y - 1)}
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg text-xs font-black transition-colors"
          >
            ◀
          </button>
          <span className="text-sm font-black text-maroon-800 dark:text-maroon-400 min-w-[60px] text-center">{filterYear}</span>
          <button
            onClick={() => setFilterYear(y => y + 1)}
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg text-xs font-black transition-colors"
          >
            ▶
          </button>
        </div>
      </div>

      {/* Monthly Ledger */}
      <div className="space-y-2">
        {monthlyLedger.map(m => {
          const isExpanded = expandedMonth === m.month;
          const hasActivity = m.payments.length > 0 || m.advances.length > 0 || m.loans.length > 0 || m.loanRepayments.length > 0;
          const paidPercent = basicSalary > 0 ? Math.min(100, (m.totalPaid / basicSalary) * 100) : 0;

          return (
            <div
              key={m.month}
              className={`bg-white dark:bg-slate-900 border rounded-2xl shadow-sm overflow-hidden transition-all ${
                hasActivity ? "border-slate-200 dark:border-slate-700" : "border-slate-100 dark:border-slate-800 opacity-70"
              }`}
            >
              {/* Month Row */}
              <button
                onClick={() => setExpandedMonth(isExpanded ? null : m.month)}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center">
                    <Calendar size={18} className="text-slate-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-black text-slate-800 dark:text-white">{m.label}</p>
                    <p className="text-[10px] text-slate-400 font-bold">
                      {m.payments.length} payment{m.payments.length !== 1 ? "s" : ""}
                      {m.advances.length > 0 && ` • ${m.advances.length} advance${m.advances.length !== 1 ? "s" : ""}`}
                      {m.loans.length > 0 && ` • ${m.loans.length} loan${m.loans.length !== 1 ? "s" : ""}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Progress bar */}
                  <div className="hidden md:flex items-center gap-2 w-40">
                    <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          paidPercent >= 100 ? "bg-emerald-500" : paidPercent > 0 ? "bg-amber-500" : "bg-slate-200"
                        }`}
                        style={{ width: `${paidPercent}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 w-10 text-right">{Math.round(paidPercent)}%</span>
                  </div>

                  <div className="text-right min-w-[100px]">
                    <p className="text-sm font-black text-slate-800 dark:text-white font-mono">
                      PKR {m.totalPaid.toLocaleString()}
                    </p>
                    {m.remaining > 0 && basicSalary > 0 && (
                      <p className="text-[10px] text-rose-500 font-bold">
                        -{m.remaining.toLocaleString()} remaining
                      </p>
                    )}
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1 ${statusColors[m.status]}`}>
                    {statusIcons[m.status]} {m.status}
                  </span>

                  {hasActivity && (
                    isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />
                  )}
                </div>
              </button>

              {/* Expanded Details */}
              {isExpanded && hasActivity && (
                <div className="border-t border-slate-100 dark:border-slate-800 px-5 py-4 space-y-4 bg-slate-50/50 dark:bg-slate-800/20">
                  {/* Salary Payments */}
                  {m.payments.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                        <DollarSign size={12} /> Salary Payments
                      </h4>
                      <div className="space-y-1.5">
                        {m.payments.map((p: any, i: number) => (
                          <div key={i} className="flex items-center justify-between bg-white dark:bg-slate-900 rounded-xl px-4 py-2.5 border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center">
                                <CheckCircle2 size={14} className="text-emerald-500" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{p.remarks || "Salary Payment"}</p>
                                <p className="text-[10px] text-slate-400">{p.date || "—"} • {p.paymentMethod || "Cash"} {p.voucherNo ? `• ${p.voucherNo}` : ""}</p>
                              </div>
                            </div>
                            <p className="text-sm font-black text-emerald-700 dark:text-emerald-400 font-mono">PKR {(Number(p.amount) || 0).toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Advances */}
                  {m.advances.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                        <Wallet size={12} /> Advances Taken
                      </h4>
                      <div className="space-y-1.5">
                        {m.advances.map((a: any, i: number) => (
                          <div key={i} className="flex items-center justify-between bg-white dark:bg-slate-900 rounded-xl px-4 py-2.5 border border-amber-100 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 bg-amber-50 dark:bg-amber-900/20 rounded-lg flex items-center justify-center">
                                <TrendingDown size={14} className="text-amber-500" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Advance - {a.notes || a.deductionMonth || "—"}</p>
                                <p className="text-[10px] text-slate-400">{a.date || "—"} • {a.status} • {a.paidFrom || "Cash"}</p>
                              </div>
                            </div>
                            <p className="text-sm font-black text-amber-700 dark:text-amber-400 font-mono">PKR {(Number(a.amount) || 0).toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Loans */}
                  {m.loans.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                        <CreditCard size={12} /> Loans Taken
                      </h4>
                      <div className="space-y-1.5">
                        {m.loans.map((l: any, i: number) => (
                          <div key={i} className="flex items-center justify-between bg-white dark:bg-slate-900 rounded-xl px-4 py-2.5 border border-rose-100 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 bg-rose-50 dark:bg-rose-900/20 rounded-lg flex items-center justify-center">
                                <CreditCard size={14} className="text-rose-500" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Loan - {l.installments} installments @ {(Number(l.monthlyDeduction) || 0).toLocaleString()}/mo</p>
                                <p className="text-[10px] text-slate-400">{l.date || "—"} • {l.status} • {l.paidFrom || "Cash"}</p>
                              </div>
                            </div>
                            <p className="text-sm font-black text-rose-700 dark:text-rose-400 font-mono">PKR {(Number(l.amount) || 0).toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Loan Repayments */}
                  {m.loanRepayments.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                        <TrendingUp size={12} /> Loan Repayments
                      </h4>
                      <div className="space-y-1.5">
                        {m.loanRepayments.map((r: any, i: number) => (
                          <div key={i} className="flex items-center justify-between bg-white dark:bg-slate-900 rounded-xl px-4 py-2.5 border border-blue-100 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                                <TrendingUp size={14} className="text-blue-500" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Loan Repayment</p>
                                <p className="text-[10px] text-slate-400">{r.date || "—"} • {r.paymentMethod || "Cash"}</p>
                              </div>
                            </div>
                            <p className="text-sm font-black text-blue-700 dark:text-blue-400 font-mono">+PKR {(Number(r.amount) || 0).toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Full Ledger Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-black text-slate-700 dark:text-white flex items-center gap-2">
            <FileText size={16} /> Complete Transaction Ledger
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Description</th>
                <th className="px-4 py-3 text-right">Debit (Paid Out)</th>
                <th className="px-4 py-3 text-right">Credit (Received)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {[
                ...salaryPayments.map(p => ({
                  date: p.date || p.createdAt || "",
                  type: "Salary",
                  desc: p.remarks || "Salary Payment",
                  debit: Number(p.amount) || 0,
                  credit: 0,
                  color: "emerald",
                })),
                ...advances.map(a => ({
                  date: a.date || a.createdAt || "",
                  type: "Advance",
                  desc: `Advance - ${a.notes || a.deductionMonth || ""}`,
                  debit: Number(a.amount) || 0,
                  credit: 0,
                  color: "amber",
                })),
                ...loans.map(l => ({
                  date: l.date || l.createdAt || "",
                  type: "Loan",
                  desc: `Loan - ${l.installments || 0} installments`,
                  debit: Number(l.amount) || 0,
                  credit: 0,
                  color: "rose",
                })),
                ...loanRepayments.map(r => ({
                  date: r.date || r.createdAt || "",
                  type: "Loan Repayment",
                  desc: r.remarks || "Loan Repayment",
                  debit: 0,
                  credit: Number(r.amount) || 0,
                  color: "blue",
                })),
              ]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((tx, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-600 dark:text-slate-400">{tx.date ? new Date(tx.date).toLocaleDateString() : "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black bg-${tx.color}-100 text-${tx.color}-700 dark:bg-${tx.color}-900/20 dark:text-${tx.color}-400`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300">{tx.desc}</td>
                    <td className="px-4 py-3 text-right font-black font-mono text-rose-600">
                      {tx.debit > 0 ? `PKR ${tx.debit.toLocaleString()}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-black font-mono text-emerald-600">
                      {tx.credit > 0 ? `PKR ${tx.credit.toLocaleString()}` : "—"}
                    </td>
                  </tr>
                ))}
              {salaryPayments.length === 0 && advances.length === 0 && loans.length === 0 && loanRepayments.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-400 font-medium">No transactions found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pay Salary Modal */}
      <PaySalaryModal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        staffList={employee ? [employee] : []}
        onSuccess={() => { setIsPayModalOpen(false); fetchData(); }}
        preselectedStaff={employee}
      />
    </div>
  );
}
