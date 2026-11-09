using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OilShop.Core.Data;

namespace OilShop.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RoznamchaReportsController : ControllerBase
{
    private readonly OilShopDbContext _db;

    public RoznamchaReportsController(OilShopDbContext db)
    {
        _db = db;
    }

    // GET /api/roznamchareports/daily?date=2026-11-08
    [HttpGet("daily")]
    public async Task<IActionResult> GetDailySummary([FromQuery] string? date)
    {
        var targetDate = DateTime.Today;
        if (!string.IsNullOrWhiteSpace(date) && DateTime.TryParse(date, out var parsed))
        {
            targetDate = parsed.Date;
        }

        var dayStart = targetDate.Date;
        var dayEnd = dayStart.AddDays(1);

        var entries = await _db.Roznamcha
            .Where(r => !r.IsDeleted && r.Date >= dayStart && r.Date < dayEnd)
            .OrderByDescending(r => r.Id)
            .ToListAsync();

        var totalTrips = entries.Count;
        var totalVehicles = entries.Select(r => r.GariNo).Distinct().Count();
        var totalKiraya = entries.Sum(r => r.Kiraya);
        var totalKharcha = entries.Sum(r => r.Kharcha);
        var totalAdvance = entries.Sum(r => r.Advance);
        var totalDiesel = entries.Sum(r => r.DieselLiter);
        var totalBachat = totalKiraya - totalKharcha - totalAdvance;

        return Ok(new
        {
            date = targetDate.ToString("yyyy-MM-dd"),
            displayDate = targetDate.ToString("dd-MM-yyyy"),
            totalVehicles,
            totalTrips,
            totalKiraya,
            totalKharcha,
            totalAdvance,
            totalDiesel,
            totalBachat,
            records = entries.Select(r => new
            {
                r.Id,
                date = r.Date.ToString("yyyy-MM-dd"),
                displayDate = r.Date.ToString("dd-MM-yyyy"),
                r.GariNo,
                r.DriverName,
                r.Maal,
                r.DieselLiter,
                r.Kiraya,
                r.Kharcha,
                r.Advance,
                baqaya = r.Kiraya - r.Kharcha - r.Advance
            })
        });
    }

    // GET /api/roznamchareports/vehicle/{gariNo}?startDate=...&endDate=...
    [HttpGet("vehicle/{gariNo}")]
    public async Task<IActionResult> GetVehicleLedger(
        string gariNo,
        [FromQuery] string? startDate,
        [FromQuery] string? endDate)
    {
        if (string.IsNullOrWhiteSpace(gariNo))
            return BadRequest(new { message = "Vehicle number is required." });

        var gariClean = gariNo.Trim();
        var vehicle = await _db.Gariyan.FirstOrDefaultAsync(g => g.GariNo == gariClean && !g.IsDeleted);

        var query = _db.Roznamcha
            .Where(r => !r.IsDeleted && r.GariNo == gariClean)
            .AsQueryable();

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

        var entries = await query.OrderBy(r => r.Date).ThenBy(r => r.Id).ToListAsync();

        var totalTrips = entries.Count;
        var totalKiraya = entries.Sum(r => r.Kiraya);
        var totalKharcha = entries.Sum(r => r.Kharcha);
        var totalAdvance = entries.Sum(r => r.Advance);
        var totalDiesel = entries.Sum(r => r.DieselLiter);
        var baqaya = totalKiraya - totalKharcha - totalAdvance;

        decimal runningBalance = 0;
        var recordsWithRunningBalance = entries.Select(r =>
        {
            var net = r.Kiraya - r.Kharcha - r.Advance;
            runningBalance += net;
            return new
            {
                r.Id,
                date = r.Date.ToString("yyyy-MM-dd"),
                displayDate = r.Date.ToString("dd-MM-yyyy"),
                r.GariNo,
                r.DriverName,
                r.Maal,
                r.DieselLiter,
                r.Kiraya,
                r.Kharcha,
                r.Advance,
                entryBaqaya = net,
                runningBalance
            };
        }).ToList();

        return Ok(new
        {
            gariNo = gariClean,
            driverName = vehicle?.DriverName ?? (entries.LastOrDefault()?.DriverName ?? "N/A"),
            malik = vehicle?.Malik ?? "Apni",
            phone = vehicle?.Phone ?? "N/A",
            totalTrips,
            totalKiraya,
            totalKharcha,
            totalAdvance,
            totalDiesel,
            baqaya,
            records = recordsWithRunningBalance
        });
    }

