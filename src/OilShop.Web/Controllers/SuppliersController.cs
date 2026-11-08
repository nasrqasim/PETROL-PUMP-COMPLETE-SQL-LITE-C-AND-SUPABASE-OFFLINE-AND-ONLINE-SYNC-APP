using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OilShop.Core.Data;
using OilShop.Core.Models;

namespace OilShop.Web.Controllers;

public class SuppliersController : Controller
{
    private readonly OilShopDbContext _db;

    public SuppliersController(OilShopDbContext db)
    {
        _db = db;
    }

    public async Task<IActionResult> Index(string? search = null, DateTime? fromDate = null, DateTime? toDate = null)
    {
        var query = _db.Suppliers.AsQueryable();

        if (fromDate.HasValue)
            query = query.Where(s => s.CreatedAt >= fromDate.Value.Date);
        if (toDate.HasValue)
            query = query.Where(s => s.CreatedAt <= toDate.Value.Date.AddDays(1).AddTicks(-1));

        if (!string.IsNullOrWhiteSpace(search))
        {
            var q = search.Trim().ToLower();
            query = query.Where(s =>
                s.Name.ToLower().Contains(q) ||
                s.Phone.ToLower().Contains(q) ||
                (s.Address != null && s.Address.ToLower().Contains(q)) ||
                (s.NTN != null && s.NTN.ToLower().Contains(q)));
        }

        ViewBag.Search = search;
        ViewBag.FromDate = fromDate?.ToString("yyyy-MM-dd");
        ViewBag.ToDate = toDate?.ToString("yyyy-MM-dd");

        return View(await query.OrderBy(s => s.Name).ToListAsync());
    }

    public async Task<IActionResult> Details(int id)
    {
        var s = await _db.Suppliers
            .Include(x => x.PurchaseInvoices)
            .Include(x => x.Payments)
            .FirstOrDefaultAsync(x => x.Id == id);
        return s is null ? NotFound() : View(s);
    }

    public IActionResult Create() => View(new Supplier());

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Create(Supplier supplier)
    {
        if (string.IsNullOrWhiteSpace(supplier.Name))
        {
            TempData["Error"] = "Supplier Name is required.";
            return View(supplier);
        }
        _db.Suppliers.Add(supplier);
        await _db.SaveChangesAsync();
        TempData["Message"] = $"Supplier {supplier.Name} added successfully.";
        return RedirectToAction(nameof(Index));
    }

    public async Task<IActionResult> Edit(int id)
    {
        var supplier = await _db.Suppliers.FindAsync(id);
        if (supplier == null) return NotFound();
        return View(supplier);
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Edit(int id, Supplier updated)
    {
        var supplier = await _db.Suppliers.FindAsync(id);
        if (supplier == null) return NotFound();

        supplier.Name = updated.Name;
        supplier.Phone = updated.Phone;
        supplier.Address = updated.Address;
        supplier.Email = updated.Email;
        supplier.NTN = updated.NTN;
        supplier.BalanceDue = updated.BalanceDue;
        supplier.Advance = updated.Advance;

        await _db.SaveChangesAsync();
        TempData["Message"] = $"Supplier {supplier.Name} updated successfully.";
        return RedirectToAction(nameof(Index));
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Delete(int id)
    {
        var supplier = await _db.Suppliers.Include(s => s.PurchaseInvoices).FirstOrDefaultAsync(s => s.Id == id);
        if (supplier == null) return NotFound();

        if (supplier.PurchaseInvoices.Any())
        {
            TempData["Error"] = $"Cannot delete supplier '{supplier.Name}' because there are {supplier.PurchaseInvoices.Count} linked purchase invoice(s).";
            return RedirectToAction(nameof(Index));
        }

        _db.Suppliers.Remove(supplier);
        await _db.SaveChangesAsync();
        TempData["Message"] = $"Supplier {supplier.Name} deleted.";
        return RedirectToAction(nameof(Index));
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> PaySupplier(int id, decimal amount)
    {
        var s = await _db.Suppliers.FindAsync(id);
        if (s is null) return NotFound();
        if (amount > s.BalanceDue) { s.Advance += amount - s.BalanceDue; s.BalanceDue = 0; }
        else s.BalanceDue -= amount;
        _db.Payments.Add(new Payment
        {
            VoucherNumber = $"PAY-{DateTime.UtcNow:yyyyMMddHHmmss}",
            Date = DateTime.Today, Type = VoucherType.CashPayment,
            PartyType = PartyType.Supplier, SupplierId = id, Amount = amount
        });
        await _db.SaveChangesAsync();
        TempData["Message"] = $"Payment of Rs. {amount:N0} paid to {s.Name}.";
        return RedirectToAction(nameof(Details), new { id });
    }
}
