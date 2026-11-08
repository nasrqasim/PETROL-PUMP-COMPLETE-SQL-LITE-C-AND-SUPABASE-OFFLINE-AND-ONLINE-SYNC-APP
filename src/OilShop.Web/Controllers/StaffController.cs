using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OilShop.Core.Data;
using OilShop.Core.Models;

namespace OilShop.Web.Controllers;

public class StaffController : Controller
{
    private readonly OilShopDbContext _db;
    private readonly IWebHostEnvironment _env;

    public StaffController(OilShopDbContext db, IWebHostEnvironment env)
    {
        _db = db;
        _env = env;
    }

    public async Task<IActionResult> Index(string? search = null, string? department = null, DateTime? fromDate = null, DateTime? toDate = null)
    {
        var query = _db.Staff.Include(s => s.Role).AsQueryable();

        if (fromDate.HasValue)
            query = query.Where(s => s.JoiningDate >= fromDate.Value.Date);
        if (toDate.HasValue)
            query = query.Where(s => s.JoiningDate <= toDate.Value.Date);

        if (!string.IsNullOrWhiteSpace(department))
            query = query.Where(s => s.Department == department);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var q = search.Trim().ToLower();
            query = query.Where(s =>
                s.Name.ToLower().Contains(q) ||
                s.EmployeeId.ToLower().Contains(q) ||
                s.Designation.ToLower().Contains(q) ||
                (s.Cnic != null && s.Cnic.ToLower().Contains(q)) ||
                s.ContactNumber.ToLower().Contains(q));
        }

        ViewBag.TotalStaff = await _db.Staff.CountAsync();
        ViewBag.ActiveStaff = await _db.Staff.CountAsync(s => s.IsActive && !s.OnLeave);
        ViewBag.OnLeave = await _db.Staff.CountAsync(s => s.OnLeave);
        ViewBag.Departments = await _db.Staff.Select(s => s.Department).Distinct().ToListAsync();

        ViewBag.Search = search;
        ViewBag.Department = department;
        ViewBag.FromDate = fromDate?.ToString("yyyy-MM-dd");
        ViewBag.ToDate = toDate?.ToString("yyyy-MM-dd");

