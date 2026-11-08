using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OilShop.Core.Data;

namespace OilShop.Web.Controllers;

/// <summary>Print Preview — Invoice Print Preview + Customer Ledger Account
/// Statement, with Print, PDF Download (browser print-to-PDF), Save as Image
/// and Share Document buttons.</summary>
public class PrintController : Controller
{
    private readonly OilShopDbContext _db;
    public PrintController(OilShopDbContext db) => _db = db;

    public async Task<IActionResult> Index(int? invoiceId, int? customerId)
    {
        var invoice = invoiceId is not null
            ? await _db.SalesInvoices.Include(i => i.Customer).Include(i => i.Lines)
                .FirstOrDefaultAsync(i => i.Id == invoiceId)
            : await _db.SalesInvoices.Include(i => i.Customer).Include(i => i.Lines)
                .OrderByDescending(i => i.Date).FirstOrDefaultAsync();

        var customer = customerId is not null
            ? await _db.Customers.FindAsync(customerId)
            : invoice?.Customer;
        ViewBag.Customer = customer;
        ViewBag.Invoices = customer is null
            ? new List<OilShop.Core.Models.SalesInvoice>()
            : await _db.SalesInvoices.Where(i => i.CustomerId == customer.Id)
                .OrderByDescending(i => i.Date).ToListAsync();
        ViewBag.Payments = customer is null
            ? new List<OilShop.Core.Models.Payment>()
            : await _db.Payments.Where(p => p.CustomerId == customer.Id)
                .OrderByDescending(p => p.Date).ToListAsync();
        ViewBag.Settings = await _db.ShopSettings.FirstOrDefaultAsync();
        ViewBag.AllInvoices = await _db.SalesInvoices.Include(i => i.Customer)
            .OrderByDescending(i => i.Date).Take(20).ToListAsync();
        ViewBag.AllCustomers = await _db.Customers.OrderBy(c => c.Name).ToListAsync();
        return View(invoice);
    }
}
