using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OilShop.Core.Data;
using OilShop.Core.Models;

namespace OilShop.Web.Controllers;

public class RoznamchaUiController : Controller
{
    private readonly OilShopDbContext _db;

    public RoznamchaUiController(OilShopDbContext db)
    {
        _db = db;
    }

    // GET: /RoznamchaUi or /RoznamchaUi/AajKiEntry
    public async Task<IActionResult> Index(string? date, string? gariNo, string? driverName, string? search)
    {
        ViewBag.Gariyan = await _db.Gariyan.Where(g => !g.IsDeleted).OrderBy(g => g.GariNo).ToListAsync();

        var query = _db.Roznamcha.Where(r => !r.IsDeleted).AsQueryable();

        if (!string.IsNullOrWhiteSpace(date) && DateTime.TryParse(date, out var parsedDate))
        {
            var dayStart = parsedDate.Date;
            var dayEnd = dayStart.AddDays(1);
            query = query.Where(r => r.Date >= dayStart && r.Date < dayEnd);
            ViewBag.FilterDate = parsedDate.ToString("yyyy-MM-dd");
        }

        if (!string.IsNullOrWhiteSpace(gariNo))
        {
            var g = gariNo.Trim();
            query = query.Where(r => r.GariNo == g);
            ViewBag.FilterGari = g;
        }

        if (!string.IsNullOrWhiteSpace(driverName))
        {
            var d = driverName.Trim().ToLower();
            query = query.Where(r => r.DriverName.ToLower().Contains(d));
            ViewBag.FilterDriver = driverName;
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(r => r.GariNo.ToLower().Contains(s) || r.DriverName.ToLower().Contains(s) || r.Maal.ToLower().Contains(s));
            ViewBag.Search = search;
        }

        var entries = await query.OrderByDescending(r => r.Date).ThenByDescending(r => r.Id).ToListAsync();
        return View(entries);
    }

