// In-Memory Store for Muslim Construction ERP
// Production-Ready Interconnected Financial Ledgers, Bank Accounts, Customers & Roznamcha

import fs from "fs";
import path from "path";

export interface CustomerData {
  Id: number;
  Name: string;
  Phone?: string;
  Address?: string;
  Email?: string;
  NTN?: string;
  BalanceDue: number;
  Advance: number;
  CreatedAt: string;
  UpdatedAt: string;
  IsDeleted?: boolean;
}

export interface SupplierData {
  Id: number;
  Name: string;
  Phone?: string;
  Address?: string;
  Email?: string;
  NTN?: string;
  BalanceDue: number;
  Advance: number;
  CreatedAt: string;
  UpdatedAt: string;
  IsDeleted?: boolean;
}

export interface ProductData {
  Id: number;
  Name: string;
  Category?: string;
  Unit?: string;
  SalePrice: number;
  PurchasePrice: number;
  StockQuantity: number;
  LowStockAlert: number;
  CreatedAt: string;
  UpdatedAt: string;
  IsDeleted?: boolean;
}

export interface SalesInvoiceData {
  Id: number;
  InvoiceNumber: string;
  Date: string;
  CustomerId?: number;
  Customer?: { Name: string };
  PaymentMode?: string;
  SubTotal: number;
  Discount: number;
  Tax: number;
  GrandTotal: number;
  PaidAmount: number;
  Remarks?: string;
  Lines?: any[];
}

export interface PurchaseInvoiceData {
  Id: number;
  InvoiceNumber: string;
  Date: string;
  SupplierId?: number;
  Supplier?: { Name: string };
  PaymentMode?: string;
  SubTotal: number;
  DiscountAmount?: number;
  Discount?: number;
  TaxAmount?: number;
  Tax?: number;
  GrandTotal: number;
  PaidAmount: number;
  Remarks?: string;
  Lines?: any[];
}

export interface ExpenseData {
  Id: number;
  Date: string;
  Category: string;
  PaymentMode: string;
  Amount: number;
  Remarks?: string;
}

export interface StaffData {
  Id: number;
  Name: string;
  Designation: string;
  Department: string;
  ContactNumber: string;
  Address?: string;
  Cnic: string;
  Salary: number;
  Advance?: number;
  IsActive: boolean;
}

export interface BankAccountData {
  Id: number;
  BankName: string;
  AccountTitle: string;
  AccountNumber: string;
  BranchName?: string;
  OpeningBalance: number;
  CurrentBalance: number;
  Status: "Active" | "Inactive";
  Description?: string;
}

export interface CashTransactionData {
  Id: number;
  Date: string;
  VoucherNumber: string;
  Description: string;
  Reference?: string;
  TransactionType: string;
  CashIn: number;
  CashOut: number;
  RunningBalance: number;
}

export interface BankTransactionData {
  Id: number;
  BankAccountId: number;
  Date: string;
  VoucherNumber: string;
  Description: string;
  TransactionType: string;
  BankIn: number;
  BankOut: number;
  RunningBalance: number;
  Reference?: string;
}

export interface CustomerLedgerEntry {
  Id: number;
  CustomerId: number;
  Date: string;
  VoucherNumber: string;
  TripRef?: string;
  Description: string;
  Debit: number;
  Credit: number;
  RunningBalance: number;
  PaymentMethod?: string;
}

export interface SupplierLedgerEntry {
  Id: number;
  SupplierId: number;
  Date: string;
  VoucherNumber: string;
  Description: string;
  Debit: number;
  Credit: number;
  RunningBalance: number;
  PaymentMethod?: string;
}

export interface LocationData {
  id: number;
  name: string;
  city: string;
  type: string;
  address?: string;
  status: "Active" | "Inactive";
}

export interface VoucherData {
  Id: number;
  VoucherNumber: string;
  Date: string;
  PaymentType: string;
  PartyType: string;
  CustomerId?: number;
  SupplierId?: number;
  StaffId?: number;
  BankAccountId?: number;
  Customer?: { Name: string };
  Supplier?: { Name: string };
  Staff?: { Name: string };
  GariNo?: string;
  DriverName?: string;
  Amount: number;
  Remarks?: string;
}

