"use client";

import ReportLayout from "@/components/erp/reports/ReportLayout";

export default function SaleSummaryPage() {
  const columns = [
    { header: "Date", accessor: "date" },
    { header: "Customer", accessor: "customer" },
    { header: "Invoice #", accessor: "invoiceNo" },
    { header: "Total Amount", accessor: "total", render: (val: number) => val.toLocaleString() },
    { header: "Discount", accessor: "discount", render: (val: number) => val.toLocaleString() },
    { header: "Net Amount", accessor: "net", render: (val: number) => val.toLocaleString() },
  ];

  const data = [
    { date: "2024-04-29", customer: "John Doe", invoiceNo: "SI-2024-001", total: 15000, discount: 500, net: 14500 },
    { date: "2024-04-29", customer: "Jane Smith", invoiceNo: "SI-2024-002", total: 25000, discount: 1000, net: 24000 },
  ];

  return (
    <ReportLayout 
      title="Sale Summary" 
      subtitle="Summary of all sales transactions"
      columns={columns} 
      data={data} 
    />
  );
}
