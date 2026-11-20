import {
  memoryStore,
  persistStore,
  BankAccountData,
  CashTransactionData,
  BankTransactionData,
  CustomerLedgerEntry,
  SupplierLedgerEntry,
  VoucherData,
  RoznamchaItemData,
  AuditLogData,
} from "./memory-store";

// ==========================================
// 0. AUDIT LOG HELPER
// ==========================================

export function addAuditLog(entry: {
  userId?: string;
  username?: string;
  action: string;
  module: string;
  recordId?: string | number;
  details: string;
  oldValue?: string;
  newValue?: string;
  reference?: string;
}): AuditLogData {
  const log: AuditLogData = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    userId: entry.userId || "admin",
    username: entry.username || "Super Admin",
    action: entry.action,
    module: entry.module,
    recordId: entry.recordId,
    details: entry.details,
    oldValue: entry.oldValue,
    newValue: entry.newValue,
    timestamp: new Date().toISOString(),
    reference: entry.reference,
  };
  if (!memoryStore.auditLogs) memoryStore.auditLogs = [];
  memoryStore.auditLogs.unshift(log);
  persistStore();
  return log;
}

// ==========================================
// 1. CASH LEDGER ENGINE
// ==========================================

export function getCurrentCashBalance(): number {
  if (memoryStore.cashTransactions.length === 0) return 0;
  return memoryStore.cashTransactions[memoryStore.cashTransactions.length - 1].RunningBalance;
}

export function postCashTransaction(params: {
  date: string;
  voucherNumber: string;
  description: string;
  reference?: string;
  transactionType: string;
  cashIn: number;
  cashOut: number;
}): CashTransactionData {
  const currentBalance = getCurrentCashBalance();
  const cashIn = Math.max(0, Number(params.cashIn) || 0);
  const cashOut = Math.max(0, Number(params.cashOut) || 0);
  const newBalance = currentBalance + cashIn - cashOut;

  const entry: CashTransactionData = {
    Id: Date.now() + Math.floor(Math.random() * 1000),
    Date: params.date,
    VoucherNumber: params.voucherNumber,
    Description: params.description,
    Reference: params.reference,
    TransactionType: params.transactionType,
    CashIn: cashIn,
    CashOut: cashOut,
    RunningBalance: newBalance,
  };

  memoryStore.cashTransactions.push(entry);
  return entry;
}

// ==========================================
// 2. BANK LEDGER ENGINE
// ==========================================

export function getBankBalance(bankAccountId: number): number {
  const account = memoryStore.bankAccounts.find((b) => b.Id === bankAccountId);
  if (!account) return 0;
  return account.CurrentBalance;
}

export function postBankTransaction(params: {
  bankAccountId: number;
  date: string;
  voucherNumber: string;
  description: string;
  transactionType: string;
  bankIn: number;
  bankOut: number;
  reference?: string;
}): BankTransactionData | null {
  const account = memoryStore.bankAccounts.find((b) => b.Id === params.bankAccountId);
  if (!account) return null;

  const bankIn = Math.max(0, Number(params.bankIn) || 0);
  const bankOut = Math.max(0, Number(params.bankOut) || 0);
  account.CurrentBalance = account.CurrentBalance + bankIn - bankOut;

  const entry: BankTransactionData = {
    Id: Date.now() + Math.floor(Math.random() * 1000),
    BankAccountId: params.bankAccountId,
    Date: params.date,
    VoucherNumber: params.voucherNumber,
    Description: params.description,
    TransactionType: params.transactionType,
    BankIn: bankIn,
    BankOut: bankOut,
    RunningBalance: account.CurrentBalance,
    Reference: params.reference,
  };

  memoryStore.bankTransactions.push(entry);
  return entry;
}

// ==========================================
// 3. CUSTOMER LEDGER & DUE/ADVANCE ENGINE
// ==========================================

export function postCustomerTripCharge(params: {
  customerId: number;
  date: string;
  tripRef: string;
  description: string;
  chargeAmount: number;
}): CustomerLedgerEntry | null {
  const custId = Number(params.customerId);
  const customer = memoryStore.customers.find((c) => Number(c.Id) === custId);
  if (!customer) return null;

  const charge = Math.max(0, Number(params.chargeAmount) || 0);
  const prevDue = Number(customer.BalanceDue) || 0;
  customer.BalanceDue = prevDue + charge;
  customer.UpdatedAt = new Date().toISOString();
  const currentNet = customer.BalanceDue - (Number(customer.Advance) || 0);

  const entry: CustomerLedgerEntry = {
    Id: Date.now() + Math.floor(Math.random() * 1000),
    CustomerId: custId,
    Date: params.date,
    VoucherNumber: `TRIP-${params.tripRef}`,
    TripRef: params.tripRef,
    Description: params.description,
    Debit: charge,
    Credit: 0,
    RunningBalance: currentNet,
    PaymentMethod: "Credit",
  };

  memoryStore.customerLedgers.push(entry);

  addAuditLog({
    action: "TRIP_CHARGE",
    module: "Customers",
    recordId: custId,
    details: `Trip charge of Rs. ${charge.toLocaleString()} posted to customer ${customer.Name}. New due: Rs. ${customer.BalanceDue.toLocaleString()}`,
    oldValue: `BalanceDue: ${prevDue}`,
    newValue: `BalanceDue: ${customer.BalanceDue}`,
    reference: `TRIP-${params.tripRef}`,
  });

  return entry;
}

