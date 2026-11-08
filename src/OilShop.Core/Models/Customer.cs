namespace OilShop.Core.Models;

/// <summary>Customer khata. BalanceDue &gt; 0 means the customer owes the shop
/// (udhaar). Advance &gt; 0 means the customer paid in advance.</summary>
public class Customer : SyncEntity
{
    public string Name { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? Email { get; set; }
    public string? NTN { get; set; }
    /// <summary>Amount the customer owes the shop (receivable).</summary>
    public decimal BalanceDue { get; set; }
    /// <summary>Advance paid by the customer, used against later sales.</summary>
    public decimal Advance { get; set; }
    public List<SalesInvoice> SalesInvoices { get; set; } = new();
    public List<Payment> Payments { get; set; } = new();
    public List<Return> Returns { get; set; } = new();
}
