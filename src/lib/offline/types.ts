/** Offline ERP entity types — mirrors MongoDB models with string IDs */

export type UserRole = "superadmin" | "admin" | "salesman" | "dataentry" | "sales_user";

export interface Timestamps {
  createdAt: string;
  updatedAt: string;
}

export interface UserRecord extends Timestamps {
  id: string;
  _id?: string;
  name: string;
  email: string;
  username: string;
  password: string;
  role: UserRole;
  financialYear: string;
  isActive: boolean;
}

export interface CategoryRecord extends Timestamps {
  id: string;
  _id?: string;
  name: string;
  code?: string;
  type: "main" | "sub";
  parentId?: string | null;
  defaultUnit?: string;
}

export interface BrandRecord extends Timestamps {
  id: string;
  _id?: string;
  name: string;
  code?: string;
  categoryId?: string;
}

export interface UnitRecord extends Timestamps {
  id: string;
  _id?: string;
  name: string;
  code?: string;
  symbol?: string;
}

export interface ItemRecord extends Timestamps {
  id: string;
  _id?: string;
  code: string;
  name: string;
  mainCategoryId?: string;
  subCategoryId?: string;
  brandId?: string;
  model?: string;
  color?: string;
  design?: string;
  size?: string;
  thickness?: string;
  length?: string;
  width?: string;
  weight?: string;
  grade?: string;
  pattern?: string;
  finish?: string;
  quality?: string;
  unit?: string;
  saleUnits?: string[];
  hsCode?: string;
  barcode?: string;
  qrCode?: string;
  location?: string;
  rack?: string;
  godown?: string;
  warehouse?: string;
  purchaseRate: number;
  wholesaleRate: number;
  retailRate: number;
  dealerRate?: number;
  contractRate?: number;
  discount?: number;
  taxPercent?: number;
  openingStock?: number;
  stockQty: number;
  reservedStock?: number;
  damagedStock?: number;
  reorderLevel: number;
  maxStock?: number;
  images?: string[];
  remarks?: string;
  litersInCtn?: number;
  gallonsInCtn?: number;
  stockQtyCartons?: number;
}

export interface PartyRecord extends Timestamps {
  id: string;
  _id?: string;
  name: string;
  companyName?: string;
  contactPerson?: string;
  email?: string;
  code: string;
  type: "Customer" | "Vendor";
  address?: string;
  region?: string;
  area?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  phone?: string;
  mobile?: string;
  ntn?: string;
  strn?: string;
  gst?: string;
  balance: number;
  creditLimit: number;
  creditDays?: number;
  openingBalance: number;
  debit: number;
  credit: number;
  manualDebit?: number;
  manualCredit?: number;
  category?: string;
  vendorType?: string;
  bankName?: string;
  accountNo?: string;
  branch?: string;
  paymentTerms?: number;
  whtApplicable?: boolean;
  status?: string;
  isActive?: boolean;
  notes?: string;
  advanceBalance?: number;
  payable?: number;
  totalPurchase?: number;
  totalPaid?: number;
  lastPurchaseDate?: string;
  lastPaymentDate?: string;
}

export interface InvoiceLineRecord {
  itemId?: string;
  description?: string;
  qty?: number;
  cartons?: number;
  liters?: number;
  gallons?: number;
  unit?: string;
  priceType?: "retail" | "wholesale" | "dealer" | "contract";
  rate?: number;
  ratePerCarton?: number;
  grossAmount?: number;
  discountPercent?: number;
  taxPercent?: number;
  netAmount?: number;
  foreignNetAmount?: number;
  isReceived?: boolean;
  deliveredQty?: number;
  pendingQty?: number;
  orderedQty?: number;
  deliveryDate?: string;
  deliveryRemarks?: string;
}

export type InvoiceType =
  | "sale"
  | "sale_return"
  | "purchase"
  | "purchase_return"
  | "quotation"
  | "purchase_order"
  | "grn"
  | "challan"
  | "sale_order"
  | "pos"
  | "non_tax_sale"
  | "non_tax_purchase"
  | "non_tax_sale_return"
  | "non_tax_purchase_return"
  | "import_purchase"
  | "draft";

export type DeliveryStatus =
  | "draft"
  | "pending"
  | "reserved"
  | "pending_delivery"
  | "partially_delivered"
  | "completed"
  | "fully_delivered"
  | "posted"
  | "cancelled";