export function postCustomerPayment(params: {
  customerId: number | string;
  date: string;
  voucherNumber?: string;
  paymentAmount?: number;
  amount?: number;
  paymentMethod: "Cash" | "Bank";
  bankAccountId?: number | string;
  description?: string;
  tripRef?: string;
  receivedBy?: string;
}): {
  ledgerEntry: CustomerLedgerEntry | null;
  cashEntry?: CashTransactionData;
  bankEntry?: BankTransactionData | null;
  voucher: VoucherData;
} {
  const custId = Number(params.customerId);
  const customer = memoryStore.customers.find((c) => Number(c.Id) === custId);
  if (!customer) throw new Error(`Customer with ID ${custId} not found`);

  const amount = Math.max(0, Number(params.amount ?? params.paymentAmount) || 0);
  const prevDue = Number(customer.BalanceDue) || 0;
  const prevAdvance = Number(customer.Advance) || 0;

  // Strict Accounting Rules A, B, C, D:
  // Scenario A & B: Amount <= Due -> Reduces Due
  // Scenario C: Amount > Due -> Due becomes 0, excess increases Advance
  // Scenario D: Due == 0 -> Full amount increases Advance
  if (amount <= prevDue) {
    customer.BalanceDue = prevDue - amount;
  } else {
    const excess = amount - prevDue;
    customer.BalanceDue = 0;
    customer.Advance = prevAdvance + excess;
  }

  customer.UpdatedAt = new Date().toISOString();
  const currentNet = customer.BalanceDue - customer.Advance;
  const voucherNum =
    params.voucherNumber ||
    `CR-${params.date.replace(/-/g, "")}-${String(memoryStore.vouchers.length + 1).padStart(2, "0")}`;

  const ledgerEntry: CustomerLedgerEntry = {
    Id: Date.now() + Math.floor(Math.random() * 1000),
    CustomerId: custId,
    Date: params.date,
    VoucherNumber: voucherNum,
    TripRef: params.tripRef,
    Description: params.description || `Payment received from ${customer.Name}`,
    Debit: 0,
    Credit: amount,
    RunningBalance: currentNet,
    PaymentMethod: params.paymentMethod,
  };
  memoryStore.customerLedgers.push(ledgerEntry);

  let cashEntry: CashTransactionData | undefined;
  let bankEntry: BankTransactionData | null | undefined;

  // Update Cash or Bank
  if (params.paymentMethod === "Cash") {
    cashEntry = postCashTransaction({
      date: params.date,
      voucherNumber: voucherNum,
      description: `Customer Receipt: ${customer.Name}`,
      reference: params.tripRef,
      transactionType: "Customer Receipt",
      cashIn: amount,
      cashOut: 0,
    });
  } else if (params.paymentMethod === "Bank" && params.bankAccountId) {
    bankEntry = postBankTransaction({
      bankAccountId: Number(params.bankAccountId),
      date: params.date,
      voucherNumber: voucherNum,
      description: `Customer Bank Receipt: ${customer.Name}`,
      transactionType: "Customer Receipt",
      bankIn: amount,
      bankOut: 0,
      reference: params.tripRef,
    });
  }

  // Ensure Voucher is registered in memoryStore.vouchers
  let voucher = memoryStore.vouchers.find((v) => v.VoucherNumber === voucherNum);
  if (!voucher) {
    voucher = {
      Id: Date.now() + Math.floor(Math.random() * 1000),
      VoucherNumber: voucherNum,
      Date: params.date,
      PaymentType: params.paymentMethod === "Cash" ? "CashReceipt" : "BankReceipt",
      PartyType: "Customer",
      CustomerId: custId,
      Customer: { Name: customer.Name },
      BankAccountId: params.bankAccountId ? Number(params.bankAccountId) : undefined,
      Amount: amount,
      Remarks: params.description || `Receipt from ${customer.Name}`,
    };
    memoryStore.vouchers.unshift(voucher);
  }

  addAuditLog({
    username: params.receivedBy || "admin",
    action: "CUSTOMER_PAYMENT",
    module: "Customers",
    recordId: custId,
    details: `Payment of Rs. ${amount.toLocaleString()} (${params.paymentMethod}) received from ${customer.Name}. Prev Due: Rs. ${prevDue.toLocaleString()}, New Due: Rs. ${customer.BalanceDue.toLocaleString()}, Advance: Rs. ${customer.Advance.toLocaleString()}`,
    oldValue: `BalanceDue: ${prevDue}, Advance: ${prevAdvance}`,
    newValue: `BalanceDue: ${customer.BalanceDue}, Advance: ${customer.Advance}`,
    reference: voucherNum,
  });

  persistStore();

  return { ledgerEntry, cashEntry, bankEntry, voucher };
}

// ==========================================
// 3B. CUSTOMER DISBURSEMENT / OUTFLOW ENGINE
// ==========================================

export function postCustomerDisbursement(params: {
  customerId: number | string;
  date: string;
  voucherNumber?: string;
  amount?: number;
  paymentAmount?: number;
  paymentMethod: "Cash" | "Bank";
  bankAccountId?: number | string;
  description?: string;
  paidBy?: string;
}): {
  ledgerEntry: CustomerLedgerEntry;
  cashEntry?: CashTransactionData;
  bankEntry?: BankTransactionData | null;
  voucher: VoucherData;
} {
  const custId = Number(params.customerId);
  const customer = memoryStore.customers.find((c) => Number(c.Id) === custId);
  if (!customer) throw new Error(`Customer with ID ${custId} not found`);

  const amount = Math.max(0, Number(params.amount ?? params.paymentAmount) || 0);
  const prevDue = Number(customer.BalanceDue) || 0;
  const prevAdvance = Number(customer.Advance) || 0;

  // When money is paid OUT to customer (Cash Out / Bank Out):
  // It increases what customer owes us, or reduces advance they previously deposited.
  // Example A: Due = 10,000, Advance = 0. Pay 5,000 -> New Due = 15,000, Advance = 0, Status: DUE
  // Example B: Advance = 10,000, Due = 0. Pay 5,000 -> Advance = 5,000, Due = 0, Status: ADVANCE
  // Example C: Balance = 0. Pay 5,000 -> Due = 5,000, Advance = 0, Status: DUE
  // Example E: Advance = 2,000. Pay 5,000 -> Advance consumed (0), Due = 3,000, Status: DUE
  if (prevAdvance > 0) {
    if (amount <= prevAdvance) {
      customer.Advance = prevAdvance - amount;
      customer.BalanceDue = 0;
    } else {
      const excess = amount - prevAdvance;
      customer.Advance = 0;
      customer.BalanceDue = prevDue + excess;
    }
  } else {
    customer.BalanceDue = prevDue + amount;
    customer.Advance = 0;
  }

  customer.UpdatedAt = new Date().toISOString();
  const currentNet = customer.BalanceDue - customer.Advance;
  const voucherNum =
    params.voucherNumber ||
    `${params.paymentMethod === "Cash" ? "CP" : "BP"}-${params.date.replace(/-/g, "")}-${String(memoryStore.vouchers.length + 1).padStart(2, "0")}`;

  const ledgerEntry: CustomerLedgerEntry = {
    Id: Date.now() + Math.floor(Math.random() * 1000),
    CustomerId: custId,
    Date: params.date,
    VoucherNumber: voucherNum,
    Description: params.description || `Payment disbursed / refunded to customer ${customer.Name}`,
    Debit: amount, // Charges / Outflow increases customer debt
    Credit: 0,
    RunningBalance: currentNet,
    PaymentMethod: params.paymentMethod,
  };
  memoryStore.customerLedgers.push(ledgerEntry);

  let cashEntry: CashTransactionData | undefined;
  let bankEntry: BankTransactionData | null | undefined;

  // Update Cash or Bank Outflow
  if (params.paymentMethod === "Cash") {
    cashEntry = postCashTransaction({
      date: params.date,
      voucherNumber: voucherNum,
      description: `Customer Cash Payment Out: ${customer.Name}`,
      transactionType: "Customer Payment",
      cashIn: 0,
      cashOut: amount,
    });
  } else if (params.paymentMethod === "Bank" && params.bankAccountId) {
    bankEntry = postBankTransaction({
      bankAccountId: Number(params.bankAccountId),
      date: params.date,
      voucherNumber: voucherNum,
      description: `Customer Bank Payment Out: ${customer.Name}`,
      transactionType: "Customer Payment",
      bankIn: 0,
      bankOut: amount,
    });
  }

  // Ensure Voucher is registered in memoryStore.vouchers
  let voucher = memoryStore.vouchers.find((v) => v.VoucherNumber === voucherNum);
  if (!voucher) {
    voucher = {
      Id: Date.now() + Math.floor(Math.random() * 1000),
      VoucherNumber: voucherNum,
      Date: params.date,
      PaymentType: params.paymentMethod === "Cash" ? "CashPayment" : "BankPayment",
      PartyType: "Customer",
      CustomerId: custId,
      Customer: { Name: customer.Name },
      BankAccountId: params.bankAccountId ? Number(params.bankAccountId) : undefined,
      Amount: amount,
      Remarks: params.description || `Disbursement / refund to customer ${customer.Name}`,
    };
    memoryStore.vouchers.unshift(voucher);
  }

  addAuditLog({
    username: params.paidBy || "admin",
    action: "CUSTOMER_DISBURSEMENT",
    module: "Customers",
    recordId: custId,
    details: `Disbursement of Rs. ${amount.toLocaleString()} (${params.paymentMethod}) paid to customer ${customer.Name}. Prev Due: Rs. ${prevDue.toLocaleString()}, Prev Adv: Rs. ${prevAdvance.toLocaleString()} -> New Due: Rs. ${customer.BalanceDue.toLocaleString()}, New Adv: Rs. ${customer.Advance.toLocaleString()}`,
    oldValue: `BalanceDue: ${prevDue}, Advance: ${prevAdvance}`,
    newValue: `BalanceDue: ${customer.BalanceDue}, Advance: ${customer.Advance}`,
    reference: voucherNum,
  });

  persistStore();

  return { ledgerEntry, cashEntry, bankEntry, voucher };
}

