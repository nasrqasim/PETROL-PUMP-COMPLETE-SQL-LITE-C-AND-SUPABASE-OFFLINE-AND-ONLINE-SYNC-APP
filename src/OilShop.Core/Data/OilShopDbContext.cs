using Microsoft.EntityFrameworkCore;
using OilShop.Core.Models;

namespace OilShop.Core.Data;

public class OilShopDbContext : DbContext
{
    public OilShopDbContext(DbContextOptions<OilShopDbContext> options) : base(options) { }

    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<Supplier> Suppliers => Set<Supplier>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<SalesInvoice> SalesInvoices => Set<SalesInvoice>();
    public DbSet<SalesInvoiceLine> SalesInvoiceLines => Set<SalesInvoiceLine>();
    public DbSet<PurchaseInvoice> PurchaseInvoices => Set<PurchaseInvoice>();
    public DbSet<PurchaseInvoiceLine> PurchaseInvoiceLines => Set<PurchaseInvoiceLine>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Return> Returns => Set<Return>();
    public DbSet<StaffMember> Staff => Set<StaffMember>();
    public DbSet<Attendance> Attendances => Set<Attendance>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
    public DbSet<Expense> Expenses => Set<Expense>();
    public DbSet<ShopSettings> ShopSettings => Set<ShopSettings>();
    public DbSet<SyncQueue> SyncQueue => Set<SyncQueue>();
    public DbSet<Advance> Advances => Set<Advance>();
    public DbSet<Loan> Loans => Set<Loan>();
    public DbSet<AppUser> AppUsers => Set<AppUser>();
    public DbSet<Gari> Gariyan => Set<Gari>();
    public DbSet<RoznamchaEntry> Roznamcha => Set<RoznamchaEntry>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Money columns: keep 2 decimals in SQLite.
        foreach (var entity in modelBuilder.Model.GetEntityTypes())
        {
            foreach (var prop in entity.GetProperties().Where(p => p.ClrType == typeof(decimal)))
                prop.SetColumnType("decimal(18,2)");
        }

        modelBuilder.Entity<SalesInvoice>()
            .HasOne(i => i.Customer).WithMany(c => c.SalesInvoices)
            .HasForeignKey(i => i.CustomerId).OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<SalesInvoice>()
            .HasOne(i => i.Staff).WithMany(s => s.SalesInvoices)
            .HasForeignKey(i => i.StaffId).OnDelete(DeleteBehavior.SetNull);
        modelBuilder.Entity<PurchaseInvoice>()
            .HasOne(i => i.Supplier).WithMany(s => s.PurchaseInvoices)
            .HasForeignKey(i => i.SupplierId).OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<SalesInvoiceLine>()
            .HasOne(l => l.SalesInvoice).WithMany(i => i.Lines)
            .HasForeignKey(l => l.SalesInvoiceId).OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<PurchaseInvoiceLine>()
            .HasOne(l => l.PurchaseInvoice).WithMany(i => i.Lines)
            .HasForeignKey(l => l.PurchaseInvoiceId).OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<Attendance>()
            .HasOne(a => a.Staff).WithMany(s => s.Attendances)
            .HasForeignKey(a => a.StaffId).OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<RolePermission>()
            .HasOne(p => p.Role).WithMany(r => r.Permissions)
            .HasForeignKey(p => p.RoleId).OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<StaffMember>()
            .HasOne(s => s.Role).WithMany(r => r.Staff)
            .HasForeignKey(s => s.RoleId).OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<AppUser>()
            .HasOne(u => u.Role).WithMany()
            .HasForeignKey(u => u.RoleId).OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<SalesInvoice>().HasIndex(i => i.InvoiceNumber).IsUnique();
        modelBuilder.Entity<PurchaseInvoice>().HasIndex(i => i.InvoiceNumber).IsUnique();
        modelBuilder.Entity<Return>().HasIndex(r => r.ReturnNumber).IsUnique();
        modelBuilder.Entity<StaffMember>().HasIndex(s => s.EmployeeId).IsUnique();
        modelBuilder.Entity<Gari>().HasIndex(g => g.GariNo).IsUnique();

        modelBuilder.Entity<Gari>()
            .HasOne(g => g.Staff).WithMany()
            .HasForeignKey(g => g.StaffId).OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<RoznamchaEntry>()
            .HasOne(r => r.Staff).WithMany()
            .HasForeignKey(r => r.StaffId).OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Payment>()
            .HasOne(p => p.Staff).WithMany()
            .HasForeignKey(p => p.StaffId).OnDelete(DeleteBehavior.SetNull);
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        // Stamp UpdatedAt + mark dirty so the sync service picks the row up.
        foreach (var entry in ChangeTracker.Entries<SyncEntity>())
        {
            if (entry.State is EntityState.Added or EntityState.Modified)
            {
                entry.Entity.UpdatedAt = DateTime.UtcNow;
                entry.Entity.IsDirty = true;
                if (entry.State == EntityState.Added)
                    entry.Entity.CreatedAt = DateTime.UtcNow;
            }
        }
        return await base.SaveChangesAsync(cancellationToken);
    }
}