    // GET /api/roznamchareports/driver/{driverName}?startDate=...&endDate=...
    [HttpGet("driver/{driverName}")]
    public async Task<IActionResult> GetDriverLedger(
        string driverName,
        [FromQuery] string? startDate,
        [FromQuery] string? endDate)
    {
        if (string.IsNullOrWhiteSpace(driverName))
            return BadRequest(new { message = "Driver name is required." });

        var driverClean = driverName.Trim();

        var query = _db.Roznamcha
            .Where(r => !r.IsDeleted && r.DriverName.ToLower() == driverClean.ToLower())
            .AsQueryable();

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

        var entries = await query.OrderBy(r => r.Date).ThenBy(r => r.Id).ToListAsync();

        var uniqueWorkingDays = entries.Select(r => r.Date.Date).Distinct().Count();
        var totalTrips = entries.Count;
        var totalKiraya = entries.Sum(r => r.Kiraya);
        var totalKharcha = entries.Sum(r => r.Kharcha);
        var totalAdvance = entries.Sum(r => r.Advance);
        var totalDiesel = entries.Sum(r => r.DieselLiter);
        var driverBaqaya = totalKiraya - totalKharcha - totalAdvance;

        decimal runningBalance = 0;
        var recordsWithRunningBalance = entries.Select(r =>
        {
            var net = r.Kiraya - r.Kharcha - r.Advance;
            runningBalance += net;
            return new
            {
                r.Id,
                date = r.Date.ToString("yyyy-MM-dd"),
                displayDate = r.Date.ToString("dd-MM-yyyy"),
                r.GariNo,
                r.DriverName,
                r.Maal,
                r.DieselLiter,
                r.Kiraya,
                r.Kharcha,
                r.Advance,
                entryBaqaya = net,
                runningBalance
            };
        }).ToList();

        var vehiclesOperated = entries.Select(r => r.GariNo).Distinct().ToList();

        return Ok(new
        {
            driverName = driverClean,
            totalWorkingDays = uniqueWorkingDays,
            totalTrips,
            vehiclesOperated,
            totalKiraya,
            totalKharcha,
            totalAdvance,
            totalDiesel,
            driverBaqaya,
            records = recordsWithRunningBalance
        });
    }

    // GET /api/roznamchareports/monthly?year=2026&month=11
    [HttpGet("monthly")]
    public async Task<IActionResult> GetMonthlyReport([FromQuery] int? year, [FromQuery] int? month)
    {
        var targetYear = year ?? DateTime.Today.Year;
        var targetMonth = month ?? DateTime.Today.Month;

        var start = new DateTime(targetYear, targetMonth, 1);
        var end = start.AddMonths(1);

        var entries = await _db.Roznamcha
            .Where(r => !r.IsDeleted && r.Date >= start && r.Date < end)
            .OrderBy(r => r.Date)
            .ToListAsync();

        var totalTrips = entries.Count;
        var totalKiraya = entries.Sum(r => r.Kiraya);
        var totalKharcha = entries.Sum(r => r.Kharcha);
        var totalAdvance = entries.Sum(r => r.Advance);
        var totalDiesel = entries.Sum(r => r.DieselLiter);
        var totalBachat = totalKiraya - totalKharcha - totalAdvance;

        return Ok(new
        {
            year = targetYear,
            month = targetMonth,
            monthName = start.ToString("MMMM yyyy"),
            totalTrips,
            totalKiraya,
            totalKharcha,
            totalAdvance,
            totalDiesel,
            totalBachat,
            records = entries.Select(r => new
            {
                r.Id,
                date = r.Date.ToString("yyyy-MM-dd"),
                displayDate = r.Date.ToString("dd-MM-yyyy"),
                r.GariNo,
                r.DriverName,
                r.Maal,
                r.DieselLiter,
                r.Kiraya,
                r.Kharcha,
                r.Advance,
                baqaya = r.Kiraya - r.Kharcha - r.Advance
            })
        });
    }
}
