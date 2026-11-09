using Microsoft.EntityFrameworkCore;
using OilShop.Core.Models;

namespace OilShop.Core.Data;

/// <summary>
/// DEMO seed data. These values are taken from the user's own demo video /
/// screenshots of the Oil Shop Management Software and are NOT real customer
/// data — phone numbers such as 03001234567 are the demo numbers shown on
/// screen. Replace them with real data after first run.
/// </summary>
public static class SeedData
{
    public static readonly DateTime DemoDate = new(2025, 10, 15);

    public static async Task EnsureSeededAsync(OilShopDbContext db)
    {
        await db.Database.EnsureCreatedAsync();

        // Create AppUsers table if it does not exist yet (schema evolution)
        await db.Database.ExecuteSqlRawAsync(@"
            CREATE TABLE IF NOT EXISTS ""AppUsers"" (
                ""Id"" INTEGER NOT NULL CONSTRAINT ""PK_AppUsers"" PRIMARY KEY AUTOINCREMENT,
                ""Username"" TEXT NOT NULL,
                ""Password"" TEXT NOT NULL,
                ""FullName"" TEXT NOT NULL,
                ""RoleId"" INTEGER NOT NULL,
                ""IsActive"" INTEGER NOT NULL,
                ""CreatedAt"" TEXT NOT NULL,
                ""UpdatedAt"" TEXT NOT NULL,
                ""IsDirty"" INTEGER NOT NULL,
                ""IsDeleted"" INTEGER NOT NULL,
                CONSTRAINT ""FK_AppUsers_Roles_RoleId"" FOREIGN KEY (""RoleId"") REFERENCES ""Roles"" (""Id"") ON DELETE RESTRICT
            );");

        try
        {
            await db.Database.ExecuteSqlRawAsync(@"ALTER TABLE ""Staff"" ADD COLUMN ""Cnic"" TEXT;");
        }
        catch { }
        try
        {
            await db.Database.ExecuteSqlRawAsync(@"ALTER TABLE ""Staff"" ADD COLUMN ""CnicFrontPath"" TEXT;");
        }
        catch { }
        try
        {
            await db.Database.ExecuteSqlRawAsync(@"ALTER TABLE ""Staff"" ADD COLUMN ""CnicBackPath"" TEXT;");
        }
        catch { }

        // Create Gariyan table for Muslim Construction - Roznamcha
        await db.Database.ExecuteSqlRawAsync(@"
            CREATE TABLE IF NOT EXISTS ""Gariyan"" (
                ""Id"" INTEGER NOT NULL CONSTRAINT ""PK_Gariyan"" PRIMARY KEY AUTOINCREMENT,
                ""GariNo"" TEXT NOT NULL UNIQUE,
                ""DriverName"" TEXT,
                ""Malik"" TEXT NOT NULL DEFAULT 'Apni',
                ""Phone"" TEXT,
                ""CreatedAt"" TEXT NOT NULL,
                ""UpdatedAt"" TEXT NOT NULL,
                ""IsDirty"" INTEGER NOT NULL DEFAULT 0,
                ""IsDeleted"" INTEGER NOT NULL DEFAULT 0
            );");

        // Create Roznamcha table for Muslim Construction - Roznamcha
        await db.Database.ExecuteSqlRawAsync(@"
            CREATE TABLE IF NOT EXISTS ""Roznamcha"" (
                ""Id"" INTEGER NOT NULL CONSTRAINT ""PK_Roznamcha"" PRIMARY KEY AUTOINCREMENT,
                ""Date"" TEXT NOT NULL,
                ""GariNo"" TEXT NOT NULL,
                ""DriverName"" TEXT NOT NULL,
                ""Maal"" TEXT,
                ""DieselLiter"" DECIMAL(18,2) NOT NULL DEFAULT 0,
                ""Kiraya"" DECIMAL(18,2) NOT NULL DEFAULT 0,
                ""Kharcha"" DECIMAL(18,2) NOT NULL DEFAULT 0,
                ""Advance"" DECIMAL(18,2) NOT NULL DEFAULT 0,
                ""CreatedAt"" TEXT NOT NULL,
                ""UpdatedAt"" TEXT NOT NULL,
                ""IsDirty"" INTEGER NOT NULL DEFAULT 0,
                ""IsDeleted"" INTEGER NOT NULL DEFAULT 0
            );");

        // Seed initial Gariyan if empty
        if (!await db.Gariyan.AnyAsync())
        {
            db.Gariyan.AddRange(
                new Gari { GariNo = "537", DriverName = "Iqbal", Malik = "Apni", Phone = "0300-1234537" },
                new Gari { GariNo = "786", DriverName = "Rashid", Malik = "Kiraye Wali", Phone = "0301-7654321" },
                new Gari { GariNo = "1122", DriverName = "Tariq", Malik = "Apni", Phone = "0302-9988776" }
            );
            await db.SaveChangesAsync();
        }

        // Seed initial Roznamcha entry if empty
        if (!await db.Roznamcha.AnyAsync())
        {
            db.Roznamcha.AddRange(
                new RoznamchaEntry
                {
                    Date = new DateTime(2026, 11, 8),
                    GariNo = "537",
                    DriverName = "Iqbal",
                    Maal = "60 Ton Tarkol",
                    DieselLiter = 100m,
                    Kiraya = 35000m,
                    Kharcha = 5000m,
                    Advance = 10000m
                },
                new RoznamchaEntry
                {
                    Date = new DateTime(2026, 11, 8),
                    GariNo = "786",
                    DriverName = "Rashid",
                    Maal = "40 Ton Bajri",
                    DieselLiter = 80m,
                    Kiraya = 28000m,
                    Kharcha = 4000m,
                    Advance = 5000m
                }
            );
            await db.SaveChangesAsync();
        }

        // Ensure default users exist even if database was already partially seeded
        if (!await db.AppUsers.AnyAsync())
        {
            var defaultRole = await db.Roles.FirstOrDefaultAsync(r => r.Name == "Owner");
            if (defaultRole == null)
            {
                defaultRole = new Role { Name = "Owner", Description = "Complete control over all modules including reports and settings." };
                db.Roles.Add(defaultRole);
                await db.SaveChangesAsync();
            }
            var cashierRole = await db.Roles.FirstOrDefaultAsync(r => r.Name == "Cashier") ?? defaultRole;

            db.AppUsers.AddRange(
                new AppUser { Username = "admin", Password = "admin123", FullName = "System Administrator", RoleId = defaultRole.Id },
                new AppUser { Username = "cashier", Password = "cashier123", FullName = "Shop Cashier", RoleId = cashierRole.Id }
            );
            await db.SaveChangesAsync();
        }

        if (await db.ShopSettings.AnyAsync()) return; // already seeded

        db.ShopSettings.Add(new ShopSettings
        {
            Id = 1,
            ShopName = "Roonjha Oil Traders",
            ShopAddress = "Main Market Road Lahore Punjab Pakistan",
            PhoneNumber = "03001234567",
            ContactNumber = "03001234567",
            EmailAddress = "info@roonjha.com",
            TaxRegistrationNumber = "NTN 1234567",
            ThemeColor = "Navy Blue",
            InvoiceHeaderText = "Roonjha Developers Oil Shop",
            ReceiptFooterText = "Thank you for visiting Roonjha Oil Traders"
        });

        var roles = new[]
        {
            new Role { Name = "Owner", Description = "Complete control over all modules including reports and settings." },
            new Role { Name = "Admin", Description = "Full access except deleting shop settings." },
            new Role { Name = "Manager", Description = "Sales, inventory and reports. No settings or delete." },
            new Role { Name = "Cashier", Description = "Can only process sales transactions and issue receipts. No access to financial reports or system settings." },
            new Role { Name = "Staff", Description = "Own sales and attendance only." }
        };
        db.Roles.AddRange(roles);
        await db.SaveChangesAsync();

        string[] modules = { "Dashboard", "Sales", "Inventory", "Customers", "Suppliers", "Accounts", "Reports", "Settings", "Staff", "Returns" };
        foreach (var role in roles)
        {
            foreach (var module in modules)
            {
                bool allowed = role.Name switch
                {
                    "Owner" or "Admin" => true,
                    "Manager" => module is not ("Settings"),
                    "Cashier" => module is "Dashboard" or "Sales" or "Customers",
                    _ => module is "Dashboard" or "Sales"
                };
                db.RolePermissions.Add(new RolePermission { RoleId = role.Id, Module = module, Allowed = allowed });
            }
        }

        var customers = new[]
        {
            new Customer { Name = "Ahmed Khan Traders", Phone = "03001234567", Address = "Lahore Punjab Pakistan", BalanceDue = 14800m },
            new Customer { Name = "Ali Motors", Phone = "03017654321", Address = "Lahore Punjab Pakistan", BalanceDue = 0m },
            new Customer { Name = "Raza Enterprises", Phone = "03017654321", Address = "Lahore Punjab Pakistan", BalanceDue = 0m },
            new Customer { Name = "Fatima Oil Center", Phone = "03007654321", Address = "Lahore Punjab Pakistan", BalanceDue = 0m }
        };
        db.Customers.AddRange(customers);

        var suppliers = new[]
        {
            new Supplier { Name = "Pakistan Oil Company", Phone = "03001234567", Address = "Lahore Punjab Pakistan" },
            new Supplier { Name = "Ahmed Khan Traders", Phone = "03001234567", Address = "Lahore Punjab Pakistan" }
        };
        db.Suppliers.AddRange(suppliers);

        var products = new[]
        {
            // Stock quantities are the post-purchase state: the seeded purchase
            // invoice PI-007892 (14-Oct-2025) already added Diesel +200L,
            // Petrol +150L and Engine Oil Drum +20L to stock.
            new Product { Name = "Diesel Fuel 50 Liters", Category = "Fuel", SalePrice = 280, PurchasePrice = 260, StockQuantity = 700 },
            new Product { Name = "Petrol 30 Liters", Category = "Fuel", SalePrice = 280, PurchasePrice = 260, StockQuantity = 550 },
            new Product { Name = "Engine Oil Drum 20 Liters", Category = "Engine Oil", SalePrice = 2600, PurchasePrice = 2400, StockQuantity = 20 },
            new Product { Name = "Engine Oil 5 Liters", Category = "Engine Oil", SalePrice = 810, PurchasePrice = 700, StockQuantity = 120 },
            new Product { Name = "Engine Oil 5 Liters", Category = "Engine Oil", SalePrice = 290, PurchasePrice = 240, StockQuantity = 150 },
            new Product { Name = "Engine Oil 5 Liters", Category = "Engine Oil", SalePrice = 450, PurchasePrice = 380, StockQuantity = 100 },
            new Product { Name = "Engine Oil 5 Liters", Category = "Engine Oil", SalePrice = 800, PurchasePrice = 690, StockQuantity = 90 },
            new Product { Name = "Engine Oil 5 Liters", Category = "Engine Oil", SalePrice = 850, PurchasePrice = 720, StockQuantity = 80 },
            new Product { Name = "Engine Oil 5 Liters", Category = "Engine Oil", SalePrice = 780, PurchasePrice = 660, StockQuantity = 75 },
            new Product { Name = "Engine Oil 5 Liters", Category = "Engine Oil", SalePrice = 680, PurchasePrice = 580, StockQuantity = 60 }
        };
        db.Products.AddRange(products);

        var owner = roles.First(r => r.Name == "Owner");
        var manager = roles.First(r => r.Name == "Manager");
        var cashier = roles.First(r => r.Name == "Cashier");
        var staff = new[]
        {
            new StaffMember { EmployeeId = "EMP-001", Name = "Muhammad Ali", Designation = "Sales Manager", Department = "Sales Department", JoiningDate = new DateTime(2024, 1, 1), ContactNumber = "0300-1234567", Address = "Lahore Punjab Pakistan", Salary = 45000, RoleId = manager.Id },
            new StaffMember { EmployeeId = "EMP-002", Name = "Sara Khan", Designation = "Cashier", Department = "Sales Department", JoiningDate = new DateTime(2024, 1, 1), ContactNumber = "0301-7654321", Address = "Lahore Punjab Pakistan", Salary = 32000, RoleId = cashier.Id },
            new StaffMember { EmployeeId = "EMP-003", Name = "Hassan Khan", Designation = "Pump Operator", Department = "Sales Department", JoiningDate = new DateTime(2024, 1, 1), ContactNumber = "0301-1234567", Address = "Lahore Punjab Pakistan", Salary = 30000, RoleId = cashier.Id },
            new StaffMember { EmployeeId = "EMP-004", Name = "Hassan Raza", Designation = "Pump Operator", Department = "Sales Department", JoiningDate = new DateTime(2024, 1, 1), ContactNumber = "0301-1234567", Address = "Lahore Punjab Pakistan", Salary = 30000, RoleId = cashier.Id },
            new StaffMember { EmployeeId = "EMP-005", Name = "Bilal Ahmed", Designation = "Salesman", Department = "Sales Department", JoiningDate = new DateTime(2024, 2, 1), ContactNumber = "0302-1111111", Address = "Lahore Punjab Pakistan", Salary = 28000, RoleId = cashier.Id },
            new StaffMember { EmployeeId = "EMP-006", Name = "Usman Ghani", Designation = "Cashier", Department = "Sales Department", JoiningDate = new DateTime(2024, 3, 1), ContactNumber = "0302-2222222", Address = "Lahore Punjab Pakistan", Salary = 32000, RoleId = cashier.Id },
            new StaffMember { EmployeeId = "EMP-007", Name = "Ayesha Khan", Designation = "Accountant", Department = "Accounts Department", JoiningDate = new DateTime(2024, 3, 1), ContactNumber = "0302-3333333", Address = "Lahore Punjab Pakistan", Salary = 40000, RoleId = manager.Id },
            new StaffMember { EmployeeId = "EMP-008", Name = "Zainab Ali", Designation = "Salesman", Department = "Sales Department", JoiningDate = new DateTime(2024, 4, 1), ContactNumber = "0302-4444444", Address = "Lahore Punjab Pakistan", Salary = 28000, RoleId = cashier.Id },
            new StaffMember { EmployeeId = "EMP-009", Name = "Omar Farooq", Designation = "Store Keeper", Department = "Inventory Department", JoiningDate = new DateTime(2024, 5, 1), ContactNumber = "0302-5555555", Address = "Lahore Punjab Pakistan", Salary = 30000, RoleId = cashier.Id },
            new StaffMember { EmployeeId = "EMP-010", Name = "Talha Mehmood", Designation = "Pump Operator", Department = "Sales Department", JoiningDate = new DateTime(2024, 6, 1), ContactNumber = "0302-6666666", Address = "Lahore Punjab Pakistan", Salary = 30000, RoleId = cashier.Id },
            // On leave (2) — totals: 12 staff members, 10 active, 2 on leave.
            new StaffMember { EmployeeId = "EMP-011", Name = "Hina Shahid", Designation = "Receptionist", Department = "Sales Department", JoiningDate = new DateTime(2024, 7, 1), ContactNumber = "0302-7777777", Address = "Lahore Punjab Pakistan", Salary = 26000, RoleId = cashier.Id, OnLeave = true },
            new StaffMember { EmployeeId = "EMP-012", Name = "Waqas Ahmed", Designation = "Driver", Department = "Sales Department", JoiningDate = new DateTime(2024, 8, 1), ContactNumber = "0302-8888888", Address = "Lahore Punjab Pakistan", Salary = 28000, RoleId = cashier.Id, OnLeave = true }
        };
        db.Staff.AddRange(staff);

        // Profit & Loss figures for 15-Oct-2025, as shown in the demo.
        db.Expenses.AddRange(
            new Expense { Date = DemoDate, Category = "Purchase Cost", Amount = 75000 },
            new Expense { Date = DemoDate, Category = "Staff Salaries", Amount = 12000 },
            new Expense { Date = DemoDate, Category = "Utilities Bill", Amount = 5250 },
            new Expense { Date = DemoDate, Category = "Rent Expense", Amount = 4000 },
            new Expense { Date = DemoDate, Category = "Fuel Cost", Amount = 2200 }
        );

        await db.SaveChangesAsync();

        // Sales Invoice SI-004587, 15-Oct-2025, Ahmed Khan Traders, Grand Total Rs. 15,680.
        var ahmed = customers[0];
        var diesel = products[0];
        var petrol = products[1];
        var invoice = new SalesInvoice
        {
            InvoiceNumber = "SI-004587",
            Date = DemoDate,
            CustomerId = ahmed.Id,
            StaffId = staff[0].Id,
            PaymentMode = PaymentMode.Credit,
            SubTotal = 14680,
            Discount = 280,
            Tax = 1280,
            GrandTotal = 15680,
            PaidAmount = 0,
            Lines = new List<SalesInvoiceLine>
            {
                new() { ProductId = diesel.Id, ProductName = diesel.Name, Quantity = 50, UnitPrice = 280, Tax = 0 },
                new() { ProductId = petrol.Id, ProductName = petrol.Name, Quantity = 30, UnitPrice = 280, Tax = 0 }
            }
        };
        db.SalesInvoices.Add(invoice);

        // Sales Return SR-001156, 15-Oct-2025, Ahmed Khan Traders, Rs. 2,800.
        db.Returns.Add(new Return
        {
            ReturnNumber = "SR-001156",
            Date = DemoDate,
            Type = ReturnType.SalesReturn,
            CustomerId = ahmed.Id,
            OriginalInvoiceNumber = "SI-004587",
            ProductId = diesel.Id,
            ProductName = diesel.Name,
            ReturnedQuantity = 10,
            UnitPrice = 280,
            RefundAmount = 2800,
            Reason = "Customer returned excess fuel",
            Status = ReturnStatus.Completed
        });

        // Attendance sample for 15-Oct-2025.
        db.Attendances.AddRange(
            new Attendance { StaffId = staff[0].Id, Date = DemoDate, CheckInTime = DemoDate.AddHours(8).AddMinutes(30), CheckOutTime = DemoDate.AddHours(18).AddMinutes(45), Status = "Present", InvoicesGenerated = 12, SalesMade = 45200 },
            new Attendance { StaffId = staff[1].Id, Date = DemoDate, CheckInTime = DemoDate.AddHours(8).AddMinutes(45), CheckOutTime = DemoDate.AddHours(18).AddMinutes(5), Status = "Present", InvoicesGenerated = 9, SalesMade = 31200 }
        );

        // Purchase Invoice PI-007892, 14-Oct-2025, supplier Pakistan Oil Company.
        // Tax Amount Rs. 80,860 and Net Payable Rs. 58,240 are the figures shown
        // in the demo screenshot; saving a purchase invoice increases stock and
        // the UI shows "Stock Updated Automatically".
        var pakOil = suppliers[0];
        var drum = products[2]; // "Engine Oil Drum 20 Liters" (inserted after Petrol)
        db.PurchaseInvoices.Add(new PurchaseInvoice
        {
            InvoiceNumber = "PI-007892",
            Date = new DateTime(2025, 10, 14),
            SupplierId = pakOil.Id,
            PaymentMode = PaymentMode.Credit,
            SubTotal = 117000,
            Discount = 139620,
            Tax = 80860,
            GrandTotal = 58240,
            PaidAmount = 0,
            Lines = new List<PurchaseInvoiceLine>
            {
                new() { ProductId = diesel.Id, ProductName = "Diesel Stock 200 Liters", Quantity = 200, UnitPrice = 260, Tax = 0 },
                new() { ProductId = petrol.Id, ProductName = "Petrol Stock 150 Liters", Quantity = 150, UnitPrice = 260, Tax = 0 },
                new() { ProductId = drum.Id, ProductName = "Engine Oil Drum 20 Liters", Quantity = 20, UnitPrice = 1300, Tax = 0 }
            }
        });

        // Advances — seeded rows sum to the demo header total Rs. 85,000.
        db.Advances.AddRange(
            new Advance { CustomerId = ahmed.Id, CustomerName = "Ahmed Khan Traders", Amount = 25000, PaidAmount = 5000, Date = new DateTime(2025, 10, 10), Status = AdvanceStatus.PartiallyPaid },
            new Advance { CustomerId = customers[2].Id, CustomerName = "Raza Enterprises", Amount = 25000, PaidAmount = 0, Date = new DateTime(2025, 10, 11), Status = AdvanceStatus.Active },
            new Advance { CustomerId = customers[3].Id, CustomerName = "Fatima Oil Center", Amount = 15000, PaidAmount = 0, Date = new DateTime(2025, 10, 12), Status = AdvanceStatus.Active },
            new Advance { CustomerId = customers[1].Id, CustomerName = "Ali Motors", Amount = 20000, PaidAmount = 0, Date = new DateTime(2025, 10, 12), Status = AdvanceStatus.Active }
        );

        // Loans — remaining balances sum to the demo header total Rs. 45,000.
        db.Loans.AddRange(
            new Loan { CustomerId = ahmed.Id, CustomerName = "Ahmed Khan Traders", AdvanceAmount = 25000, LoanAmount = 10000, DateIssued = new DateTime(2025, 10, 10), RepaymentDueDate = new DateTime(2025, 10, 25), InstallmentPlan = "Monthly", PaidAmount = 5000, Status = LoanStatus.PartiallyPaid },
            new Loan { CustomerId = customers[2].Id, CustomerName = "Raza Enterprises", AdvanceAmount = 0, LoanAmount = 20000, DateIssued = new DateTime(2025, 10, 12), RepaymentDueDate = new DateTime(2025, 11, 12), InstallmentPlan = "Monthly", PaidAmount = 0, Status = LoanStatus.Active },
            new Loan { CustomerId = customers[3].Id, CustomerName = "Fatima Oil Center", AdvanceAmount = 0, LoanAmount = 20000, DateIssued = new DateTime(2025, 10, 13), RepaymentDueDate = new DateTime(2025, 11, 13), InstallmentPlan = "Monthly", PaidAmount = 0, Status = LoanStatus.Active }
        );

        if (!await db.AppUsers.AnyAsync())
        {
            db.AppUsers.AddRange(
                new AppUser { Username = "admin", Password = "admin123", FullName = "System Administrator", RoleId = owner.Id },
                new AppUser { Username = "cashier", Password = "cashier123", FullName = "Shop Cashier", RoleId = cashier.Id },
                new AppUser { Username = "manager", Password = "manager123", FullName = "Store Manager", RoleId = manager.Id }
            );
        }

        await db.SaveChangesAsync();
    }
}
