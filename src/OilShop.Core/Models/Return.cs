namespace OilShop.Core.Models;

public enum ReturnType { SalesReturn, PurchaseReturn }
public enum ReturnStatus { Completed, Processed }

public class Return : SyncEntity
{
    public string ReturnNumber { get; set; } = string.Empty; // e.g. SR-001156
    public DateTime Date { get; set; } = DateTime.Today;
    public ReturnType Type { get; set; }
    public int? CustomerId { get; set; }
    public Customer? Customer { get; set; }
    public int? SupplierId { get; set; }
    public Supplier? Supplier { get; set; }
    public string? OriginalInvoiceNumber { get; set; } // e.g. SI-004587
    public int ProductId { get; set; }
    public Product? Product { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public decimal ReturnedQuantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal RefundAmount { get; set; }
    public string Reason { get; set; } = string.Empty; // e.g. "Customer returned excess fuel"
    public ReturnStatus Status { get; set; } = ReturnStatus.Completed;
    public string? Remarks { get; set; }
}
