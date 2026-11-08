using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OilShop.Core.Data;
using OilShop.Core.Models;

namespace OilShop.Web.Controllers;

/// <summary>Roles / RBAC — per-module Allowed/Denied grid.
/// Owner: full access. Cashier: sales only, no reports or settings.</summary>
public class RolesController : Controller
{
    private readonly OilShopDbContext _db;
    public RolesController(OilShopDbContext db) => _db = db;

    public static readonly string[] Modules =
        { "Sales", "Inventory", "Accounts", "Settings", "Reports", "Dashboard", "Customers", "Suppliers", "Staff", "Returns" };

    public async Task<IActionResult> Index()
    {
        ViewBag.Modules = Modules;
        return View(await _db.Roles.Include(r => r.Permissions).OrderBy(r => r.Id).ToListAsync());
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> SavePermissions(int roleId, Dictionary<string, bool> allowed)
    {
        var role = await _db.Roles.Include(r => r.Permissions).FirstOrDefaultAsync(r => r.Id == roleId);
        if (role is null) return NotFound();
        if (role.Name == "Owner")
        {
            TempData["Message"] = "Owner always has full access.";
            return RedirectToAction(nameof(Index));
        }
        foreach (var perm in role.Permissions)
            perm.Allowed = allowed.TryGetValue(perm.Module, out var v) && v;
        await _db.SaveChangesAsync();
        TempData["Message"] = $"Permissions saved for {role.Name}.";
        return RedirectToAction(nameof(Index));
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> AddRole(string name, string? description)
    {
        var role = new Role { Name = name, Description = description };
        _db.Roles.Add(role);
        await _db.SaveChangesAsync();
        foreach (var module in Modules)
            _db.RolePermissions.Add(new RolePermission { RoleId = role.Id, Module = module, Allowed = false });
        await _db.SaveChangesAsync();
        TempData["Message"] = $"Role {name} added.";
        return RedirectToAction(nameof(Index));
    }
}
