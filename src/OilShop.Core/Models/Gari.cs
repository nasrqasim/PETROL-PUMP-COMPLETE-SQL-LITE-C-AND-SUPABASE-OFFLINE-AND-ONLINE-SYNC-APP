using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OilShop.Core.Models;

[Table("Gariyan")]
public class Gari : SyncEntity
{
    [Required]
    [MaxLength(50)]
    public string GariNo { get; set; } = string.Empty;

    [MaxLength(100)]
    public string DriverName { get; set; } = string.Empty;

    /// <summary>
    /// Ownership: "Apni" (Own) or "Kiraye Wali" (Rented)
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string Malik { get; set; } = "Apni";

    [MaxLength(50)]
    public string Phone { get; set; } = string.Empty;
}
