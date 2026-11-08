namespace OilShop.Core.Models;

public class Expense : SyncEntity
{
    public DateTime Date { get; set; } = DateTime.Today;
    public string Category { get; set; } = string.Empty; // Purchase Cost / Staff Salaries / Utilities Bill / Rent Expense / Fuel Cost
    public decimal Amount { get; set; }
    public string? Remarks { get; set; }
    public PaymentMode PaidFrom { get; set; } = PaymentMode.Cash;
}

/// <summary>Shop profile + branding, one row (Id = 1). Edited on the Settings page.</summary>
public class ShopSettings : SyncEntity
{
    public string ShopName { get; set; } = "Roonjha Oil Traders";
    public string ShopAddress { get; set; } = "Main Market Road Lahore Punjab Pakistan";
    public string PhoneNumber { get; set; } = "03001234567";
    public string ContactNumber { get; set; } = "03001234567";
    public string EmailAddress { get; set; } = "info@roonjha.com";
    public string TaxRegistrationNumber { get; set; } = "NTN 1234567";
    public string ThemeColor { get; set; } = "Navy Blue";
    public string? LogoPath { get; set; }
    public string InvoiceHeaderText { get; set; } = "Roonjha Developers Oil Shop";
    public string ReceiptFooterText { get; set; } = "Thank you for visiting Roonjha Oil Traders";
}

/// <summary>Offline change queue. Every local insert/update/delete that must
/// reach Supabase is recorded here and replayed by the sync service when online.</summary>
public class SyncQueue : SyncEntity
{
    public string EntityType { get; set; } = string.Empty;
    public int EntityId { get; set; }
    public string Operation { get; set; } = string.Empty; // Insert / Update / Delete
    public string PayloadJson { get; set; } = string.Empty;
    public bool Synced { get; set; }
    public DateTime? SyncedAt { get; set; }
    public string? LastError { get; set; }
}
