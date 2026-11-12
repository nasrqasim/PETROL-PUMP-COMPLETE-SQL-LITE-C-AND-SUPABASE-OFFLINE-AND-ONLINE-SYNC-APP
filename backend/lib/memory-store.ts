// In-Memory Cloud Store for Vercel Serverless environment
// Keeps all Customer, Supplier, Product, Sales, Purchases, Expenses, Staff, Vouchers,
// Gariyan, and Roznamcha entries fully functional and editable even when deployed
// on Vercel without local SQLite bridge.

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
  global.__memoryStore = {
    customers: [
      { Id: 1, Name: "Ahmed Khan Traders", Phone: "03001234567", Address: "Lahore Punjab Pakistan", BalanceDue: 800, Advance: 0, CreatedAt: new Date().toISOString(), UpdatedAt: new Date().toISOString() },
      { Id: 2, Name: "Ali Motors", Phone: "03017654321", Address: "Lahore Punjab Pakistan", BalanceDue: 0, Advance: 0, CreatedAt: new Date().toISOString(), UpdatedAt: new Date().toISOString() },
      { Id: 3, Name: "Fatima Oil Center", Phone: "03007654321", Address: "Lahore Punjab Pakistan", BalanceDue: 0, Advance: 0, CreatedAt: new Date().toISOString(), UpdatedAt: new Date().toISOString() },
      { Id: 4, Name: "Nasrullah Qasim", Phone: "03152914836", Address: "Uthal Lasbela", BalanceDue: 9980, Advance: 0, CreatedAt: new Date().toISOString(), UpdatedAt: new Date().toISOString() },
    ],
    suppliers: [
      { Id: 1, Name: "Pakistan Oil Company", Phone: "03001234567", Address: "Lahore Punjab Pakistan", BalanceDue: 0, Advance: 0, CreatedAt: new Date().toISOString(), UpdatedAt: new Date().toISOString() },
      { Id: 2, Name: "Ahmed Khan Traders", Phone: "03001234567", Address: "Lahore Punjab Pakistan", BalanceDue: 0, Advance: 0, CreatedAt: new Date().toISOString(), UpdatedAt: new Date().toISOString() },
      { Id: 3, Name: "nasr qasim roonjha", Phone: "03108444612", Address: "Winder Lasbela", BalanceDue: 67870, Advance: 890, CreatedAt: new Date().toISOString(), UpdatedAt: new Date().toISOString() },
    ],
    products: [
      { Id: 1, Name: "Diesel Fuel 50 Liters", Category: "Fuel", Unit: "Liters", SalePrice: 280, PurchasePrice: 260, StockQuantity: 675.65, LowStockAlert: 10, CreatedAt: new Date().toISOString(), UpdatedAt: new Date().toISOString() },
      { Id: 2, Name: "Petrol 30 Liters", Category: "Fuel", Unit: "Liters", SalePrice: 280, PurchasePrice: 260, StockQuantity: 550, LowStockAlert: 10, CreatedAt: new Date().toISOString(), UpdatedAt: new Date().toISOString() },
      { Id: 3, Name: "Engine Oil Drum 20 Liters", Category: "Engine Oil", Unit: "Liters", SalePrice: 2600, PurchasePrice: 2400, StockQuantity: 10, LowStockAlert: 10, CreatedAt: new Date().toISOString(), UpdatedAt: new Date().toISOString() },
      { Id: 4, Name: "Engine Oil 5 Liters", Category: "Engine Oil", Unit: "Liters", SalePrice: 810, PurchasePrice: 700, StockQuantity: 120, LowStockAlert: 10, CreatedAt: new Date().toISOString(), UpdatedAt: new Date().toISOString() },
    ],
    sales: [
      { Id: 5, InvoiceNumber: "SI-004591", Date: new Date().toISOString(), CustomerId: 1, Customer: { Name: "Ahmed Khan Traders" }, PaymentMode: "Cash", SubTotal: 660, Discount: 0, Tax: 0, GrandTotal: 660, PaidAmount: 660, Remarks: "" },
      { Id: 4, InvoiceNumber: "SI-004590", Date: new Date().toISOString(), CustomerId: 1, Customer: { Name: "Ahmed Khan Traders" }, PaymentMode: "Cash", SubTotal: 8880, Discount: 0, Tax: 0, GrandTotal: 8880, PaidAmount: 8880, Remarks: "" },
      { Id: 2, InvoiceNumber: "SI-004588", Date: new Date().toISOString(), CustomerId: 1, Customer: { Name: "Ahmed Khan Traders" }, PaymentMode: "Cash", SubTotal: 5000, Discount: 0, Tax: 0, GrandTotal: 5000, PaidAmount: 5000, Remarks: "" },
    ],
    purchases: [
      { Id: 1, InvoiceNumber: "PI-007892", Date: new Date().toISOString(), SupplierId: 1, Supplier: { Name: "Pakistan Oil Company" }, PaymentMode: "Credit", SubTotal: 117000, DiscountAmount: 139620, TaxAmount: 80860, GrandTotal: 58240, PaidAmount: 0, Remarks: "" },
    ],
    expenses: [
      { Id: 6, Date: new Date().toISOString(), Category: "Rent Expense", PaymentMode: "Cash", Amount: 6590, Remarks: "Shop rent" },
      { Id: 5, Date: new Date().toISOString(), Category: "Fuel Cost", PaymentMode: "Cash", Amount: 2200, Remarks: "Generator fuel" },
      { Id: 3, Date: new Date().toISOString(), Category: "Utilities Bill", PaymentMode: "Bank", Amount: 5250, Remarks: "Electricity" },
      { Id: 2, Date: new Date().toISOString(), Category: "Staff Salaries", PaymentMode: "Cash", Amount: 12000, Remarks: "Monthly advance" },
    ],
    staff: [
      { Id: 1, Name: "Iqbal Driver", Designation: "Senior Driver", Department: "Transport", ContactNumber: "03001234567", Cnic: "52101-1234567-1", Salary: 35000, IsActive: true },
      { Id: 2, Name: "Rashid Driver", Designation: "Vehicle Driver", Department: "Transport", ContactNumber: "03007654321", Cnic: "52101-7654321-2", Salary: 30000, IsActive: true },
      { Id: 3, Name: "Tariq Staff", Designation: "Accountant", Department: "Accounts", ContactNumber: "03152914836", Cnic: "52101-9988776-3", Salary: 45000, IsActive: true },
    ],
    vouchers: [
      { Id: 4, VoucherNumber: "CP-20261110200817", Date: new Date().toISOString(), PaymentType: "CashPayment", PartyType: "Vehicle", GariNo: "786", DriverName: "Rashid", Amount: 5000, Remarks: "Vehicle Baqaya Settlement" },
      { Id: 2, VoucherNumber: "BR-20261108183705", Date: new Date().toISOString(), PaymentType: "BankReceipt", PartyType: "Customer", Customer: { Name: "Ahmed Khan Traders" }, Amount: 20000, Remarks: "Meezan Bank Deposit" },
      { Id: 1, VoucherNumber: "CP-20261108182748", Date: new Date().toISOString(), PaymentType: "CashPayment", PartyType: "Customer", Customer: { Name: "Ahmed Khan Traders" }, Amount: 6000, Remarks: "Partial payment" },
    ],
    gariyan: [
      { id: 1, gariNo: "786", driverName: "Rashid Driver", malik: "Haji Najeeb", phone: "03152914836", modelYear: "2024", capacity: "15 Ton", status: "Active" },
      { id: 2, gariNo: "LES-992", driverName: "Iqbal Driver", malik: "Windr Oil Traders", phone: "03001234567", modelYear: "2022", capacity: "20 Ton", status: "Active" },
      { id: 3, gariNo: "TK-404", driverName: "Farooq", malik: "Nasr Qasim Transport", phone: "03108444612", modelYear: "2023", capacity: "10 Ton", status: "Active" },
    ],
    roznamcha: [
      { id: 1, date: new Date().toISOString().split("T")[0], displayDate: new Date().toLocaleDateString("en-GB"), gariNo: "786", driverName: "Rashid Driver", maal: "High Speed Diesel", dieselLiter: 120, kiraya: 45000, kharcha: 8000, advance: 15000, baqaya: 22000 },
      { id: 2, date: new Date().toISOString().split("T")[0], displayDate: new Date().toLocaleDateString("en-GB"), gariNo: "LES-992", driverName: "Iqbal Driver", maal: "Super Petrol", dieselLiter: 90, kiraya: 38000, kharcha: 6000, advance: 12000, baqaya: 20000 },
    ],
  };
}

export const memoryStore = global.__memoryStore!;
