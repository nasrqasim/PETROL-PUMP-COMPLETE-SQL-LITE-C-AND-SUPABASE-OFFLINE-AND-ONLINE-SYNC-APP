using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OilShop.Core.Models;

[Table("Roznamcha")]
public class RoznamchaEntry : SyncEntity
{
    [Required]
    public DateTime Date { get; set; } = DateTime.Today;

    [Required]
    [MaxLength(50)]
    public string GariNo { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string DriverName { get; set; } = string.Empty;

    public int? StaffId { get; set; }
    public StaffMember? Staff { get; set; }

    [MaxLength(200)]
    public string Maal { get; set; } = string.Empty;

    [Column(TypeName = "decimal(18,2)")]
    public decimal DieselLiter { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Kiraya { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Kharcha { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Advance { get; set; }

    [NotMapped]
    public decimal Baqaya => Kiraya - Kharcha - Advance;
}