export function applyCustomerAdvance(params: {
  customerId: number;
  date: string;
  tripRef: string;
  appliedAmount: number;
}): CustomerLedgerEntry | null {
  const custId = Number(params.customerId);
  const customer = memoryStore.customers.find((c) => Number(c.Id) === custId);
  if (!customer) return null;

  const applied = Math.max(0, Number(params.appliedAmount) || 0);
  const prevAdvance = Number(customer.Advance) || 0;
  const actualApplied = Math.min(applied, prevAdvance);

  customer.Advance = prevAdvance - actualApplied;
  customer.UpdatedAt = new Date().toISOString();
  const currentNet = (Number(customer.BalanceDue) || 0) - customer.Advance;

  const entry: CustomerLedgerEntry = {
    Id: Date.now() + Math.floor(Math.random() * 1000),
    CustomerId: custId,
    Date: params.date,
    VoucherNumber: `ADV-ADJ-${params.tripRef}`,
    TripRef: params.tripRef,
    Description: `Applied existing customer advance to Trip #${params.tripRef}`,
    Debit: 0,
    Credit: actualApplied,
    RunningBalance: currentNet,
    PaymentMethod: "AdvanceAdjustment",
  };

  memoryStore.customerLedgers.push(entry);

  addAuditLog({
    action: "ADVANCE_APPLIED",
    module: "Customers",
    recordId: custId,
    details: `Applied advance Rs. ${actualApplied.toLocaleString()} for ${customer.Name} on Trip #${params.tripRef}. Remaining advance: Rs. ${customer.Advance.toLocaleString()}`,
    oldValue: `Advance: ${prevAdvance}`,
    newValue: `Advance: ${customer.Advance}`,
    reference: `ADV-ADJ-${params.tripRef}`,
  });

  return entry;
}

// ==========================================
// 4. SUPPLIER LEDGER ENGINE
// ==========================================

export function postSupplierPayment(params: {
  supplierId: number | string;
  date: string;
  voucherNumber?: string;
  paymentAmount?: number;
  amount?: number;
  paymentMethod: "Cash" | "Bank";
  bankAccountId?: number | string;
  description?: string;
  paidBy?: string;
}): {
  ledgerEntry: SupplierLedgerEntry | null;
  cashEntry?: CashTransactionData;
  bankEntry?: BankTransactionData | null;
  voucher: VoucherData;
} {
  const suppId = Number(params.supplierId);
  const supplier = memoryStore.suppliers.find((s) => Number(s.Id) === suppId);
  if (!supplier) throw new Error(`Supplier with ID ${suppId} not found`);

  const amount = Math.max(0, Number(params.amount ?? params.paymentAmount) || 0);
  const prevDue = Number(supplier.BalanceDue) || 0;
  const prevAdvance = Number(supplier.Advance) || 0;

  if (amount <= prevDue) {
    supplier.BalanceDue = prevDue - amount;
  } else {
    const excess = amount - prevDue;
    supplier.BalanceDue = 0;
    supplier.Advance = prevAdvance + excess;
  }

  supplier.UpdatedAt = new Date().toISOString();
  const currentNet = supplier.BalanceDue - supplier.Advance;
  const voucherNum =
    params.voucherNumber ||
    `CP-${params.date.replace(/-/g, "")}-${String(memoryStore.vouchers.length + 1).padStart(2, "0")}`;

  const ledgerEntry: SupplierLedgerEntry = {
    Id: Date.now() + Math.floor(Math.random() * 1000),
    SupplierId: suppId,
    Date: params.date,
    VoucherNumber: voucherNum,
    Description: params.description || `Payment disbursed to ${supplier.Name}`,
    Debit: amount, // Reduces our liability
    Credit: 0,
    RunningBalance: currentNet,
    PaymentMethod: params.paymentMethod,
  };
  memoryStore.supplierLedgers.push(ledgerEntry);

  let cashEntry: CashTransactionData | undefined;
  let bankEntry: BankTransactionData | null | undefined;

  if (params.paymentMethod === "Cash") {
    cashEntry = postCashTransaction({
      date: params.date,
      voucherNumber: voucherNum,
      description: `Supplier Payment: ${supplier.Name}`,
      transactionType: "Supplier Payment",
      cashIn: 0,
      cashOut: amount,
    });
  } else if (params.paymentMethod === "Bank" && params.bankAccountId) {
    bankEntry = postBankTransaction({
      bankAccountId: Number(params.bankAccountId),
      date: params.date,
      voucherNumber: voucherNum,
      description: `Supplier Bank Payment: ${supplier.Name}`,
      transactionType: "Supplier Payment",
      bankIn: 0,
      bankOut: amount,
    });
  }

  // Ensure Voucher is registered in memoryStore.vouchers
  let voucher = memoryStore.vouchers.find((v) => v.VoucherNumber === voucherNum);
  if (!voucher) {
    voucher = {
      Id: Date.now() + Math.floor(Math.random() * 1000),
      VoucherNumber: voucherNum,
      Date: params.date,
      PaymentType: params.paymentMethod === "Cash" ? "CashPayment" : "BankPayment",
      PartyType: "Supplier",
      SupplierId: suppId,
      Supplier: { Name: supplier.Name },
      BankAccountId: params.bankAccountId ? Number(params.bankAccountId) : undefined,
      Amount: amount,
      Remarks: params.description || `Payment to ${supplier.Name}`,
    };
    memoryStore.vouchers.unshift(voucher);
  }

  addAuditLog({
    username: params.paidBy || "admin",
    action: "SUPPLIER_PAYMENT",
    module: "Suppliers",
    recordId: suppId,
    details: `Payment of Rs. ${amount.toLocaleString()} (${params.paymentMethod}) disbursed to ${supplier.Name}. Prev Due: Rs. ${prevDue.toLocaleString()}, New Due: Rs. ${supplier.BalanceDue.toLocaleString()}, Advance: Rs. ${supplier.Advance.toLocaleString()}`,
    oldValue: `BalanceDue: ${prevDue}, Advance: ${prevAdvance}`,
    newValue: `BalanceDue: ${supplier.BalanceDue}, Advance: ${supplier.Advance}`,
    reference: voucherNum,
  });

  persistStore();

  return { ledgerEntry, cashEntry, bankEntry, voucher };
}

