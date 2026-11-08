namespace OilShop.Core.Models;

public class AppUser : SyncEntity
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty; // Demo/plain or hashed
    public string FullName { get; set; } = string.Empty;
    public int RoleId { get; set; }
    public Role? Role { get; set; }
    public bool IsActive { get; set; } = true;
}
