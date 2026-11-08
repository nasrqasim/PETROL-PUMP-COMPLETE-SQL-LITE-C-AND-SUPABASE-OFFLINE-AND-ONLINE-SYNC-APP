using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OilShop.Core.Data;
using OilShop.Core.Models;
using OilShop.Core.Services;
using OilShop.Web.Models;

namespace OilShop.Web.Controllers;

public class CashBankController : Controller
{
    private readonly OilShopDbContext _db;
    private readonly InvoiceService _invoices;

    public CashBankController(OilShopDbContext db, InvoiceService invoices)
    {
        _db = db;
        _invoices = invoices;
    }

    private async Task PopulateViewDataAsync()
    {
        ViewBag.Cash = await _invoices.CashBalanceAsync();
        ViewBag.Bank = await _invoices.BankBalanceAsync();
        ViewBag.Customers = await _db.Customers.OrderBy(c => c.Name).ToListAsync();
        ViewBag.Suppliers = await _db.Suppliers.OrderBy(s => s.Name).ToListAsync();
    }

    public async Task<IActionResult> Index(string? search = null, DateTime? fromDate = null, DateTime? toDate = null)
    {
        await PopulateViewDataAsync();

        var query = _db.Payments
            .Include(p => p.Customer)
            .Include(p => p.Supplier)
            .AsQueryable();

        if (fromDate.HasValue)
            query = query.Where(p => p.Date >= fromDate.Value.Date);
        if (toDate.HasValue)
            query = query.Where(p => p.Date <= toDate.Value.Date);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var q = search.Trim().ToLower();
            query = query.Where(p =>
                p.VoucherNumber.ToLower().Contains(q) ||
                (p.Customer != null && p.Customer.Name.ToLower().Contains(q)) ||
                (p.Supplier != null && p.Supplier.Name.ToLower().Contains(q)) ||
                (p.Remarks != null && p.Remarks.ToLower().Contains(q)) ||
                (p.BankAccount != null && p.BankAccount.ToLower().Contains(q)));
        }

        ViewBag.Search = search;
        ViewBag.FromDate = fromDate?.ToString("yyyy-MM-dd");
        ViewBag.ToDate = toDate?.ToString("yyyy-MM-dd");

        var payments = await query
            .OrderByDescending(p => p.Date)
            .ThenByDescending(p => p.Id)
            .ToListAsync();

