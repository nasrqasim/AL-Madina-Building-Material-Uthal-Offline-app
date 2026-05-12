"use client";

import { useState, useEffect } from "react";
import ERPPageHeader from "@/components/erp/ui/ERPPageHeader";
import ERPDataTable from "@/components/erp/ui/ERPDataTable";
import JobModal from "@/components/erp/maintain/JobModal";
import { Plus, Briefcase, Calendar, DollarSign, Search, Edit2, Trash2, Clock, CheckCircle2, FileText, Download, Printer, FileSpreadsheet } from "lucide-react";
import ERPStatCard from "@/components/erp/ui/ERPStatCard";
import { exportToExcel, downloadTemplate, printPage, triggerFileInput, importFromExcel } from "@/lib/excel";

export default function JobsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/jobs");
      const json = await res.json();
      if (json.ok) setJobs(json.data);
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchJobs(); }, []);

  const handleAdd = () => { setSelectedJob(null); setIsModalOpen(true); };

  const handleImport = async () => {
    const file = await triggerFileInput();
    if (file) {
      const data = await importFromExcel(file);
      for (const row of data) {
        await fetch("/api/jobs", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: row["Code"] || row.code || `JOB-${Date.now()}`,
            name: row["Name"] || row.name || "Unknown",
            customer: row["Customer"] || row.customer || "",
            startDate: row["Start Date"] || row.startDate || "",
            endDate: row["End Date"] || row.endDate || "",
            budget: parseFloat(row["Budget"] || row.budget || "0"),
            status: row["Status"] || row.status || "Active",
          }),
        });
      }
      fetchJobs();
    }
  };

  const handleEdit = (job: any) => { setSelectedJob(job); setIsModalOpen(true); };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this job/project?")) {
      try {
        const res = await fetch(`/api/jobs/${id}`, { method: "DELETE" });
        if (!res.ok) {
          const json = await res.json();
          throw new Error(json.message || "Failed to delete job");
        }
        fetchJobs();
      } catch (e) {
        console.error(e);
        alert((e as Error).message);
      }
    }
  };

  const handleSave = async (data: any) => {
    try {
      const url = selectedJob?._id ? `/api/jobs/${selectedJob._id}` : "/api/jobs";
      const method = selectedJob?._id ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedJob?._id ? data : { ...data, code: data.code || `JOB-${Date.now()}` }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to save job");
      
      fetchJobs();
      setIsModalOpen(false);
    } catch (e) {
      console.error(e);
      alert((e as Error).message);
    }
  };

  const columns = [
    { header: "Job Code", accessor: "code", render: (val: string) => <span className="px-2 py-1 bg-rose-50 text-rose-600 rounded text-[10px] font-black uppercase tracking-widest">{val}</span> },
    { header: "Job Name", accessor: "name", render: (val: string) => <span className="font-black text-slate-900 dark:text-white">{val}</span> },
    { header: "Customer", accessor: "customer", render: (val: string) => <span className="text-slate-400 dark:text-slate-500 font-bold">{val || "-"}</span> },
    { header: "Duration", accessor: "startDate", render: (val: string, row: any) => (
      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-bold">
        <Calendar size={14} className="text-slate-300" />
        <span className="text-[10px]">{val} → {row.endDate}</span>
      </div>
    )},
    { header: "Budget", accessor: "budget", render: (val: number) => <span className="text-sm font-black text-slate-900 dark:text-white">Rs.{(val||0).toLocaleString()}</span> },
    { header: "Status", accessor: "status", render: (val: string) => <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${val === "Active" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>{val}</span> },
  ];

  return (
    <div className="space-y-6">
      <ERPPageHeader title="Jobs / Projects" subtitle="Master Data / Jobs"
        actions={[
          { label: "Print", onClick: printPage, icon: Printer },
          { label: "Export", onClick: () => exportToExcel(jobs, "Jobs.xlsx"), icon: FileSpreadsheet },
          { label: "Download Template", onClick: () => downloadTemplate(["Code", "Name", "Customer", "Start Date", "End Date", "Budget", "Status"], "JobsTemplate.xlsx"), icon: Download },
          { label: "Import", onClick: handleImport, icon: FileText },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-6">
          <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl"><Briefcase size={24} /></div>
          <div>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">{jobs.length}</h4>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Total Jobs</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-6">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl"><Clock size={24} /></div>
          <div>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">{jobs.filter(j => j.status === "Active").length}</h4>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Active</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-6">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl"><CheckCircle2 size={24} /></div>
          <div>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">{jobs.filter(j => j.status === "Completed").length}</h4>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Completed</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-6">
          <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl"><DollarSign size={24} /></div>
          <div>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">Rs.{(jobs.reduce((acc, j) => acc + (j.budget||0), 0) / 1000).toFixed(1)}k</h4>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Total Budget</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
            <input type="text" placeholder="Search jobs..." className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-maroon-800/5 transition-all" />
          </div>
          <button onClick={handleAdd} className="flex items-center gap-2 px-8 py-3 bg-maroon-800 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-maroon-900 transition-all shadow-lg shadow-maroon-800/20">
            <Plus size={18} /> New Job
          </button>
        </div>
        <ERPDataTable columns={columns} data={jobs}
          actions={[
            { label: "Edit", onClick: handleEdit, icon: Edit2 },
            { label: "Delete", onClick: (row: any) => handleDelete(row._id), icon: Trash2, variant: "danger" },
          ]}
        />
      </div>

      <JobModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} job={selectedJob} onSave={handleSave} />
    </div>
  );
}
