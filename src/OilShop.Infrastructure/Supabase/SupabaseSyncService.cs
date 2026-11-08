using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using OilShop.Core.Data;
using OilShop.Core.Models;

namespace OilShop.Infrastructure.Supabase;

/// <summary>
/// Offline-first sync with Supabase via its PostgREST HTTP API
/// (POST /rest/v1/{table} with Prefer: resolution=merge-duplicates).
/// Using plain HTTP keeps the EF Core models free of Supabase base classes.
///
/// Local SQLite is always the source of truth while offline. When the app
/// is online, changed rows (IsDirty) are pushed and newer cloud rows are
/// pulled, using UpdatedAt as the conflict rule (latest write wins).
///
/// If Supabase is NOT configured (empty URL / key), this service logs a
/// warning and does nothing — the app keeps working fully offline.
/// Never put a real Supabase key in source control; use appsettings.json
/// placeholders or the SUPABASE_URL / SUPABASE_ANON_KEY environment variables.
/// </summary>
public class SupabaseSyncService
{
    private readonly OilShopDbContext _db;
    private readonly IConfiguration _config;
    private readonly ILogger<SupabaseSyncService> _logger;
    private readonly HttpClient _http = new();

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(_config["Supabase:Url"]) &&
        !string.IsNullOrWhiteSpace(_config["Supabase:AnonKey"]) &&
        !_config["Supabase:Url"]!.Contains("YOUR-");

    public SupabaseSyncService(OilShopDbContext db, IConfiguration config, ILogger<SupabaseSyncService> logger)
    {
        _db = db;
        _config = config;
        _logger = logger;
    }

