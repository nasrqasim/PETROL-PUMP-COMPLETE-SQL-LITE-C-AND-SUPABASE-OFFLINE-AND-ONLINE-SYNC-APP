// In-Memory Store for Muslim Construction
// Optimized, clean baseline ready for 10,000+ entries across all modules

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
  IsActive: boolean;
}

export interface VoucherData {
  Id: number;
  VoucherNumber: string;
  Date: string;
  PaymentType: string;
  PartyType: string;
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
  dieselLiter: number;
  kiraya: number;
  kharcha: number;
  advance: number;
  baqaya: number;
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
    vouchers: VoucherData[];
    gariyan: GariData[];
    roznamcha: RoznamchaItemData[];
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
      { Id: 1, Name: "Iqbal Driver", Designation: "Senior Driver", Department: "Transport", ContactNumber: "03001234567", Cnic: "52101-1234567-1", Salary: 40000, IsActive: true },
      { Id: 2, Name: "Rashid Driver", Designation: "Vehicle Driver", Department: "Transport", ContactNumber: "03007654321", Cnic: "52101-7654321-2", Salary: 35000, IsActive: true },
      { Id: 3, Name: "Tariq Khan", Designation: "Accountant / Munshi", Department: "Accounts & Roznamcha", ContactNumber: "03152914836", Cnic: "52101-9988776-3", Salary: 50000, IsActive: true },
      { Id: 4, Name: "Gul Muhammad", Designation: "Supervisor / Site Incharge", Department: "Construction Site", ContactNumber: "03108444612", Cnic: "52101-5544332-4", Salary: 45000, IsActive: true },
    ],
    vouchers: [
      { Id: 1, VoucherNumber: "CP-20261115-01", Date: todayStr, PaymentType: "CashPayment", PartyType: "Staff", Staff: { Name: "Iqbal Driver" }, DriverName: "Iqbal Driver", Amount: 15000, Remarks: "Monthly Salary advance payment" },
      { Id: 2, VoucherNumber: "CR-20261115-02", Date: todayStr, PaymentType: "CashReceipt", PartyType: "Customer", Customer: { Name: "Lasbela Mining Corporation" }, Amount: 50000, Remarks: "Running bill cash clearance" },
      { Id: 3, VoucherNumber: "CP-20261115-03", Date: todayStr, PaymentType: "CashPayment", PartyType: "Vehicle", GariNo: "786", DriverName: "Rashid Driver", Amount: 8000, Remarks: "Vehicle maintenance & brake shoes" },
    ],
    gariyan: [
      { id: 1, gariNo: "786", driverName: "Rashid Driver", malik: "Haji Najeeb (Muslim Construction)", phone: "03152914836", modelYear: "2024", capacity: "25 Ton Dumper", status: "Active" },
      { id: 2, gariNo: "LES-992", driverName: "Iqbal Driver", malik: "Muslim Construction Fleet", phone: "03001234567", modelYear: "2023", capacity: "30 Ton Trailer", status: "Active" },
      { id: 3, gariNo: "TK-404", driverName: "Farooq", malik: "Nasrullah Qasim Transport", phone: "03108444612", modelYear: "2024", capacity: "18 Ton Truck", status: "Active" },
    ],
    roznamcha: [
      { id: 1, date: todayStr, displayDate: displayDateStr, gariNo: "786", driverName: "Rashid Driver", maal: "Crush Stone Material", dieselLiter: 120, kiraya: 55000, kharcha: 9000, advance: 15000, baqaya: 31000 },
      { id: 2, date: todayStr, displayDate: displayDateStr, gariNo: "LES-992", driverName: "Iqbal Driver", maal: "Construction Sand (Reti)", dieselLiter: 95, kiraya: 48000, kharcha: 7500, advance: 12000, baqaya: 28500 },
    ],
  };
}

export const memoryStore = global.__memoryStore!;
