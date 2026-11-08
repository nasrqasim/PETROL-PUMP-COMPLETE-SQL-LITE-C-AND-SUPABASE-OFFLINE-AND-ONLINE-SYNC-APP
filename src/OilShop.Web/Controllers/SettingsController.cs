using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OilShop.Core.Data;
using OilShop.Core.Models;

namespace OilShop.Web.Controllers;

/// <summary>Settings — Shop Profile, Branding, and User Login Account management.</summary>
public class SettingsController : Controller
{
    private readonly OilShopDbContext _db;
    private readonly IWebHostEnvironment _env;

    public SettingsController(OilShopDbContext db, IWebHostEnvironment env)
    {
        _db = db;
        _env = env;
    }

    public async Task<IActionResult> Index()
    {
        var settings = await _db.ShopSettings.FirstOrDefaultAsync() ?? new ShopSettings { Id = 1 };
        ViewBag.Users = await _db.AppUsers.Include(u => u.Role).OrderBy(u => u.Username).ToListAsync();
        ViewBag.Roles = await _db.Roles.OrderBy(r => r.Name).ToListAsync();
        return View(settings);
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Index(ShopSettings model, IFormFile? logoFile)
    {
        var settings = await _db.ShopSettings.FirstOrDefaultAsync();
        if (settings is null)
        {
            model.Id = 1;
            _db.ShopSettings.Add(model);
            settings = model;
        }
        else
        {
            settings.ShopName = model.ShopName;
            settings.ShopAddress = model.ShopAddress;
            settings.PhoneNumber = model.PhoneNumber;
            settings.ContactNumber = model.ContactNumber;
            settings.EmailAddress = model.EmailAddress;
            settings.TaxRegistrationNumber = model.TaxRegistrationNumber;
            settings.ThemeColor = model.ThemeColor;
            settings.InvoiceHeaderText = model.InvoiceHeaderText;
            settings.ReceiptFooterText = model.ReceiptFooterText;
        }

        if (logoFile is { Length: > 0 })
        {
            var uploads = Path.Combine(_env.WebRootPath, "uploads");
            Directory.CreateDirectory(uploads);
            var fileName = $"logo{Path.GetExtension(logoFile.FileName)}";
            var path = Path.Combine(uploads, fileName);
            await using var stream = new FileStream(path, FileMode.Create);
            await logoFile.CopyToAsync(stream);
            settings.LogoPath = $"/uploads/{fileName}";
        }

        await _db.SaveChangesAsync();
        TempData["Message"] = "Settings saved.";
        return RedirectToAction(nameof(Index));
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> AddUser(string username, string password, string fullName, int roleId)
    {
        if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
        {
            TempData["Error"] = "Username and password cannot be empty.";
            return RedirectToAction(nameof(Index));
        }

        var exists = await _db.AppUsers.AnyAsync(u => u.Username.ToLower() == username.Trim().ToLower());
        if (exists)
        {
            TempData["Error"] = $"User with Login ID '{username}' already exists.";
            return RedirectToAction(nameof(Index));
        }

        _db.AppUsers.Add(new AppUser
        {
            Username = username.Trim(),
            Password = password,
            FullName = fullName?.Trim() ?? username.Trim(),
            RoleId = roleId,
            IsActive = true
        });

        await _db.SaveChangesAsync();
        TempData["Message"] = $"Login ID '{username}' added successfully.";
        return RedirectToAction(nameof(Index));
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> UpdateUserRole(int userId, int roleId, bool isActive)
    {
        var user = await _db.AppUsers.FindAsync(userId);
        if (user != null)
        {
            user.RoleId = roleId;
            user.IsActive = isActive;
            await _db.SaveChangesAsync();
            TempData["Message"] = $"User '{user.Username}' updated successfully.";
        }
        return RedirectToAction(nameof(Index));
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> DeleteUser(int userId)
    {
        var user = await _db.AppUsers.FindAsync(userId);
        if (user != null)
        {
            if (user.Username.Equals("admin", StringComparison.OrdinalIgnoreCase))
            {
                TempData["Error"] = "Cannot delete default admin user.";
                return RedirectToAction(nameof(Index));
            }
            _db.AppUsers.Remove(user);
            await _db.SaveChangesAsync();
            TempData["Message"] = $"User '{user.Username}' deleted.";
        }
        return RedirectToAction(nameof(Index));
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> ResetDefaults()
    {
        var settings = await _db.ShopSettings.FirstOrDefaultAsync();
        if (settings is not null)
        {
            settings.ShopName = "Roonjha Oil Traders";
            settings.ShopAddress = "Main Market Road Lahore Punjab Pakistan";
            settings.PhoneNumber = "03001234567";
            settings.ContactNumber = "03001234567";
            settings.EmailAddress = "info@roonjha.com";
            settings.TaxRegistrationNumber = "NTN 1234567";
            settings.ThemeColor = "Navy Blue";
            settings.ReceiptFooterText = "Thank you for visiting Roonjha Oil Traders";
            await _db.SaveChangesAsync();
        }
        TempData["Message"] = "Settings reset to defaults.";
        return RedirectToAction(nameof(Index));
    }
}
