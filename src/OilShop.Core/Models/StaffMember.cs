namespace OilShop.Core.Models;

public class StaffMember : SyncEntity
{
    public string EmployeeId { get; set; } = string.Empty; // e.g. EMP-001
    public string Name { get; set; } = string.Empty;
    public string Designation { get; set; } = string.Empty; // Sales Manager / Cashier / Pump Operator
    public string Department { get; set; } = string.Empty;  // Sales Department
    public DateTime JoiningDate { get; set; }
    public string ContactNumber { get; set; } = string.Empty;
    public string? Address { get; set; }
    public decimal Salary { get; set; }
    public bool IsActive { get; set; } = true;
    public bool OnLeave { get; set; }
    public string? PhotoPath { get; set; }
    public string? Cnic { get; set; }
    public string? CnicFrontPath { get; set; }
    public string? CnicBackPath { get; set; }
    public int RoleId { get; set; }
    public Role? Role { get; set; }
    public List<Attendance> Attendances { get; set; } = new();
    public List<SalesInvoice> SalesInvoices { get; set; } = new();
}

public class Attendance : SyncEntity
{
    public int StaffId { get; set; }
    public StaffMember? Staff { get; set; }
    public DateTime Date { get; set; } = DateTime.Today;
    public DateTime? CheckInTime { get; set; }
    public DateTime? CheckOutTime { get; set; }
    public string Status { get; set; } = "Present"; // Present / On Leave / Absent
    public int InvoicesGenerated { get; set; }
    public decimal SalesMade { get; set; }
}
