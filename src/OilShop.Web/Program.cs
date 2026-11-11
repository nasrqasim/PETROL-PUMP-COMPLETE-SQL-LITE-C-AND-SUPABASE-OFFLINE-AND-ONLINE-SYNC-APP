using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.EntityFrameworkCore;
using OilShop.Core.Data;
using OilShop.Core.Services;
using OilShop.Infrastructure.Supabase;

var builder = WebApplication.CreateBuilder(args);

// SQLite (offline-first local database). The file lives next to the app.
builder.Services.AddDbContext<OilShopDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("OilShopDb")
        ?? "Data Source=oilshop.db"));

// Authentication
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.LoginPath = "/Account/Login";
        options.LogoutPath = "/Account/Logout";
        options.ExpireTimeSpan = TimeSpan.FromDays(7);
    });

// Business services.
builder.Services.AddScoped<InvoiceService>();
builder.Services.AddScoped<ProfitLossService>();
builder.Services.AddScoped<ReturnService>();
builder.Services.AddScoped<AdvanceLoanService>();
builder.Services.AddScoped<SupabaseSyncService>();
builder.Services.AddScoped<OilShop.Web.Services.ReportEngineService>();

builder.Services.AddControllersWithViews()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

var app = builder.Build();

// Seed demo data on first run.
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<OilShopDbContext>();
    await SeedData.EnsureSeededAsync(db);
}

// Try one background sync on startup; never blocks or crashes the app.
_ = Task.Run(async () =>
{
    try
    {
        using var scope = app.Services.CreateScope();
        var sync = scope.ServiceProvider.GetRequiredService<SupabaseSyncService>();
        await sync.SyncAsync();
    }
    catch (Exception ex)
    {
        app.Logger.LogWarning(ex, "Startup Supabase sync skipped; app continues offline.");
    }
});

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Dashboard/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Dashboard}/{action=Index}/{id?}");

app.Run();
