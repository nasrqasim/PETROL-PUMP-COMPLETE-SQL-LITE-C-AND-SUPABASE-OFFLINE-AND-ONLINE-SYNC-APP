using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OilShop.Core.Data;
using OilShop.Core.Models;
using OilShop.Core.Services;
using OilShop.Web.Models;

namespace OilShop.Web.Controllers;

[ApiController]
[Route("api/oilshop")]
public class OilShopApiController : ControllerBase
{
    private readonly OilShopDbContext _db;
    private readonly InvoiceService _invoices;

    public OilShopApiController(OilShopDbContext db, InvoiceService invoices)
    {
        _db = db;
        _invoices = invoices;
    }

    // GET /api/oilshop/dashboard
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        var today = DateTime.Today;
        var tomorrow = today.AddDays(1);

        var todaySalesInvoices = await _db.SalesInvoices
            .Where(s => s.Date >= today && s.Date < tomorrow && !s.IsDeleted)
            .ToListAsync();
        var todayPurchases = await _db.PurchaseInvoices
            .Where(p => p.Date >= today && p.Date < tomorrow && !p.IsDeleted)
            .ToListAsync();
        var todayExpenses = await _db.Expenses
            .Where(e => e.Date >= today && e.Date < tomorrow && !e.IsDeleted)
            .ToListAsync();

        var lowStock = await _db.Products
            .Where(p => !p.IsDeleted && p.StockQuantity <= p.LowStockAlert)
            .CountAsync();

        var cashInHand = await _invoices.CashBalanceAsync();
        var bankBalance = await _invoices.BankBalanceAsync();

        var recentSales = await _db.SalesInvoices
            .Include(s => s.Customer)
            .Where(s => !s.IsDeleted)
            .OrderByDescending(s => s.Date)
            .ThenByDescending(s => s.Id)
            .Take(10)
            .Select(s => new
            {
                s.Id,
                s.InvoiceNumber,
                Date = s.Date.ToString("dd-MMM-yyyy"),
                Customer = s.Customer != null ? s.Customer.Name : "Walk-in Customer",
                Mode = s.PaymentMode.ToString(),
                s.GrandTotal
            })
            .ToListAsync();

