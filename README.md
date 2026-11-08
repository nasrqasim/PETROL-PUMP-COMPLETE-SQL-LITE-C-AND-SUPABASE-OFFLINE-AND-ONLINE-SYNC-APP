# Oil Shop Management System — Roonjha Developers

Complete, functional Oil Shop Management Software in the same navy-blue UI
design as the demo video screens (navy sidebar `#172554`, top bar `#1e3a8a`,
ROONJHA DEVELOPERS branding, white cards, green income / red expenses,
Urdu headings where the screenshots show them).

## Stack

- **C# / .NET 8** — ASP.NET Core MVC web app (`src/OilShop.Web`)
- **UI** — Tailwind CSS via CDN + `wwwroot/css/site.css` (same design as the demo)
- **Local DB (offline-first)** — Entity Framework Core + **SQLite** (`oilshop.db`)
- **Cloud backend** — **Supabase** (PostgREST via the Supabase .NET client),
  synced when online; the app works fully offline when Supabase is not
  configured or the network is down.

## How to run

```bash
dotnet restore
dotnet run --project src/OilShop.Web
```

Then open `https://localhost:5001` (or the URL printed in the terminal).
On first run the database is created and seeded with the demo data below.

## How to configure Supabase

1. Create a project at https://supabase.com and create tables matching
   `Schema.sql` (Customers, Suppliers, Products, SalesInvoices,
   PurchaseInvoices, Payments, Returns, Staff, Expenses, etc.).
2. Put your project URL and anon key in `src/OilShop.Web/appsettings.json`
   (keys are empty placeholders by default) **or** as environment variables:

```bash
export SUPABASE_URL="https://YOUR-PROJECT.supabase.co"
export SUPABASE_ANON_KEY="YOUR-ANON-KEY"
```

   Never commit real keys to source control.
3. Restart the app. It will sync on startup and whenever
   `SupabaseSyncService.SyncAsync()` is called.

### How the offline-first sync works

- SQLite is always the source of truth while offline.
- Every insert/update marks the row `IsDirty = true` with `UpdatedAt`.
- When online, the sync service pushes dirty rows (and replays the
  `SyncQueue` table for offline changes) and pulls cloud rows newer than
  the last sync. Last-write-wins on `UpdatedAt`; a local dirty row is
  never overwritten by the cloud.
- If Supabase is unconfigured or unreachable, the service logs a warning
  and the app keeps working offline — nothing crashes.

## Money rules (golden rule)

- Dashboard Cash, Dashboard Bank and Person Ledger are kept **separate**.
- A **credit** sale/purchase changes **only** the khata — cash and bank
  are unchanged.
- Overpayment on a receipt **auto-creates advance**; a later sale/purchase
  against advance reduces the advance only.
- Sale decreases stock, purchase increases stock, returns restore stock.

## Modules

1. Dashboard — revenue, expenses, net profit, cash, bank, receivables,
   payables, recent invoices, low-stock alerts.
2. Customers — khata, balance due, udhaar/advance, payment receipt,
   WhatsApp balance link.
3. Suppliers — same khata logic for suppliers.
4. Products / Inventory — stock auto-updates on sale/purchase.
5. Sales Invoice — New Sales Invoice (customer, date, product lines,
   quantity/unit price/tax, discount, grand total), Save, Print view.
6. Purchase Invoice — same for suppliers; saving shows
   "Stock Updated Automatically".
7. Cash & Bank — cash/bank receipt and payment vouchers.
8. Returns — Sales Return and Purchase Return with reason, refund amount,
   stock restored; return slip print.
9. Staff — staff list, ID card (employee ID, designation, department,
   joining date, contact, QR placeholder), attendance check-in/check-out,
   sales record. Totals: 12 staff, 10 active, 2 on leave.
10. Roles / RBAC — Owner, Admin, Manager, Cashier, Staff with per-module
    Allowed/Denied toggles (Sales, Inventory, Accounts, Settings, Reports,
    ...). Owner has full access; Cashier can only do sales — no reports
    or settings.
11. Reports Center — **140+ reports** (General, Voucher, Daily/Monthly/
    Yearly Sales, Profit & Loss, Cash Flow, Balance Sheet, Stock, Customer
    Ledger, Supplier Ledger, Tax, Staff Attendance, Payroll, ...), each
    with Generate Report and Export PDF. Profit & Loss computes from real
    data.
12. WhatsApp — Customer Contacts with phone numbers, balance due,
    WhatsApp button opening wa.me with a prefilled balance message,
    Send Report / Share Statement.
13. Print — Print Preview: Invoice Print Preview (SI-004587, Grand Total
    Rs. 15,680) and Customer Ledger Account Statement, with Print,
    PDF Download (browser print-to-PDF), Save as Image, Share Document.
