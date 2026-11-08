namespace OilShop.Core.Models;

public enum PaymentMode { Cash, Bank, Credit }

public class SalesInvoice : SyncEntity
{
    public string InvoiceNumber { get; set; } = string.Empty; // e.g. SI-004587
    public DateTime Date { get; set; } = DateTime.Today;
    public int CustomerId { get; set; }
    public Customer? Customer { get; set; }
    public int? StaffId { get; set; }
    public StaffMember? Staff { get; set; }
    public PaymentMode PaymentMode { get; set; } = PaymentMode.Cash;
    public decimal SubTotal { get; set; }
    public decimal Discount { get; set; }
    public decimal Tax { get; set; }
    public decimal GrandTotal { get; set; }
    public decimal PaidAmount { get; set; }
    public string? Remarks { get; set; }
    public List<SalesInvoiceLine> Lines { get; set; } = new();
}

public class SalesInvoiceLine : SyncEntity
{
    public int SalesInvoiceId { get; set; }
    public SalesInvoice? SalesInvoice { get; set; }
    public int ProductId { get; set; }
    public Product? Product { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Tax { get; set; }
    public decimal TotalAmount => Quantity * UnitPrice + Tax;
}
