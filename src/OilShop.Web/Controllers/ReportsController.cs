using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OilShop.Core.Data;
using OilShop.Core.Services;
using OilShop.Web.Models;
using OilShop.Web.Services;

namespace OilShop.Web.Controllers;

/// <summary>Reports Center with complete ERP reports, multi-criteria filtering,
/// live sorting, pagination, Excel/CSV export, and PDF print formatting.</summary>
public class ReportsController : Controller
{
    private readonly OilShopDbContext _db;
    private readonly ProfitLossService _pl;
    private readonly ReportEngineService _reportEngine;

    public ReportsController(OilShopDbContext db, ProfitLossService pl, ReportEngineService reportEngine)
    {
        _db = db;
        _pl = pl;
        _reportEngine = reportEngine;
    }

    public static readonly (string Category, string Name)[] AllReports =
    {
        // Main Reports
        ("Main Reports", "Journal Report"),
        ("Main Reports", "Print Vouchers"),
        ("Main Reports", "Serial Tracking"),
        ("Main Reports", "PO Tracking"),
        ("Main Reports", "SO Tracking"),
        ("Main Reports", "Draft Report"),

        // Purchase Reports
        ("Purchase Reports", "Purchase Summary"),
        ("Purchase Reports", "Purchase Register"),
        ("Purchase Reports", "Party Purchase Summary"),
        ("Purchase Reports", "Vendor Payments"),
        ("Purchase Reports", "Purchase Activity"),
        ("Purchase Reports", "Item Purchase Analysis"),
        ("Purchase Reports", "Accounts Payable Aging"),
        ("Purchase Reports", "Vendor Balances"),

        // Sale Reports
        ("Sale Reports", "Sale Summary"),
        ("Sale Reports", "Sale Register"),
        ("Sale Reports", "POS Sales"),
        ("Sale Reports", "Party Sale Summary"),
        ("Sale Reports", "Collection Report"),
        ("Sale Reports", "Sale Activity"),
        ("Sale Reports", "Item Sale Analysis"),
        ("Sale Reports", "Accounts Receivable Aging"),
        ("Sale Reports", "Salesperson Performance"),
        ("Sale Reports", "Salesman Incentive"),
        ("Sale Reports", "Item-wise Profit & Loss"),
        ("Sale Reports", "Invoice-wise Profit & Loss"),
        ("Sale Reports", "Customer Balances"),
        ("Sale Reports", "Sales Intelligence"),
        ("Sale Reports", "Operational Metrics"),

        // Inventory Reports
        ("Inventory Reports", "Inventory Ledger"),
        ("Inventory Reports", "Inventory Balances"),
        ("Inventory Reports", "Low Stock Alert"),
        ("Inventory Reports", "Inventory Intelligence"),

        // Financial Reports
        ("Financial Reports", "Ledger Report"),
        ("Financial Reports", "Trial Balance"),
        ("Financial Reports", "Profit & Loss"),
        ("Financial Reports", "Balance Sheet"),
        ("Financial Reports", "Cash Flow Statement"),
        ("Financial Reports", "Tax Reports"),
        ("Financial Reports", "Financial Health"),
        ("Financial Reports", "Cash Flow Management"),

        // Salary Reports
        ("Salary Reports", "Salary Register"),
        ("Salary Reports", "Staff Loan & Advance")
    };

    public IActionResult Index()
    {
        ViewBag.ReportCount = AllReports.Length;
        return View(AllReports);
    }

    public async Task<IActionResult> ProfitLoss(DateTime? from, DateTime? to)
    {
        var start = from ?? DateTime.Today;
        var end = to ?? DateTime.Today;
        var result = await _pl.GetAsync(start, end);
        ViewBag.From = start;
        ViewBag.To = end;
        return View(result);
    }

    [HttpGet]
    public async Task<IActionResult> Generate([FromQuery] ReportFilterModel filter)
    {
        if (string.IsNullOrWhiteSpace(filter.ReportName))
            filter.ReportName = "Sale Summary";

        var result = await _reportEngine.GenerateReportAsync(filter);

        ViewBag.Customers = await _db.Customers.OrderBy(c => c.Name).ToListAsync();
        ViewBag.Suppliers = await _db.Suppliers.OrderBy(s => s.Name).ToListAsync();
        ViewBag.Products = await _db.Products.OrderBy(p => p.Name).ToListAsync();
        ViewBag.Staff = await _db.Staff.OrderBy(s => s.Name).ToListAsync();
        ViewBag.Categories = await _db.Products.Select(p => p.Category).Where(c => c != null).Distinct().ToListAsync();

        return View(result);
    }

