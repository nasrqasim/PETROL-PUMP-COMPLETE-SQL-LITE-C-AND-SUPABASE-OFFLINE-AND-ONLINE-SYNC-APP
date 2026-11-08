using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OilShop.Core.Data;
using OilShop.Core.Models;
using OilShop.Core.Services;

namespace OilShop.Web.Controllers;

/// <summary>Reports Center with categorized reports: Main Reports, Purchase Reports,
/// Sale Reports, Inventory Reports, Financial Reports, and Salary Reports.</summary>
public class ReportsController : Controller
{
    private readonly OilShopDbContext _db;
    private readonly ProfitLossService _pl;
    public ReportsController(OilShopDbContext db, ProfitLossService pl) { _db = db; _pl = pl; }

    public static readonly (string Category, string Name)[] AllReports =
    {
        // Main Reports
        ("Main Reports", "Journal Report"),
        ("Main Reports", "Print Vouchers"),
        ("Main Reports", "Serial Tracking"),
        ("Main Reports", "PO Tracking"),
        ("Main Reports", "SO Tracking"),
        ("Main Reports", "Draft Report"),

        // Purchase Reports
        ("Purchase Reports", "Purchase Summary"),
        ("Purchase Reports", "Purchase Register"),
        ("Purchase Reports", "Party Purchase Summary"),
        ("Purchase Reports", "Vendor Payments"),
        ("Purchase Reports", "Purchase Activity"),
        ("Purchase Reports", "Item Purchase Analysis"),
        ("Purchase Reports", "Accounts Payable Aging"),
        ("Purchase Reports", "Vendor Balances"),

        // Sale Reports
        ("Sale Reports", "Sale Summary"),
        ("Sale Reports", "Sale Register"),
        ("Sale Reports", "POS Sales"),
        ("Sale Reports", "Party Sale Summary"),
        ("Sale Reports", "Collection Report"),
        ("Sale Reports", "Sale Activity"),
        ("Sale Reports", "Item Sale Analysis"),
        ("Sale Reports", "Accounts Receivable Aging"),
        ("Sale Reports", "Salesperson Performance"),
        ("Sale Reports", "Salesman Incentive"),
        ("Sale Reports", "Item-wise Profit & Loss"),
        ("Sale Reports", "Invoice-wise Profit & Loss"),
        ("Sale Reports", "Customer Balances"),
        ("Sale Reports", "Sales Intelligence"),
        ("Sale Reports", "Operational Metrics"),

        // Inventory Reports
        ("Inventory Reports", "Inventory Ledger"),
        ("Inventory Reports", "Inventory Balances"),
        ("Inventory Reports", "Low Stock Alert"),
        ("Inventory Reports", "Inventory Intelligence"),

        // Financial Reports
        ("Financial Reports", "Ledger Report"),
        ("Financial Reports", "Trial Balance"),
        ("Financial Reports", "Profit & Loss"),
        ("Financial Reports", "Balance Sheet"),
        ("Financial Reports", "Cash Flow Statement"),
        ("Financial Reports", "Tax Reports"),
        ("Financial Reports", "Financial Health"),
        ("Financial Reports", "Cash Flow Management"),

        // Salary Reports
        ("Salary Reports", "Salary Register"),
        ("Salary Reports", "Staff Loan & Advance")
    };

    public IActionResult Index()
    {
        ViewBag.ReportCount = AllReports.Length;
        return View(AllReports);
    }

    public async Task<IActionResult> ProfitLoss(DateTime? from, DateTime? to)
    {
        var start = from ?? DateTime.Today;
        var end = to ?? DateTime.Today;
        var result = await _pl.GetAsync(start, end);
        ViewBag.From = start;
        ViewBag.To = end;
        return View(result);
    }

    public async Task<IActionResult> Generate(string name, DateTime? fromDate = null, DateTime? toDate = null)
    {
        ViewBag.ReportName = name;
        ViewBag.GeneratedAt = DateTime.Now;
        ViewBag.FromDate = fromDate?.ToString("yyyy-MM-dd");
        ViewBag.ToDate = toDate?.ToString("yyyy-MM-dd");

        // Filter dates if specified
        var salesQuery = _db.SalesInvoices.Include(s => s.Customer).Include(s => s.Lines).Include(s => s.Staff).AsQueryable();
        var purchaseQuery = _db.PurchaseInvoices.Include(p => p.Supplier).Include(p => p.Lines).AsQueryable();
        var paymentQuery = _db.Payments.Include(p => p.Customer).Include(p => p.Supplier).AsQueryable();
        var expenseQuery = _db.Expenses.AsQueryable();

        if (fromDate.HasValue)
        {
            salesQuery = salesQuery.Where(s => s.Date >= fromDate.Value.Date);
            purchaseQuery = purchaseQuery.Where(p => p.Date >= fromDate.Value.Date);
            paymentQuery = paymentQuery.Where(p => p.Date >= fromDate.Value.Date);
            expenseQuery = expenseQuery.Where(e => e.Date >= fromDate.Value.Date);
        }
        if (toDate.HasValue)
        {
            salesQuery = salesQuery.Where(s => s.Date <= toDate.Value.Date);
            purchaseQuery = purchaseQuery.Where(p => p.Date <= toDate.Value.Date);
            paymentQuery = paymentQuery.Where(p => p.Date <= toDate.Value.Date);
            expenseQuery = expenseQuery.Where(e => e.Date <= toDate.Value.Date);
        }

        ViewBag.SalesInvoices = await salesQuery.OrderByDescending(s => s.Date).ToListAsync();
        ViewBag.PurchaseInvoices = await purchaseQuery.OrderByDescending(p => p.Date).ToListAsync();
        ViewBag.Payments = await paymentQuery.OrderByDescending(p => p.Date).ToListAsync();
        ViewBag.Expenses = await expenseQuery.OrderByDescending(e => e.Date).ToListAsync();
        ViewBag.Customers = await _db.Customers.OrderBy(c => c.Name).ToListAsync();
        ViewBag.Suppliers = await _db.Suppliers.OrderBy(s => s.Name).ToListAsync();
        ViewBag.Products = await _db.Products.OrderBy(p => p.Name).ToListAsync();
        ViewBag.Staff = await _db.Staff.Include(s => s.Attendances).OrderBy(s => s.Name).ToListAsync();
        ViewBag.Advances = await _db.Advances.OrderByDescending(a => a.Date).ToListAsync();
        ViewBag.Loans = await _db.Loans.OrderByDescending(l => l.DateIssued).ToListAsync();

        ViewBag.SalesCount = await salesQuery.CountAsync();
        ViewBag.PurchaseCount = await purchaseQuery.CountAsync();
        ViewBag.CustomerCount = await _db.Customers.CountAsync();
        ViewBag.ProductCount = await _db.Products.CountAsync();
        ViewBag.TotalRevenue = (await salesQuery.Select(i => i.GrandTotal).ToListAsync()).Sum();
        ViewBag.TotalPurchases = (await purchaseQuery.Select(i => i.GrandTotal).ToListAsync()).Sum();
        ViewBag.TotalReceivables = (await _db.Customers.Select(c => c.BalanceDue).ToListAsync()).Sum();
        ViewBag.TotalPayables = (await _db.Suppliers.Select(s => s.BalanceDue).ToListAsync()).Sum();

        return View();
    }
}
