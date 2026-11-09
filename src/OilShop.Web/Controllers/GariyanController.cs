using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OilShop.Core.Data;
using OilShop.Core.Models;

namespace OilShop.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GariyanController : ControllerBase
{
    private readonly OilShopDbContext _db;

    public GariyanController(OilShopDbContext db)
    {
        _db = db;
    }

    // GET /api/gariyan
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var list = await _db.Gariyan
            .Where(g => !g.IsDeleted)
            .OrderBy(g => g.GariNo)
            .Select(g => new
            {
                g.Id,
                g.GariNo,
                g.DriverName,
                g.Malik,
                g.Phone,
                g.CreatedAt,
                g.UpdatedAt
            })
            .ToListAsync();

        return Ok(list);
    }

    // GET /api/gariyan/{id}
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var g = await _db.Gariyan.FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted);
        if (g == null) return NotFound(new { message = $"Gari with Id {id} not found." });
        return Ok(g);
    }

    // POST /api/gariyan
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Gari dto)
    {
        if (string.IsNullOrWhiteSpace(dto.GariNo))
            return BadRequest(new { message = "GariNo is required." });

        var exists = await _db.Gariyan.AnyAsync(x => x.GariNo == dto.GariNo.Trim() && !x.IsDeleted);
        if (exists)
            return Conflict(new { message = $"Vehicle number {dto.GariNo} already registered." });

        var entity = new Gari
        {
            GariNo = dto.GariNo.Trim(),
            DriverName = dto.DriverName?.Trim() ?? string.Empty,
            Malik = string.IsNullOrWhiteSpace(dto.Malik) ? "Apni" : dto.Malik.Trim(),
            Phone = dto.Phone?.Trim() ?? string.Empty,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.Gariyan.Add(entity);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = entity.Id }, entity);
    }

    // PUT /api/gariyan/{id}
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] Gari dto)
    {
        var entity = await _db.Gariyan.FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted);
        if (entity == null) return NotFound(new { message = $"Gari with Id {id} not found." });

        if (!string.IsNullOrWhiteSpace(dto.GariNo) && dto.GariNo.Trim() != entity.GariNo)
        {
            var conflict = await _db.Gariyan.AnyAsync(x => x.GariNo == dto.GariNo.Trim() && x.Id != id && !x.IsDeleted);
            if (conflict)
                return Conflict(new { message = $"Vehicle number {dto.GariNo} is already registered." });
            entity.GariNo = dto.GariNo.Trim();
        }

        if (dto.DriverName != null) entity.DriverName = dto.DriverName.Trim();
        if (!string.IsNullOrWhiteSpace(dto.Malik)) entity.Malik = dto.Malik.Trim();
        if (dto.Phone != null) entity.Phone = dto.Phone.Trim();

        entity.UpdatedAt = DateTime.UtcNow;
        entity.IsDirty = true;
        await _db.SaveChangesAsync();

        return Ok(entity);
    }

    // DELETE /api/gariyan/{id}
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await _db.Gariyan.FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted);
        if (entity == null) return NotFound(new { message = $"Gari with Id {id} not found." });

        entity.IsDeleted = true;
        entity.UpdatedAt = DateTime.UtcNow;
        entity.IsDirty = true;
        await _db.SaveChangesAsync();

        return Ok(new { success = true, message = $"Vehicle {entity.GariNo} deleted successfully." });
    }
}