    [HttpGet]
    public async Task<IActionResult> ExportCsv([FromQuery] ReportFilterModel filter)
    {
        // Don't paginate for file export
        filter.Page = 1;
        filter.PageSize = 10000;

        var result = await _reportEngine.GenerateReportAsync(filter);
        var sb = new StringBuilder();

        // Header info
        sb.AppendLine($"Report: \"{result.ReportName}\"");
        sb.AppendLine($"Category: \"{result.ReportCategory}\"");
        sb.AppendLine($"Generated: \"{result.GeneratedAt:yyyy-MM-dd HH:mm:ss}\"");
        sb.AppendLine();

        // Columns
        sb.AppendLine(string.Join(",", result.Columns.Select(c => $"\"{c.Title.Replace("\"", "\"\"")}\"")));

        // Rows
        foreach (var row in result.Rows)
        {
            var cells = result.Columns.Select(c =>
            {
                var text = row.ContainsKey(c.Key) ? row[c.Key].Text : "";
                return $"\"{text.Replace("\"", "\"\"")}\"";
            });
            sb.AppendLine(string.Join(",", cells));
        }

        var bytes = Encoding.UTF8.GetPreamble().Concat(Encoding.UTF8.GetBytes(sb.ToString())).ToArray();
        var fileName = $"{result.ReportName.Replace(" ", "_")}_{DateTime.Now:yyyyMMddHHmmss}.csv";
        return File(bytes, "text/csv", fileName);
    }

    [HttpGet]
    public async Task<IActionResult> ExportExcel([FromQuery] ReportFilterModel filter)
    {
        filter.Page = 1;
        filter.PageSize = 10000;

        var result = await _reportEngine.GenerateReportAsync(filter);
        var sb = new StringBuilder();

        sb.AppendLine("<html xmlns:o=\"urn:schemas-microsoft-com:office:office\" xmlns:x=\"urn:schemas-microsoft-com:office:excel\" xmlns=\"http://www.w3.org/TR/REC-html40\">");
        sb.AppendLine("<head><meta charset=\"utf-8\"/><style>table{border-collapse:collapse;} th{background:#1e3a8a;color:white;padding:6px;border:1px solid #ddd;} td{padding:5px;border:1px solid #ddd;} .num{mso-number-format:\"\\#\\,\\#\\#0\";text-align:right;}</style></head>");
        sb.AppendLine("<body>");
        sb.AppendLine($"<h2>{result.ReportName}</h2>");
        sb.AppendLine($"<p>Generated: {result.GeneratedAt:dd-MMM-yyyy hh:mm tt}</p>");

        sb.AppendLine("<table>");
        sb.AppendLine("<thead><tr>");
        foreach (var col in result.Columns)
        {
            sb.AppendLine($"<th>{col.Title}</th>");
        }
        sb.AppendLine("</tr></thead>");
        sb.AppendLine("<tbody>");

        foreach (var row in result.Rows)
        {
            sb.AppendLine("<tr>");
            foreach (var col in result.Columns)
            {
                var cell = row.ContainsKey(col.Key) ? row[col.Key] : null;
                var val = cell?.Text ?? "";
                if (col.IsNumeric && cell?.RawNumber != null)
                {
                    sb.AppendLine($"<td class=\"num\">{cell.RawNumber.Value}</td>");
                }
                else
                {
                    sb.AppendLine($"<td>{val}</td>");
                }
            }
            sb.AppendLine("</tr>");
        }
        sb.AppendLine("</tbody></table></body></html>");

        var bytes = Encoding.UTF8.GetBytes(sb.ToString());
        var fileName = $"{result.ReportName.Replace(" ", "_")}_{DateTime.Now:yyyyMMddHHmmss}.xls";
        return File(bytes, "application/vnd.ms-excel", fileName);
    }
}
