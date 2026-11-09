using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OilShop.Core.Data;
using OilShop.Core.Models;

namespace OilShop.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RoznamchaController : ControllerBase
{
    private readonly OilShopDbContext _db;

    public RoznamchaController(OilShopDbContext db)
    {
        _db = db;
    }

    // GET /api/roznamcha?date=2026-11-08&gariNo=537&driverName=Iqbal&startDate=...&endDate=...
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? date,
        [FromQuery] string? startDate,
        [FromQuery] string? endDate,
        [FromQuery] string? gariNo,
        [FromQuery] string? driverName,
        [FromQuery] string? search)
    {
        var query = _db.Roznamcha.Where(r => !r.IsDeleted).AsQueryable();

        if (!string.IsNullOrWhiteSpace(date) && DateTime.TryParse(date, out var singleDate))
        {
            var dayStart = singleDate.Date;
            var dayEnd = dayStart.AddDays(1);
            query = query.Where(r => r.Date >= dayStart && r.Date < dayEnd);
        }
        else
        {
            if (!string.IsNullOrWhiteSpace(startDate) && DateTime.TryParse(startDate, out var sDate))
            {
                var sDay = sDate.Date;
                query = query.Where(r => r.Date >= sDay);
            }
            if (!string.IsNullOrWhiteSpace(endDate) && DateTime.TryParse(endDate, out var eDate))
            {
                var eDay = eDate.Date.AddDays(1);
                query = query.Where(r => r.Date < eDay);
            }
        }

        if (!string.IsNullOrWhiteSpace(gariNo))
        {
            var g = gariNo.Trim();
            query = query.Where(r => r.GariNo == g);
        }

        if (!string.IsNullOrWhiteSpace(driverName))
        {
            var d = driverName.Trim().ToLower();
            query = query.Where(r => r.DriverName.ToLower().Contains(d));
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(r =>
                r.GariNo.ToLower().Contains(s) ||
                r.DriverName.ToLower().Contains(s) ||
                r.Maal.ToLower().Contains(s));
        }

        var list = await query
            .OrderByDescending(r => r.Date)
            .ThenByDescending(r => r.Id)
            .ToListAsync();

        var result = list.Select(r => new
        {
            r.Id,
            date = r.Date.ToString("yyyy-MM-dd"),
            displayDate = r.Date.ToString("dd-MM-yyyy"),
            gariNo = r.GariNo,
            driverName = r.DriverName,
            maal = r.Maal,
            dieselLiter = r.DieselLiter,
            kiraya = r.Kiraya,
            kharcha = r.Kharcha,
            advance = r.Advance,
            baqaya = r.Kiraya - r.Kharcha - r.Advance,
            r.CreatedAt,
            r.UpdatedAt
        });

        return Ok(result);
    }

    // GET /api/roznamcha/{id}
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var r = await _db.Roznamcha.FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted);
        if (r == null) return NotFound(new { message = $"Roznamcha entry with Id {id} not found." });

        return Ok(new
        {
            r.Id,
            date = r.Date.ToString("yyyy-MM-dd"),
            displayDate = r.Date.ToString("dd-MM-yyyy"),
            gariNo = r.GariNo,
            driverName = r.DriverName,
            maal = r.Maal,
            dieselLiter = r.DieselLiter,
            kiraya = r.Kiraya,
            kharcha = r.Kharcha,
            advance = r.Advance,
            baqaya = r.Kiraya - r.Kharcha - r.Advance,
            r.CreatedAt,
            r.UpdatedAt
        });
    }

    public class RoznamchaDto
    {
        public string? Date { get; set; }
        public string GariNo { get; set; } = string.Empty;
        public string DriverName { get; set; } = string.Empty;
        public string? Maal { get; set; }
        public decimal DieselLiter { get; set; }
        public decimal Kiraya { get; set; }
        public decimal Kharcha { get; set; }
        public decimal Advance { get; set; }
    }

    // POST /api/roznamcha
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] RoznamchaDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.GariNo))
            return BadRequest(new { message = "Gari number is required." });
        if (string.IsNullOrWhiteSpace(dto.DriverName))
            return BadRequest(new { message = "Driver name is required." });

        if (dto.Kiraya < 0 || dto.Kharcha < 0 || dto.Advance < 0 || dto.DieselLiter < 0)
            return BadRequest(new { message = "Financial figures and diesel cannot be negative." });

        var entryDate = DateTime.Today;
        if (!string.IsNullOrWhiteSpace(dto.Date) && DateTime.TryParse(dto.Date, out var parsedDate))
        {
            entryDate = parsedDate;
        }

        var entry = new RoznamchaEntry
        {
            Date = entryDate,
            GariNo = dto.GariNo.Trim(),
            DriverName = dto.DriverName.Trim(),
            Maal = dto.Maal?.Trim() ?? string.Empty,
            DieselLiter = dto.DieselLiter,
            Kiraya = dto.Kiraya,
            Kharcha = dto.Kharcha,
            Advance = dto.Advance,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.Roznamcha.Add(entry);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = entry.Id }, new
        {
            entry.Id,
            date = entry.Date.ToString("yyyy-MM-dd"),
            displayDate = entry.Date.ToString("dd-MM-yyyy"),
            entry.GariNo,
            entry.DriverName,
            entry.Maal,
            entry.DieselLiter,
            entry.Kiraya,
            entry.Kharcha,
            entry.Advance,
            baqaya = entry.Kiraya - entry.Kharcha - entry.Advance
        });
    }

    // PUT /api/roznamcha/{id}
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] RoznamchaDto dto)
    {
        var entry = await _db.Roznamcha.FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted);
        if (entry == null) return NotFound(new { message = $"Roznamcha entry with Id {id} not found." });

        if (dto.Kiraya < 0 || dto.Kharcha < 0 || dto.Advance < 0 || dto.DieselLiter < 0)
            return BadRequest(new { message = "Financial figures and diesel cannot be negative." });

        if (!string.IsNullOrWhiteSpace(dto.Date) && DateTime.TryParse(dto.Date, out var parsedDate))
        {
            entry.Date = parsedDate;
        }
        if (!string.IsNullOrWhiteSpace(dto.GariNo)) entry.GariNo = dto.GariNo.Trim();
        if (!string.IsNullOrWhiteSpace(dto.DriverName)) entry.DriverName = dto.DriverName.Trim();
        if (dto.Maal != null) entry.Maal = dto.Maal.Trim();

        entry.DieselLiter = dto.DieselLiter;
        entry.Kiraya = dto.Kiraya;
        entry.Kharcha = dto.Kharcha;
        entry.Advance = dto.Advance;
        entry.UpdatedAt = DateTime.UtcNow;
        entry.IsDirty = true;

        await _db.SaveChangesAsync();

        return Ok(new
        {
            entry.Id,
            date = entry.Date.ToString("yyyy-MM-dd"),
            displayDate = entry.Date.ToString("dd-MM-yyyy"),
            entry.GariNo,
            entry.DriverName,
            entry.Maal,
            entry.DieselLiter,
            entry.Kiraya,
            entry.Kharcha,
            entry.Advance,
            baqaya = entry.Kiraya - entry.Kharcha - entry.Advance
        });
    }

    // DELETE /api/roznamcha/{id}
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var entry = await _db.Roznamcha.FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted);
        if (entry == null) return NotFound(new { message = $"Roznamcha entry with Id {id} not found." });

        entry.IsDeleted = true;
        entry.UpdatedAt = DateTime.UtcNow;
        entry.IsDirty = true;

        await _db.SaveChangesAsync();

        return Ok(new { success = true, message = $"Roznamcha entry {id} deleted successfully." });
    }
}
