using Microsoft.EntityFrameworkCore;
using OilShop.Core.Data;

namespace OilShop.Core.Services;

public record ProfitLossResult(
    decimal TotalRevenue,
    decimal SalesRevenue,
    decimal CashSales,
    decimal CreditSales,
    decimal OtherIncome,
    decimal TotalExpenses,
    decimal PurchaseCost,
    decimal StaffSalaries,
    decimal UtilitiesBill,
    decimal RentExpense,
    decimal FuelCost,
    decimal NetProfit,
    decimal ProfitMarginPercent);

/// <summary>Profit &amp; Loss computed from real data (invoices + expenses),
/// never hard-coded. The demo screenshot for 15-Oct-2025 shows Revenue
/// 125,600 / Expenses 98,450 / Net Profit 27,150 / 21.6% — those are the
/// reference figures for that full day; the report below computes the same
/// numbers live from whatever invoices and expenses are in the database.</summary>
public class ProfitLossService
{
    private readonly OilShopDbContext _db;
    public ProfitLossService(OilShopDbContext db) => _db = db;

    public async Task<ProfitLossResult> GetAsync(DateTime from, DateTime to)
    {
        var sales = await _db.SalesInvoices
            .Where(i => i.Date >= from && i.Date <= to)
            .ToListAsync();
        var expenses = await _db.Expenses
            .Where(e => e.Date >= from && e.Date <= to)
            .ToListAsync();

        decimal ExpenseBy(string category) => expenses
            .Where(e => e.Category.Equals(category, StringComparison.OrdinalIgnoreCase))
            .Sum(e => e.Amount);

        var salesRevenue = sales.Sum(i => i.GrandTotal);
        var cashSales = sales.Where(i => i.PaymentMode == Models.PaymentMode.Cash).Sum(i => i.GrandTotal);
        var creditSales = sales.Where(i => i.PaymentMode == Models.PaymentMode.Credit).Sum(i => i.GrandTotal);
        var otherIncome = 0m; // extend with an Income table if other income needs tracking
        var totalRevenue = salesRevenue + otherIncome;

        var purchaseCost = ExpenseBy("Purchase Cost");
        var salaries = ExpenseBy("Staff Salaries");
        var utilities = ExpenseBy("Utilities Bill");
        var rent = ExpenseBy("Rent Expense");
        var fuel = ExpenseBy("Fuel Cost");
        var otherExpenses = expenses
            .Where(e => !new[] { "Purchase Cost", "Staff Salaries", "Utilities Bill", "Rent Expense", "Fuel Cost" }
                .Contains(e.Category, StringComparer.OrdinalIgnoreCase))
            .Sum(e => e.Amount);
        var totalExpenses = purchaseCost + salaries + utilities + rent + fuel + otherExpenses;

        var net = totalRevenue - totalExpenses;
        var margin = totalRevenue == 0 ? 0 : Math.Round(net / totalRevenue * 100, 1);

        return new ProfitLossResult(
            totalRevenue, salesRevenue, cashSales, creditSales, otherIncome,
            totalExpenses, purchaseCost, salaries, utilities, rent, fuel, net, margin);
    }
}