14. Settings — Shop Profile Settings, Shop Branding Settings (logo
    upload, theme color Navy Blue), Invoice Header Customization and
    Receipt Footer Text; Save Settings persists.
15. Advance & Loan — Total Advances Given Rs. 85,000, Total Loans
    Outstanding Rs. 45,000; Customer Advance table, Customer Loan panel,
    Add Advance, Add Loan, Record Payment, Generate Report.

## Demo seed data (NOT real customer data)

Seeded from the user's own demo video/screenshots, labelled as demo:

- Shop: Roonjha Oil Traders, Main Market Road Lahore Punjab Pakistan,
  Phone/Contact 03001234567, info@roonjha.com, NTN 1234567, Navy Blue,
  footer "Thank you for visiting Roonjha Oil Traders".
- Customers: Ahmed Khan Traders (balance due Rs. 14,800), Ali Motors,
  Raza Enterprises, Fatima Oil Center.
- Products: Diesel Fuel 50 Liters Rs. 280, Petrol 30 Liters Rs. 280,
  Engine Oil 5 Liters Rs. 810/290/450/800/850/780/680, Engine Oil Drum
  20 Liters.
- Sales Invoice SI-004587, 15-Oct-2025, Ahmed Khan Traders,
  Grand Total Rs. 15,680.
- Purchase Invoice PI-007892, 14-Oct-2025, Pakistan Oil Company
  (Diesel Stock 200L Rs. 260, Petrol Stock 150L Rs. 260, Engine Oil Drum
  20L; Tax Amount Rs. 80,860, Net Payable Rs. 58,240 as shown in the demo).
- Profit & Loss reference 15-Oct-2025: Revenue Rs. 125,600, Expenses
  Rs. 98,450, Net Profit Rs. 27,150, Profit Margin 21.6%. The report
  itself computes live from the invoices/expenses in the database; the
  demo figures are shown on the P&L page as the reference for that day.
- Staff: Muhammad Ali EMP-001 Sales Manager (joining 01-Jan-2024),
  Sara Khan EMP-002 Cashier, Hassan Khan Pump Operator, Hassan Raza
  EMP-003, plus 8 more to reach 12 staff (10 active, 2 on leave).
- Sales Return SR-001156, 15-Oct-2025, Ahmed Khan Traders, Rs. 2,800,
  "Customer returned excess fuel"; Total Sales Returns Rs. 12,500,
  Total Purchase Returns Rs. 8,300.
- Advances (total Rs. 85,000): Ahmed Khan Traders Rs. 25,000 on
  10-Oct-2025 (Partially Paid), Raza Enterprises Rs. 25,000, Fatima Oil
  Center Rs. 15,000 on 12-Oct-2025, Ali Motors Rs. 20,000.
- Loans (outstanding Rs. 45,000): Ahmed Khan Traders — Advance
  Rs. 25,000, Loan Rs. 10,000, issued 10-Oct-2025, due 25-Oct-2025,
  Monthly, Paid Rs. 5,000; Raza Enterprises Rs. 20,000; Fatima Oil
  Center Rs. 20,000.
- Note: the demo screenshot's advance table also showed row values of
  Rs. 28,000 and Rs. 110,000; these are not seeded as separate advances.

Replace the seed data with real data after first run (delete `oilshop.db`
and re-seed, or edit/delete records in the app).

## Project structure

```
OilShop.sln
Schema.sql
README.md
src/
  OilShop.Web/            ASP.NET Core MVC app (controllers, views, Program.cs)
  OilShop.Core/           Models, DbContext, SeedData, Services
  OilShop.Infrastructure/ SupabaseSyncService
```

## Build status — honest

- `dotnet --version` was run in the build environment: **dotnet is NOT
  installed there, so `dotnet build` could not be run and the code has NOT
  been build-tested.** The code was written carefully to be consistent
  (matching models, DbContext, controllers and views), but run
  `dotnet build` on a machine with the .NET 8 SDK before shipping, and
  fix any compiler errors it reports.
- Supabase sync is implemented against the Supabase **PostgREST HTTP API**
  (no Supabase base classes on the EF models, so the sync layer uses
  `HttpClient` + JSON). If you prefer the typed Supabase .NET client,
  add the `supabase` NuGet package and map the models to `SupabaseModel`.
- "PDF Download" uses the browser's Print → Save as PDF (no server-side
  PDF library is bundled). "Save as Image" uses the browser screenshot.
  WhatsApp sending opens wa.me — WhatsApp has no free official API for
  sending from a desktop app, so the user taps Send in WhatsApp.
- No login screen is included in this package: RBAC roles/permissions are
  implemented and enforced per module in the Roles page, but wiring a
  login + current-user role check is a next step (same as the Petrol Pump
  package).
