"use client";

import ERPPageHeader from "@/components/erp/ui/ERPPageHeader";
import COATreeView from "@/components/erp/maintain/COATreeView";
import { Download, FileText, Printer, FileSpreadsheet } from "lucide-react";
import { exportToExcel, downloadTemplate, printPage, triggerFileInput, importFromExcel } from "@/lib/excel";

export default function AccountsPage() {
  const handleImport = async () => {
    const file = await triggerFileInput();
    if (file) {
      const data = await importFromExcel(file);
      console.log("Imported Data:", data);
      alert("Data imported successfully!");
    }
  };

  return (
    <div className="space-y-6">
      <ERPPageHeader 
        title="Chart of Accounts" 
        description="Manage your organizational account hierarchy and financial structure."
        actions={[
          { label: "Print", onClick: printPage, icon: Printer },
          { label: "Export Excel", onClick: () => exportToExcel([], "ChartOfAccounts.xlsx"), icon: FileSpreadsheet },
          { label: "Download Template", onClick: () => downloadTemplate(["Code", "Name", "Type", "Balance"], "ChartOfAccountsTemplate.xlsx"), icon: Download },
          { label: "Import Excel", onClick: handleImport, icon: FileText },
        ]}
      />
      <COATreeView />
    </div>
  );
}
