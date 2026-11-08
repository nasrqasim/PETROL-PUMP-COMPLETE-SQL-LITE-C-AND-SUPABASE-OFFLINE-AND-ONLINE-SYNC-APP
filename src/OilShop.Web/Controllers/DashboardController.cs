using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OilShop.Core.Data;
using OilShop.Core.Services;

namespace OilShop.Web.Controllers;

public class DashboardController : Controller
{
    private readonly OilShopDbContext _db;
    private readonly InvoiceService _invoices;
    private readonly ProfitLossService _pl;

    public DashboardController(OilShopDbContext db, InvoiceService invoices, ProfitLossService pl)
    {
        _db = db; _invoices = invoices; _pl = pl;
    }

    public async Task<IActionResult> Index()
    {
        var today = DateTime.Today;
        var pl = await _pl.GetAsync(today, today);
        ViewBag.Revenue = pl.TotalRevenue;
        ViewBag.Expenses = pl.TotalExpenses;
        ViewBag.NetProfit = pl.NetProfit;
        ViewBag.Cash = await _invoices.CashBalanceAsync();
        ViewBag.Bank = await _invoices.BankBalanceAsync();
        ViewBag.Receivables = (await _db.Customers.Select(c => c.BalanceDue).ToListAsync()).Sum();
        ViewBag.Payables = (await _db.Suppliers.Select(s => s.BalanceDue).ToListAsync()).Sum();
        var recentInvoices = await _db.SalesInvoices
            .Include(i => i.Customer).OrderByDescending(i => i.Date).Take(10).ToListAsync();
        ViewBag.RecentInvoices = recentInvoices;
        ViewBag.LowStock = await _db.Products.Where(p => p.StockQuantity <= p.LowStockAlert).ToListAsync();
        return View(recentInvoices);
    }

    public IActionResult Error() => View();
}
