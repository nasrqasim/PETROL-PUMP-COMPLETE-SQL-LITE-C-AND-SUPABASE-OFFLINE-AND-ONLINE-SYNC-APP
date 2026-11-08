using OilShop.Core.Models;

namespace OilShop.Core.Services;

/// <summary>Builds WhatsApp (wa.me) links. WhatsApp has no free official API
/// for sending from a desktop app, so the app opens wa.me with a prefilled
/// message — the user taps Send in WhatsApp. No message is ever sent silently.</summary>
public static class WhatsAppService
{
    public static string ToWaNumber(string phone)
    {
        var digits = new string(phone.Where(char.IsDigit).ToArray());
        if (digits.StartsWith("0")) digits = "92" + digits[1..]; // Pakistan
        return digits;
    }

    public static string BalanceMessage(string shopName, string customerName, decimal balanceDue) =>
        $"Assalam-o-Alaikum {customerName}! {shopName} se aap ka baqaya Rs. {balanceDue:N0} hai. " +
        "Baraye meherbani jald ada kar dein. Shukriya!";

    public static string BalanceLink(string phone, string shopName, string customerName, decimal balanceDue) =>
        $"https://wa.me/{ToWaNumber(phone)}?text={Uri.EscapeDataString(BalanceMessage(shopName, customerName, balanceDue))}";

    public static string StatementLink(string phone, string customerName, string statementSummary) =>
        $"https://wa.me/{ToWaNumber(phone)}?text={Uri.EscapeDataString($"Assalam-o-Alaikum {customerName}! Aap ka khata statement:\n{statementSummary}")}";

    public static string InvoiceLink(string phone, SalesInvoice invoice) =>
        $"https://wa.me/{ToWaNumber(phone)}?text={Uri.EscapeDataString($"Assalam-o-Alaikum! Aap ki invoice {invoice.InvoiceNumber} ({invoice.Date:dd-MMM-yyyy}) ka total Rs. {invoice.GrandTotal:N0} hai. Shukriya!")}";
}
