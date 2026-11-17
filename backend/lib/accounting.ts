import {
  memoryStore,
  BankAccountData,
  CashTransactionData,
  BankTransactionData,
  CustomerLedgerEntry,
  SupplierLedgerEntry,
  VoucherData,
  RoznamchaItemData,
} from "./memory-store";

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
  const customer = memoryStore.customers.find((c) => c.Id === params.customerId);
  if (!customer) return null;

  const charge = Math.max(0, Number(params.chargeAmount) || 0);
  customer.BalanceDue = (Number(customer.BalanceDue) || 0) + charge;
  const currentNet = customer.BalanceDue - (Number(customer.Advance) || 0);

  const entry: CustomerLedgerEntry = {
    Id: Date.now() + Math.floor(Math.random() * 1000),
    CustomerId: params.customerId,
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
  return entry;
}

export function postCustomerPayment(params: {
  customerId: number;
  date: string;
  voucherNumber: string;
  paymentAmount: number;
  paymentMethod: "Cash" | "Bank";
  bankAccountId?: number;
  description?: string;
  tripRef?: string;
}): {
  ledgerEntry: CustomerLedgerEntry | null;
  cashEntry?: CashTransactionData;
  bankEntry?: BankTransactionData | null;
} {
  const customer = memoryStore.customers.find((c) => c.Id === params.customerId);
  if (!customer) return { ledgerEntry: null };

  const amount = Math.max(0, Number(params.paymentAmount) || 0);
  const due = Number(customer.BalanceDue) || 0;
  const advance = Number(customer.Advance) || 0;

  // Rule: Reduce outstanding due first; excess becomes advance
  if (amount <= due) {
    customer.BalanceDue = due - amount;
  } else {
    const excess = amount - due;
    customer.BalanceDue = 0;
    customer.Advance = advance + excess;
  }

  const currentNet = customer.BalanceDue - customer.Advance;

  const ledgerEntry: CustomerLedgerEntry = {
    Id: Date.now() + Math.floor(Math.random() * 1000),
    CustomerId: params.customerId,
    Date: params.date,
    VoucherNumber: params.voucherNumber,
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
      voucherNumber: params.voucherNumber,
      description: `Customer Receipt: ${customer.Name}`,
      reference: params.tripRef,
      transactionType: "Customer Receipt",
      cashIn: amount,
      cashOut: 0,
    });
  } else if (params.paymentMethod === "Bank" && params.bankAccountId) {
    bankEntry = postBankTransaction({
      bankAccountId: params.bankAccountId,
      date: params.date,
      voucherNumber: params.voucherNumber,
      description: `Customer Bank Receipt: ${customer.Name}`,
      transactionType: "Customer Receipt",
      bankIn: amount,
      bankOut: 0,
      reference: params.tripRef,
    });
  }

  return { ledgerEntry, cashEntry, bankEntry };
}

export function applyCustomerAdvance(params: {
  customerId: number;
  date: string;
  tripRef: string;
  appliedAmount: number;
}): CustomerLedgerEntry | null {
  const customer = memoryStore.customers.find((c) => c.Id === params.customerId);
  if (!customer) return null;

  const applied = Math.max(0, Number(params.appliedAmount) || 0);
  const advance = Number(customer.Advance) || 0;
  const actualApplied = Math.min(applied, advance);

  customer.Advance = advance - actualApplied;
  const currentNet = (Number(customer.BalanceDue) || 0) - customer.Advance;

  const entry: CustomerLedgerEntry = {
    Id: Date.now() + Math.floor(Math.random() * 1000),
    CustomerId: params.customerId,
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
  return entry;
}

// ==========================================
// 4. SUPPLIER LEDGER ENGINE
// ==========================================

export function postSupplierPayment(params: {
  supplierId: number;
  date: string;
  voucherNumber: string;
  paymentAmount: number;
  paymentMethod: "Cash" | "Bank";
  bankAccountId?: number;
  description?: string;
}): {
  ledgerEntry: SupplierLedgerEntry | null;
  cashEntry?: CashTransactionData;
  bankEntry?: BankTransactionData | null;
} {
  const supplier = memoryStore.suppliers.find((s) => s.Id === params.supplierId);
  if (!supplier) return { ledgerEntry: null };

  const amount = Math.max(0, Number(params.paymentAmount) || 0);
  const due = Number(supplier.BalanceDue) || 0;
  const advance = Number(supplier.Advance) || 0;

  if (amount <= due) {
    supplier.BalanceDue = due - amount;
  } else {
    const excess = amount - due;
    supplier.BalanceDue = 0;
    supplier.Advance = advance + excess;
  }

  const currentNet = supplier.BalanceDue - supplier.Advance;

  const ledgerEntry: SupplierLedgerEntry = {
    Id: Date.now() + Math.floor(Math.random() * 1000),
    SupplierId: params.supplierId,
    Date: params.date,
    VoucherNumber: params.voucherNumber,
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
      voucherNumber: params.voucherNumber,
      description: `Supplier Payment: ${supplier.Name}`,
      transactionType: "Supplier Payment",
      cashIn: 0,
      cashOut: amount,
    });
  } else if (params.paymentMethod === "Bank" && params.bankAccountId) {
    bankEntry = postBankTransaction({
      bankAccountId: params.bankAccountId,
      date: params.date,
      voucherNumber: params.voucherNumber,
      description: `Supplier Bank Payment: ${supplier.Name}`,
      transactionType: "Supplier Payment",
      bankIn: 0,
      bankOut: amount,
    });
  }

  return { ledgerEntry, cashEntry, bankEntry };
}

// ==========================================
// 5. UNIFIED VOUCHER PROCESSING PIPELINE
// ==========================================

export function processVoucher(v: {
  VoucherNumber?: string;
  Date: string;
  PaymentType: "CashPayment" | "CashReceipt" | "BankPayment" | "BankReceipt";
  PartyType: "Customer" | "Supplier" | "Staff" | "Driver" | "Vehicle" | "General";
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

  const isCash = v.PaymentType === "CashPayment" || v.PaymentType === "CashReceipt";
  const isInflow = v.PaymentType === "CashReceipt" || v.PaymentType === "BankReceipt";

  // 1. Process Party-Specific Ledgers
  if (v.PartyType === "Customer" && v.CustomerId) {
    if (isInflow) {
      postCustomerPayment({
        customerId: v.CustomerId,
        date: v.Date,
        voucherNumber: vNum,
        paymentAmount: amount,
        paymentMethod: isCash ? "Cash" : "Bank",
        bankAccountId: v.BankAccountId,
        description: v.Remarks,
      });
    }
  } else if (v.PartyType === "Supplier" && v.SupplierId) {
    if (!isInflow) {
      postSupplierPayment({
        supplierId: v.SupplierId,
        date: v.Date,
        voucherNumber: vNum,
        paymentAmount: amount,
        paymentMethod: isCash ? "Cash" : "Bank",
        bankAccountId: v.BankAccountId,
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

  const voucherRecord: VoucherData = {
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
  return voucherRecord;
}
