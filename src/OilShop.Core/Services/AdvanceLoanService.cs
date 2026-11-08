using Microsoft.EntityFrameworkCore;
using OilShop.Core.Data;
using OilShop.Core.Models;

namespace OilShop.Core.Services;

/// <summary>Advance &amp; Loan management. Record Payment updates the paid
/// amount and the remaining balance; totals are always computed from data.</summary>
public class AdvanceLoanService
{
    private readonly OilShopDbContext _db;
    public AdvanceLoanService(OilShopDbContext db) => _db = db;

    public async Task<decimal> TotalAdvancesGivenAsync() =>
        (await _db.Advances.Where(a => !a.IsDeleted).Select(a => a.Amount).ToListAsync()).Sum();

    public async Task<decimal> TotalLoansOutstandingAsync() =>
        (await _db.Loans.Where(l => !l.IsDeleted).Select(l => l.LoanAmount - l.PaidAmount).ToListAsync()).Sum();

    public async Task<Advance> AddAdvanceAsync(Advance advance)
    {
        advance.Status = AdvanceStatus.Active;
        _db.Advances.Add(advance);
        await _db.SaveChangesAsync();
        return advance;
    }

    public async Task<Loan> AddLoanAsync(Loan loan)
    {
        loan.Status = LoanStatus.Active;
        _db.Loans.Add(loan);
        await _db.SaveChangesAsync();
        return loan;
    }

    /// <summary>Record a repayment against an advance or a loan.</summary>
    public async Task RecordAdvancePaymentAsync(int advanceId, decimal amount)
    {
        var advance = await _db.Advances.FindAsync(advanceId)
            ?? throw new InvalidOperationException("Advance not found.");
        advance.PaidAmount += amount;
        advance.Status = advance.PaidAmount >= advance.Amount ? AdvanceStatus.Settled
            : advance.PaidAmount > 0 ? AdvanceStatus.PartiallyPaid : AdvanceStatus.Active;
        await _db.SaveChangesAsync();
    }

    public async Task RecordLoanPaymentAsync(int loanId, decimal amount)
    {
        var loan = await _db.Loans.FindAsync(loanId)
            ?? throw new InvalidOperationException("Loan not found.");
        loan.PaidAmount += amount;
        loan.Status = loan.PaidAmount >= loan.LoanAmount ? LoanStatus.Paid
            : loan.PaidAmount > 0 ? LoanStatus.PartiallyPaid : LoanStatus.Active;
        await _db.SaveChangesAsync();
    }
}
