using Microsoft.EntityFrameworkCore;
using OilShop.Core.Data;
using OilShop.Core.Models;

namespace OilShop.Core.Services;

/// <summary>
/// Money-flow rules (same golden rule as the Petrol Pump system):
/// Dashboard Cash, Dashboard Bank and Person Ledger are separate.
/// A credit sale/purchase changes ONLY the ledger. Cash/bank change only
/// when money actually moves. Overpayment auto-creates advance, and a later
/// sale/purchase against advance reduces the advance only.
/// </summary>
public class InvoiceService
{
    private readonly OilShopDbContext _db;
    public InvoiceService(OilShopDbContext db) => _db = db;

    public async Task<SalesInvoice> CreateSaleAsync(SalesInvoice invoice)
    {
        invoice.SubTotal = invoice.Lines.Sum(l => l.Quantity * l.UnitPrice);
        invoice.GrandTotal = invoice.SubTotal - invoice.Discount + invoice.Tax;

        var customer = await _db.Customers.FindAsync(invoice.CustomerId)
            ?? throw new InvalidOperationException("Customer not found.");

        foreach (var line in invoice.Lines)
        {
            var product = await _db.Products.FindAsync(line.ProductId)
                ?? throw new InvalidOperationException($"Product {line.ProductId} not found.");
            if (product.StockQuantity < line.Quantity)
                throw new InvalidOperationException($"Not enough stock for {product.Name}. Available: {product.StockQuantity}.");
            product.StockQuantity -= line.Quantity; // stock auto-updates on sale
            product.IsDirty = true;
            line.ProductName = product.Name;
        }

        switch (invoice.PaymentMode)
        {
            case PaymentMode.Credit:
                // Credit sale: ONLY the khata changes. Cash and bank unchanged.
                ApplyToKhata(customer, invoice.GrandTotal);
                break;
            case PaymentMode.Cash:
            case PaymentMode.Bank:
                // Cash/bank sale: money received now; khata unchanged unless
                // the customer had an advance, which is drawn down first.
                var fromAdvance = Math.Min(customer.Advance, invoice.GrandTotal);
                customer.Advance -= fromAdvance;
                invoice.PaidAmount = invoice.GrandTotal;
                break;
        }

        customer.IsDirty = true;
        _db.SalesInvoices.Add(invoice);
        await _db.SaveChangesAsync();
        return invoice;
    }

    public async Task<PurchaseInvoice> CreatePurchaseAsync(PurchaseInvoice invoice)
    {
        invoice.SubTotal = invoice.Lines.Sum(l => l.Quantity * l.UnitPrice);
        invoice.GrandTotal = invoice.SubTotal - invoice.Discount + invoice.Tax;

        var supplier = await _db.Suppliers.FindAsync(invoice.SupplierId)
            ?? throw new InvalidOperationException("Supplier not found.");

        foreach (var line in invoice.Lines)
        {
            var product = await _db.Products.FindAsync(line.ProductId)
                ?? throw new InvalidOperationException($"Product {line.ProductId} not found.");
            product.StockQuantity += line.Quantity; // stock auto-updates on purchase
            product.IsDirty = true;
            line.ProductName = product.Name;
        }

        if (invoice.PaymentMode == PaymentMode.Credit)
        {
            // Credit purchase: ONLY the supplier khata changes.
            supplier.BalanceDue += invoice.GrandTotal - invoice.PaidAmount;
        }
        else
        {
            var fromAdvance = Math.Min(supplier.Advance, invoice.GrandTotal);
            supplier.Advance -= fromAdvance;
            invoice.PaidAmount = invoice.GrandTotal;
        }

        supplier.IsDirty = true;
        _db.PurchaseInvoices.Add(invoice);
        await _db.SaveChangesAsync();
        return invoice;
    }

    /// <summary>Record a cash/bank receipt against a customer khata.
    /// Overpayment automatically becomes advance.</summary>
    public async Task<Payment> ReceiveCustomerPaymentAsync(int customerId, decimal amount, PaymentMode mode, string? bankAccount = null)
    {
        var customer = await _db.Customers.FindAsync(customerId)
            ?? throw new InvalidOperationException("Customer not found.");
        var voucher = new Payment
        {
            VoucherNumber = $"RCPT-{DateTime.UtcNow:yyyyMMddHHmmss}",
            Date = DateTime.Today,
            Type = mode == PaymentMode.Bank ? VoucherType.BankReceipt : VoucherType.CashReceipt,
            PartyType = PartyType.Customer,
            CustomerId = customerId,
            BankAccount = bankAccount,
            Amount = amount
        };

        if (amount > customer.BalanceDue)
        {
            // Overpayment auto-creates advance.
            customer.Advance += amount - customer.BalanceDue;
            customer.BalanceDue = 0;
            voucher.CreatesAdvance = true;
        }
        else
        {
            customer.BalanceDue -= amount;
        }

        customer.IsDirty = true;
        _db.Payments.Add(voucher);
        await _db.SaveChangesAsync();
        return voucher;
    }

    private static void ApplyToKhata(Customer customer, decimal amount)
    {
        // A later sale against advance reduces advance only.
        var fromAdvance = Math.Min(customer.Advance, amount);
        customer.Advance -= fromAdvance;
        customer.BalanceDue += amount - fromAdvance;
    }

    public async Task<decimal> CashBalanceAsync()
    {
        var receipts = (await _db.Payments.Where(p => p.Type == VoucherType.CashReceipt).Select(p => p.Amount).ToListAsync()).Sum();
        var payments = (await _db.Payments.Where(p => p.Type == VoucherType.CashPayment).Select(p => p.Amount).ToListAsync()).Sum();
        var cashSales = (await _db.SalesInvoices.Where(i => i.PaymentMode == PaymentMode.Cash).Select(i => i.GrandTotal).ToListAsync()).Sum();
        var cashPurchases = (await _db.PurchaseInvoices.Where(i => i.PaymentMode == PaymentMode.Cash).Select(i => i.GrandTotal).ToListAsync()).Sum();
        return receipts - payments + cashSales - cashPurchases;
    }

    public async Task<decimal> BankBalanceAsync()
    {
        var receipts = (await _db.Payments.Where(p => p.Type == VoucherType.BankReceipt).Select(p => p.Amount).ToListAsync()).Sum();
        var payments = (await _db.Payments.Where(p => p.Type == VoucherType.BankPayment).Select(p => p.Amount).ToListAsync()).Sum();
        var bankSales = (await _db.SalesInvoices.Where(i => i.PaymentMode == PaymentMode.Bank).Select(i => i.GrandTotal).ToListAsync()).Sum();
        var bankPurchases = (await _db.PurchaseInvoices.Where(i => i.PaymentMode == PaymentMode.Bank).Select(i => i.GrandTotal).ToListAsync()).Sum();
        return receipts - payments + bankSales - bankPurchases;
    }
}
