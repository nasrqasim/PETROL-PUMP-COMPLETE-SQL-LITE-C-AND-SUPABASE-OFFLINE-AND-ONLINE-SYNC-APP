using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OilShop.Core.Data;
using OilShop.Core.Services;

namespace OilShop.Web.Controllers;

/// <summary>WhatsApp Integration — Customer Contacts with balance due and a
/// WhatsApp button that opens wa.me with a prefilled balance message.
/// Also Send Report / Share Statement actions.</summary>
public class WhatsAppController : Controller
{
    private readonly OilShopDbContext _db;
    public WhatsAppController(OilShopDbContext db) => _db = db;

    public async Task<IActionResult> Index()
    {
        ViewBag.ShopName = (await _db.ShopSettings.FirstOrDefaultAsync())?.ShopName ?? "Roonjha Oil Traders";
        return View(await _db.Customers.OrderBy(c => c.Name).ToListAsync());
    }

    public async Task<IActionResult> Chat(int id)
    {
        var customer = await _db.Customers.FindAsync(id);
        if (customer is null) return NotFound();
        var shop = await _db.ShopSettings.FirstOrDefaultAsync();
        ViewBag.Link = WhatsAppService.BalanceLink(
            customer.Phone, shop?.ShopName ?? "Roonjha Oil Traders", customer.Name, customer.BalanceDue);
        ViewBag.Invoices = await _db.SalesInvoices
            .Where(i => i.CustomerId == id).OrderByDescending(i => i.Date).ToListAsync();
        ViewBag.Payments = await _db.Payments
            .Where(p => p.CustomerId == id).OrderByDescending(p => p.Date).ToListAsync();
        return View(customer);
    }
}