    // POST: /RoznamchaUi/Save
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Save(int? id, DateTime date, string gariNo, string driverName, string? maal, decimal dieselLiter, decimal kiraya, decimal kharcha, decimal advance)
    {
        if (string.IsNullOrWhiteSpace(gariNo) || string.IsNullOrWhiteSpace(driverName))
        {
            TempData["Error"] = "Vehicle number and driver name are required.";
            return RedirectToAction(nameof(Index));
        }

        if (kiraya < 0 || kharcha < 0 || advance < 0 || dieselLiter < 0)
        {
            TempData["Error"] = "Financial values cannot be negative.";
            return RedirectToAction(nameof(Index));
        }

        if (id.HasValue && id.Value > 0)
        {
            var existing = await _db.Roznamcha.FirstOrDefaultAsync(r => r.Id == id.Value && !r.IsDeleted);
            if (existing == null) return NotFound();

            existing.Date = date;
            existing.GariNo = gariNo.Trim();
            existing.DriverName = driverName.Trim();
            existing.Maal = maal?.Trim() ?? string.Empty;
            existing.DieselLiter = dieselLiter;
            existing.Kiraya = kiraya;
            existing.Kharcha = kharcha;
            existing.Advance = advance;
            existing.UpdatedAt = DateTime.UtcNow;
            existing.IsDirty = true;

            TempData["Message"] = $"Roznamcha entry #{existing.Id} updated successfully.";
        }
        else
        {
            var entry = new RoznamchaEntry
            {
                Date = date,
                GariNo = gariNo.Trim(),
                DriverName = driverName.Trim(),
                Maal = maal?.Trim() ?? string.Empty,
                DieselLiter = dieselLiter,
                Kiraya = kiraya,
                Kharcha = kharcha,
                Advance = advance,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _db.Roznamcha.Add(entry);
            TempData["Message"] = "New Roznamcha daily entry saved successfully.";
        }

        await _db.SaveChangesAsync();
        return RedirectToAction(nameof(Index));
    }

    // POST: /RoznamchaUi/Delete/{id}
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Delete(int id)
    {
        var entry = await _db.Roznamcha.FirstOrDefaultAsync(r => r.Id == id && !r.IsDeleted);
        if (entry != null)
        {
            entry.IsDeleted = true;
            entry.UpdatedAt = DateTime.UtcNow;
            entry.IsDirty = true;
            await _db.SaveChangesAsync();
            TempData["Message"] = $"Roznamcha entry #{id} deleted successfully.";
        }
        return RedirectToAction(nameof(Index));
    }

    // GET: /RoznamchaUi/GariKhata
    public async Task<IActionResult> GariKhata(string? gariNo, DateTime? startDate, DateTime? endDate)
    {
        var gariyan = await _db.Gariyan.Where(g => !g.IsDeleted).OrderBy(g => g.GariNo).ToListAsync();
        ViewBag.Gariyan = gariyan;

        var selectedNo = gariNo ?? gariyan.FirstOrDefault()?.GariNo ?? "537";
        ViewBag.SelectedGari = selectedNo;

        var vehicle = gariyan.FirstOrDefault(g => g.GariNo == selectedNo);
        ViewBag.Vehicle = vehicle;

        var query = _db.Roznamcha.Where(r => !r.IsDeleted && r.GariNo == selectedNo).AsQueryable();

        if (startDate.HasValue)
        {
            query = query.Where(r => r.Date >= startDate.Value.Date);
            ViewBag.StartDate = startDate.Value.ToString("yyyy-MM-dd");
        }
        if (endDate.HasValue)
        {
            var end = endDate.Value.Date.AddDays(1);
            query = query.Where(r => r.Date < end);
            ViewBag.EndDate = endDate.Value.ToString("yyyy-MM-dd");
        }

        var records = await query.OrderBy(r => r.Date).ThenBy(r => r.Id).ToListAsync();
        return View(records);
    }

    // GET: /RoznamchaUi/DriverKhata
    public async Task<IActionResult> DriverKhata(string? driverName, DateTime? startDate, DateTime? endDate)
    {
        var allDrivers = await _db.Roznamcha
            .Where(r => !r.IsDeleted && !string.IsNullOrEmpty(r.DriverName))
            .Select(r => r.DriverName)
            .Distinct()
            .OrderBy(d => d)
            .ToListAsync();

        ViewBag.Drivers = allDrivers;

        var selectedDriver = driverName ?? allDrivers.FirstOrDefault() ?? "Iqbal";
        ViewBag.SelectedDriver = selectedDriver;

        var query = _db.Roznamcha.Where(r => !r.IsDeleted && r.DriverName.ToLower() == selectedDriver.ToLower()).AsQueryable();

        if (startDate.HasValue)
        {
            query = query.Where(r => r.Date >= startDate.Value.Date);
            ViewBag.StartDate = startDate.Value.ToString("yyyy-MM-dd");
        }
        if (endDate.HasValue)
        {
            var end = endDate.Value.Date.AddDays(1);
            query = query.Where(r => r.Date < end);
            ViewBag.EndDate = endDate.Value.ToString("yyyy-MM-dd");
        }

        var records = await query.OrderBy(r => r.Date).ThenBy(r => r.Id).ToListAsync();
        return View(records);
    }

    // GET: /RoznamchaUi/DinKaKhulasa
    public async Task<IActionResult> DinKaKhulasa(DateTime? date)
    {
        var targetDate = date?.Date ?? DateTime.Today;
        ViewBag.SelectedDate = targetDate.ToString("yyyy-MM-dd");

        var dayStart = targetDate.Date;
        var dayEnd = dayStart.AddDays(1);

        var records = await _db.Roznamcha
            .Where(r => !r.IsDeleted && r.Date >= dayStart && r.Date < dayEnd)
            .OrderByDescending(r => r.Id)
            .ToListAsync();

        return View(records);
    }

    // GET: /RoznamchaUi/Gariyan
    public async Task<IActionResult> Gariyan()
    {
        var list = await _db.Gariyan.Where(g => !g.IsDeleted).OrderBy(g => g.GariNo).ToListAsync();
        return View(list);
    }

    // POST: /RoznamchaUi/SaveGari
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> SaveGari(int? id, string gariNo, string? driverName, string malik, string? phone)
    {
        if (string.IsNullOrWhiteSpace(gariNo))
        {
            TempData["Error"] = "Vehicle number is required.";
            return RedirectToAction(nameof(Gariyan));
        }

        if (id.HasValue && id.Value > 0)
        {
            var g = await _db.Gariyan.FirstOrDefaultAsync(x => x.Id == id.Value && !x.IsDeleted);
            if (g == null) return NotFound();

            var conflict = await _db.Gariyan.AnyAsync(x => x.GariNo == gariNo.Trim() && x.Id != id.Value && !x.IsDeleted);
            if (conflict)
            {
                TempData["Error"] = $"Vehicle {gariNo} is already registered.";
                return RedirectToAction(nameof(Gariyan));
            }

            g.GariNo = gariNo.Trim();
            g.DriverName = driverName?.Trim() ?? string.Empty;
            g.Malik = string.IsNullOrWhiteSpace(malik) ? "Apni" : malik.Trim();
            g.Phone = phone?.Trim() ?? string.Empty;
            g.UpdatedAt = DateTime.UtcNow;
            g.IsDirty = true;
            TempData["Message"] = $"Vehicle #{g.GariNo} updated successfully.";
        }
        else
        {
            var exists = await _db.Gariyan.AnyAsync(x => x.GariNo == gariNo.Trim() && !x.IsDeleted);
            if (exists)
            {
                TempData["Error"] = $"Vehicle {gariNo} is already registered.";
                return RedirectToAction(nameof(Gariyan));
            }

            var g = new Gari
            {
                GariNo = gariNo.Trim(),
                DriverName = driverName?.Trim() ?? string.Empty,
                Malik = string.IsNullOrWhiteSpace(malik) ? "Apni" : malik.Trim(),
                Phone = phone?.Trim() ?? string.Empty,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _db.Gariyan.Add(g);
            TempData["Message"] = $"Vehicle #{g.GariNo} registered successfully.";
        }

        await _db.SaveChangesAsync();
        return RedirectToAction(nameof(Gariyan));
    }

    // POST: /RoznamchaUi/DeleteGari/{id}
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> DeleteGari(int id)
    {
        var g = await _db.Gariyan.FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted);
        if (g != null)
        {
            g.IsDeleted = true;
            g.UpdatedAt = DateTime.UtcNow;
            g.IsDirty = true;
            await _db.SaveChangesAsync();
            TempData["Message"] = $"Vehicle #{g.GariNo} removed successfully.";
        }
        return RedirectToAction(nameof(Gariyan));
    }
}
