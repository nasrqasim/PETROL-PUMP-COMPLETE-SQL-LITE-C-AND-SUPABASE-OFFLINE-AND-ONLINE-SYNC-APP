namespace OilShop.Core.Models;

public class PurchaseInvoice : SyncEntity
{
    public string InvoiceNumber { get; set; } = string.Empty; // e.g. PI-000123
    public DateTime Date { get; set; } = DateTime.Today;
    public int SupplierId { get; set; }
    public Supplier? Supplier { get; set; }
    public PaymentMode PaymentMode { get; set; } = PaymentMode.Cash;
    public decimal SubTotal { get; set; }
    public decimal Discount { get; set; }
    public decimal Tax { get; set; }
    public decimal GrandTotal { get; set; }
    public decimal PaidAmount { get; set; }
    public string? Remarks { get; set; }
    public List<PurchaseInvoiceLine> Lines { get; set; } = new();
}

public class PurchaseInvoiceLine : SyncEntity
{
    public int PurchaseInvoiceId { get; set; }
    public PurchaseInvoice? PurchaseInvoice { get; set; }
    public int ProductId { get; set; }
    public Product? Product { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Tax { get; set; }
    public decimal TotalAmount => Quantity * UnitPrice + Tax;
}
