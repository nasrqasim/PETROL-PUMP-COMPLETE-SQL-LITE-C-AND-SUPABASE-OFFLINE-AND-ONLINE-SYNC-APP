using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OilShop.Core.Data;
using OilShop.Core.Models;

namespace OilShop.Web.Controllers;

public class ExpensesController : Controller
{
    private readonly OilShopDbContext _db;

    public ExpensesController(OilShopDbContext db)
    {
        _db = db;
    }

    public async Task<IActionResult> Index(string? search = null, DateTime? fromDate = null, DateTime? toDate = null, string? category = null)
    {
        var query = _db.Expenses.AsQueryable();

        if (fromDate.HasValue)
            query = query.Where(e => e.Date >= fromDate.Value.Date);
        if (toDate.HasValue)
            query = query.Where(e => e.Date <= toDate.Value.Date);
        if (!string.IsNullOrWhiteSpace(category))
            query = query.Where(e => e.Category == category);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var q = search.Trim().ToLower();
            query = query.Where(e =>
                e.Category.ToLower().Contains(q) ||
                (e.Remarks != null && e.Remarks.ToLower().Contains(q)));
        }

        var expenses = await query.OrderByDescending(e => e.Date).ThenByDescending(e => e.Id).ToListAsync();

        ViewBag.Search = search;
        ViewBag.FromDate = fromDate?.ToString("yyyy-MM-dd");
        ViewBag.ToDate = toDate?.ToString("yyyy-MM-dd");
        ViewBag.Category = category;
        ViewBag.Categories = await _db.Expenses.Select(e => e.Category).Distinct().ToListAsync();
        ViewBag.TotalExpense = expenses.Sum(e => e.Amount);

        return View(expenses);
    }

    public IActionResult Create()
    {
        return View(new Expense { Date = DateTime.Today });
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Create(Expense expense)
    {
        if (string.IsNullOrWhiteSpace(expense.Category) || expense.Amount <= 0)
        {
            TempData["Error"] = "Category and valid amount are required.";
            return View(expense);
        }

        _db.Expenses.Add(expense);
        await _db.SaveChangesAsync();

        TempData["Message"] = $"Expense of Rs. {expense.Amount:N0} for '{expense.Category}' added.";
        return RedirectToAction(nameof(Index));
    }

    public async Task<IActionResult> Edit(int id)
    {
        var expense = await _db.Expenses.FindAsync(id);
        if (expense == null) return NotFound();
        return View(expense);
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Edit(int id, Expense updated)
    {
        var expense = await _db.Expenses.FindAsync(id);
        if (expense == null) return NotFound();

        expense.Date = updated.Date;
        expense.Category = updated.Category;
        expense.Amount = updated.Amount;
        expense.PaidFrom = updated.PaidFrom;
        expense.Remarks = updated.Remarks;

        await _db.SaveChangesAsync();
        TempData["Message"] = $"Expense '{expense.Category}' updated.";
        return RedirectToAction(nameof(Index));
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Delete(int id)
    {
        var expense = await _db.Expenses.FindAsync(id);
        if (expense != null)
        {
            _db.Expenses.Remove(expense);
            await _db.SaveChangesAsync();
            TempData["Message"] = "Expense deleted successfully.";
        }
        return RedirectToAction(nameof(Index));
    }
}