export interface GariData {
  id: number;
  gariNo: string;
  driverName: string;
  malik: string;
  phone: string;
  modelYear?: string;
  capacity?: string;
  status?: string;
}

export interface RoznamchaItemData {
  id: number;
  date: string;
  displayDate: string;
  gariNo: string;
  driverName: string;
  maal: string;
  unit?: string;
  unitQuantity?: number;
  pricePerUnit?: number;
  materialAmount?: number;
  dieselLiter: number;
  kiraya: number;
  kharcha: number;
  otherExpenseName?: string;
  otherExpenseAmount?: number;
  advance: number;
  baqaya: number;

  // Customer & Location Enhancements
  customerId?: number;
  customerName?: string;
  fromLocation?: string;
  toLocation?: string;
  deliveryAddress?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  bankAccountId?: number;
  paidAmount?: number;
  advanceUsed?: number;
}

export type VehicleTripStatus =
  | "Available / At Base"
  | "Loading"
  | "Loaded / Ready to Depart"
  | "On the Way"
  | "At Destination"
  | "Unloading"
  | "Returning"
  | "Returned to Base"
  | "Trip Completed"
  | "Pending"
  | "Under Maintenance";

export interface VehicleStatusHistoryRecord {
  id: number;
  vehicleId?: number;
  gariNo: string;
  driverName: string;
  tripId?: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM AM/PM
  location: string;
  destination?: string;
  startingLocation?: string;
  status: VehicleTripStatus;
  remarks?: string;
  updatedBy: string;
  createdAt: string;
}

export interface VehicleDailyStatusRecord {
  id: number;
  gariNo: string;
  vehicleName?: string;
  driverName: string;
  date: string; // YYYY-MM-DD
  tripId?: number;
  tripNumber?: string;
  startingLocation: string;
  currentLocation: string;
  destination: string;
  departureTime?: string;
  expectedReturn?: string;
  status: VehicleTripStatus;
  lastUpdated: string;
  updatedBy: string;
}

export interface CompanySettingsData {
  companyName: string;
  tagline: string;
  address: string;
  phone: string;
  email?: string;
  description?: string;
  logoUrl?: string;
  permanentCredit: string;
  developerAttribution?: string;
  updatedAt: string;
}

export interface AuditLogData {
  id: number;
  userId: string;
  username: string;
  action: string;
  module: string;
  recordId?: string | number;
  details: string;
  oldValue?: string;
  newValue?: string;
  timestamp: string;
  reference?: string;
}

declare global {
  var __memoryStore: {
    customers: CustomerData[];
    suppliers: SupplierData[];
    products: ProductData[];
    sales: SalesInvoiceData[];
    purchases: PurchaseInvoiceData[];
    expenses: ExpenseData[];
    staff: StaffData[];
    bankAccounts: BankAccountData[];
    cashTransactions: CashTransactionData[];
    bankTransactions: BankTransactionData[];
    customerLedgers: CustomerLedgerEntry[];
    supplierLedgers: SupplierLedgerEntry[];
    locations: LocationData[];
    vouchers: VoucherData[];
    gariyan: GariData[];
    roznamcha: RoznamchaItemData[];
    vehicleStatuses: VehicleDailyStatusRecord[];
    vehicleStatusHistory: VehicleStatusHistoryRecord[];
    companySettings: CompanySettingsData;
    auditLogs: AuditLogData[];
  } | undefined;
}

