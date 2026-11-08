using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OilShop.Core.Data;
using OilShop.Core.Models;
using OilShop.Core.Services;

namespace OilShop.Web.Controllers;

/// <summary>Advance &amp; Loan Management — header totals are computed from data.</summary>
public class AdvancesController : Controller
{
    private readonly OilShopDbContext _db;
    private readonly AdvanceLoanService _service;
    public AdvancesController(OilShopDbContext db, AdvanceLoanService service) { _db = db; _service = service; }

    public async Task<IActionResult> Index()
    {
        ViewBag.TotalAdvancesGiven = await _service.TotalAdvancesGivenAsync();
        ViewBag.TotalLoansOutstanding = await _service.TotalLoansOutstandingAsync();
        ViewBag.Advances = await _db.Advances.OrderByDescending(a => a.Date).ToListAsync();
        ViewBag.Loans = await _db.Loans.OrderByDescending(l => l.DateIssued).ToListAsync();
        ViewBag.Customers = await _db.Customers.OrderBy(c => c.Name).ToListAsync();
        return View();
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> AddAdvance(Advance advance)
    {
        advance.CustomerName = (await _db.Customers.FindAsync(advance.CustomerId))?.Name ?? advance.CustomerName;
        await _service.AddAdvanceAsync(advance);
        TempData["Message"] = $"Advance of Rs. {advance.Amount:N0} added for {advance.CustomerName}.";
        return RedirectToAction(nameof(Index));
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> AddLoan(Loan loan)
    {
        loan.CustomerName = (await _db.Customers.FindAsync(loan.CustomerId))?.Name ?? loan.CustomerName;
        await _service.AddLoanAsync(loan);
        TempData["Message"] = $"Loan of Rs. {loan.LoanAmount:N0} added for {loan.CustomerName}.";
        return RedirectToAction(nameof(Index));
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> RecordPayment(string kind, int id, decimal amount)
    {
        if (kind == "Loan") await _service.RecordLoanPaymentAsync(id, amount);
        else await _service.RecordAdvancePaymentAsync(id, amount);
        TempData["Message"] = $"Payment of Rs. {amount:N0} recorded. Balances updated.";
        return RedirectToAction(nameof(Index));
    }
}
