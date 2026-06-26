export type UserRole = "superadmin" | "admin" | "salesman" | "dataentry" | "sales_user";

export type FinancialYear = string;

export interface ERPNavItem {
  title: string;
  href: string;
  roles: UserRole[];
  icon?: any;
  submenu?: ERPNavItem[];
}

export interface SalesInvoiceLineInput {
  itemId: string;
  cartons: number;
  liters: number;
  gallons: number;
  ratePerCarton: number;
  discountPercent?: number;
}
