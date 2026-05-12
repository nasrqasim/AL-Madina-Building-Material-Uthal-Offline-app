"use client";

import ReportLayout from "@/components/erp/reports/ReportLayout";
import { useParams } from "next/navigation";

export default function GenericReportPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  // Format slug to Title Case
  const title = slug.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");

  const columns = [
    { header: "Date", accessor: "date" },
    { header: "Reference", accessor: "ref" },
    { header: "Account/Item", accessor: "name" },
    { header: "Description", accessor: "desc" },
    { header: "Amount", accessor: "amount", render: (val: number) => val?.toLocaleString() || "0" },
  ];

  const data: any[] = []; // Empty state for now

  return (
    <ReportLayout 
      title={title} 
      subtitle={`Viewing ${title}`}
      columns={columns} 
      data={data} 
    />
  );
}