// ==========================================
// 4B. SUPPLIER REFUND / INFLOW ENGINE
// ==========================================

export function postSupplierRefund(params: {
  supplierId: number | string;
  date: string;
  voucherNumber?: string;
  amount?: number;
  paymentAmount?: number;
  paymentMethod: "Cash" | "Bank";
  bankAccountId?: number | string;
  description?: string;
  receivedBy?: string;
}): {
  ledgerEntry: SupplierLedgerEntry;
  cashEntry?: CashTransactionData;
  bankEntry?: BankTransactionData | null;
  voucher: VoucherData;
} {
  const suppId = Number(params.supplierId);
  const supplier = memoryStore.suppliers.find((s) => Number(s.Id) === suppId);
  if (!supplier) throw new Error(`Supplier with ID ${suppId} not found`);

  const amount = Math.max(0, Number(params.amount ?? params.paymentAmount) || 0);
  const prevDue = Number(supplier.BalanceDue) || 0;
  const prevAdvance = Number(supplier.Advance) || 0;

  // When supplier refunds us money (Cash In / Bank In):
  // It reduces advance we previously paid them, or increases our payable due.
  if (prevAdvance > 0) {
    if (amount <= prevAdvance) {
      supplier.Advance = prevAdvance - amount;
      supplier.BalanceDue = 0;
    } else {
      const excess = amount - prevAdvance;
      supplier.Advance = 0;
      supplier.BalanceDue = prevDue + excess;
    }
  } else {
    supplier.BalanceDue = prevDue + amount;
    supplier.Advance = 0;
  }

  supplier.UpdatedAt = new Date().toISOString();
  const currentNet = supplier.BalanceDue - supplier.Advance;
  const voucherNum =
    params.voucherNumber ||
    `${params.paymentMethod === "Cash" ? "CR" : "BR"}-${params.date.replace(/-/g, "")}-${String(memoryStore.vouchers.length + 1).padStart(2, "0")}`;

  const ledgerEntry: SupplierLedgerEntry = {
    Id: Date.now() + Math.floor(Math.random() * 1000),
    SupplierId: suppId,
    Date: params.date,
    VoucherNumber: voucherNum,
    Description: params.description || `Refund received from supplier ${supplier.Name}`,
    Debit: 0,
    Credit: amount, // Inward receipt reduces advance or increases payable
    RunningBalance: currentNet,
    PaymentMethod: params.paymentMethod,
  };
  memoryStore.supplierLedgers.push(ledgerEntry);

  let cashEntry: CashTransactionData | undefined;
  let bankEntry: BankTransactionData | null | undefined;

  if (params.paymentMethod === "Cash") {
    cashEntry = postCashTransaction({
      date: params.date,
      voucherNumber: voucherNum,
      description: `Supplier Cash Refund: ${supplier.Name}`,
      transactionType: "Supplier Refund",
      cashIn: amount,
      cashOut: 0,
    });
  } else if (params.paymentMethod === "Bank" && params.bankAccountId) {
    bankEntry = postBankTransaction({
      bankAccountId: Number(params.bankAccountId),
      date: params.date,
      voucherNumber: voucherNum,
      description: `Supplier Bank Refund: ${supplier.Name}`,
      transactionType: "Supplier Refund",
      bankIn: amount,
      bankOut: 0,
    });
  }

  let voucher = memoryStore.vouchers.find((v) => v.VoucherNumber === voucherNum);
  if (!voucher) {
    voucher = {
      Id: Date.now() + Math.floor(Math.random() * 1000),
      VoucherNumber: voucherNum,
      Date: params.date,
      PaymentType: params.paymentMethod === "Cash" ? "CashReceipt" : "BankReceipt",
      PartyType: "Supplier",
      SupplierId: suppId,
      Supplier: { Name: supplier.Name },
      BankAccountId: params.bankAccountId ? Number(params.bankAccountId) : undefined,
      Amount: amount,
      Remarks: params.description || `Refund from supplier ${supplier.Name}`,
    };
    memoryStore.vouchers.unshift(voucher);
  }

  addAuditLog({
    username: params.receivedBy || "admin",
    action: "SUPPLIER_REFUND",
    module: "Suppliers",
    recordId: suppId,
    details: `Refund of Rs. ${amount.toLocaleString()} (${params.paymentMethod}) received from supplier ${supplier.Name}. Prev Due: Rs. ${prevDue.toLocaleString()}, Prev Adv: Rs. ${prevAdvance.toLocaleString()} -> New Due: Rs. ${supplier.BalanceDue.toLocaleString()}, New Adv: Rs. ${supplier.Advance.toLocaleString()}`,
    oldValue: `BalanceDue: ${prevDue}, Advance: ${prevAdvance}`,
    newValue: `BalanceDue: ${supplier.BalanceDue}, Advance: ${supplier.Advance}`,
    reference: voucherNum,
  });

  persistStore();

  return { ledgerEntry, cashEntry, bankEntry, voucher };
}

// ==========================================
// 5. UNIFIED VOUCHER PROCESSING PIPELINE
// ==========================================