        return View(payments);
    }

    public async Task<IActionResult> CashHistory(string? search = null, DateTime? fromDate = null, DateTime? toDate = null)
    {
        ViewBag.Cash = await _invoices.CashBalanceAsync();

        // 1. Cash Sales (Debit +)
        var sales = await _db.SalesInvoices
            .Include(s => s.Customer)
            .Where(s => s.PaymentMode == PaymentMode.Cash)
            .ToListAsync();

        // 2. Cash Purchases (Credit -)
        var purchases = await _db.PurchaseInvoices
            .Include(p => p.Supplier)
            .Where(p => p.PaymentMode == PaymentMode.Cash)
            .ToListAsync();

        // 3. Cash Vouchers (Receipt = Debit +, Payment = Credit -)
        var vouchers = await _db.Payments
            .Include(p => p.Customer)
            .Include(p => p.Supplier)
            .Where(p => p.Type == VoucherType.CashReceipt || p.Type == VoucherType.CashPayment)
            .ToListAsync();

        // 4. Cash Expenses (Credit -)
        var expenses = await _db.Expenses
            .Where(e => e.PaidFrom == PaymentMode.Cash)
            .ToListAsync();

        var list = new List<CashBankHistoryItem>();

        foreach (var s in sales)
        {
            list.Add(new CashBankHistoryItem
            {
                Date = s.Date,
                RefNumber = s.InvoiceNumber,
                SourceType = "Cash Sale",
                Description = $"Sale Invoice #{s.InvoiceNumber}",
                Party = s.Customer?.Name ?? "Walk-in Customer",
                Debit = s.GrandTotal,
                Credit = 0,
                Remarks = s.Remarks,
                DetailsUrl = $"/Sales/Print/{s.Id}"
            });
        }

        foreach (var p in purchases)
        {
            list.Add(new CashBankHistoryItem
            {
                Date = p.Date,
                RefNumber = p.InvoiceNumber,
                SourceType = "Cash Purchase",
                Description = $"Purchase #{p.InvoiceNumber}",
                Party = p.Supplier?.Name ?? "Vendor",
                Debit = 0,
                Credit = p.GrandTotal,
                Remarks = p.Remarks,
                DetailsUrl = $"/Purchases/Details/{p.Id}"
            });
        }

        foreach (var v in vouchers)
        {
            var isReceipt = v.Type == VoucherType.CashReceipt;
            var party = v.PartyType == PartyType.Customer ? v.Customer?.Name : (v.PartyType == PartyType.Supplier ? v.Supplier?.Name : v.PartyType.ToString());
            list.Add(new CashBankHistoryItem
            {
                Date = v.Date,
                RefNumber = v.VoucherNumber,
                SourceType = isReceipt ? "Cash Receipt Voucher" : "Cash Payment Voucher",
                Description = isReceipt ? "Cash Received" : "Cash Paid Out",
                Party = party ?? "—",
                Debit = isReceipt ? v.Amount : 0,
                Credit = !isReceipt ? v.Amount : 0,
                Remarks = v.Remarks
            });
        }

        foreach (var e in expenses)
        {
            list.Add(new CashBankHistoryItem
            {
                Date = e.Date,
                RefNumber = $"EXP-{e.Id:D4}",
                SourceType = "Cash Expense",
                Description = $"Expense: {e.Category}",
                Party = e.Category,
                Debit = 0,
                Credit = e.Amount,
                Remarks = e.Remarks,
                DetailsUrl = $"/Expenses/Edit/{e.Id}"
            });
        }

        // Apply filters
        var filtered = list.AsEnumerable();
        if (fromDate.HasValue)
            filtered = filtered.Where(x => x.Date.Date >= fromDate.Value.Date);
        if (toDate.HasValue)
            filtered = filtered.Where(x => x.Date.Date <= toDate.Value.Date);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var q = search.Trim().ToLower();
            filtered = filtered.Where(x =>
                x.RefNumber.ToLower().Contains(q) ||
                x.Party.ToLower().Contains(q) ||
                x.Description.ToLower().Contains(q) ||
                (x.Remarks != null && x.Remarks.ToLower().Contains(q)));
        }

        var sorted = filtered.OrderBy(x => x.Date).ThenBy(x => x.RefNumber).ToList();
        decimal runningBalance = 0;
        foreach (var item in sorted)
        {
            runningBalance += item.Debit - item.Credit;
            item.Balance = runningBalance;
        }

        ViewBag.Search = search;
        ViewBag.FromDate = fromDate?.ToString("yyyy-MM-dd");
        ViewBag.ToDate = toDate?.ToString("yyyy-MM-dd");
        ViewBag.TotalDebit = sorted.Sum(x => x.Debit);
        ViewBag.TotalCredit = sorted.Sum(x => x.Credit);

        return View(sorted.OrderByDescending(x => x.Date).ToList());
    }

    public async Task<IActionResult> BankHistory(string? search = null, DateTime? fromDate = null, DateTime? toDate = null)
    {
        ViewBag.Bank = await _invoices.BankBalanceAsync();

        // 1. Bank Sales (Debit +)
        var sales = await _db.SalesInvoices
            .Include(s => s.Customer)
            .Where(s => s.PaymentMode == PaymentMode.Bank)
            .ToListAsync();

        // 2. Bank Purchases (Credit -)
        var purchases = await _db.PurchaseInvoices
            .Include(p => p.Supplier)
            .Where(p => p.PaymentMode == PaymentMode.Bank)
            .ToListAsync();

        // 3. Bank Vouchers (Receipt = Debit +, Payment = Credit -)
        var vouchers = await _db.Payments
            .Include(p => p.Customer)
            .Include(p => p.Supplier)
            .Where(p => p.Type == VoucherType.BankReceipt || p.Type == VoucherType.BankPayment)
            .ToListAsync();

        // 4. Bank Expenses (Credit -)
        var expenses = await _db.Expenses
            .Where(e => e.PaidFrom == PaymentMode.Bank)
            .ToListAsync();

        var list = new List<CashBankHistoryItem>();

        foreach (var s in sales)
        {
            list.Add(new CashBankHistoryItem
            {
                Date = s.Date,
                RefNumber = s.InvoiceNumber,
                SourceType = "Bank Sale",
                Description = $"Sale Invoice #{s.InvoiceNumber}",
                Party = s.Customer?.Name ?? "Walk-in Customer",
                Debit = s.GrandTotal,
                Credit = 0,
                Remarks = s.Remarks,
                DetailsUrl = $"/Sales/Print/{s.Id}"
            });
        }

        foreach (var p in purchases)
        {
            list.Add(new CashBankHistoryItem
            {
                Date = p.Date,
                RefNumber = p.InvoiceNumber,
                SourceType = "Bank Purchase",
                Description = $"Purchase #{p.InvoiceNumber}",
                Party = p.Supplier?.Name ?? "Vendor",
                Debit = 0,
                Credit = p.GrandTotal,
                Remarks = p.Remarks,
                DetailsUrl = $"/Purchases/Details/{p.Id}"
            });
        }

        foreach (var v in vouchers)
        {
            var isReceipt = v.Type == VoucherType.BankReceipt;
            var party = v.PartyType == PartyType.Customer ? v.Customer?.Name : (v.PartyType == PartyType.Supplier ? v.Supplier?.Name : v.PartyType.ToString());
            list.Add(new CashBankHistoryItem
            {
                Date = v.Date,
                RefNumber = v.VoucherNumber,
                SourceType = isReceipt ? "Bank Receipt Voucher" : "Bank Payment Voucher",
                Description = isReceipt ? "Bank Deposit/Receipt" : "Bank Transfer/Payment",
                Party = party ?? "—",
                Debit = isReceipt ? v.Amount : 0,
                Credit = !isReceipt ? v.Amount : 0,
                Remarks = string.IsNullOrEmpty(v.BankAccount) ? v.Remarks : $"[Bank: {v.BankAccount}] {v.Remarks}"
            });
        }

        foreach (var e in expenses)
        {
            list.Add(new CashBankHistoryItem
            {
                Date = e.Date,
                RefNumber = $"EXP-{e.Id:D4}",
                SourceType = "Bank Expense",
                Description = $"Expense: {e.Category}",
                Party = e.Category,
                Debit = 0,
                Credit = e.Amount,
                Remarks = e.Remarks,
                DetailsUrl = $"/Expenses/Edit/{e.Id}"
            });
        }

        // Filter
        var filtered = list.AsEnumerable();
        if (fromDate.HasValue)
            filtered = filtered.Where(x => x.Date.Date >= fromDate.Value.Date);
        if (toDate.HasValue)
            filtered = filtered.Where(x => x.Date.Date <= toDate.Value.Date);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var q = search.Trim().ToLower();
            filtered = filtered.Where(x =>
                x.RefNumber.ToLower().Contains(q) ||
                x.Party.ToLower().Contains(q) ||
                x.Description.ToLower().Contains(q) ||
                (x.Remarks != null && x.Remarks.ToLower().Contains(q)));
        }

        var sorted = filtered.OrderBy(x => x.Date).ThenBy(x => x.RefNumber).ToList();
        decimal runningBalance = 0;
        foreach (var item in sorted)
        {
            runningBalance += item.Debit - item.Credit;
            item.Balance = runningBalance;
        }

        ViewBag.Search = search;
        ViewBag.FromDate = fromDate?.ToString("yyyy-MM-dd");
        ViewBag.ToDate = toDate?.ToString("yyyy-MM-dd");
        ViewBag.TotalDebit = sorted.Sum(x => x.Debit);
        ViewBag.TotalCredit = sorted.Sum(x => x.Credit);

        return View(sorted.OrderByDescending(x => x.Date).ToList());
    }

    public async Task<IActionResult> CashPayment()
    {
        await PopulateViewDataAsync();
        return View();
    }

    public async Task<IActionResult> BankPayment()
    {
        await PopulateViewDataAsync();
        return View();
    }

    public async Task<IActionResult> CashReceipt()
    {
        await PopulateViewDataAsync();
        return View();
    }

    public async Task<IActionResult> BankReceipt()
    {
        await PopulateViewDataAsync();
        return View();
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> ProcessVoucher(VoucherType type, PartyType partyType, int? customerId, int? supplierId, decimal amount, string? bankAccount, string? remarks, DateTime? date)
    {
        if (amount <= 0)
        {
            TempData["Error"] = "Amount must be greater than zero.";
            return RedirectToAction(nameof(Index));
        }

        var voucherDate = date ?? DateTime.Today;
        var prefix = type switch
        {
            VoucherType.CashReceipt => "CR",
            VoucherType.CashPayment => "CP",
            VoucherType.BankReceipt => "BR",
            VoucherType.BankPayment => "BP",
            _ => "VCH"
        };

        var payment = new Payment
        {
            VoucherNumber = $"{prefix}-{DateTime.Now:yyyyMMddHHmmss}",
            Date = voucherDate,
            Type = type,
            PartyType = partyType,
            CustomerId = partyType == PartyType.Customer ? customerId : null,
            SupplierId = partyType == PartyType.Supplier ? supplierId : null,
            BankAccount = bankAccount,
            Amount = amount,
            Remarks = remarks
        };

        // Account balance adjustments
        if (partyType == PartyType.Customer && customerId.HasValue)
        {
            var customer = await _db.Customers.FindAsync(customerId.Value);
            if (customer != null)
            {
                if (type == VoucherType.CashReceipt || type == VoucherType.BankReceipt)
                {
                    if (customer.BalanceDue >= amount)
                    {
                        customer.BalanceDue -= amount;
                    }
                    else
                    {
                        var remaining = amount - customer.BalanceDue;
                        customer.BalanceDue = 0;
                        customer.Advance += remaining;
                        payment.CreatesAdvance = true;
                    }
                }
                else if (type == VoucherType.CashPayment || type == VoucherType.BankPayment)
                {
                    if (customer.Advance >= amount)
                    {
                        customer.Advance -= amount;
                    }
                    else
                    {
                        var diff = amount - customer.Advance;
                        customer.Advance = 0;
                        customer.BalanceDue += diff;
                    }
                }
            }
        }
        else if (partyType == PartyType.Supplier && supplierId.HasValue)
        {
            var supplier = await _db.Suppliers.FindAsync(supplierId.Value);
            if (supplier != null)
            {
                if (type == VoucherType.CashPayment || type == VoucherType.BankPayment)
                {
                    if (supplier.BalanceDue >= amount)
                    {
                        supplier.BalanceDue -= amount;
                    }
                    else
                    {
                        var remaining = amount - supplier.BalanceDue;
                        supplier.BalanceDue = 0;
                        supplier.Advance += remaining;
                        payment.CreatesAdvance = true;
                    }
                }
                else if (type == VoucherType.CashReceipt || type == VoucherType.BankReceipt)
                {
                    if (supplier.Advance >= amount)
                    {
                        supplier.Advance -= amount;
                    }
                    else
                    {
                        var diff = amount - supplier.Advance;
                        supplier.Advance = 0;
                        supplier.BalanceDue += diff;
                    }
                }
            }
        }

        _db.Payments.Add(payment);
        await _db.SaveChangesAsync();

        TempData["Message"] = $"{type} voucher '{payment.VoucherNumber}' of Rs. {amount:N0} processed successfully and accounts updated.";
        return RedirectToAction(nameof(Index));
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> DeleteVoucher(int id)
    {
        var payment = await _db.Payments.FindAsync(id);
        if (payment == null) return NotFound();

        // Reverse balances if applicable
        if (payment.PartyType == PartyType.Customer && payment.CustomerId.HasValue)
        {
            var customer = await _db.Customers.FindAsync(payment.CustomerId.Value);
            if (customer != null)
            {
                if (payment.Type == VoucherType.CashReceipt || payment.Type == VoucherType.BankReceipt)
                {
                    // Reversing receipt: increase BalanceDue
                    customer.BalanceDue += payment.Amount;
                }
                else if (payment.Type == VoucherType.CashPayment || payment.Type == VoucherType.BankPayment)
                {
                    // Reversing payment: decrease BalanceDue
                    customer.BalanceDue = Math.Max(0, customer.BalanceDue - payment.Amount);
                }
            }
        }
        else if (payment.PartyType == PartyType.Supplier && payment.SupplierId.HasValue)
        {
            var supplier = await _db.Suppliers.FindAsync(payment.SupplierId.Value);
            if (supplier != null)
            {
                if (payment.Type == VoucherType.CashPayment || payment.Type == VoucherType.BankPayment)
                {
                    // Reversing payment: increase BalanceDue to supplier
                    supplier.BalanceDue += payment.Amount;
                }
                else if (payment.Type == VoucherType.CashReceipt || payment.Type == VoucherType.BankReceipt)
                {
                    // Reversing receipt: decrease BalanceDue
                    supplier.BalanceDue = Math.Max(0, supplier.BalanceDue - payment.Amount);
                }
            }
        }

        _db.Payments.Remove(payment);
        await _db.SaveChangesAsync();
        TempData["Message"] = $"Voucher {payment.VoucherNumber} deleted and ledger reversed.";
        return RedirectToAction(nameof(Index));
    }
}
