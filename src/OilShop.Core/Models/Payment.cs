namespace OilShop.Core.Models;

public enum VoucherType { CashReceipt, CashPayment, BankReceipt, BankPayment }
public enum PartyType { Customer, Supplier, Staff, Vehicle, Expense, Other }

/// <summary>Cash &amp; Bank voucher. A receipt increases cash/bank, a payment decreases it.
/// Golden rule: cash, bank and khata ledgers are kept separate — a credit
/// invoice touches only the khata, never cash or bank.</summary>
public class Payment : SyncEntity
{
    public string VoucherNumber { get; set; } = string.Empty;
    public DateTime Date { get; set; } = DateTime.Today;
    public VoucherType Type { get; set; }
    public PartyType PartyType { get; set; }
    public int? CustomerId { get; set; }
    public Customer? Customer { get; set; }
    public int? SupplierId { get; set; }
    public Supplier? Supplier { get; set; }
    public int? StaffId { get; set; }
    public StaffMember? Staff { get; set; }
    public string? GariNo { get; set; }
    public string? DriverName { get; set; }
    public string? BankAccount { get; set; }
    public decimal Amount { get; set; }
    public string? Remarks { get; set; }
    /// <summary>When a receipt overpays a khata, the extra becomes advance automatically.</summary>
    public bool CreatesAdvance { get; set; }
}