        return Ok(new
        {
            CashInHand = cashInHand,
            BankBalance = bankBalance,
            TodaySales = todaySalesInvoices.Sum(s => s.GrandTotal),
            TodayPurchases = todayPurchases.Sum(p => p.GrandTotal),
            TodayExpenses = todayExpenses.Sum(e => e.Amount),
            TodaySalesInvoicesCount = todaySalesInvoices.Count,
            LowStockCount = lowStock,
            RecentSales = recentSales
        });
    }

    // Customers
    [HttpGet("customers")]
    public async Task<IActionResult> GetCustomers() =>
        Ok(await _db.Customers.Where(c => !c.IsDeleted).OrderBy(c => c.Name).ToListAsync());

    [HttpGet("customers/{id:int}")]
    public async Task<IActionResult> GetCustomer(int id)
    {
        var c = await _db.Customers.Include(x => x.SalesInvoices).FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted);
        return c == null ? NotFound() : Ok(c);
    }

    [HttpPost("customers")]
    public async Task<IActionResult> CreateCustomer([FromBody] Customer model)
    {
        _db.Customers.Add(model);
        await _db.SaveChangesAsync();
        return Ok(model);
    }

    [HttpPut("customers/{id:int}")]
    public async Task<IActionResult> UpdateCustomer(int id, [FromBody] Customer model)
    {
        var existing = await _db.Customers.FindAsync(id);
        if (existing == null) return NotFound();
        existing.Name = model.Name;
        existing.Phone = model.Phone;
        existing.Address = model.Address;
        existing.Email = model.Email;
        existing.NTN = model.NTN;
        existing.BalanceDue = model.BalanceDue;
        existing.Advance = model.Advance;
        existing.UpdatedAt = DateTime.UtcNow;
        existing.IsDirty = true;
        await _db.SaveChangesAsync();
        return Ok(existing);
    }

    [HttpDelete("customers/{id:int}")]
    public async Task<IActionResult> DeleteCustomer(int id)
    {
        var c = await _db.Customers.FindAsync(id);
        if (c == null) return NotFound();
        c.IsDeleted = true;
        c.UpdatedAt = DateTime.UtcNow;
        c.IsDirty = true;
        await _db.SaveChangesAsync();
        return Ok(new { success = true });
    }

    // Suppliers
    [HttpGet("suppliers")]
    public async Task<IActionResult> GetSuppliers() =>
        Ok(await _db.Suppliers.Where(s => !s.IsDeleted).OrderBy(s => s.Name).ToListAsync());

    [HttpGet("suppliers/{id:int}")]
    public async Task<IActionResult> GetSupplier(int id)
    {
        var s = await _db.Suppliers.Include(x => x.PurchaseInvoices).FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted);
        return s == null ? NotFound() : Ok(s);
    }

    [HttpPost("suppliers")]
    public async Task<IActionResult> CreateSupplier([FromBody] Supplier model)
    {
        _db.Suppliers.Add(model);
        await _db.SaveChangesAsync();
        return Ok(model);
    }

    [HttpPut("suppliers/{id:int}")]
    public async Task<IActionResult> UpdateSupplier(int id, [FromBody] Supplier model)
    {
        var existing = await _db.Suppliers.FindAsync(id);
        if (existing == null) return NotFound();
        existing.Name = model.Name;
        existing.Phone = model.Phone;
        existing.Address = model.Address;
        existing.Email = model.Email;
        existing.NTN = model.NTN;
        existing.BalanceDue = model.BalanceDue;
        existing.Advance = model.Advance;
        existing.UpdatedAt = DateTime.UtcNow;
        existing.IsDirty = true;
        await _db.SaveChangesAsync();
        return Ok(existing);
    }

    [HttpDelete("suppliers/{id:int}")]
    public async Task<IActionResult> DeleteSupplier(int id)
    {
        var s = await _db.Suppliers.FindAsync(id);
        if (s == null) return NotFound();
        s.IsDeleted = true;
        s.UpdatedAt = DateTime.UtcNow;
        s.IsDirty = true;
        await _db.SaveChangesAsync();
        return Ok(new { success = true });
    }

    // Products / Stock
    [HttpGet("products")]
    public async Task<IActionResult> GetProducts() =>
        Ok(await _db.Products.Where(p => !p.IsDeleted).OrderBy(p => p.Name).ToListAsync());

    [HttpPost("products")]
    public async Task<IActionResult> CreateProduct([FromBody] Product model)
    {
        _db.Products.Add(model);
        await _db.SaveChangesAsync();
        return Ok(model);
    }

    [HttpPut("products/{id:int}")]
    public async Task<IActionResult> UpdateProduct(int id, [FromBody] Product model)
    {
        var p = await _db.Products.FindAsync(id);
        if (p == null) return NotFound();
        p.Name = model.Name;
        p.Category = model.Category;
        p.Unit = model.Unit;
        p.SalePrice = model.SalePrice;
        p.PurchasePrice = model.PurchasePrice;
        p.StockQuantity = model.StockQuantity;
        p.LowStockAlert = model.LowStockAlert;
        p.UpdatedAt = DateTime.UtcNow;
        p.IsDirty = true;
        await _db.SaveChangesAsync();
        return Ok(p);
    }

    [HttpDelete("products/{id:int}")]
    public async Task<IActionResult> DeleteProduct(int id)
    {
        var p = await _db.Products.FindAsync(id);
        if (p == null) return NotFound();
        p.IsDeleted = true;
        p.UpdatedAt = DateTime.UtcNow;
        p.IsDirty = true;
        await _db.SaveChangesAsync();
        return Ok(new { success = true });
    }

    // Sales Invoices
    [HttpGet("sales")]
    public async Task<IActionResult> GetSales([FromQuery] string? search)
    {
        var query = _db.SalesInvoices
            .Include(s => s.Customer)
            .Include(s => s.Lines)
            .Where(s => !s.IsDeleted)
            .OrderByDescending(s => s.Date)
            .ThenByDescending(s => s.Id)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var q = search.Trim().ToLower();
            query = query.Where(s => s.InvoiceNumber.ToLower().Contains(q) || (s.Customer != null && s.Customer.Name.ToLower().Contains(q)));
        }

        var list = await query.ToListAsync();
        return Ok(list);
    }

    // Purchases
    [HttpGet("purchases")]
    public async Task<IActionResult> GetPurchases([FromQuery] string? search)
    {
        var query = _db.PurchaseInvoices
            .Include(p => p.Supplier)
            .Include(p => p.Lines)
            .Where(p => !p.IsDeleted)
            .OrderByDescending(p => p.Date)
            .ThenByDescending(p => p.Id)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var q = search.Trim().ToLower();
            query = query.Where(p => p.InvoiceNumber.ToLower().Contains(q) || (p.Supplier != null && p.Supplier.Name.ToLower().Contains(q)));
        }

        var list = await query.ToListAsync();
        return Ok(list);
    }

    // Expenses
    [HttpGet("expenses")]
    public async Task<IActionResult> GetExpenses([FromQuery] string? search)
    {
        var query = _db.Expenses.Where(e => !e.IsDeleted).OrderByDescending(e => e.Date).ThenByDescending(e => e.Id).AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var q = search.Trim().ToLower();
            query = query.Where(e => e.Category.ToLower().Contains(q) || (e.Remarks != null && e.Remarks.ToLower().Contains(q)));
        }
        return Ok(await query.ToListAsync());
    }

    [HttpPost("expenses")]
    public async Task<IActionResult> CreateExpense([FromBody] Expense model)
    {
        _db.Expenses.Add(model);
        await _db.SaveChangesAsync();
        return Ok(model);
    }

    [HttpDelete("expenses/{id:int}")]
    public async Task<IActionResult> DeleteExpense(int id)
    {
        var e = await _db.Expenses.FindAsync(id);
        if (e == null) return NotFound();
        e.IsDeleted = true;
        e.UpdatedAt = DateTime.UtcNow;
        e.IsDirty = true;
        await _db.SaveChangesAsync();
        return Ok(new { success = true });
    }

    // Staff
    [HttpGet("staff")]
    public async Task<IActionResult> GetStaff() =>
        Ok(await _db.Staff.Include(s => s.Role).Where(s => !s.IsDeleted).OrderBy(s => s.Name).ToListAsync());

    [HttpPost("staff")]
    public async Task<IActionResult> CreateStaff([FromBody] StaffMember model)
    {
        _db.Staff.Add(model);
        await _db.SaveChangesAsync();
        return Ok(model);
    }

    [HttpPut("staff/{id:int}")]
    public async Task<IActionResult> UpdateStaff(int id, [FromBody] StaffMember model)
    {
        var s = await _db.Staff.FindAsync(id);
        if (s == null) return NotFound();
        s.Name = model.Name;
        s.Designation = model.Designation;
        s.Department = model.Department;
        s.ContactNumber = model.ContactNumber;
        s.Address = model.Address;
        s.Salary = model.Salary;
        s.IsActive = model.IsActive;
        s.RoleId = model.RoleId;
        s.Cnic = model.Cnic;
        s.UpdatedAt = DateTime.UtcNow;
        s.IsDirty = true;
        await _db.SaveChangesAsync();
        return Ok(s);
    }

    [HttpDelete("staff/{id:int}")]
    public async Task<IActionResult> DeleteStaff(int id)
    {
        var s = await _db.Staff.FindAsync(id);
        if (s == null) return NotFound();
        s.IsDeleted = true;
        s.UpdatedAt = DateTime.UtcNow;
        s.IsDirty = true;
        await _db.SaveChangesAsync();
        return Ok(new { success = true });
    }

    // Cash & Bank Vouchers
    [HttpGet("vouchers")]
    public async Task<IActionResult> GetVouchers() =>
        Ok(await _db.Payments.Include(p => p.Customer).Include(p => p.Supplier).Include(p => p.Staff).OrderByDescending(p => p.Date).ThenByDescending(p => p.Id).ToListAsync());

    // Settings
    [HttpGet("settings")]
    public async Task<IActionResult> GetSettings() =>
        Ok(await _db.ShopSettings.FirstOrDefaultAsync() ?? new ShopSettings());
}