export function processVoucher(v: {
  VoucherNumber?: string;
  Date: string;
  PaymentType: string;
  PartyType: string;
  PartyId?: number;
  CustomerId?: number;
  SupplierId?: number;
  StaffId?: number;
  BankAccountId?: number;
  GariNo?: string;
  DriverName?: string;
  Amount: number;
  Remarks?: string;
}): VoucherData {
  const amount = Math.max(0, Number(v.Amount) || 0);
  const vNum =
    v.VoucherNumber ||
    `${v.PaymentType.substring(0, 2).toUpperCase()}-${v.Date.replace(/-/g, "")}-${Math.floor(100 + Math.random() * 900)}`;

  const isCash = v.PaymentType.startsWith("Cash") || v.PaymentType.includes("Cash");
  const isInflow =
    v.PaymentType.includes("Receipt") ||
    v.PaymentType === "CustomerReceipt" ||
    v.PaymentType === "CashReceipt" ||
    v.PaymentType === "BankReceipt" ||
    v.PaymentType === "OtherIncome";

  // 1. Process Party-Specific Ledgers
  if (v.PartyType === "Customer" && v.CustomerId) {
    if (isInflow) {
      postCustomerPayment({
        customerId: Number(v.CustomerId),
        date: v.Date,
        voucherNumber: vNum,
        paymentAmount: amount,
        paymentMethod: isCash ? "Cash" : "Bank",
        bankAccountId: v.BankAccountId ? Number(v.BankAccountId) : undefined,
        description: v.Remarks,
      });
    } else {
      // Customer Outflow / Disbursement (CRITICAL ACCOUNTING BUG FIX)
      postCustomerDisbursement({
        customerId: Number(v.CustomerId),
        date: v.Date,
        voucherNumber: vNum,
        amount: amount,
        paymentMethod: isCash ? "Cash" : "Bank",
        bankAccountId: v.BankAccountId ? Number(v.BankAccountId) : undefined,
        description: v.Remarks,
      });
    }
  } else if (v.PartyType === "Supplier" && v.SupplierId) {
    if (!isInflow) {
      postSupplierPayment({
        supplierId: Number(v.SupplierId),
        date: v.Date,
        voucherNumber: vNum,
        paymentAmount: amount,
        paymentMethod: isCash ? "Cash" : "Bank",
        bankAccountId: v.BankAccountId ? Number(v.BankAccountId) : undefined,
        description: v.Remarks,
      });
    } else {
      // Supplier Inflow / Refund
      postSupplierRefund({
        supplierId: Number(v.SupplierId),
        date: v.Date,
        voucherNumber: vNum,
        amount: amount,
        paymentMethod: isCash ? "Cash" : "Bank",
        bankAccountId: v.BankAccountId ? Number(v.BankAccountId) : undefined,
        description: v.Remarks,
      });
    }
  } else if (v.PartyType === "Staff" && v.StaffId) {
    const staff = memoryStore.staff.find((s) => s.Id === v.StaffId);
    if (staff) {
      if (!isInflow) {
        // Staff Salary or Advance Payment
        if (isCash) {
          postCashTransaction({
            date: v.Date,
            voucherNumber: vNum,
            description: `Staff Payment: ${staff.Name} (${v.Remarks || "Salary/Advance"})`,
            transactionType: "Staff Payment",
            cashIn: 0,
            cashOut: amount,
          });
        } else if (v.BankAccountId) {
          postBankTransaction({
            bankAccountId: v.BankAccountId,
            date: v.Date,
            voucherNumber: vNum,
            description: `Staff Bank Payment: ${staff.Name}`,
            transactionType: "Staff Payment",
            bankIn: 0,
            bankOut: amount,
          });
        }
      }
    }
  } else if (v.PartyType === "Vehicle" && v.GariNo) {
    if (!isInflow) {
      if (isCash) {
        postCashTransaction({
          date: v.Date,
          voucherNumber: vNum,
          description: `Vehicle Expense: #${v.GariNo} ${v.DriverName ? `(${v.DriverName})` : ""} - ${v.Remarks || "Maintenance"}`,
          reference: v.GariNo,
          transactionType: "Vehicle Expense",
          cashIn: 0,
          cashOut: amount,
        });
      } else if (v.BankAccountId) {
        postBankTransaction({
          bankAccountId: v.BankAccountId,
          date: v.Date,
          voucherNumber: vNum,
          description: `Vehicle Bank Expense: #${v.GariNo}`,
          transactionType: "Vehicle Expense",
          bankIn: 0,
          bankOut: amount,
          reference: v.GariNo,
        });
      }
    }
  } else {
    // General Income / Expense
    if (isCash) {
      postCashTransaction({
        date: v.Date,
        voucherNumber: vNum,
        description: v.Remarks || (isInflow ? "General Cash Receipt" : "General Cash Expense"),
        transactionType: isInflow ? "Other Income" : "Expense",
        cashIn: isInflow ? amount : 0,
        cashOut: isInflow ? 0 : amount,
      });
    } else if (v.BankAccountId) {
      postBankTransaction({
        bankAccountId: v.BankAccountId,
        date: v.Date,
        voucherNumber: vNum,
        description: v.Remarks || (isInflow ? "General Bank Receipt" : "General Bank Expense"),
        transactionType: isInflow ? "Other Income" : "Expense",
        bankIn: isInflow ? amount : 0,
        bankOut: isInflow ? 0 : amount,
      });
    }
  }

  // Find Party Names for Denormalized Display
  let custObj: { Name: string } | undefined;
  let suppObj: { Name: string } | undefined;
  let staffObj: { Name: string } | undefined;

  if (v.CustomerId) {
    const c = memoryStore.customers.find((cust) => cust.Id === v.CustomerId);
    if (c) custObj = { Name: c.Name };
  }
  if (v.SupplierId) {
    const s = memoryStore.suppliers.find((supp) => supp.Id === v.SupplierId);
    if (s) suppObj = { Name: s.Name };
  }
  if (v.StaffId) {
    const st = memoryStore.staff.find((stf) => stf.Id === v.StaffId);
    if (st) staffObj = { Name: st.Name };
  }

  let voucherRecord = memoryStore.vouchers.find((vRec) => vRec.VoucherNumber === vNum);
  if (voucherRecord) {
    if (custObj && !voucherRecord.Customer) voucherRecord.Customer = custObj;
    if (suppObj && !voucherRecord.Supplier) voucherRecord.Supplier = suppObj;
    if (staffObj && !voucherRecord.Staff) voucherRecord.Staff = staffObj;
    if (v.Remarks && !voucherRecord.Remarks) voucherRecord.Remarks = v.Remarks;
  } else {
    voucherRecord = {
      Id: Date.now() + Math.floor(Math.random() * 100),
      VoucherNumber: vNum,
      Date: v.Date,
      PaymentType: v.PaymentType,
      PartyType: v.PartyType,
      CustomerId: v.CustomerId,
      SupplierId: v.SupplierId,
      StaffId: v.StaffId,
      BankAccountId: v.BankAccountId,
      GariNo: v.GariNo,
      DriverName: v.DriverName,
      Customer: custObj,
      Supplier: suppObj,
      Staff: staffObj,
      Amount: amount,
      Remarks: v.Remarks,
    };
    memoryStore.vouchers.unshift(voucherRecord);
  }

  persistStore();
  return voucherRecord;
}

