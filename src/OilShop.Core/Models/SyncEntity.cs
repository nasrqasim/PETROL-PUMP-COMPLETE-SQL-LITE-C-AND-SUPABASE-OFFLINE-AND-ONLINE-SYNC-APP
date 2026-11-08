namespace OilShop.Core.Models;

/// <summary>Base class for every entity that syncs with Supabase.
/// UpdatedAt drives the push/pull sync; IsDeleted is a soft delete so a
/// deleted row can be propagated instead of disappearing locally.</summary>
public abstract class SyncEntity
{
    public int Id { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public bool IsDeleted { get; set; }
    /// <summary>Set to true by the app whenever a row changes offline; cleared after a successful push.</summary>
    public bool IsDirty { get; set; }
}
