namespace OilShop.Web.Models;

public class CashBankHistoryItem
{
    public DateTime Date { get; set; }
    public string RefNumber { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Party { get; set; } = string.Empty;
    public string SourceType { get; set; } = string.Empty; // Sale / Purchase / Voucher / Expense
    public decimal Debit { get; set; }  // Cash/Bank Inflow (+)
    public decimal Credit { get; set; } // Cash/Bank Outflow (-)
    public decimal Balance { get; set; }
    public string? Remarks { get; set; }
    public string? DetailsUrl { get; set; }
}
