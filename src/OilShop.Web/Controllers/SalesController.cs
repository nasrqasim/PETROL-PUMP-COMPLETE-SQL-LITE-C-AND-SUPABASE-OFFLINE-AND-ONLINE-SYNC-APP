using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OilShop.Core.Data;
using OilShop.Core.Models;
using OilShop.Core.Services;

namespace OilShop.Web.Controllers;

public class SalesController : Controller
{
    private readonly OilShopDbContext _db;
    private readonly InvoiceService _invoices;

    public SalesController(OilShopDbContext db, InvoiceService invoices)
    {
        _db = db;
        _invoices = invoices;
    }

    public async Task<IActionResult> Index(string? search = null, DateTime? fromDate = null, DateTime? toDate = null, PaymentMode? paymentMode = null)
    {
        var query = _db.SalesInvoices.Include(i => i.Customer).AsQueryable();

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
                (i.Customer != null && i.Customer.Name.ToLower().Contains(q)) ||
                (i.Remarks != null && i.Remarks.ToLower().Contains(q)));
        }

        ViewBag.Search = search;
        ViewBag.FromDate = fromDate?.ToString("yyyy-MM-dd");
        ViewBag.ToDate = toDate?.ToString("yyyy-MM-dd");
        ViewBag.PaymentMode = paymentMode;

        var list = await query.OrderByDescending(i => i.Date).ThenByDescending(i => i.Id).ToListAsync();
        ViewBag.TotalRevenue = list.Sum(i => i.GrandTotal);

        return View(list);
    }

    public async Task<IActionResult> Create()
    {
        ViewBag.Customers = await _db.Customers.OrderBy(c => c.Name).ToListAsync();
        ViewBag.Products = await _db.Products.OrderBy(p => p.Name).ToListAsync();
        ViewBag.Staff = await _db.Staff.Where(s => s.IsActive).OrderBy(s => s.Name).ToListAsync();
        return View(new SalesInvoice { Date = DateTime.Today, Lines = new List<SalesInvoiceLine> { new() } });
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Create(SalesInvoice invoice)
    {
        invoice.Lines = invoice.Lines.Where(l => l.ProductId > 0 && l.Quantity > 0).ToList();
        if (!invoice.Lines.Any())
        {
            TempData["Error"] = "Add at least one product line.";
            return RedirectToAction(nameof(Create));
        }
        invoice.InvoiceNumber = $"SI-{await _db.SalesInvoices.CountAsync() + 4587:D6}";
        try
        {
            await _invoices.CreateSaleAsync(invoice);
            TempData["Message"] = $"Invoice {invoice.InvoiceNumber} saved. Stock updated automatically.";
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
        var invoice = await _db.SalesInvoices.Include(i => i.Lines).FirstOrDefaultAsync(i => i.Id == id);
        if (invoice == null) return NotFound();

        ViewBag.Customers = await _db.Customers.OrderBy(c => c.Name).ToListAsync();
        ViewBag.Products = await _db.Products.OrderBy(p => p.Name).ToListAsync();
        ViewBag.Staff = await _db.Staff.Where(s => s.IsActive).OrderBy(s => s.Name).ToListAsync();
        return View(invoice);
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Edit(int id, SalesInvoice updated)
    {
        var invoice = await _db.SalesInvoices.Include(i => i.Lines).FirstOrDefaultAsync(i => i.Id == id);
        if (invoice == null) return NotFound();

        invoice.Date = updated.Date;
        invoice.CustomerId = updated.CustomerId;
        invoice.StaffId = updated.StaffId;
        invoice.PaymentMode = updated.PaymentMode;
        invoice.Remarks = updated.Remarks;
        invoice.Discount = updated.Discount;
        invoice.Tax = updated.Tax;

        // Recalculate SubTotal and GrandTotal
        invoice.SubTotal = invoice.Lines.Sum(l => l.Quantity * l.UnitPrice);
        invoice.GrandTotal = invoice.SubTotal - invoice.Discount + invoice.Tax;
        invoice.PaidAmount = invoice.PaymentMode == PaymentMode.Credit ? 0 : invoice.GrandTotal;

        await _db.SaveChangesAsync();
        TempData["Message"] = $"Sale Invoice {invoice.InvoiceNumber} updated.";
        return RedirectToAction(nameof(Index));
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Delete(int id)
    {
        var invoice = await _db.SalesInvoices.Include(i => i.Lines).Include(i => i.Customer).FirstOrDefaultAsync(i => i.Id == id);
        if (invoice == null) return NotFound();

        // Restore stock
        foreach (var line in invoice.Lines)
        {
            var product = await _db.Products.FindAsync(line.ProductId);
            if (product != null)
            {
                product.StockQuantity += line.Quantity;
            }
        }

        // Reverse khata if credit
        if (invoice.PaymentMode == PaymentMode.Credit && invoice.Customer != null)
        {
            invoice.Customer.BalanceDue = Math.Max(0, invoice.Customer.BalanceDue - invoice.GrandTotal);
        }

        _db.SalesInvoices.Remove(invoice);
        await _db.SaveChangesAsync();

        TempData["Message"] = $"Sale Invoice {invoice.InvoiceNumber} deleted and stock restored.";
        return RedirectToAction(nameof(Index));
    }

    public async Task<IActionResult> Print(int id)
    {
        var invoice = await _db.SalesInvoices
            .Include(i => i.Customer).Include(i => i.Staff).Include(i => i.Lines)
            .FirstOrDefaultAsync(i => i.Id == id);
        if (invoice is null) return NotFound();
        ViewBag.Settings = await _db.ShopSettings.FirstOrDefaultAsync();
        return View(invoice);
    }
}