// ==========================================
// 8. VEHICLE DAILY TRACKING & TIMELINE ENGINE
// ==========================================

export function syncVehicleTrackingFromRoznamcha(entry: RoznamchaItemData): void {
  const gUpper = entry.gariNo.trim().toUpperCase();
  const dateStr = entry.date;
  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  const vehicle = memoryStore.gariyan.find(
    (g) => g.gariNo.trim().toUpperCase() === gUpper
  );
  const vehicleName = vehicle ? `${vehicle.capacity || "Fleet Vehicle"} (${vehicle.malik})` : "Fleet Vehicle";

  const startingLoc = entry.fromLocation || "Site Area Hub Plant";
  const destination = entry.toLocation || "Site Delivery Point";

  // Check if today's status already exists for this vehicle
  let dailyStatus = memoryStore.vehicleStatuses.find(
    (s) => s.gariNo.trim().toUpperCase() === gUpper && s.date === dateStr
  );

  if (dailyStatus) {
    dailyStatus.tripId = entry.id;
    dailyStatus.tripNumber = `TRIP-${String(entry.id).padStart(3, "0")}`;
    dailyStatus.driverName = entry.driverName;
    dailyStatus.startingLocation = startingLoc;
    dailyStatus.destination = destination;
    dailyStatus.currentLocation = `${startingLoc} (Dispatched)`;
    dailyStatus.status = "On the Way";
    dailyStatus.departureTime = timeStr;
    dailyStatus.lastUpdated = `${dateStr} ${timeStr}`;
    dailyStatus.updatedBy = "Roznamcha Dispatch";
  } else {
    dailyStatus = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      gariNo: entry.gariNo,
      vehicleName,
      driverName: entry.driverName,
      date: dateStr,
      tripId: entry.id,
      tripNumber: `TRIP-${String(entry.id).padStart(3, "0")}`,
      startingLocation: startingLoc,
      currentLocation: `${startingLoc} (Dispatched)`,
      destination: destination,
      departureTime: timeStr,
      status: "On the Way",
      lastUpdated: `${dateStr} ${timeStr}`,
      updatedBy: "Roznamcha Dispatch",
    };
    memoryStore.vehicleStatuses.push(dailyStatus);
  }

  // Record an immutable status timeline history event
  const historyEvent = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    gariNo: entry.gariNo,
    driverName: entry.driverName,
    tripId: entry.id,
    date: dateStr,
    time: timeStr,
    location: startingLoc,
    startingLocation: startingLoc,
    destination: destination,
    status: "On the Way" as const,
    remarks: `Trip recorded via Daily Roznamcha: ${entry.maal || "Material"} (${entry.unitQuantity || 1} ${entry.unit || "Cargo"}), freight Rs. ${entry.kiraya.toLocaleString()}. Moving towards ${destination}.`,
    updatedBy: "Roznamcha Dispatch",
    createdAt: new Date().toISOString(),
  };

  memoryStore.vehicleStatusHistory.push(historyEvent);
}

export function updateVehicleStatus(params: {
  gariNo: string;
  driverName?: string;
  status: any;
  currentLocation: string;
  destination?: string;
  tripId?: number;
  remarks?: string;
  date?: string;
  time?: string;
  updatedBy?: string;
}) {
  const gUpper = params.gariNo.trim().toUpperCase();
  const dateStr = params.date || new Date().toISOString().split("T")[0];
  const timeStr = params.time || new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  const updatedBy = params.updatedBy || "Operations Officer";

  const vehicle = memoryStore.gariyan.find(
    (g) => g.gariNo.trim().toUpperCase() === gUpper
  );
  const vehicleName = vehicle ? `${vehicle.capacity || "Fleet Vehicle"} (${vehicle.malik})` : "Fleet Vehicle";

  let dailyStatus = memoryStore.vehicleStatuses.find(
    (s) => s.gariNo.trim().toUpperCase() === gUpper && s.date === dateStr
  );

  if (dailyStatus) {
    dailyStatus.status = params.status;
    dailyStatus.currentLocation = params.currentLocation;
    if (params.destination) dailyStatus.destination = params.destination;
    if (params.driverName) dailyStatus.driverName = params.driverName;
    if (params.tripId) dailyStatus.tripId = params.tripId;
    dailyStatus.lastUpdated = `${dateStr} ${timeStr}`;
    dailyStatus.updatedBy = updatedBy;
  } else {
    dailyStatus = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      gariNo: params.gariNo,
      vehicleName,
      driverName: params.driverName || (vehicle ? vehicle.driverName : "Driver"),
      date: dateStr,
      tripId: params.tripId,
      tripNumber: params.tripId ? `TRIP-${String(params.tripId).padStart(3, "0")}` : undefined,
      startingLocation: params.currentLocation,
      currentLocation: params.currentLocation,
      destination: params.destination || "Base / Available",
      status: params.status,
      lastUpdated: `${dateStr} ${timeStr}`,
      updatedBy: updatedBy,
    };
    memoryStore.vehicleStatuses.push(dailyStatus);
  }

  // Append immutable history record
  const historyRecord = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    gariNo: params.gariNo,
    driverName: params.driverName || dailyStatus.driverName,
    tripId: params.tripId || dailyStatus.tripId,
    date: dateStr,
    time: timeStr,
    location: params.currentLocation,
    destination: params.destination || dailyStatus.destination,
    startingLocation: dailyStatus.startingLocation,
    status: params.status,
    remarks: params.remarks || `Status updated to ${params.status} at ${params.currentLocation}`,
    updatedBy: updatedBy,
    createdAt: new Date().toISOString(),
  };

  memoryStore.vehicleStatusHistory.push(historyRecord);
  return { dailyStatus, historyRecord };
}

// ==========================================
// 8. BALANCE RECONCILIATION & AUDIT ENGINE
// ==========================================

