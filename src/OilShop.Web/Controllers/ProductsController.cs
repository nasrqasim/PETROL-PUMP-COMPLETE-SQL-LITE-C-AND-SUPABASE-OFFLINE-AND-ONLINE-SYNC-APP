using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OilShop.Core.Data;
using OilShop.Core.Models;

namespace OilShop.Web.Controllers;

public class ProductsController : Controller
{
    private readonly OilShopDbContext _db;

    public ProductsController(OilShopDbContext db)
    {
        _db = db;
    }

    public async Task<IActionResult> Index(string? search = null, string? category = null, DateTime? fromDate = null, DateTime? toDate = null)
    {
        var query = _db.Products.AsQueryable();

        if (fromDate.HasValue)
            query = query.Where(p => p.CreatedAt >= fromDate.Value.Date);
        if (toDate.HasValue)
            query = query.Where(p => p.CreatedAt <= toDate.Value.Date.AddDays(1).AddTicks(-1));

        if (!string.IsNullOrWhiteSpace(category))
            query = query.Where(p => p.Category == category);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var q = search.Trim().ToLower();
            query = query.Where(p =>
                p.Name.ToLower().Contains(q) ||
                (p.Category != null && p.Category.ToLower().Contains(q)) ||
                p.Unit.ToLower().Contains(q));
        }

        ViewBag.Search = search;
        ViewBag.Category = category;
        ViewBag.FromDate = fromDate?.ToString("yyyy-MM-dd");
        ViewBag.ToDate = toDate?.ToString("yyyy-MM-dd");
        ViewBag.Categories = await _db.Products.Select(p => p.Category).Where(c => c != null).Distinct().ToListAsync();

        return View(await query.OrderBy(p => p.Name).ToListAsync());
    }

    public IActionResult Create() => View(new Product());

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Create(Product product)
    {
        if (string.IsNullOrWhiteSpace(product.Name))
        {
            TempData["Error"] = "Product Name is required.";
            return View(product);
        }
        _db.Products.Add(product);
        await _db.SaveChangesAsync();
        TempData["Message"] = $"Product {product.Name} added to inventory.";
        return RedirectToAction(nameof(Index));
    }

    public async Task<IActionResult> Edit(int id)
    {
        var product = await _db.Products.FindAsync(id);
        if (product == null) return NotFound();
        return View(product);
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Edit(int id, Product updated)
    {
        var product = await _db.Products.FindAsync(id);
        if (product == null) return NotFound();

        product.Name = updated.Name;
        product.Category = updated.Category;
        product.Unit = updated.Unit;
        product.SalePrice = updated.SalePrice;
        product.PurchasePrice = updated.PurchasePrice;
        product.StockQuantity = updated.StockQuantity;
        product.LowStockAlert = updated.LowStockAlert;

        await _db.SaveChangesAsync();
        TempData["Message"] = $"Product {product.Name} updated.";
        return RedirectToAction(nameof(Index));
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Delete(int id)
    {
        var product = await _db.Products.FindAsync(id);
        if (product != null)
        {
            _db.Products.Remove(product);
            await _db.SaveChangesAsync();
            TempData["Message"] = $"Product {product.Name} removed from catalog.";
        }
        return RedirectToAction(nameof(Index));
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> AdjustStock(int id, decimal quantity)
    {
        var p = await _db.Products.FindAsync(id);
        if (p is null) return NotFound();
        p.StockQuantity += quantity;
        await _db.SaveChangesAsync();
        TempData["Message"] = $"Stock for {p.Name} adjusted to {p.StockQuantity}.";
        return RedirectToAction(nameof(Index));
    }
}
