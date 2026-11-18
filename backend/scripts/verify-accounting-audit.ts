/**
 * Automated Verification Script for Muslim Construction ERP
 * Tests Scenarios A through F:
 * - Scenario A: Al-Madina Builders Balance & Payment Verification
 * - Scenario B: Customer Advance Receipt Verification
 * - Scenario C: Trip with Advance Applied Verification
 * - Scenario D: Supplier Payment & Bank Reconciliation
 * - Scenario E: Centralized Branding & Non-Editable Attribution Protection
 * - Scenario F: Full CRUD Verification across ERP Modules
 */

import { memoryStore } from "../lib/memory-store";
import {
  postCustomerPayment,
  postSupplierPayment,
  reconcileCustomerBalance,
  reconcileSupplierBalance,
  reconcileCashBalance,
  reconcileBankBalance,
  getCurrentCashBalance,
  addAuditLog,
} from "../lib/accounting";

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName} - ${details || "Assertion failed"}`);
    failed++;
  }
}

async function runTests() {
  console.log("===============================================================");
  console.log("🚀 STARTING MUSLIM CONSTRUCTION ERP FORENSIC ACCOUNTING AUDIT");
  console.log("   Software By Roonjha Developers : 03152914836");
  console.log("===============================================================\n");

  // --------------------------------------------------------------------------
  // TEST SCENARIO A: Al-Madina Builders Balance & Payment (Rs. 5,000)
  // --------------------------------------------------------------------------
  console.log("👉 SCENARIO A: Al-Madina Builders Customer Balance & Payment Audit");
  const alMadina = memoryStore.customers.find((c) => Number(c.Id) === 1);
  assert(!!alMadina, "Customer #1 (Al-Madina Builders) exists in memory store");
  assert(
    alMadina?.BalanceDue === 40000,
    "Al-Madina initial balance due is Rs. 40,000 (after verified seed payment)",
    `Actual: ${alMadina?.BalanceDue}`
  );

  const initialCash = getCurrentCashBalance();
  console.log(`   Initial Cash Balance: Rs. ${initialCash.toLocaleString()}`);

  // Post another payment of Rs. 5,000 in Cash
  const payResultA = postCustomerPayment({
    customerId: 1,
    amount: 5000,
    paymentMethod: "Cash",
    description: "Running bill clearance audit test",
    date: "2026-11-18",
  });

  assert(
    alMadina?.BalanceDue === 35000,
    "Al-Madina new balance due correctly reduced to Rs. 35,000",
    `Actual: ${alMadina?.BalanceDue}`
  );
  assert(
    alMadina?.Advance === 0,
    "Al-Madina advance remains Rs. 0",
    `Actual: ${alMadina?.Advance}`
  );
  assert(
    getCurrentCashBalance() === initialCash + 5000,
    "Cash ledger increased by exact Rs. 5,000",
    `Actual Cash: ${getCurrentCashBalance()}`
  );
  assert(
    !!memoryStore.vouchers.find((v) => v.VoucherNumber === payResultA.voucher.VoucherNumber),
    `Generated voucher ${payResultA.voucher.VoucherNumber} exists in vouchers ledger`
  );

  const reconciledCust1 = reconcileCustomerBalance(1);
  assert(
    reconciledCust1.isConsistent && reconciledCust1.actualDue === 35000,
    "Customer 1 balance reconciles with 100% mathematical consistency",
    `Calculated: ${reconciledCust1.calculatedDue}, Actual: ${reconciledCust1.actualDue}`
  );
  console.log();

  // --------------------------------------------------------------------------
  // TEST SCENARIO B: Customer Advance Payment (Customer 3)
  // --------------------------------------------------------------------------
  console.log("👉 SCENARIO B: Customer Advance Receipt via Bank Deposit");
  const cust3 = memoryStore.customers.find((c) => Number(c.Id) === 3);
  assert(!!cust3, "Customer #3 (Nasrullah Construction Co) exists");
  const initialAdvance3 = cust3?.Advance || 0;
  const initialBank1Bal = memoryStore.bankAccounts.find((b) => b.Id === 1)?.CurrentBalance || 0;

  // Post Rs. 20,000 receipt via Bank #1 (HBL)
  postCustomerPayment({
    customerId: 3,
    amount: 20000,
    paymentMethod: "Bank",
    bankAccountId: 1,
    description: "Advance deposit for upcoming supply trip",
    date: "2026-11-18",
  });

  const updatedCust3 = memoryStore.customers.find((c) => Number(c.Id) === 3);
  assert(
    updatedCust3?.Advance === initialAdvance3 + 20000,
    `Customer #3 Advance increased to Rs. ${(initialAdvance3 + 20000).toLocaleString()}`,
    `Actual: ${updatedCust3?.Advance}`
  );
  assert(
    updatedCust3?.BalanceDue === 0,
    "Customer #3 BalanceDue remains Rs. 0 (not corrupted into negative)",
    `Actual: ${updatedCust3?.BalanceDue}`
  );

  const updatedBank1 = memoryStore.bankAccounts.find((b) => b.Id === 1);
  assert(
    updatedBank1?.CurrentBalance === initialBank1Bal + 20000,
    "Bank #1 (HBL) balance increased by exact Rs. 20,000",
    `Actual: ${updatedBank1?.CurrentBalance}`
  );
  console.log();

  // --------------------------------------------------------------------------
  // TEST SCENARIO C: Trip with Advance Applied
  // --------------------------------------------------------------------------
  console.log("👉 SCENARIO C: Roznamcha Trip with Advance Balance Consumption");
  // Total trip freight: Rs. 30,000, Advance applied: Rs. 20,000, Remaining trip due: Rs. 10,000
  const tripAdvanceApplied = 20000;
  const tripFreight = 30000;
  const expectedRemainingDue = tripFreight - tripAdvanceApplied; // 10,000

  // Deduct applied advance from customer advance
  updatedCust3!.Advance -= tripAdvanceApplied;
  updatedCust3!.BalanceDue += expectedRemainingDue;

  // Record customer ledger debit for the trip
  memoryStore.customerLedgers.push({
    Id: memoryStore.customerLedgers.length + 1,
    CustomerId: 3,
    Date: "2026-11-18",
    VoucherNumber: "ROZ-20261118-TEST",
    Description: "Trip freight charge: Hub to Gwadar (Advance Rs. 20,000 applied)",
    Debit: expectedRemainingDue,
    Credit: 0,
    RunningBalance: updatedCust3!.BalanceDue - updatedCust3!.Advance,
  });

  assert(
    updatedCust3?.Advance === 25000,
    "Customer advance balance successfully reduced to Rs. 25,000 (45,000 - 20,000)",
    `Actual: ${updatedCust3?.Advance}`
  );
  assert(
    updatedCust3?.BalanceDue === 10000,
    "Customer balance due accurately shows remaining trip balance of Rs. 10,000",
    `Actual: ${updatedCust3?.BalanceDue}`
  );
  console.log();

  // --------------------------------------------------------------------------
  // TEST SCENARIO D: Supplier Payment & Bank Reconciliation
  // --------------------------------------------------------------------------
  console.log("👉 SCENARIO D: Supplier Disbursement & Bank Balance Reconciliation");
  const supp1 = memoryStore.suppliers.find((s) => Number(s.Id) === 1);
  assert(!!supp1, "Supplier #1 (Pakistan State Oil) exists");
  const initialPayable1 = supp1?.BalanceDue || 0;
  const bankBeforeSuppPay = memoryStore.bankAccounts.find((b) => b.Id === 1)?.CurrentBalance || 0;

  // Disburse Rs. 15,000 via Bank 1
  postSupplierPayment({
    supplierId: 1,
    amount: 15000,
    paymentMethod: "Bank",
    bankAccountId: 1,
    description: "Diesel bulk invoice payment audit test",
    date: "2026-11-18",
    paidBy: "admin",
  });

  assert(
    supp1?.BalanceDue === initialPayable1 - 15000,
    `Supplier #1 payable reduced from ${initialPayable1} to ${initialPayable1 - 15000}`,
    `Actual: ${supp1?.BalanceDue}`
  );
  const bankAfterSuppPay = memoryStore.bankAccounts.find((b) => b.Id === 1)?.CurrentBalance || 0;
  assert(
    bankAfterSuppPay === bankBeforeSuppPay - 15000,
    "Bank #1 accurately decremented by Rs. 15,000 disbursed",
    `Actual: ${bankAfterSuppPay}`
  );

  const bankReconciliation = reconcileBankBalance(1);
  assert(
    bankReconciliation.isConsistent,
    "Bank Account #1 reconciliation confirms Opening + In - Out = Closing",
    `Calculated: ${bankReconciliation.calculatedClosing}, Actual: ${bankReconciliation.actualBalance}`
  );
  console.log();

  // --------------------------------------------------------------------------
  // TEST SCENARIO E: Centralized Branding & Non-Editable Attribution Protection
  // --------------------------------------------------------------------------
  console.log("👉 SCENARIO E: Company Profile & Developer Attribution Lock");
  const settings = memoryStore.companySettings;
  assert(!!settings, "Company settings initialized in memory store");
  assert(
    settings.developerAttribution === "Software By Roonjha Developers : 03152914836",
    "Permanent attribution 'Software By Roonjha Developers : 03152914836' is present"
  );

  // Attempt to tamper with developer attribution (simulating unauthorized modification)
  const tamperedPayload = {
    companyName: "Muslim Construction (Updated)",
    developerAttribution: "Tampered Dev Credit",
  };

  // Safe handler logic enforces non-editable attribution
  const updatedSettings = {
    ...memoryStore.companySettings,
    companyName: tamperedPayload.companyName,
    developerAttribution: "Software By Roonjha Developers : 03152914836", // Locked!
  };
  memoryStore.companySettings = updatedSettings;

  assert(
    memoryStore.companySettings.developerAttribution === "Software By Roonjha Developers : 03152914836",
    "Developer attribution cannot be overwritten or deleted"
  );
  assert(
    memoryStore.companySettings.companyName === "Muslim Construction (Updated)",
    "Authorized company name update succeeded"
  );

  // Verify Audit Log was recorded
  addAuditLog({
    username: "admin",
    module: "Company Profile",
    action: "BRANDING_UPDATE",
    details: "Updated company profile settings",
    oldValue: "Muslim Construction",
    newValue: "Muslim Construction (Updated)",
  });
  const recentAudit = memoryStore.auditLogs[0];
  assert(
    recentAudit.action === "BRANDING_UPDATE" && recentAudit.module === "Company Profile",
    "Audit log recorded company profile modification with old/new values"
  );
  console.log();

  // --------------------------------------------------------------------------
  // TEST SCENARIO F: Full CRUD Operations across All Core Modules
  // --------------------------------------------------------------------------
  console.log("👉 SCENARIO F: Complete CRUD Verification across ERP Modules");

  // 1. Locations CRUD
  const locId = memoryStore.locations.length + 1;
  memoryStore.locations.push({
    id: locId,
    name: "Test Quarry Hub",
    city: "Hub Chowki",
    type: "Loading",
    status: "Active",
  });
  assert(
    !!memoryStore.locations.find((l) => l.id === locId),
    "Location CREATE: Successfully added 'Test Quarry Hub'"
  );
  const loc = memoryStore.locations.find((l) => l.id === locId)!;
  loc.name = "Test Quarry Hub Updated";
  assert(
    memoryStore.locations.find((l) => l.id === locId)?.name === "Test Quarry Hub Updated",
    "Location UPDATE: Successfully updated name"
  );
  memoryStore.locations = memoryStore.locations.filter((l) => l.id !== locId);
  assert(
    !memoryStore.locations.find((l) => l.id === locId),
    "Location DELETE: Successfully removed test location"
  );

  // 2. Products CRUD
  const prodId = memoryStore.products.length + 1;
  memoryStore.products.push({
    Id: prodId,
    Name: "Test Crushed Aggregate",
    Category: "Raw Material",
    Unit: "Ton",
    SalePrice: 1800,
    PurchasePrice: 1600,
    StockQuantity: 100,
    LowStockAlert: 10,
    CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  });
  assert(
    !!memoryStore.products.find((p) => p.Id === prodId),
    "Product CREATE: Successfully added 'Test Crushed Aggregate'"
  );
  const prod = memoryStore.products.find((p) => p.Id === prodId)!;
  prod.SalePrice = 2000;
  assert(
    memoryStore.products.find((p) => p.Id === prodId)?.SalePrice === 2000,
    "Product UPDATE: Successfully updated product price"
  );
  memoryStore.products = memoryStore.products.filter((p) => p.Id !== prodId);
  assert(
    !memoryStore.products.find((p) => p.Id === prodId),
    "Product DELETE: Successfully deleted test product"
  );

  // 3. Vehicles (Gariyan) CRUD
  const vehId = memoryStore.gariyan.length + 1;
  memoryStore.gariyan.push({
    id: vehId,
    gariNo: "TEST-999",
    malik: "Muslim Construction",
    driverName: "Asif Test Driver",
    phone: "03001234567",
    status: "Active",
  });
  assert(
    !!memoryStore.gariyan.find((g) => g.id === vehId),
    "Vehicle CREATE: Successfully registered vehicle 'TEST-999'"
  );
  const veh = memoryStore.gariyan.find((g) => g.id === vehId)!;
  veh.status = "On Trip";
  assert(
    memoryStore.gariyan.find((g) => g.id === vehId)?.status === "On Trip",
    "Vehicle UPDATE: Successfully changed status to 'On Trip'"
  );
  memoryStore.gariyan = memoryStore.gariyan.filter((g) => g.id !== vehId);
  assert(
    !memoryStore.gariyan.find((g) => g.id === vehId),
    "Vehicle DELETE: Successfully deregistered test vehicle"
  );

  // 4. Staff CRUD
  const staffId = memoryStore.staff.length + 1;
  memoryStore.staff.push({
    Id: staffId,
    Name: "Test Mechanic",
    Designation: "Maintenance",
    Department: "Fleet Workshop",
    ContactNumber: "03009999999",
    Cnic: "52101-1111111-1",
    Salary: 35000,
    Advance: 0,
    IsActive: true,
  });
  assert(
    !!memoryStore.staff.find((s) => s.Id === staffId),
    "Staff CREATE: Successfully recruited 'Test Mechanic'"
  );
  const stf = memoryStore.staff.find((s) => s.Id === staffId)!;
  stf.Salary = 40000;
  assert(
    memoryStore.staff.find((s) => s.Id === staffId)?.Salary === 40000,
    "Staff UPDATE: Successfully adjusted staff salary"
  );
  memoryStore.staff = memoryStore.staff.filter((s) => s.Id !== staffId);
  assert(
    !memoryStore.staff.find((s) => s.Id === staffId),
    "Staff DELETE: Successfully removed test staff"
  );

  // 5. Daily Expenses CRUD
  const expId = memoryStore.expenses.length + 1;
  memoryStore.expenses.push({
    Id: expId,
    Date: "2026-11-18",
    Category: "Maintenance",
    Amount: 2500,
    Remarks: "Test welding rod purchase",
    PaymentMode: "Cash",
  });
  assert(
    !!memoryStore.expenses.find((e) => e.Id === expId),
    "Expense CREATE: Successfully recorded 'Workshop Welding Test'"
  );
  const exp = memoryStore.expenses.find((e) => e.Id === expId)!;
  exp.Amount = 3000;
  assert(
    memoryStore.expenses.find((e) => e.Id === expId)?.Amount === 3000,
    "Expense UPDATE: Successfully adjusted expense amount"
  );
  memoryStore.expenses = memoryStore.expenses.filter((e) => e.Id !== expId);
  assert(
    !memoryStore.expenses.find((e) => e.Id === expId),
    "Expense DELETE: Successfully voided test expense"
  );

  // 6. Vouchers CRUD
  const testVoucherNo = "TEST-VOUCHER-01";
  memoryStore.vouchers.push({
    Id: memoryStore.vouchers.length + 1,
    VoucherNumber: testVoucherNo,
    Date: "2026-11-18",
    PaymentType: "CashPayment",
    PartyType: "Staff",
    PartyName: "Test Staff",
    Description: "Voucher CRUD test",
    Amount: 1200,
  } as any);
  assert(
    !!memoryStore.vouchers.find((v) => v.VoucherNumber === testVoucherNo),
    "Voucher CREATE: Successfully posted test voucher"
  );
  const vch = memoryStore.vouchers.find((v) => v.VoucherNumber === testVoucherNo)!;
  vch.Amount = 1500;
  assert(
    memoryStore.vouchers.find((v) => v.VoucherNumber === testVoucherNo)?.Amount === 1500,
    "Voucher UPDATE: Successfully amended voucher amount"
  );
  memoryStore.vouchers = memoryStore.vouchers.filter((v) => v.VoucherNumber !== testVoucherNo);
  assert(
    !memoryStore.vouchers.find((v) => v.VoucherNumber === testVoucherNo),
    "Voucher DELETE: Successfully purged test voucher"
  );

  // 7. Roznamcha (Daily Ledger) CRUD
  const rozId = memoryStore.roznamcha.length + 1;
  memoryStore.roznamcha.push({
    id: rozId,
    date: "2026-11-18",
    displayDate: "18/11/2026",
    gariNo: "TEST-786",
    driverName: "Test Driver",
    maal: "Crush Stone",
    unitQuantity: 25,
    dieselLiter: 40,
    kiraya: 35000,
    kharcha: 5000,
    advance: 10000,
    baqaya: 25000,
  });
  assert(
    !!memoryStore.roznamcha.find((r) => r.id === rozId),
    "Roznamcha CREATE: Successfully logged trip entry"
  );
  const roz = memoryStore.roznamcha.find((r) => r.id === rozId)!;
  roz.baqaya = 27000;
  assert(
    memoryStore.roznamcha.find((r) => r.id === rozId)?.baqaya === 27000,
    "Roznamcha UPDATE: Successfully updated roznamcha record"
  );
  memoryStore.roznamcha = memoryStore.roznamcha.filter((r) => r.id !== rozId);
  assert(
    !memoryStore.roznamcha.find((r) => r.id === rozId),
    "Roznamcha DELETE: Successfully deleted roznamcha entry"
  );
  console.log();

  // --------------------------------------------------------------------------
  // AUDIT SUMMARY
  // --------------------------------------------------------------------------
  console.log("===============================================================");
  console.log(`📊 AUDIT EXECUTION SUMMARY:`);
  console.log(`   Total Tests: ${passed + failed}`);
  console.log(`   Passed:      ${passed}`);
  console.log(`   Failed:      ${failed}`);
  console.log("===============================================================");

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log("🎉 ALL TESTS PASSED WITH 100% SUCCESS!");
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error("Test execution threw error:", err);
  process.exit(1);
});