export function reconcileCustomerBalance(customerId: number): {
  customer: any;
  openingBalance: number;
  totalDebits: number;
  totalCredits: number;
  calculatedClosing: number;
  calculatedDue: number;
  actualDue: number;
  currentDue: number;
  currentAdvance: number;
  isReconciled: boolean;
  isConsistent: boolean;
} {
  const custId = Number(customerId);
  const customer = memoryStore.customers.find((c) => Number(c.Id) === custId);
  if (!customer) throw new Error("Customer not found");

  const transactions = memoryStore.customerLedgers.filter((t) => Number(t.CustomerId) === custId);
  const openingBalance = 0;
  const totalDebits = transactions.reduce((sum, t) => sum + (Number(t.Debit) || 0), 0);
  const totalCredits = transactions.reduce((sum, t) => sum + (Number(t.Credit) || 0), 0);
  const calculatedClosing = openingBalance + totalDebits - totalCredits;

  const currentDue = Number(customer.BalanceDue) || 0;
  const currentAdvance = Number(customer.Advance) || 0;
  const currentNet = currentDue - currentAdvance;

  const isReconciled = calculatedClosing === currentNet;

  return {
    customer,
    openingBalance,
    totalDebits,
    totalCredits,
    calculatedClosing,
    calculatedDue: currentDue,
    actualDue: currentDue,
    currentDue,
    currentAdvance,
    isReconciled,
    isConsistent: isReconciled,
  };
}

export function reconcileSupplierBalance(supplierId: number): {
  supplier: any;
  openingBalance: number;
  totalPurchases: number;
  totalPayments: number;
  calculatedPayable: number;
  currentPayable: number;
  actualPayable: number;
  currentAdvance: number;
  isReconciled: boolean;
  isConsistent: boolean;
} {
  const suppId = Number(supplierId);
  const supplier = memoryStore.suppliers.find((s) => Number(s.Id) === suppId);
  if (!supplier) throw new Error("Supplier not found");

  const transactions = memoryStore.supplierLedgers.filter((t) => Number(t.SupplierId) === suppId);
  const openingBalance = 0;
  const totalPurchases = transactions.reduce((sum, t) => sum + (Number(t.Credit) || 0), 0);
  const totalPayments = transactions.reduce((sum, t) => sum + (Number(t.Debit) || 0), 0);
  const calculatedPayable = openingBalance + totalPurchases - totalPayments;

  const currentPayable = Number(supplier.BalanceDue) || 0;
  const currentAdvance = Number(supplier.Advance) || 0;
  const currentNet = currentPayable - currentAdvance;
  const isReconciled = calculatedPayable === currentNet;

  return {
    supplier,
    openingBalance,
    totalPurchases,
    totalPayments,
    calculatedPayable,
    currentPayable,
    actualPayable: currentPayable,
    currentAdvance,
    isReconciled,
    isConsistent: isReconciled,
  };
}

export function reconcileCashBalance(): {
  openingCash: number;
  totalCashIn: number;
  totalCashOut: number;
  calculatedCash: number;
  currentCash: number;
  isReconciled: boolean;
} {
  const openingEntry = memoryStore.cashTransactions.find((t) => t.TransactionType === "Opening Cash");
  const openingCash = openingEntry ? Number(openingEntry.CashIn) || 0 : 0;

  const totalCashIn = memoryStore.cashTransactions.reduce((acc, t) => acc + (Number(t.CashIn) || 0), 0);
  const totalCashOut = memoryStore.cashTransactions.reduce((acc, t) => acc + (Number(t.CashOut) || 0), 0);
  const calculatedCash = totalCashIn - totalCashOut;
  const currentCash = getCurrentCashBalance();

  return {
    openingCash,
    totalCashIn,
    totalCashOut,
    calculatedCash,
    currentCash,
    isReconciled: calculatedCash === currentCash,
  };
}

export function reconcileBankBalance(bankAccountId: number): {
  account: BankAccountData;
  openingBalance: number;
  totalBankIn: number;
  totalBankOut: number;
  calculatedBalance: number;
  calculatedClosing: number;
  currentBalance: number;
  actualBalance: number;
  isReconciled: boolean;
  isConsistent: boolean;
} {
  const bId = Number(bankAccountId);
  const account = memoryStore.bankAccounts.find((b) => Number(b.Id) === bId);
  if (!account) throw new Error("Bank account not found");

  const txs = memoryStore.bankTransactions.filter((t) => Number(t.BankAccountId) === bId);
  const totalBankIn = txs.reduce((acc, t) => acc + (Number(t.BankIn) || 0), 0);
  const totalBankOut = txs.reduce((acc, t) => acc + (Number(t.BankOut) || 0), 0);
  const calculatedBalance = totalBankIn - totalBankOut;
  const currentBalance = Number(account.CurrentBalance) || 0;

  return {
    account,
    openingBalance: Number(account.OpeningBalance) || 0,
    totalBankIn,
    totalBankOut,
    calculatedBalance,
    calculatedClosing: calculatedBalance,
    currentBalance,
    actualBalance: currentBalance,
    isReconciled: calculatedBalance === currentBalance,
    isConsistent: calculatedBalance === currentBalance,
  };
}

// ==========================================
// 10. COMPREHENSIVE DATABASE AUDIT & CLEANING ENGINE
// ==========================================

