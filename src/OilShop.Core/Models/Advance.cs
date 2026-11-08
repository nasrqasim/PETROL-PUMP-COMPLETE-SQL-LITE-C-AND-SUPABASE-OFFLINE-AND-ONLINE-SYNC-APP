namespace OilShop.Core.Models;

public enum AdvanceStatus { Active, PartiallyPaid, Settled }
public enum LoanStatus { Active, PartiallyPaid, Paid, Overdue }

/// <summary>Advance given to (or taken from) a customer. An advance is drawn
/// down automatically by later sales — nothing is forgotten.</summary>
public class Advance : SyncEntity
{
    public int CustomerId { get; set; }
    public Customer? Customer { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal RemainingBalance => Amount - PaidAmount;
    public DateTime Date { get; set; } = DateTime.Today;
    public AdvanceStatus Status { get; set; } = AdvanceStatus.Active;
    public string? Remarks { get; set; }
}

/// <summary>Loan given to a customer, repaid in installments.</summary>
public class Loan : SyncEntity
{
    public int CustomerId { get; set; }
    public Customer? Customer { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public decimal AdvanceAmount { get; set; }
    public decimal LoanAmount { get; set; }
    public DateTime DateIssued { get; set; } = DateTime.Today;
    public DateTime RepaymentDueDate { get; set; }
    public string InstallmentPlan { get; set; } = "Monthly";
    public decimal PaidAmount { get; set; }
    public decimal RemainingBalance => LoanAmount - PaidAmount;
    public LoanStatus Status { get; set; } = LoanStatus.Active;
    public string? Remarks { get; set; }
}