export interface InvoiceRecord extends Timestamps {
  id: string;
  _id?: string;
  invoiceNo: string;
  type: InvoiceType;
  paymentMethod?: "Cash" | "Card" | "Credit" | "Bank";
  date: string;
  dueDate?: string;
  partyId?: string;
  paymentTerms?: string;
  employeeId?: string;
  jobId?: string;
  locationId?: string;
  toLocationId?: string;
  reference?: string;
  vendorInvNo?: string;
  vendorInvoiceDate?: string;
  linkToGRN?: string;
  linkToPO?: string;
  exchangeRate?: number;
  balance?: number;
  currency?: string;
  regNo?: string;
  startKms?: number;
  endKms?: number;
  rangeKms?: number;
  isCreditBill?: boolean;
  linkedInvoiceId?: string;
  lines: InvoiceLineRecord[];
  subTotal?: number;
  discountAmount?: number;
  taxAmount?: number;
  whtPercent?: number;
  whtAmount?: number;
  totalAmount?: number;
  amountReceived?: number;
  paymentAccountId?: string;
  notes?: string;
  useAdvance?: boolean;
  advanceAmountUsed?: number;
  deliveryStatus?: DeliveryStatus;
  status?: string;
}

export interface AccountRecord extends Timestamps {
  id: string;
  _id?: string;
  code: string;
  title: string;
  type: "cash" | "bank" | "expense" | "receivable" | "payable" | "income" | "equity" | "asset";
  openingBalance: number;
  currentBalance?: number;
}

export interface JournalEntryRecord extends Timestamps {
  id: string;
  date: string;
  invoiceId?: string;
  voucherNo?: string;
  accountCode: string;
  accountTitle: string;
  debit: number;
  credit: number;
  remarks?: string;
  partyId?: string;
  partyType?: string;
}

export interface CashReceiptRecord extends Timestamps {
  id: string;
  receiptNumber: string;
  receiptType?: "party" | "petty" | "multi";
  date: string;
  partyId?: string;
  cashAccountId?: string;
  cashAccountTitle?: string;
  reference?: string;
  narration?: string;
  employeeId?: string;
  jobId?: string;
  amount: number;
  whtAmount?: number;
  netAmount?: number;
  notes?: string;
  status?: string;
  partyReceiptType?: "Standard" | "Advance" | "Deposit" | "Extra Cash";
  contraLines?: { accountId?: string; accountTitle?: string; description?: string; amount?: number }[];
  partyLines?: { partyId?: string; partyName?: string; amount?: number; invoiceRef?: string }[];
}

export interface CashPaymentRecord extends Timestamps {
  id: string;
  voucherNo: string;
  date: string;
  partyId?: string;
  vendor?: string;
  cashAccountId?: string;
  amount: number;
  wht?: number;
  netPaid?: number;
  reference?: string;
  narration?: string;
  notes?: string;
  status?: string;
  isRefund?: boolean;
  partyPaymentType?: string;
}

export interface BankReceiptRecord extends Timestamps {
  id: string;
  receiptNumber: string;
  date: string;
  party?: string;
  partyId?: string;
  bankId?: string;
  amount: number;
  instrumentNo?: string;
  status?: string;
  narration?: string;
}

export interface BankPaymentRecord extends Timestamps {
  id: string;
  voucherNo: string;
  date: string;
  vendor?: string;
  partyId?: string;
  bankId?: string;
  amount: number;
  instrumentNo?: string;
  status?: string;
  narration?: string;
}

export interface ShopProfileRecord extends Timestamps {
  id: string;
  companyName: string;
  tradeName?: string;
  address?: string;
  city?: string;
  province?: string;
  country?: string;
  postalCode?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  website?: string;
  ntn?: string;
  gstRegistration?: string;
  stn?: string;
  fiscalYearStart?: string;
  currency?: string;
  logo?: string;
  amountDecimalPlaces?: string;
  quantityDecimalPlaces?: string;
}

export interface DeliveryOrderRecord extends Timestamps {
  id: string;
  deliveryNo: string;
  invoiceId: string;
  invoiceNo: string;
  partyId?: string;
  date: string;
  lines: InvoiceLineRecord[];
  status: DeliveryStatus;
  notes?: string;
}