if (!global.__memoryStore) {
  // ── CLEAN DEFAULT STATE ──────────────────────────────────────────────────────
  // All transaction arrays start empty. Master/reference data only.
  // Dates are NEVER generated with new Date() here — they come from disk or user input.
  global.__memoryStore = {
    customers: [],
    suppliers: [],
    products: [],
    sales: [],
    purchases: [],
    expenses: [],
    staff: [],
    bankAccounts: [],
    cashTransactions: [],
    bankTransactions: [],
    customerLedgers: [],
    supplierLedgers: [],
    locations: [
      { id: 1, name: "Site Area Hub Plant", city: "Hub Chowki", type: "Construction Site", address: "Main Industrial Estate Hub", status: "Active" },
      { id: 2, name: "Winder Mining Quarry", city: "Winder", type: "Quarry / Plant", address: "Winder Mining Zone Lasbela", status: "Active" },
      { id: 3, name: "Karachi Port Depot / Site", city: "Karachi", type: "Depot", address: "West Wharf Port Area", status: "Active" },
      { id: 4, name: "Uthal District Site Yard", city: "Uthal", type: "Client Yard", address: "Bypass Road Uthal", status: "Active" },
      { id: 5, name: "Bhawalpur Highway Project", city: "Bhawalpur", type: "Construction Site", address: "N-5 Bypass Site Camp", status: "Active" },
    ],
    vouchers: [],
    gariyan: [],
    roznamcha: [],
    vehicleStatuses: [],
    vehicleStatusHistory: [],
    companySettings: {
      companyName: "Muslim Construction",
      tagline: "Construction & Transport Management System",
      address: "Site Area Hub, Lasbela & Transport Chowk, Pakistan",
      phone: "+92 315 2914836",
      email: "info@muslimconstruction.com",
      description: "Heavy Earthmoving, Aggregate Supply & Transport Logistics",
      logoUrl: "/icons/icon-192x192.png",
      permanentCredit: "Software By Roonjha Developers : 03152914836",
      developerAttribution: "Software By Roonjha Developers : 03152914836",
      updatedAt: "2026-11-20T12:00:00.000Z",
    },
    auditLogs: [
      {
        id: 1,
        userId: "admin",
        username: "Super Admin",
        action: "DB_RESET",
        module: "System",
        details: "Database cleaned and reset to zero. All transactions cleared by administrator.",
        timestamp: "2026-11-20T12:00:00.000Z",
      },
    ],
  };
}

const DATA_FILE_PATH = path.join(process.cwd(), "data", "erp-store.json");

export function persistStore(): boolean {
  try {
    if (!global.__memoryStore) return false;
    const dir = path.dirname(DATA_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(global.__memoryStore, null, 2), "utf8");
    return true;
  } catch (err) {
    return false;
  }
}

export function loadStoreFromDisk(): boolean {
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const content = fs.readFileSync(DATA_FILE_PATH, "utf8");
      if (content && content.trim()) {
        const parsed = JSON.parse(content);
        if (parsed && typeof parsed === "object" && Array.isArray(parsed.customers)) {
          // Deep merge: disk data wins for all arrays and settings
          // But ensure required keys exist (backward compat with old DB schemas)
          if (!parsed.customerLedgers) parsed.customerLedgers = [];
          if (!parsed.supplierLedgers) parsed.supplierLedgers = [];
          if (!parsed.vouchers) parsed.vouchers = [];
          if (!parsed.gariyan) parsed.gariyan = [];
          if (!parsed.roznamcha) parsed.roznamcha = [];
          if (!parsed.vehicleStatuses) parsed.vehicleStatuses = [];
          if (!parsed.vehicleStatusHistory) parsed.vehicleStatusHistory = [];
          if (!parsed.auditLogs) parsed.auditLogs = [];
          if (!parsed.locations) parsed.locations = [];
          if (!parsed.companySettings) {
            parsed.companySettings = global.__memoryStore?.companySettings ?? {
              companyName: "Muslim Construction",
              tagline: "Construction & Transport Management System",
              address: "Site Area Hub, Lasbela & Transport Chowk, Pakistan",
              phone: "+92 315 2914836",
              email: "info@muslimconstruction.com",
              description: "Heavy Earthmoving, Aggregate Supply & Transport Logistics",
              logoUrl: "/icons/icon-192x192.png",
              permanentCredit: "Software By Roonjha Developers : 03152914836",
              developerAttribution: "Software By Roonjha Developers : 03152914836",
              updatedAt: new Date().toISOString(),
            };
          }
          global.__memoryStore = parsed;
          return true;
        }
      }
    }
  } catch (err) {
    // Ignore and proceed with default
  }
  return false;
}

// On first load, check if persisted disk data exists
if (typeof process !== "undefined" && typeof process.cwd === "function") {
  loadStoreFromDisk();
  persistStore();
}

export const memoryStore = global.__memoryStore!;
