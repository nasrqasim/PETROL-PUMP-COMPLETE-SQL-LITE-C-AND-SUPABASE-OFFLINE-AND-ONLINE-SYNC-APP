using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OilShop.Core.Data;
using OilShop.Core.Models;
using OilShop.Core.Services;

namespace OilShop.Web.Controllers;

public class CustomersController : Controller
{
    private readonly OilShopDbContext _db;
    private readonly InvoiceService _invoices;

    public CustomersController(OilShopDbContext db, InvoiceService invoices)
    {
        _db = db;
        _invoices = invoices;
    }

    public async Task<IActionResult> Index(string? search = null, DateTime? fromDate = null, DateTime? toDate = null)
    {
        var query = _db.Customers.AsQueryable();

        if (fromDate.HasValue)
            query = query.Where(c => c.CreatedAt >= fromDate.Value.Date);
        if (toDate.HasValue)
            query = query.Where(c => c.CreatedAt <= toDate.Value.Date.AddDays(1).AddTicks(-1));

        if (!string.IsNullOrWhiteSpace(search))
        {
            var q = search.Trim().ToLower();
            query = query.Where(c =>
                c.Name.ToLower().Contains(q) ||
                c.Phone.ToLower().Contains(q) ||
                (c.Address != null && c.Address.ToLower().Contains(q)) ||
                (c.NTN != null && c.NTN.ToLower().Contains(q)));
        }

        ViewBag.Search = search;
        ViewBag.FromDate = fromDate?.ToString("yyyy-MM-dd");
        ViewBag.ToDate = toDate?.ToString("yyyy-MM-dd");

        return View(await query.OrderBy(c => c.Name).ToListAsync());
    }

    public async Task<IActionResult> Details(int id)
    {
        var c = await _db.Customers
            .Include(x => x.SalesInvoices)
            .Include(x => x.Payments)
            .FirstOrDefaultAsync(x => x.Id == id);
        return c is null ? NotFound() : View(c);
    }

    public IActionResult Create() => View(new Customer());

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Create(Customer customer)
    {
        if (string.IsNullOrWhiteSpace(customer.Name))
        {
            TempData["Error"] = "Customer Name is required.";
            return View(customer);
        }
        _db.Customers.Add(customer);
        await _db.SaveChangesAsync();
        TempData["Message"] = $"Customer {customer.Name} added successfully.";
        return RedirectToAction(nameof(Index));
    }

    public async Task<IActionResult> Edit(int id)
    {
        var customer = await _db.Customers.FindAsync(id);
        if (customer == null) return NotFound();
        return View(customer);
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Edit(int id, Customer updated)
    {
        var customer = await _db.Customers.FindAsync(id);
        if (customer == null) return NotFound();

        customer.Name = updated.Name;
        customer.Phone = updated.Phone;
        customer.Address = updated.Address;
        customer.Email = updated.Email;
        customer.NTN = updated.NTN;
        customer.BalanceDue = updated.BalanceDue;
        customer.Advance = updated.Advance;

        await _db.SaveChangesAsync();
        TempData["Message"] = $"Customer {customer.Name} updated successfully.";
        return RedirectToAction(nameof(Index));
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Delete(int id)
    {
        var customer = await _db.Customers.Include(c => c.SalesInvoices).FirstOrDefaultAsync(c => c.Id == id);
        if (customer == null) return NotFound();

        if (customer.SalesInvoices.Any())
        {
            TempData["Error"] = $"Cannot delete customer '{customer.Name}' because there are {customer.SalesInvoices.Count} linked invoice(s).";
            return RedirectToAction(nameof(Index));
        }

        _db.Customers.Remove(customer);
        await _db.SaveChangesAsync();
        TempData["Message"] = $"Customer {customer.Name} deleted.";
        return RedirectToAction(nameof(Index));
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> ReceivePayment(int id, decimal amount, string mode)
    {
        var paymentMode = mode == "Bank" ? PaymentMode.Bank : PaymentMode.Cash;
        await _invoices.ReceiveCustomerPaymentAsync(id, amount, paymentMode);
        TempData["Message"] = $"Payment of Rs. {amount:N0} received.";
        return RedirectToAction(nameof(Details), new { id });
    }
}
