namespace OilShop.Core.Models;

/// <summary>Supplier khata. BalanceDue &gt; 0 means the shop owes the supplier
/// (payable). Advance &gt; 0 means the shop paid the supplier in advance.</summary>
public class Supplier : SyncEntity
{
    public string Name { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? Email { get; set; }
    public string? NTN { get; set; }
    public decimal BalanceDue { get; set; }
    public decimal Advance { get; set; }
    public List<PurchaseInvoice> PurchaseInvoices { get; set; } = new();
    public List<Payment> Payments { get; set; } = new();
    public List<Return> Returns { get; set; } = new();
}
