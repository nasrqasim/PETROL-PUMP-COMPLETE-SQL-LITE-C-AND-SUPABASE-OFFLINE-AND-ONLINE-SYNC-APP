using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OilShop.Core.Data;
using OilShop.Core.Models;
using OilShop.Core.Services;

namespace OilShop.Web.Controllers;

public class PurchasesController : Controller
{
    private readonly OilShopDbContext _db;
    private readonly InvoiceService _invoices;

    public PurchasesController(OilShopDbContext db, InvoiceService invoices)
    {
        _db = db;
        _invoices = invoices;
    }

    public async Task<IActionResult> Index(string? search = null, DateTime? fromDate = null, DateTime? toDate = null, PaymentMode? paymentMode = null)
    {
        var query = _db.PurchaseInvoices.Include(i => i.Supplier).AsQueryable();

        if (fromDate.HasValue)
            query = query.Where(i => i.Date >= fromDate.Value.Date);
        if (toDate.HasValue)
            query = query.Where(i => i.Date <= toDate.Value.Date);
        if (paymentMode.HasValue)
            query = query.Where(i => i.PaymentMode == paymentMode.Value);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var q = search.Trim().ToLower();
            query = query.Where(i =>
                i.InvoiceNumber.ToLower().Contains(q) ||
                (i.Supplier != null && i.Supplier.Name.ToLower().Contains(q)) ||
                (i.Remarks != null && i.Remarks.ToLower().Contains(q)));
        }

        ViewBag.Search = search;
        ViewBag.FromDate = fromDate?.ToString("yyyy-MM-dd");
        ViewBag.ToDate = toDate?.ToString("yyyy-MM-dd");
        ViewBag.PaymentMode = paymentMode;

        var list = await query.OrderByDescending(i => i.Date).ThenByDescending(i => i.Id).ToListAsync();
        ViewBag.TotalPurchases = list.Sum(i => i.GrandTotal);

        return View(list);
    }

    public async Task<IActionResult> Details(int id)
    {
        var invoice = await _db.PurchaseInvoices
            .Include(i => i.Supplier)
            .Include(i => i.Lines)
            .FirstOrDefaultAsync(i => i.Id == id);
        if (invoice == null) return NotFound();
        return View(invoice);
    }

    public async Task<IActionResult> Create()
    {
        ViewBag.Suppliers = await _db.Suppliers.OrderBy(s => s.Name).ToListAsync();
        ViewBag.Products = await _db.Products.OrderBy(p => p.Name).ToListAsync();
        return View(new PurchaseInvoice { Date = DateTime.Today, Lines = new List<PurchaseInvoiceLine> { new() } });
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Create(PurchaseInvoice invoice)
    {
        invoice.Lines = invoice.Lines.Where(l => l.ProductId > 0 && l.Quantity > 0).ToList();
        if (!invoice.Lines.Any())
        {
            TempData["Error"] = "Add at least one product line.";
            return RedirectToAction(nameof(Create));
        }
        invoice.InvoiceNumber = $"PI-{await _db.PurchaseInvoices.CountAsync() + 7892:D6}";
        try
        {
            await _invoices.CreatePurchaseAsync(invoice);
            TempData["Message"] = $"Purchase invoice {invoice.InvoiceNumber} saved. Stock Updated Automatically.";
        }
        catch (InvalidOperationException ex)
        {
            TempData["Error"] = ex.Message;
            return RedirectToAction(nameof(Create));
        }
        return RedirectToAction(nameof(Index));
    }

    public async Task<IActionResult> Edit(int id)
    {
        var invoice = await _db.PurchaseInvoices.Include(i => i.Lines).FirstOrDefaultAsync(i => i.Id == id);
        if (invoice == null) return NotFound();

        ViewBag.Suppliers = await _db.Suppliers.OrderBy(s => s.Name).ToListAsync();
        return View(invoice);
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Edit(int id, PurchaseInvoice updated)
    {
        var invoice = await _db.PurchaseInvoices.Include(i => i.Lines).FirstOrDefaultAsync(i => i.Id == id);
        if (invoice == null) return NotFound();

        invoice.Date = updated.Date;
        invoice.SupplierId = updated.SupplierId;
        invoice.PaymentMode = updated.PaymentMode;
        invoice.Remarks = updated.Remarks;
        invoice.Discount = updated.Discount;
        invoice.Tax = updated.Tax;

        invoice.SubTotal = invoice.Lines.Sum(l => l.Quantity * l.UnitPrice);
        invoice.GrandTotal = invoice.SubTotal - invoice.Discount + invoice.Tax;
        invoice.PaidAmount = invoice.PaymentMode == PaymentMode.Credit ? 0 : invoice.GrandTotal;

        await _db.SaveChangesAsync();
        TempData["Message"] = $"Purchase Invoice {invoice.InvoiceNumber} updated.";
        return RedirectToAction(nameof(Index));
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Delete(int id)
    {
        var invoice = await _db.PurchaseInvoices.Include(i => i.Lines).Include(i => i.Supplier).FirstOrDefaultAsync(i => i.Id == id);
        if (invoice == null) return NotFound();

        // Reduce stock that was added by this purchase
        foreach (var line in invoice.Lines)
        {
            var product = await _db.Products.FindAsync(line.ProductId);
            if (product != null)
            {
                product.StockQuantity = Math.Max(0, product.StockQuantity - line.Quantity);
            }
        }

        // Reverse payable if credit
        if (invoice.PaymentMode == PaymentMode.Credit && invoice.Supplier != null)
        {
            invoice.Supplier.BalanceDue = Math.Max(0, invoice.Supplier.BalanceDue - invoice.GrandTotal);
        }

        _db.PurchaseInvoices.Remove(invoice);
        await _db.SaveChangesAsync();

        TempData["Message"] = $"Purchase Invoice {invoice.InvoiceNumber} deleted and stock adjusted.";
        return RedirectToAction(nameof(Index));
    }
}
