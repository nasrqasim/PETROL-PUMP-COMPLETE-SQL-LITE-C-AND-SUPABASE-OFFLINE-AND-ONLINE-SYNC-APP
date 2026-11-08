namespace OilShop.Core.Models;

public class Product : SyncEntity
{
    public string Name { get; set; } = string.Empty;   // e.g. "Diesel Fuel 50 Liters"
    public string? Category { get; set; }              // Fuel / Engine Oil / Lube Oil
    public string Unit { get; set; } = "Liters";
    public decimal SalePrice { get; set; }             // price per unit
    public decimal PurchasePrice { get; set; }
    public decimal StockQuantity { get; set; }
    public decimal LowStockAlert { get; set; } = 10;
}