export function auditAndCleanDatabase(): {
  success: boolean;
  timestamp: string;
  customersAudited: number;
  suppliersAudited: number;
  cashReconciled: boolean;
  bankAccountsReconciled: number;
  correctionsMade: string[];
  summary: {
    totalCustomers: number;
    totalSuppliers: number;
    totalRoznamcha: number;
    totalVouchers: number;
    totalProducts: number;
    totalStaff: number;
    totalBankAccounts: number;
    cashBalance: number;
  };
} {
  const corrections: string[] = [];
  const todayStr = new Date().toISOString().split("T")[0];

  // 1. Audit & Clean Customers
  memoryStore.customers.forEach((customer) => {
    const custId = Number(customer.Id);
    let ledgers = memoryStore.customerLedgers.filter((l) => Number(l.CustomerId) === custId);

    // If customer has a balance or advance but 0 ledger entries, create opening entry
    if (ledgers.length === 0) {
      if ((customer.BalanceDue || 0) > 0) {
        const opEntry: CustomerLedgerEntry = {
          Id: Date.now() + Math.floor(Math.random() * 1000),
          CustomerId: custId,
          Date: customer.CreatedAt ? customer.CreatedAt.split("T")[0] : todayStr,
          VoucherNumber: `OP-DUE-${custId}`,
          Description: `Opening Balance Due for ${customer.Name}`,
          Debit: Number(customer.BalanceDue) || 0,
          Credit: 0,
          RunningBalance: Number(customer.BalanceDue) || 0,
          PaymentMethod: "Credit",
        };
        memoryStore.customerLedgers.push(opEntry);
        corrections.push(`Added opening due ledger entry for customer ${customer.Name} (Rs. ${customer.BalanceDue})`);
      } else if ((customer.Advance || 0) > 0) {
        const opEntry: CustomerLedgerEntry = {
          Id: Date.now() + Math.floor(Math.random() * 1000),
          CustomerId: custId,
          Date: customer.CreatedAt ? customer.CreatedAt.split("T")[0] : todayStr,
          VoucherNumber: `OP-ADV-${custId}`,
          Description: `Opening Advance Balance for ${customer.Name}`,
          Debit: 0,
          Credit: Number(customer.Advance) || 0,
          RunningBalance: -(Number(customer.Advance) || 0),
          PaymentMethod: "Bank",
        };
        memoryStore.customerLedgers.push(opEntry);
        corrections.push(`Added opening advance ledger entry for customer ${customer.Name} (Rs. ${customer.Advance})`);
      }
    }

    // Recalculate sequential ledger balances
    ledgers = memoryStore.customerLedgers.filter((l) => Number(l.CustomerId) === custId);
    let runningNet = 0;
    ledgers.forEach((entry) => {
      runningNet += (Number(entry.Debit) || 0) - (Number(entry.Credit) || 0);
      entry.RunningBalance = runningNet;
    });

    const expectedDue = runningNet > 0 ? runningNet : 0;
    const expectedAdvance = runningNet < 0 ? Math.abs(runningNet) : 0;

    if (customer.BalanceDue !== expectedDue || customer.Advance !== expectedAdvance) {
      corrections.push(
        `Synchronized customer ${customer.Name}: Due changed from ${customer.BalanceDue} to ${expectedDue}, Advance changed from ${customer.Advance} to ${expectedAdvance}`
      );
      customer.BalanceDue = expectedDue;
      customer.Advance = expectedAdvance;
      customer.UpdatedAt = new Date().toISOString();
    }
  });

  // 2. Audit & Clean Suppliers
  memoryStore.suppliers.forEach((supplier) => {
    const suppId = Number(supplier.Id);
    let ledgers = memoryStore.supplierLedgers.filter((l) => Number(l.SupplierId) === suppId);

    // If supplier has a balance or advance but 0 ledger entries, create opening entry
    if (ledgers.length === 0) {
      if ((supplier.BalanceDue || 0) > 0) {
        const opEntry: SupplierLedgerEntry = {
          Id: Date.now() + Math.floor(Math.random() * 1000),
          SupplierId: suppId,
          Date: supplier.CreatedAt ? supplier.CreatedAt.split("T")[0] : todayStr,
          VoucherNumber: `OP-DUE-SUP-${suppId}`,
          Description: `Opening Payable Balance for ${supplier.Name}`,
          Debit: 0,
          Credit: Number(supplier.BalanceDue) || 0,
          RunningBalance: Number(supplier.BalanceDue) || 0,
          PaymentMethod: "Credit",
        };
        memoryStore.supplierLedgers.push(opEntry);
        corrections.push(`Added opening payable ledger entry for supplier ${supplier.Name} (Rs. ${supplier.BalanceDue})`);
      } else if ((supplier.Advance || 0) > 0) {
        const opEntry: SupplierLedgerEntry = {
          Id: Date.now() + Math.floor(Math.random() * 1000),
          SupplierId: suppId,
          Date: supplier.CreatedAt ? supplier.CreatedAt.split("T")[0] : todayStr,
          VoucherNumber: `OP-ADV-SUP-${suppId}`,
          Description: `Opening Advance Deposit for ${supplier.Name}`,
          Debit: Number(supplier.Advance) || 0,
          Credit: 0,
          RunningBalance: Number(supplier.Advance) || 0,
          PaymentMethod: "Bank",
        };
        memoryStore.supplierLedgers.push(opEntry);
        corrections.push(`Added opening advance deposit entry for supplier ${supplier.Name} (Rs. ${supplier.Advance})`);
      }
    }

    // Recalculate sequential supplier ledger balances
    ledgers = memoryStore.supplierLedgers.filter((l) => Number(l.SupplierId) === suppId);
    let runningNet = 0;
    ledgers.forEach((entry) => {
      runningNet += (Number(entry.Credit) || 0) - (Number(entry.Debit) || 0);
      entry.RunningBalance = runningNet;
    });

    const expectedDue = runningNet > 0 ? runningNet : 0;
    const expectedAdvance = runningNet < 0 ? Math.abs(runningNet) : 0;

    if (supplier.BalanceDue !== expectedDue || supplier.Advance !== expectedAdvance) {
      corrections.push(
        `Synchronized supplier ${supplier.Name}: Due changed from ${supplier.BalanceDue} to ${expectedDue}, Advance changed from ${supplier.Advance} to ${expectedAdvance}`
      );
      supplier.BalanceDue = expectedDue;
      supplier.Advance = expectedAdvance;
      supplier.UpdatedAt = new Date().toISOString();
    }
  });

  // 3. Audit & Clean Cash Ledger
  let cashRunning = 0;
  memoryStore.cashTransactions.forEach((tx) => {
    cashRunning += (Number(tx.CashIn) || 0) - (Number(tx.CashOut) || 0);
    if (tx.RunningBalance !== cashRunning) {
      corrections.push(`Adjusted cash voucher ${tx.VoucherNumber} running balance to ${cashRunning}`);
      tx.RunningBalance = cashRunning;
    }
  });

  // 4. Audit & Clean Bank Accounts
  memoryStore.bankAccounts.forEach((account) => {
    const accId = Number(account.Id);
    const txs = memoryStore.bankTransactions.filter((t) => Number(t.BankAccountId) === accId);
    let bankRunning = 0;
    txs.forEach((tx) => {
      bankRunning += (Number(tx.BankIn) || 0) - (Number(tx.BankOut) || 0);
      tx.RunningBalance = bankRunning;
    });
    if (account.CurrentBalance !== bankRunning && txs.length > 0) {
      corrections.push(`Synchronized bank account ${account.BankName} balance to ${bankRunning}`);
      account.CurrentBalance = bankRunning;
    }
  });

  // 5. Add Audit Log
  addAuditLog({
    action: "DATABASE_CLEAN_AUDIT",
    module: "Database",
    details: `Cleaned and audited database: ${corrections.length} correction(s) applied. Complete relational ledger integrity verified.`,
  });

  // 6. Persist to Disk
  persistStore();

  return {
    success: true,
    timestamp: new Date().toISOString(),
    customersAudited: memoryStore.customers.length,
    suppliersAudited: memoryStore.suppliers.length,
    cashReconciled: true,
    bankAccountsReconciled: memoryStore.bankAccounts.length,
    correctionsMade: corrections,
    summary: {
      totalCustomers: memoryStore.customers.length,
      totalSuppliers: memoryStore.suppliers.length,
      totalRoznamcha: memoryStore.roznamcha.length,
      totalVouchers: memoryStore.vouchers.length,
      totalProducts: memoryStore.products.length,
      totalStaff: memoryStore.staff.length,
      totalBankAccounts: memoryStore.bankAccounts.length,
      cashBalance: getCurrentCashBalance(),
    },
  };
}
