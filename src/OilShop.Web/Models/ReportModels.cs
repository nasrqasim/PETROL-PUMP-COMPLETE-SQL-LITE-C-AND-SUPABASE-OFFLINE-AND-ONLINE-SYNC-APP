namespace OilShop.Web.Models;

public class ReportFilterModel
{
    public string ReportName { get; set; } = string.Empty;
    public string DatePreset { get; set; } = "all"; // all, today, yesterday, this_week, this_month, prev_month, this_year, custom
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public string? Search { get; set; }
    public int? CustomerId { get; set; }
    public int? SupplierId { get; set; }
    public int? ProductId { get; set; }
    public string? Category { get; set; }
    public string? PaymentMode { get; set; }
    public string? Status { get; set; }
    public int? StaffId { get; set; }
    public string? SortBy { get; set; }
    public string? SortOrder { get; set; } = "asc"; // asc or desc
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 25;
}

public class ReportHeaderSummary
{
    public string Label { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public string? ColorClass { get; set; }
}

public class ReportColumnDefinition
{
    public string Key { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public bool IsNumeric { get; set; }
    public bool IsCurrency { get; set; }
    public bool Sortable { get; set; } = true;
}

public class ReportRowCell
{
    public string Text { get; set; } = string.Empty;
    public decimal? RawNumber { get; set; }
    public string? LinkUrl { get; set; }
    public string? BadgeClass { get; set; }
}

public class ReportResultModel
{
    public string ReportName { get; set; } = string.Empty;
    public string ReportCategory { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime GeneratedAt { get; set; } = DateTime.Now;

    public ReportFilterModel Filter { get; set; } = new();

    public List<ReportHeaderSummary> Summaries { get; set; } = new();
    public List<ReportColumnDefinition> Columns { get; set; } = new();
    public List<Dictionary<string, ReportRowCell>> Rows { get; set; } = new();
    public Dictionary<string, decimal> Totals { get; set; } = new();

    public int TotalRows { get; set; }
    public int CurrentPage => Filter.Page;
    public int TotalPages => PageSize > 0 ? (int)Math.Ceiling((double)TotalRows / PageSize) : 1;
    public int PageSize => Filter.PageSize;
}
