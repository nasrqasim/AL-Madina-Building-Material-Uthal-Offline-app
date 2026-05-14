import InventoryChart from "@/components/erp/inventory/InventoryChart";
import ERPPageHeader from "@/components/erp/ui/ERPPageHeader";

export default function InventoryChartPage() {
  return (
    <div className="flex h-full flex-col">
      <ERPPageHeader title="Chart of Inventory" />
      <div className="flex-1 overflow-hidden p-4">
        <InventoryChart />
      </div>
    </div>
  );
}
