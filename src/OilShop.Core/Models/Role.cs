namespace OilShop.Core.Models;

/// <summary>Role-based access control. One row per module per role.
/// Owner = full access to everything. Cashier = sales only, no reports/settings.</summary>
public class Role : SyncEntity
{
    public string Name { get; set; } = string.Empty; // Owner / Admin / Manager / Cashier / Staff
    public string? Description { get; set; }
    public List<RolePermission> Permissions { get; set; } = new();
    public List<StaffMember> Staff { get; set; } = new();

    public bool CanAccess(string module)
    {
        if (Name.Equals("Owner", StringComparison.OrdinalIgnoreCase)) return true;
        return Permissions.Any(p => p.Module == module && p.Allowed);
    }
}

public class RolePermission : SyncEntity
{
    public int RoleId { get; set; }
    public Role? Role { get; set; }
    /// <summary>Module name: Dashboard, Sales, Inventory, Customers, Suppliers, Accounts, Reports, Settings, Staff, Returns.</summary>
    public string Module { get; set; } = string.Empty;
    public bool Allowed { get; set; }
}
