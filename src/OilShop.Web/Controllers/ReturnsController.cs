using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OilShop.Core.Data;
using OilShop.Core.Models;
using OilShop.Core.Services;

namespace OilShop.Web.Controllers;

public class ReturnsController : Controller
{
    private readonly OilShopDbContext _db;
    private readonly ReturnService _returns;
    public ReturnsController(OilShopDbContext db, ReturnService returns) { _db = db; _returns = returns; }

    public async Task<IActionResult> Index()
    {
        ViewBag.TotalSalesReturns = await _returns.TotalSalesReturnsAsync();
        ViewBag.TotalPurchaseReturns = await _returns.TotalPurchaseReturnsAsync();
        return View(await _db.Returns
            .Include(r => r.Customer).Include(r => r.Supplier)
            .OrderByDescending(r => r.Date).ToListAsync());
    }

    public async Task<IActionResult> Create()
    {
        ViewBag.Customers = await _db.Customers.OrderBy(c => c.Name).ToListAsync();
        ViewBag.Suppliers = await _db.Suppliers.OrderBy(s => s.Name).ToListAsync();
        ViewBag.Products = await _db.Products.OrderBy(p => p.Name).ToListAsync();
        return View(new Return { Date = DateTime.Today });
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Create(Return ret)
    {
        ret.ReturnNumber = ret.Type == ReturnType.SalesReturn
            ? $"SR-{await _db.Returns.CountAsync() + 1156:D6}"
            : $"PR-{await _db.Returns.CountAsync() + 1156:D6}";
        try
        {
            await _returns.CreateAsync(ret);
            TempData["Message"] = $"Return {ret.ReturnNumber} saved. Refund Rs. {ret.RefundAmount:N0}. Stock restored.";
        }
        catch (InvalidOperationException ex)
        {
            TempData["Error"] = ex.Message;
            return RedirectToAction(nameof(Create));
        }
        return RedirectToAction(nameof(Index));
    }

    public async Task<IActionResult> Slip(int id)
    {
        var ret = await _db.Returns.Include(r => r.Customer).Include(r => r.Supplier)
            .FirstOrDefaultAsync(r => r.Id == id);
        return ret is null ? NotFound() : View(ret);
    }
}