        return View(await query.OrderBy(s => s.EmployeeId).ToListAsync());
    }

    public async Task<IActionResult> Details(int id)
    {
        var s = await _db.Staff.Include(x => x.Role)
            .Include(x => x.Attendances)
            .Include(x => x.SalesInvoices)
            .FirstOrDefaultAsync(x => x.Id == id);
        return s is null ? NotFound() : View(s);
    }

    public async Task<IActionResult> Create()
    {
        ViewBag.Roles = await _db.Roles.OrderBy(r => r.Name).ToListAsync();
        return View(new StaffMember { JoiningDate = DateTime.Today });
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Create(StaffMember staff, IFormFile? cnicFrontFile, IFormFile? cnicBackFile, IFormFile? photoFile)
    {
        var uploads = Path.Combine(_env.WebRootPath, "uploads", "staff");
        Directory.CreateDirectory(uploads);

        if (photoFile is { Length: > 0 })
        {
            var fName = $"photo_{Guid.NewGuid():N}{Path.GetExtension(photoFile.FileName)}";
            await using var stream = new FileStream(Path.Combine(uploads, fName), FileMode.Create);
            await photoFile.CopyToAsync(stream);
            staff.PhotoPath = $"/uploads/staff/{fName}";
        }

        if (cnicFrontFile is { Length: > 0 })
        {
            var fName = $"cnic_front_{Guid.NewGuid():N}{Path.GetExtension(cnicFrontFile.FileName)}";
            await using var stream = new FileStream(Path.Combine(uploads, fName), FileMode.Create);
            await cnicFrontFile.CopyToAsync(stream);
            staff.CnicFrontPath = $"/uploads/staff/{fName}";
        }

        if (cnicBackFile is { Length: > 0 })
        {
            var fName = $"cnic_back_{Guid.NewGuid():N}{Path.GetExtension(cnicBackFile.FileName)}";
            await using var stream = new FileStream(Path.Combine(uploads, fName), FileMode.Create);
            await cnicBackFile.CopyToAsync(stream);
            staff.CnicBackPath = $"/uploads/staff/{fName}";
        }

        staff.EmployeeId = $"EMP-{await _db.Staff.CountAsync() + 1:D3}";
        _db.Staff.Add(staff);
        await _db.SaveChangesAsync();

        TempData["Message"] = $"Staff member {staff.Name} added as {staff.EmployeeId}.";
        return RedirectToAction(nameof(Index));
    }

    public async Task<IActionResult> Edit(int id)
    {
        var staff = await _db.Staff.FindAsync(id);
        if (staff == null) return NotFound();

        ViewBag.Roles = await _db.Roles.OrderBy(r => r.Name).ToListAsync();
        return View(staff);
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Edit(int id, StaffMember updated, IFormFile? cnicFrontFile, IFormFile? cnicBackFile, IFormFile? photoFile)
    {
        var staff = await _db.Staff.FindAsync(id);
        if (staff == null) return NotFound();

        var uploads = Path.Combine(_env.WebRootPath, "uploads", "staff");
        Directory.CreateDirectory(uploads);

        if (photoFile is { Length: > 0 })
        {
            var fName = $"photo_{Guid.NewGuid():N}{Path.GetExtension(photoFile.FileName)}";
            await using var stream = new FileStream(Path.Combine(uploads, fName), FileMode.Create);
            await photoFile.CopyToAsync(stream);
            staff.PhotoPath = $"/uploads/staff/{fName}";
        }

        if (cnicFrontFile is { Length: > 0 })
        {
            var fName = $"cnic_front_{Guid.NewGuid():N}{Path.GetExtension(cnicFrontFile.FileName)}";
            await using var stream = new FileStream(Path.Combine(uploads, fName), FileMode.Create);
            await cnicFrontFile.CopyToAsync(stream);
            staff.CnicFrontPath = $"/uploads/staff/{fName}";
        }

        if (cnicBackFile is { Length: > 0 })
        {
            var fName = $"cnic_back_{Guid.NewGuid():N}{Path.GetExtension(cnicBackFile.FileName)}";
            await using var stream = new FileStream(Path.Combine(uploads, fName), FileMode.Create);
            await cnicBackFile.CopyToAsync(stream);
            staff.CnicBackPath = $"/uploads/staff/{fName}";
        }

        staff.Name = updated.Name;
        staff.Designation = updated.Designation;
        staff.Department = updated.Department;
        staff.JoiningDate = updated.JoiningDate;
        staff.ContactNumber = updated.ContactNumber;
        staff.Address = updated.Address;
        staff.Salary = updated.Salary;
        staff.IsActive = updated.IsActive;
        staff.OnLeave = updated.OnLeave;
        staff.RoleId = updated.RoleId;
        staff.Cnic = updated.Cnic;

        await _db.SaveChangesAsync();
        TempData["Message"] = $"Staff {staff.Name} updated.";
        return RedirectToAction(nameof(Index));
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Delete(int id)
    {
        var staff = await _db.Staff.FindAsync(id);
        if (staff != null)
        {
            _db.Staff.Remove(staff);
            await _db.SaveChangesAsync();
            TempData["Message"] = $"Staff {staff.Name} deleted.";
        }
        return RedirectToAction(nameof(Index));
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> CheckIn(int id)
    {
        var today = DateTime.Today;
        var att = await _db.Attendances.FirstOrDefaultAsync(a => a.StaffId == id && a.Date == today)
            ?? new Attendance { StaffId = id, Date = today };
        if (att.Id == 0) _db.Attendances.Add(att);
        att.CheckInTime = DateTime.Now;
        att.Status = "Present";
        await _db.SaveChangesAsync();
        TempData["Message"] = "Checked in.";
        return RedirectToAction(nameof(Details), new { id });
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> CheckOut(int id)
    {
        var today = DateTime.Today;
        var att = await _db.Attendances.FirstOrDefaultAsync(a => a.StaffId == id && a.Date == today);
        if (att is not null)
        {
            att.CheckOutTime = DateTime.Now;
            await _db.SaveChangesAsync();
            TempData["Message"] = "Checked out.";
        }
        return RedirectToAction(nameof(Details), new { id });
    }
}