export interface ActivityLogRecord extends Timestamps {
  id: string;
  userId?: string;
  action: string;
  module: string;
  details?: string;
  entityId?: string;
}

export interface BackupHistoryRecord extends Timestamps {
  id: string;
  filename: string;
  size: number;
  recordCount: number;
  type: "manual" | "auto";
}

export interface SettingRecord extends Timestamps {
  id: string;
  key: string;
  value: unknown;
}

export interface OfflineSession {
  id: string;
  name: string;
  role: UserRole;
  financialYear: string;
  username: string;
}

export function toMongoShape<T extends { id: string }>(record: T): T & { _id: string } {
  return { ...record, _id: record.id };
}

export function toMongoList<T extends { id: string }>(records: T[]): (T & { _id: string })[] {
  return records.map(toMongoShape);
}

export interface DraftRecord {
  id?: number;
  module: string;
  data: any;
  createdAt: string;
}

export interface SyncQueueRecord {
  id?: number;
  endpoint: string;
  method: string;
  payload: any;
  status: string;
  retries: number;
  lastError?: string;
  createdAt: string;
}

export interface LocationRecord extends Timestamps {
  id: string;
  _id?: string;
  name: string;
  address?: string;
  isDefault?: boolean;
}

export interface EmployeeRecord extends Timestamps {
  id: string;
  _id?: string;
  code?: string;
  name: string;
  cnic?: string;
  phone?: string;
  email?: string;
  city?: string;
  address?: string;
  designation?: string;
  department?: string;
  grade?: string;
  joiningDate?: string;
  employmentStatus?: string;
  basicSalary?: number;
  salary?: number;
  bankName?: string;
  accountNo?: string;
  iban?: string;
  ntn?: string;
  eobi?: string;
  sessi?: string;
  providentFund?: string;
  status?: string;
  isActive?: boolean;
}

export interface BankRecord extends Timestamps {
  id: string;
  _id?: string;
  code?: string;
  name: string;
  accountNo?: string;
  accountTitle?: string;
  type?: string;
  balance?: number;
  branch?: string;
  status?: string;
  isDefault?: boolean;
}

export interface OtherIncomeRecord extends Timestamps {
  id: string;
  _id?: string;
  title: string;
  description: string;
  amount: number;
  incomeType: "Monthly" | "Yearly" | "One Time";
  paymentMethod: "Cash" | "Bank" | "Online";
  reference: string;
  date: string;
}

export interface ExpenseRecord extends Timestamps {
  id: string;
  _id?: string;
  voucherNo: string;
  date: string;
  category: string;
  expenseType: string;
  name: string;
  description?: string;
  paidFrom: "Cash" | "Bank";
  bankAccount?: string;
  amount: number;
  referenceNo?: string;
  notes?: string;
  attachment?: string;
  status: "Paid" | "Unpaid" | "Partial" | "Draft";
}

export interface SalaryAdvanceRecord extends Timestamps {
  id: string;
  _id?: string;
  voucherNo: string;
  date: string;
  employeeId?: string;
  employee: string;
  department?: string;
  amount: number;
  deductionMonth: string;
  status: "Paid" | "Approved" | "Pending";
  notes?: string;
  paidFrom?: "Cash" | "Bank";
}

export interface SalaryLoanRecord extends Timestamps {
  id: string;
  _id?: string;
  voucherNo: string;
  date: string;
  employeeId?: string;
  employee: string;
  department?: string;
  amount: number;
  installments: number;
  monthlyDeduction: number;
  status: "Active" | "Completed" | "Pending";
  notes?: string;
  paidFrom?: "Cash" | "Bank";
}

export interface PayrollRunRecord extends Timestamps {
  id: string;
  _id?: string;
  voucherNo: string;
  month: string;
  date: string;
  workingDays: number;
  staff: any[];
  totalAmount: number;
  status: "posted" | "draft";
  notes?: string;
}

export interface FinalSettlementRecord extends Timestamps {
  id: string;
  _id?: string;
  voucherNo: string;
  date: string;
  employeeId?: string;
  employee: string;
  leavingDate: string;
  grossPay: number;
  deductions: number;
  netPayable: number;
  status: "Paid" | "Approved" | "Pending";
  notes?: string;
  paidFrom?: "Cash" | "Bank";
}

