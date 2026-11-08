using Microsoft.EntityFrameworkCore;
using OilShop.Core.Data;
using OilShop.Core.Models;

namespace OilShop.Core.Services;

/// <summary>Returns: stock is restored and the khata is adjusted.
/// Sales return → stock increases, customer balance decreases (refund).
/// Purchase return → stock decreases, supplier balance decreases.</summary>
public class ReturnService
{
    private readonly OilShopDbContext _db;
    public ReturnService(OilShopDbContext db) => _db = db;

    public async Task<Return> CreateAsync(Return ret)
    {
        var product = await _db.Products.FindAsync(ret.ProductId)
            ?? throw new InvalidOperationException("Product not found.");
        ret.RefundAmount = ret.ReturnedQuantity * ret.UnitPrice;
        ret.ProductName = product.Name;

        if (ret.Type == ReturnType.SalesReturn)
        {
            product.StockQuantity += ret.ReturnedQuantity; // stock restored
            if (ret.CustomerId is { } cid)
            {
                var customer = await _db.Customers.FindAsync(cid);
                if (customer is not null)
                {
                    customer.BalanceDue = Math.Max(0, customer.BalanceDue - ret.RefundAmount);
                    customer.IsDirty = true;
                }
            }
        }
        else
        {
            product.StockQuantity = Math.Max(0, product.StockQuantity - ret.ReturnedQuantity);
            if (ret.SupplierId is { } sid)
            {
                var supplier = await _db.Suppliers.FindAsync(sid);
                if (supplier is not null)
                {
                    supplier.BalanceDue = Math.Max(0, supplier.BalanceDue - ret.RefundAmount);
                    supplier.IsDirty = true;
                }
            }
        }

        product.IsDirty = true;
        _db.Returns.Add(ret);
        await _db.SaveChangesAsync();
        return ret;
    }

    public async Task<decimal> TotalSalesReturnsAsync(DateTime? from = null, DateTime? to = null)
    {
        var q = _db.Returns.Where(r => r.Type == ReturnType.SalesReturn);
        if (from is not null) q = q.Where(r => r.Date >= from);
        if (to is not null) q = q.Where(r => r.Date <= to);
        return (await q.Select(r => r.RefundAmount).ToListAsync()).Sum();
    }

    public async Task<decimal> TotalPurchaseReturnsAsync(DateTime? from = null, DateTime? to = null)
    {
        var q = _db.Returns.Where(r => r.Type == ReturnType.PurchaseReturn);
        if (from is not null) q = q.Where(r => r.Date >= from);
        if (to is not null) q = q.Where(r => r.Date <= to);
        return (await q.Select(r => r.RefundAmount).ToListAsync()).Sum();
    }
}
