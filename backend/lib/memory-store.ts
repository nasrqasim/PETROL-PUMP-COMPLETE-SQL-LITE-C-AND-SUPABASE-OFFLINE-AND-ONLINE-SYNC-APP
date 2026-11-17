// In-Memory Store for Muslim Construction ERP
// Production-Ready Interconnected Financial Ledgers, Bank Accounts, Customers & Roznamcha

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
  } | undefined;
}

if (!global.__memoryStore) {
  const todayStr = new Date().toISOString().split("T")[0];
  const displayDateStr = new Date().toLocaleDateString("en-GB");

  global.__memoryStore = {
    customers: [
      { Id: 1, Name: "Al-Madina Builders", Phone: "03001234567", Address: "Site Area Hub / Karachi", BalanceDue: 45000, Advance: 0, CreatedAt: new Date().toISOString(), UpdatedAt: new Date().toISOString() },
      { Id: 2, Name: "Lasbela Mining Corporation", Phone: "03152914836", Address: "Winder Lasbela", BalanceDue: 120000, Advance: 0, CreatedAt: new Date().toISOString(), UpdatedAt: new Date().toISOString() },
      { Id: 3, Name: "Nasrullah Construction Co", Phone: "03108444612", Address: "Uthal District Lasbela", BalanceDue: 0, Advance: 25000, CreatedAt: new Date().toISOString(), UpdatedAt: new Date().toISOString() },
    ],
    suppliers: [
      { Id: 1, Name: "Pakistan State Oil (PSO)", Phone: "03001234567", Address: "Main Hub Depot", BalanceDue: 85000, Advance: 0, CreatedAt: new Date().toISOString(), UpdatedAt: new Date().toISOString() },
      { Id: 2, Name: "Attock Petroleum Hub", Phone: "03017654321", Address: "Bhawalpur Bypass", BalanceDue: 0, Advance: 50000, CreatedAt: new Date().toISOString(), UpdatedAt: new Date().toISOString() },
      { Id: 3, Name: "Al-Rehman Spare Parts & Tyres", Phone: "03152914836", Address: "Transport Chowk Hub", BalanceDue: 34000, Advance: 0, CreatedAt: new Date().toISOString(), UpdatedAt: new Date().toISOString() },
    ],
    products: [
      { Id: 1, Name: "High Speed Diesel (HSD)", Category: "Fuel", Unit: "Liters", SalePrice: 285, PurchasePrice: 270, StockQuantity: 15400, LowStockAlert: 2000, CreatedAt: new Date().toISOString(), UpdatedAt: new Date().toISOString() },
      { Id: 2, Name: "Super Petrol (PMG)", Category: "Fuel", Unit: "Liters", SalePrice: 280, PurchasePrice: 265, StockQuantity: 8200, LowStockAlert: 1500, CreatedAt: new Date().toISOString(), UpdatedAt: new Date().toISOString() },
      { Id: 3, Name: "Engine Oil Rimula 20W50", Category: "Lubricants", Unit: "Liters", SalePrice: 1200, PurchasePrice: 1050, StockQuantity: 240, LowStockAlert: 20, CreatedAt: new Date().toISOString(), UpdatedAt: new Date().toISOString() },
      { Id: 4, Name: "Crush Stone 1/2 Inch (Material)", Category: "Construction Material", Unit: "Dumpers / Tons", SalePrice: 38000, PurchasePrice: 32000, StockQuantity: 45, LowStockAlert: 5, CreatedAt: new Date().toISOString(), UpdatedAt: new Date().toISOString() },
    ],
    sales: [
      { Id: 1, InvoiceNumber: "INV-MC-00101", Date: todayStr, CustomerId: 1, Customer: { Name: "Al-Madina Builders" }, PaymentMode: "Credit", SubTotal: 85500, Discount: 0, Tax: 0, GrandTotal: 85500, PaidAmount: 40500, Remarks: "Diesel supply 300L for heavy machinery" },
      { Id: 2, InvoiceNumber: "INV-MC-00102", Date: todayStr, CustomerId: 2, Customer: { Name: "Lasbela Mining Corporation" }, PaymentMode: "Cash", SubTotal: 76000, Discount: 0, Tax: 0, GrandTotal: 76000, PaidAmount: 76000, Remarks: "Crush stone 2 dumpers trip delivery" },
    ],
    purchases: [
      { Id: 1, InvoiceNumber: "PUR-PSO-9812", Date: todayStr, SupplierId: 1, Supplier: { Name: "Pakistan State Oil (PSO)" }, PaymentMode: "Credit", SubTotal: 540000, DiscountAmount: 0, TaxAmount: 0, GrandTotal: 540000, PaidAmount: 455000, Remarks: "Diesel tanker stock inward 2000L" },
    ],
    expenses: [
      { Id: 1, Date: todayStr, Category: "Site Machinery Maintenance", PaymentMode: "Cash", Amount: 8500, Remarks: "Hydraulic oil & filter change" },
      { Id: 2, Date: todayStr, Category: "Toll Taxes & Highway Expense", PaymentMode: "Cash", Amount: 4200, Remarks: "Hub River toll receipts" },
      { Id: 3, Date: todayStr, Category: "Staff Mess & Daily Food", PaymentMode: "Cash", Amount: 2800, Remarks: "Site labours lunch & tea" },
    ],
    staff: [
      { Id: 1, Name: "Iqbal Driver", Designation: "Senior Driver", Department: "Transport", ContactNumber: "03001234567", Cnic: "52101-1234567-1", Salary: 40000, Advance: 15000, IsActive: true },
      { Id: 2, Name: "Rashid Driver", Designation: "Vehicle Driver", Department: "Transport", ContactNumber: "03007654321", Cnic: "52101-7654321-2", Salary: 35000, Advance: 0, IsActive: true },
      { Id: 3, Name: "Tariq Khan", Designation: "Accountant / Munshi", Department: "Accounts & Roznamcha", ContactNumber: "03152914836", Cnic: "52101-9988776-3", Salary: 50000, Advance: 0, IsActive: true },
      { Id: 4, Name: "Gul Muhammad", Designation: "Supervisor / Site Incharge", Department: "Construction Site", ContactNumber: "03108444612", Cnic: "52101-5544332-4", Salary: 45000, Advance: 5000, IsActive: true },
    ],
    bankAccounts: [
      { Id: 1, BankName: "Meezan Bank Limited", AccountTitle: "Muslim Construction Fleet Operations", AccountNumber: "0219-0103445892", BranchName: "Hub Chowki Branch", OpeningBalance: 450000, CurrentBalance: 450000, Status: "Active", Description: "Main operational account for transport & diesel purchases" },
      { Id: 2, BankName: "Habib Bank Limited (HBL)", AccountTitle: "Muslim Construction Main Corporate", AccountNumber: "1104-7901234567", BranchName: "Lasbela Corporate Center", OpeningBalance: 1250000, CurrentBalance: 1250000, Status: "Active", Description: "Client bill receipts and mining project clearances" },
    ],
    cashTransactions: [
      { Id: 1, Date: todayStr, VoucherNumber: "OP-CASH-001", Description: "Opening Cash in Hand", Reference: "System", TransactionType: "Opening Cash", CashIn: 150000, CashOut: 0, RunningBalance: 150000 },
      { Id: 2, Date: todayStr, VoucherNumber: "CR-20261115-02", Description: "Customer Receipt: Lasbela Mining Corporation", Reference: "TRIP-01", TransactionType: "Customer Receipt", CashIn: 50000, CashOut: 0, RunningBalance: 200000 },
      { Id: 3, Date: todayStr, VoucherNumber: "CP-20261115-01", Description: "Staff Payment: Iqbal Driver (Monthly Salary advance)", Reference: "STAFF-01", TransactionType: "Staff Payment", CashIn: 0, CashOut: 15000, RunningBalance: 185000 },
    ],
    bankTransactions: [
      { Id: 1, BankAccountId: 1, Date: todayStr, VoucherNumber: "OP-BANK-001", Description: "Opening Balance Meezan Bank", TransactionType: "Opening Balance", BankIn: 450000, BankOut: 0, RunningBalance: 450000 },
      { Id: 2, BankAccountId: 2, Date: todayStr, VoucherNumber: "OP-BANK-002", Description: "Opening Balance HBL Corporate", TransactionType: "Opening Balance", BankIn: 1250000, BankOut: 0, RunningBalance: 1250000 },
    ],
    customerLedgers: [
      { Id: 1, CustomerId: 1, Date: todayStr, VoucherNumber: "TRIP-101", TripRef: "101", Description: "Diesel delivery trip to Site Hub", Debit: 85500, Credit: 0, RunningBalance: 85500, PaymentMethod: "Credit" },
      { Id: 2, CustomerId: 1, Date: todayStr, VoucherNumber: "CR-101", TripRef: "101", Description: "Cash part payment received", Debit: 0, Credit: 40500, RunningBalance: 45000, PaymentMethod: "Cash" },
      { Id: 3, CustomerId: 2, Date: todayStr, VoucherNumber: "TRIP-102", TripRef: "102", Description: "Crush stone 2 dumpers delivery", Debit: 170000, Credit: 0, RunningBalance: 170000, PaymentMethod: "Credit" },
      { Id: 4, CustomerId: 2, Date: todayStr, VoucherNumber: "CR-102", TripRef: "102", Description: "Cash received from Lasbela Mining", Debit: 0, Credit: 50000, RunningBalance: 120000, PaymentMethod: "Cash" },
    ],
    supplierLedgers: [
      { Id: 1, SupplierId: 1, Date: todayStr, VoucherNumber: "PUR-9812", Description: "Diesel tanker stock inward 2000L", Debit: 0, Credit: 540000, RunningBalance: 540000, PaymentMethod: "Credit" },
      { Id: 2, SupplierId: 1, Date: todayStr, VoucherNumber: "CP-9812", Description: "Cash payment made to PSO Depot", Debit: 455000, Credit: 0, RunningBalance: 85000, PaymentMethod: "Cash" },
    ],
    locations: [
      { id: 1, name: "Site Area Hub Plant", city: "Hub Chowki", type: "Construction Site", address: "Main Industrial Estate Hub", status: "Active" },
      { id: 2, name: "Winder Mining Quarry", city: "Winder", type: "Quarry / Plant", address: "Winder Mining Zone Lasbela", status: "Active" },
      { id: 3, name: "Karachi Port Depot / Site", city: "Karachi", type: "Depot", address: "West Wharf Port Area", status: "Active" },
      { id: 4, name: "Uthal District Site Yard", city: "Uthal", type: "Client Yard", address: "Bypass Road Uthal", status: "Active" },
      { id: 5, name: "Bhawalpur Highway Project", city: "Bhawalpur", type: "Construction Site", address: "N-5 Bypass Site Camp", status: "Active" },
    ],
    vouchers: [
      { Id: 1, VoucherNumber: "CP-20261115-01", Date: todayStr, PaymentType: "CashPayment", PartyType: "Staff", StaffId: 1, Staff: { Name: "Iqbal Driver" }, DriverName: "Iqbal Driver", Amount: 15000, Remarks: "Monthly Salary advance payment" },
      { Id: 2, VoucherNumber: "CR-20261115-02", Date: todayStr, PaymentType: "CashReceipt", PartyType: "Customer", CustomerId: 2, Customer: { Name: "Lasbela Mining Corporation" }, Amount: 50000, Remarks: "Running bill cash clearance" },
      { Id: 3, VoucherNumber: "CP-20261115-03", Date: todayStr, PaymentType: "CashPayment", PartyType: "Vehicle", GariNo: "786", DriverName: "Rashid Driver", Amount: 8000, Remarks: "Vehicle maintenance & brake shoes" },
    ],
    gariyan: [
      { id: 1, gariNo: "786", driverName: "Rashid Driver", malik: "Haji Najeeb (Muslim Construction)", phone: "03152914836", modelYear: "2024", capacity: "25 Ton Dumper", status: "Active" },
      { id: 2, gariNo: "LES-992", driverName: "Iqbal Driver", malik: "Muslim Construction Fleet", phone: "03001234567", modelYear: "2023", capacity: "30 Ton Trailer", status: "Active" },
      { id: 3, gariNo: "TK-404", driverName: "Farooq", malik: "Nasrullah Qasim Transport", phone: "03108444612", modelYear: "2024", capacity: "18 Ton Truck", status: "Active" },
    ],
    roznamcha: [
      { id: 1, date: todayStr, displayDate: displayDateStr, gariNo: "786", driverName: "Rashid Driver", maal: "High Speed Diesel (HSD)", unit: "Liters", unitQuantity: 100, pricePerUnit: 285, materialAmount: 28500, dieselLiter: 100, kiraya: 55000, kharcha: 4000, otherExpenseName: "Toll Tax", otherExpenseAmount: 1500, advance: 15000, baqaya: 74000, customerId: 2, customerName: "Lasbela Mining Corporation", fromLocation: "Site Area Hub Plant", toLocation: "Winder Mining Quarry", paymentStatus: "Partially Paid", paymentMethod: "Cash", paidAmount: 15000 },
      { id: 2, date: todayStr, displayDate: displayDateStr, gariNo: "LES-992", driverName: "Iqbal Driver", maal: "Crush Stone Material", unit: "Dumpers", unitQuantity: 1, pricePerUnit: 38000, materialAmount: 38000, dieselLiter: 95, kiraya: 48000, kharcha: 3500, otherExpenseName: "Site Labour", otherExpenseAmount: 2000, advance: 12000, baqaya: 79500, customerId: 1, customerName: "Al-Madina Builders", fromLocation: "Winder Mining Quarry", toLocation: "Site Area Hub Plant", paymentStatus: "Credit / Pay Later", paymentMethod: "Credit", paidAmount: 0 },
    ],
    vehicleStatuses: [
      {
        id: 1,
        gariNo: "786",
        vehicleName: "25 Ton Dumper",
        driverName: "Rashid Driver",
        date: todayStr,
        tripId: 1,
        tripNumber: "TRIP-001",
        startingLocation: "Site Area Hub Plant",
        currentLocation: "Winder Mining Highway (Near Lasbela Toll Plaza)",
        destination: "Winder Mining Quarry",
        departureTime: "08:30 AM",
        expectedReturn: "06:00 PM",
        status: "On the Way",
        lastUpdated: `${todayStr} 09:45 AM`,
        updatedBy: "Dispatch Officer (Hub Base)",
      },
      {
        id: 2,
        gariNo: "LES-992",
        vehicleName: "30 Ton Heavy Trailer",
        driverName: "Iqbal Driver",
        date: todayStr,
        tripId: 2,
        tripNumber: "TRIP-002",
        startingLocation: "Winder Mining Quarry",
        currentLocation: "Site Area Hub Plant Yard",
        destination: "Site Area Hub Plant",
        departureTime: "09:00 AM",
        expectedReturn: "04:30 PM",
        status: "At Destination",
        lastUpdated: `${todayStr} 11:15 AM`,
        updatedBy: "Site Supervisor (Hub Yard)",
      },
      {
        id: 3,
        gariNo: "TK-404",
        vehicleName: "18 Ton Truck",
        driverName: "Farooq",
        date: todayStr,
        tripId: undefined,
        tripNumber: undefined,
        startingLocation: "Site Area Hub Base Yard",
        currentLocation: "Site Area Hub Base Yard",
        destination: "Base / Available",
        departureTime: undefined,
        expectedReturn: undefined,
        status: "Available / At Base",
        lastUpdated: `${todayStr} 07:00 AM`,
        updatedBy: "System (Ready for Dispatch)",
      },
    ],
    vehicleStatusHistory: [
      {
        id: 1,
        gariNo: "786",
        driverName: "Rashid Driver",
        tripId: 1,
        date: todayStr,
        time: "08:00 AM",
        location: "Site Area Hub Plant Yard",
        startingLocation: "Site Area Hub Plant",
        destination: "Winder Mining Quarry",
        status: "Loading",
        remarks: "Loading 100 Liters fuel tanker and project consumables.",
        updatedBy: "Base Munshi",
        createdAt: new Date().toISOString(),
      },
      {
        id: 2,
        gariNo: "786",
        driverName: "Rashid Driver",
        tripId: 1,
        date: todayStr,
        time: "08:30 AM",
        location: "Site Area Hub Exit Gate",
        startingLocation: "Site Area Hub Plant",
        destination: "Winder Mining Quarry",
        status: "On the Way",
        remarks: "Departed from Hub base heading towards Winder quarry.",
        updatedBy: "Dispatch Gate",
        createdAt: new Date().toISOString(),
      },
      {
        id: 3,
        gariNo: "LES-992",
        driverName: "Iqbal Driver",
        tripId: 2,
        date: todayStr,
        time: "09:00 AM",
        location: "Winder Mining Quarry",
        startingLocation: "Winder Mining Quarry",
        destination: "Site Area Hub Plant",
        status: "On the Way",
        remarks: "Loaded 1 Dumper crush stone material, moving to Hub.",
        updatedBy: "Quarry Supervisor",
        createdAt: new Date().toISOString(),
      },
      {
        id: 4,
        gariNo: "LES-992",
        driverName: "Iqbal Driver",
        tripId: 2,
        date: todayStr,
        time: "11:15 AM",
        location: "Site Area Hub Plant Yard",
        startingLocation: "Winder Mining Quarry",
        destination: "Site Area Hub Plant",
        status: "At Destination",
        remarks: "Vehicle arrived at destination site, queueing for unloading.",
        updatedBy: "Site Supervisor",
        createdAt: new Date().toISOString(),
      },
    ],
  };
}

export const memoryStore = global.__memoryStore!;