    private HttpRequestMessage Request(HttpMethod method, string path, string? json = null)
    {
        var url = _config["Supabase:Url"]!.TrimEnd('/') + "/rest/v1/" + path.TrimStart('/');
        var req = new HttpRequestMessage(method, url);
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _config["Supabase:AnonKey"]);
        req.Headers.Add("apikey", _config["Supabase:AnonKey"]);
        if (json is not null)
            req.Content = new StringContent(json, Encoding.UTF8, "application/json");
        return req;
    }

    /// <summary>Push local dirty rows, then pull newer cloud rows. Safe to
    /// call on a timer or on app start; never throws when offline.</summary>
    public async Task SyncAsync(CancellationToken ct = default)
    {
        if (!IsConfigured)
        {
            _logger.LogWarning("Supabase is not configured (empty Supabase:Url / Supabase:AnonKey). Running offline-only; local SQLite remains the source of truth.");
            return;
        }
        try
        {
            await PushAsync(ct);
            await PullAsync(ct);
            _logger.LogInformation("Supabase sync completed at {Time:u}.", DateTime.UtcNow);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Supabase sync failed (network or server error). Local data is unaffected; the next sync will retry.");
        }
    }

    private async Task PushAsync(CancellationToken ct)
    {
        // 1) Replay the offline change queue first (order preserved).
        var pending = await _db.SyncQueue.Where(q => !q.Synced).OrderBy(q => q.Id).ToListAsync(ct);
        foreach (var item in pending)
        {
            try
            {
                using var resp = item.Operation == "Delete"
                    ? await _http.SendAsync(Request(HttpMethod.Delete, $"{item.EntityType}?id=eq.{item.EntityId}"), ct)
                    : await _http.SendAsync(Request(HttpMethod.Post, $"{item.EntityType}?on_conflict=id",
                        item.PayloadJson), ct);
                resp.Headers.TryGetValues("Prefer", out _);
                resp.EnsureSuccessStatusCode();
                item.Synced = true;
                item.SyncedAt = DateTime.UtcNow;
            }
            catch (Exception ex)
            {
                item.LastError = ex.Message;
                _logger.LogWarning(ex, "Failed to push {Entity} {Id}; will retry next sync.", item.EntityType, item.EntityId);
            }
        }

        // 2) Push any dirty entity rows directly (belt and braces with the queue).
        await PushDirtyAsync(_db.Customers, "Customers", ct);
        await PushDirtyAsync(_db.Products, "Products", ct);
        await PushDirtyAsync(_db.SalesInvoices, "SalesInvoices", ct);
        await PushDirtyAsync(_db.Suppliers, "Suppliers", ct);
        await PushDirtyAsync(_db.Payments, "Payments", ct);
        await PushDirtyAsync(_db.Returns, "Returns", ct);
        await PushDirtyAsync(_db.Staff, "Staff", ct);
        await PushDirtyAsync(_db.Expenses, "Expenses", ct);

        await _db.SaveChangesAsync(ct);
    }

    private async Task PushDirtyAsync<T>(DbSet<T> set, string table, CancellationToken ct) where T : SyncEntity
    {
        var dirty = await set.Where(e => e.IsDirty && !e.IsDeleted).ToListAsync(ct);
        foreach (var row in dirty)
        {
            try
            {
                var json = JsonSerializer.Serialize(row, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
                var req = Request(HttpMethod.Post, $"{table}?on_conflict=id", json);
                req.Headers.Add("Prefer", "resolution=merge-duplicates");
                using var resp = await _http.SendAsync(req, ct);
                resp.EnsureSuccessStatusCode();
                row.IsDirty = false;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to push {Table} row {Id}.", table, row.Id);
            }
        }
    }

    private async Task PullAsync(CancellationToken ct)
    {
        // Pull rows updated since our last sync. UpdatedAt is the watermark.
        // Last-write-wins: a cloud row only overwrites a local row when its
        // UpdatedAt is newer AND the local row is not dirty (local edits win).
        var lastSync = await _db.SyncQueue
            .Where(q => q.Synced && q.SyncedAt != null)
            .MaxAsync(q => (DateTime?)q.SyncedAt, ct) ?? DateTime.UtcNow.AddDays(-30);

        _logger.LogInformation("Pulling Supabase changes newer than {LastSync:u}.", lastSync);

        // Reference pattern for Customers; repeat the same block for the
        // other tables as needed.
        var rows = await GetRowsAsync("Customers", lastSync, ct);
        foreach (var row in rows)
        {
            if (!row.TryGetValue("id", out var idEl) || !idEl.TryGetInt32(out var id)) continue;
            var updatedAt = row.TryGetValue("updatedAt", out var u) && u.TryGetDateTime(out var dt) ? dt : DateTime.MinValue;
            var local = await _db.Customers.FindAsync(new object[] { id }, ct);
            if (local is null)
            {
                var created = new Customer
                {
                    Id = id,
                    Name = GetString(row, "name"),
                    Phone = GetString(row, "phone"),
                    Address = GetString(row, "address"),
                    BalanceDue = GetDecimal(row, "balanceDue"),
                    Advance = GetDecimal(row, "advance"),
                    UpdatedAt = updatedAt,
                    IsDirty = false
                };
                _db.Customers.Add(created);
            }
            else if (!local.IsDirty && updatedAt > local.UpdatedAt)
            {
                local.Name = GetString(row, "name");
                local.Phone = GetString(row, "phone");
                local.Address = GetString(row, "address");
                local.BalanceDue = GetDecimal(row, "balanceDue");
                local.Advance = GetDecimal(row, "advance");
                local.UpdatedAt = updatedAt;
                local.IsDirty = false;
            }
        }
        await _db.SaveChangesAsync(ct);
    }

    private async Task<List<Dictionary<string, JsonElement>>> GetRowsAsync(string table, DateTime since, CancellationToken ct)
    {
        var req = Request(HttpMethod.Get, $"{table}?updated_at=gt.{Uri.EscapeDataString(since.ToString("o"))}&select=*");
        using var resp = await _http.SendAsync(req, ct);
        resp.EnsureSuccessStatusCode();
        var body = await resp.Content.ReadAsStringAsync(ct);
        return JsonSerializer.Deserialize<List<Dictionary<string, JsonElement>>>(body)
            ?? new List<Dictionary<string, JsonElement>>();
    }

    private static string GetString(Dictionary<string, JsonElement> row, string key) =>
        row.TryGetValue(key, out var el) && el.ValueKind == JsonValueKind.String ? el.GetString() ?? string.Empty : string.Empty;

    private static decimal GetDecimal(Dictionary<string, JsonElement> row, string key) =>
        row.TryGetValue(key, out var el) && el.ValueKind == JsonValueKind.Number ? el.GetDecimal() : 0m;
}
