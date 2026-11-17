"use client";

import React, { useState, useEffect } from "react";
import {
  PlusCircle,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Calendar,
  Truck,
  User,
  Printer,
  X,
  FileText,
  Fuel,
  Package,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Coins,
} from "lucide-react";
import { printTableDocument } from "@/lib/print-table";

interface RoznamchaItem {
  id: number;
  date: string;
  displayDate: string;
  gariNo: string;
  driverName: string;
  maal: string;
  unit?: string;
  unitQuantity?: number;
  pricePerUnit?: number;
  materialAmount?: number;
  dieselLiter: number;
  kiraya: number;
  kharcha: number;
  otherExpenseName?: string;
  otherExpenseAmount?: number;
  advance: number;
  baqaya: number;
}

interface Gari {
  id: number;
  gariNo: string;
  driverName: string;
  malik: string;
  phone: string;
}

interface Product {
  Id: number;
  Name: string;
  Category?: string;
  Unit?: string;
  SalePrice: number;
  PurchasePrice: number;
  StockQuantity?: number;
}

const UNIT_OPTIONS = [
  { label: "None (No Unit)", value: "" },
  { label: "Liters (ltr)", value: "Liters" },
  { label: "Cartons (ctn)", value: "Cartons" },
  { label: "Pieces (pcs)", value: "Pieces" },
  { label: "Gallons", value: "Gallons" },
  { label: "Tons", value: "Tons" },
  { label: "Dumpers", value: "Dumpers" },
  { label: "Bags", value: "Bags" },
];

export default function AajKiEntryPage() {
  const [entries, setEntries] = useState<RoznamchaItem[]>([]);
  const [gariyan, setGariyan] = useState<Gari[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [gariNo, setGariNo] = useState("");
  const [driverName, setDriverName] = useState("");
  const [maal, setMaal] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [unit, setUnit] = useState<string>("");
  const [unitQuantity, setUnitQuantity] = useState<number | "">("");
  const [pricePerUnit, setPricePerUnit] = useState<number | "">("");
  const [dieselLiter, setDieselLiter] = useState<number | "">("");
  const [kiraya, setKiraya] = useState<number | "">("");
  const [kharcha, setKharcha] = useState<number | "">("");
  const [otherExpenseName, setOtherExpenseName] = useState("");
  const [otherExpenseAmount, setOtherExpenseAmount] = useState<number | "">("");
  const [advance, setAdvance] = useState<number | "">("");

  // Thermal Receipt State
  const [receiptItem, setReceiptItem] = useState<RoznamchaItem | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Filter States
  const [filterDate, setFilterDate] = useState("");
  const [filterGari, setFilterGari] = useState("");
  const [filterDriver, setFilterDriver] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [gariRes, rozRes, prodRes] = await Promise.all([
        fetch("/api/gariyan"),
        fetch("/api/roznamcha"),
        fetch("/api/products"),
      ]);

      const gariData = gariRes.ok ? await gariRes.json().catch(() => []) : [];
      const rozData = rozRes.ok ? await rozRes.json().catch(() => []) : [];
      const prodData = prodRes.ok ? await prodRes.json().catch(() => []) : [];

      setGariyan(Array.isArray(gariData) ? gariData : []);
      setEntries(Array.isArray(rozData) ? rozData : []);
      setProducts(Array.isArray(prodData) ? prodData : []);
    } catch (err: any) {
      setError(err?.message || "Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleVehicleSelect = (selectedNo: string) => {
    setGariNo(selectedNo);
    const vehicle = gariyan.find((g) => g.gariNo === selectedNo);
    if (vehicle && vehicle.driverName) {
      setDriverName(vehicle.driverName);
    }
  };

  const handleProductSelect = (prodIdStr: string) => {
    setSelectedProductId(prodIdStr);
    if (!prodIdStr) return;
    const prod = products.find((p) => String(p.Id) === prodIdStr);
    if (prod) {
      setMaal(prod.Name);
      if (prod.SalePrice && prod.SalePrice > 0) {
        setPricePerUnit(prod.SalePrice);
      }
      // Infer unit if matched
      const prodUnitLower = (prod.Unit || "").toLowerCase();
      if (prodUnitLower.includes("liter") || prodUnitLower.includes("ltr")) {
        setUnit("Liters");
      } else if (prodUnitLower.includes("carton") || prodUnitLower.includes("ctn")) {
        setUnit("Cartons");
      } else if (prodUnitLower.includes("piece") || prodUnitLower.includes("pcs")) {
        setUnit("Pieces");
      } else if (prodUnitLower.includes("gallon")) {
        setUnit("Gallons");
      } else if (prodUnitLower.includes("ton")) {
        setUnit("Tons");
      } else if (prodUnitLower.includes("dumper")) {
        setUnit("Dumpers");
      } else if (prodUnitLower.includes("bag")) {
        setUnit("Bags");
      } else if (prod.Unit) {
        setUnit(prod.Unit);
      }
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormDate(new Date().toISOString().split("T")[0]);
    setGariNo("");
    setDriverName("");
    setMaal("");
    setSelectedProductId("");
    setUnit("");
    setUnitQuantity("");
    setPricePerUnit("");
    setDieselLiter("");
    setKiraya("");
    setKharcha("");
    setOtherExpenseName("");
    setOtherExpenseAmount("");
    setAdvance("");
  };

  const handleEdit = (item: RoznamchaItem) => {
    setEditingId(item.id);
    setFormDate(item.date);
    setGariNo(item.gariNo);
    setDriverName(item.driverName);
    setMaal(item.maal);
    setUnit(item.unit || "");
    setUnitQuantity(item.unitQuantity !== undefined && item.unitQuantity !== null ? item.unitQuantity : "");
    setPricePerUnit(item.pricePerUnit !== undefined && item.pricePerUnit !== null ? item.pricePerUnit : "");
    setDieselLiter(item.dieselLiter || "");
    setKiraya(item.kiraya || "");
    setKharcha(item.kharcha || "");
    setOtherExpenseName(item.otherExpenseName || "");
    setOtherExpenseAmount(item.otherExpenseAmount !== undefined && item.otherExpenseAmount !== null ? item.otherExpenseAmount : "");
    setAdvance(item.advance || "");

    // Find if product matches
    const matched = products.find((p) => p.Name.toLowerCase() === (item.maal || "").toLowerCase());
    setSelectedProductId(matched ? String(matched.Id) : "");

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(`Are you sure you want to delete Daily Ledger entry #${id}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/roznamcha/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed.");
      setSuccess("Entry deleted successfully.");
      setTimeout(() => setSuccess(null), 3000);
      loadData();
    } catch (err: any) {
      setError(err?.message || "Failed to delete.");
    }
  };

  const handlePrintReceipt = (item: RoznamchaItem) => {
    setReceiptItem(item);
    setShowReceiptModal(true);
  };

  const executePrint = () => {
    document.body.classList.add("printing-thermal");
    window.print();
    setTimeout(() => {
      document.body.classList.remove("printing-thermal");
    }, 1000);
  };

  // Live calculation:
  // User instruction: "expenses should add in total and only advance should decrease and add option of units optional like litres ,ctn,pieces,gallons etc and if i select litr show option price per litre then add this to net total and receipt and save entry shows it"
  const liveKiraya = Number(kiraya) || 0;
  const liveKharcha = Number(kharcha) || 0;
  const liveOtherExpense = Number(otherExpenseAmount) || 0;
  const liveUnitQty = Number(unitQuantity) || 0;
  const livePricePerUnit = Number(pricePerUnit) || 0;
  const liveMaterialAmount = (liveUnitQty > 0 && livePricePerUnit > 0) ? (liveUnitQty * livePricePerUnit) : 0;
  const liveAdvance = Number(advance) || 0;

  const liveGrossTotal = liveKiraya + liveKharcha + liveOtherExpense + liveMaterialAmount;
  const liveBaqaya = liveGrossTotal - liveAdvance;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!gariNo.trim()) {
      setError("Please select or enter vehicle number.");
      return;
    }
    if (!driverName.trim()) {
      setError("Please enter driver name.");
      return;
    }

    const payload = {
      date: formDate,
      gariNo: gariNo.trim(),
      driverName: driverName.trim(),
      maal: maal.trim(),
      unit: unit.trim(),
      unitQuantity: liveUnitQty,
      pricePerUnit: livePricePerUnit,
      materialAmount: liveMaterialAmount,
      dieselLiter: Number(dieselLiter) || (unit === "Liters" ? liveUnitQty : 0),
      kiraya: liveKiraya,
      kharcha: liveKharcha,
      otherExpenseName: otherExpenseName.trim(),
      otherExpenseAmount: liveOtherExpense,
      advance: liveAdvance,
    };

    if (payload.kiraya < 0 || payload.kharcha < 0 || payload.advance < 0) {
      setError("Financial values cannot be negative.");
      return;
    }

    setSaving(true);
    try {
      const url = editingId ? `/api/roznamcha/${editingId}` : "/api/roznamcha";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || errJson.message || "Failed to save record.");
      }

      const savedData = await res.json().catch(() => ({}));
      const currentItem: RoznamchaItem = {
        id: savedData.id || editingId || Date.now(),
        date: payload.date,
        displayDate: new Date(payload.date).toLocaleDateString("en-GB"),
        gariNo: payload.gariNo,
        driverName: payload.driverName,
        maal: payload.maal,
        unit: payload.unit,
        unitQuantity: payload.unitQuantity,
        pricePerUnit: payload.pricePerUnit,
        materialAmount: payload.materialAmount,
        dieselLiter: payload.dieselLiter,
        kiraya: payload.kiraya,
        kharcha: payload.kharcha,
        otherExpenseName: payload.otherExpenseName,
        otherExpenseAmount: payload.otherExpenseAmount,
        advance: payload.advance,
        baqaya: liveBaqaya,
      };

      setSuccess(editingId ? "Entry updated successfully!" : "New daily entry saved successfully!");
      setTimeout(() => setSuccess(null), 4000);
      resetForm();
      loadData();

      // Trigger Thermal Receipt Modal Option
      setReceiptItem(currentItem);
      setShowReceiptModal(true);
    } catch (err: any) {
      setError(err?.message || "An error occurred.");
    } finally {
      setSaving(false);
    }
  };

  // Filtered entries
  const filteredEntries = entries.filter((item) => {
    if (filterDate && item.date !== filterDate) return false;
    if (filterGari && item.gariNo !== filterGari) return false;
    if (filterDriver && !item.driverName.toLowerCase().includes(filterDriver.toLowerCase())) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        item.gariNo.toLowerCase().includes(q) ||
        item.driverName.toLowerCase().includes(q) ||
        (item.maal && item.maal.toLowerCase().includes(q)) ||
        (item.otherExpenseName && item.otherExpenseName.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  // Aggregate totals
  const totalTripsCount = filteredEntries.length;
  const totalDieselLiterSummary = filteredEntries.reduce((sum, e) => sum + (Number(e.dieselLiter) || 0), 0);
  const totalFreightSummary = filteredEntries.reduce((sum, e) => sum + (Number(e.kiraya) || 0), 0);
  const totalTripExpensesSummary = filteredEntries.reduce((sum, e) => sum + (Number(e.kharcha) || 0), 0);
  const totalOtherExpenseSummary = filteredEntries.reduce((sum, e) => sum + (Number(e.otherExpenseAmount) || 0), 0);
  const totalAdvanceSummary = filteredEntries.reduce((sum, e) => sum + (Number(e.advance) || 0), 0);
  const totalNetBalanceSummary = filteredEntries.reduce((sum, e) => sum + (Number(e.baqaya) || 0), 0);

  const handlePrintTableLedger = () => {
    printTableDocument({
      title: "Daily Roznamcha Ledger",
      subtitle: "Vehicle & driver departures, materials, freight, trip expenses, diesel consumption, and net balance accounts",
      headers: [
        "Date",
        "Vehicle #",
        "Driver Name",
        "Material / Units",
        "Diesel (L)",
        "Freight (Rs.)",
        "Trip Exp (Rs.)",
        "Other Exp (Rs.)",
        "Advance (Rs.)",
        "Net Total (Rs.)",
      ],
      columnAlignments: [
        "center",
        "center",
        "left",
        "left",
        "right",
        "right",
        "right",
        "right",
        "right",
        "right",
      ],
      rows: filteredEntries.map((row) => [
        row.displayDate || row.date,
        row.gariNo,
        row.driverName,
        row.maal + (row.unit && row.unitQuantity ? ` (${row.unitQuantity} ${row.unit})` : ""),
        row.dieselLiter > 0 ? `${row.dieselLiter} L` : "—",
        `Rs. ${Number(row.kiraya || 0).toLocaleString()}`,
        `Rs. ${Number(row.kharcha || 0).toLocaleString()}`,
        `Rs. ${Number(row.otherExpenseAmount || 0).toLocaleString()}`,
        `Rs. ${Number(row.advance || 0).toLocaleString()}`,
        `Rs. ${Number(row.baqaya || 0).toLocaleString()}`,
      ]),
      footers: [
        `TOTAL (${totalTripsCount} TRIPS)`,
        "",
        "",
        "",
        `${totalDieselLiterSummary} L`,
        `Rs. ${totalFreightSummary.toLocaleString()}`,
        `Rs. ${totalTripExpensesSummary.toLocaleString()}`,
        `Rs. ${totalOtherExpenseSummary.toLocaleString()}`,
        `Rs. ${totalAdvanceSummary.toLocaleString()}`,
        `Rs. ${totalNetBalanceSummary.toLocaleString()}`,
      ],
      notes: "Software By Roonjha Developers : 03152914836 - Muslim Construction & Transport Management System",
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Title & Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-4 sm:p-5 rounded-2xl border border-slate-700/80 shadow-md no-print">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-400/30">
                <Calendar className="w-5 h-5" />
              </span>
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
                Daily Ledger — Roznamcha Entry
              </h2>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Vehicle & driver departures, materials, freight, trip expenses, diesel consumption, and net balance accounts
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handlePrintTableLedger}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-lg shadow-sm transition"
              title="Print Roznamcha Ledger Table"
            >
              <Printer className="w-3.5 h-3.5 text-slate-950" />
              <span>Print Ledger</span>
            </button>
            <button
              onClick={loadData}
              className="self-end sm:self-auto flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-600 transition"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
              <span>Refresh Data</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-700/60 text-xs top-cards-box">
          <div className="bg-slate-800/60 p-2 rounded-xl border border-slate-700/50">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Trips Recorded</span>
            <div className="text-sm font-bold text-slate-100">{filteredEntries.length} Trips</div>
          </div>
          <div className="bg-slate-800/60 p-2 rounded-xl border border-slate-700/50">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Freight</span>
            <div className="text-sm font-bold text-emerald-400">Rs. {totalFreightSummary.toLocaleString()}</div>
          </div>
          <div className="bg-slate-800/60 p-2 rounded-xl border border-slate-700/50">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Net Balance</span>
            <div className="text-sm font-bold text-amber-400">Rs. {totalNetBalanceSummary.toLocaleString()}</div>
          </div>
          <div className="bg-slate-800/60 p-2 rounded-xl border border-slate-700/50">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Thermal Printing</span>
            <div className="text-sm font-bold text-sky-400 flex items-center gap-1">
              <Printer className="w-3.5 h-3.5" /> 80mm Active
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 sm:p-4 rounded-xl flex items-start gap-2.5 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Notice</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 sm:p-4 rounded-xl flex items-start gap-2.5 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Success</p>
            <p>{success}</p>
          </div>
        </div>
      )}

      {/* Entry Form Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-6">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
            <PlusCircle className="w-4 h-4 text-amber-500" />
            <span>{editingId ? `Edit Entry #${editingId}` : "Record Daily Ledger Entry"}</span>
          </h3>
          {editingId && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-700">
              Editing Mode Active
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Date, Vehicle, Driver */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {/* 1. Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Entry Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-slate-50/50"
              />
            </div>

            {/* 2. Vehicle No */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Vehicle Number <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  required
                  placeholder="e.g. 786 or LES-992"
                  value={gariNo}
                  onChange={(e) => setGariNo(e.target.value)}
                  className="w-full text-sm font-semibold border border-slate-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none uppercase"
                />
                {gariyan.length > 0 && (
                  <select
                    value=""
                    onChange={(e) => handleVehicleSelect(e.target.value)}
                    className="border border-slate-300 rounded-xl px-2 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
                    title="Select registered vehicle"
                  >
                    <option value="">Choose</option>
                    {gariyan.map((g) => (
                      <option key={g.id} value={g.gariNo}>
                        {g.gariNo}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* 3. Driver Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Driver Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Driver Name"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Row 2: Material / Product Selection & Units */}
          <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-amber-600" />
                Material / Cargo & Units (Optional)
              </span>
              {products.length > 0 && (
                <span className="text-[11px] text-slate-500">
                  Select saved item from Products Master or type manually
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {/* Material Name with Product Master selector */}
              <div className="sm:col-span-2">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Material / Product Name
                  </label>
                  {products.length > 0 && (
                    <select
                      value={selectedProductId}
                      onChange={(e) => handleProductSelect(e.target.value)}
                      className="text-[11px] border border-amber-300 rounded-lg px-2 py-0.5 bg-amber-50/60 text-slate-800 focus:outline-none cursor-pointer"
                      title="Choose saved item from products list"
                    >
                      <option value="">Choose from Products Master...</option>
                      {products.map((p) => (
                        <option key={p.Id} value={String(p.Id)}>
                          {p.Name} {p.SalePrice ? `(Rs. ${p.SalePrice}${p.Unit ? `/${p.Unit}` : ""})` : ""}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="e.g. High Speed Diesel, Crush Stone, Sand, Cement"
                  value={maal}
                  onChange={(e) => {
                    setMaal(e.target.value);
                    setSelectedProductId("");
                  }}
                  className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                />
              </div>

              {/* Unit Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Unit (Optional)
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white cursor-pointer"
                >
                  {UNIT_OPTIONS.map((u) => (
                    <option key={u.value} value={u.value}>
                      {u.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity (if unit is selected) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quantity {unit ? `(${unit})` : ""}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g. 100"
                  value={unitQuantity}
                  onChange={(e) => {
                    const val = e.target.value === "" ? "" : Number(e.target.value);
                    setUnitQuantity(val);
                    // If unit is Liters and dieselLiter is empty or matched, sync dieselLiter
                    if (unit === "Liters" && (dieselLiter === "" || dieselLiter === unitQuantity)) {
                      setDieselLiter(val);
                    }
                  }}
                  className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                />
              </div>
            </div>

            {/* If Unit is selected, show Price per Unit / Liter */}
            {unit && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2 border-t border-slate-200/60 items-center">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {unit === "Liters" ? "Price per Liter (Rs.)" : `Price per ${unit} (Rs.)`}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder={unit === "Liters" ? "e.g. 285" : "e.g. 500"}
                    value={pricePerUnit}
                    onChange={(e) => setPricePerUnit(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full text-sm font-semibold border border-amber-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                  />
                </div>

                <div className="sm:col-span-2 flex items-center gap-2 pt-4 sm:pt-0">
                  <span className="text-xs text-slate-600">Calculated Material Subtotal:</span>
                  <span className="text-sm font-black text-amber-700 bg-amber-100/70 px-2.5 py-1 rounded-lg border border-amber-200">
                    Rs. {liveMaterialAmount.toLocaleString()}
                  </span>
                  <span className="text-[11px] text-slate-400 italic">
                    (Adds to Gross Total)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Row 3: Financial Details (Freight, Trip Expenses, Other Expenses, Advance) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {/* Diesel Liters (Fuel consumption) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>Diesel Fuel (Ltr)</span>
                <Fuel className="w-3.5 h-3.5 text-slate-400" />
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g. 100"
                value={dieselLiter}
                onChange={(e) => setDieselLiter(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            {/* Freight */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>Freight</span>
                <span className="text-emerald-600 font-bold">Rs.</span>
              </label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 35000"
                value={kiraya}
                onChange={(e) => setKiraya(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full text-sm border border-emerald-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold text-emerald-800 bg-emerald-50/20"
              />
            </div>

            {/* Trip Expenses */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>Trip Expenses</span>
                <span className="text-rose-600 font-bold">Rs.</span>
              </label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 5000"
                value={kharcha}
                onChange={(e) => setKharcha(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full text-sm border border-rose-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-rose-500 focus:outline-none font-bold text-rose-800 bg-rose-50/20"
              />
            </div>

            {/* Advance Paid */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>Advance Paid</span>
                <span className="text-amber-600 font-bold">Rs.</span>
              </label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 10000"
                value={advance}
                onChange={(e) => setAdvance(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full text-sm border border-amber-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none font-bold text-amber-800 bg-amber-50/20"
              />
            </div>
          </div>

          {/* Row 4: Other Expenses (Field Name & Price) */}
          <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/80">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 items-center">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Other Expense Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Toll Tax, Labour, Loading, Food"
                  value={otherExpenseName}
                  onChange={(e) => setOtherExpenseName(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Other Expense Amount</span>
                  <span className="text-slate-500 font-bold">Rs.</span>
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 2000"
                  value={otherExpenseAmount}
                  onChange={(e) => setOtherExpenseAmount(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                />
              </div>

              <div className="text-xs text-slate-500 pt-2 sm:pt-4">
                <span className="block font-medium">Accounting Calculation:</span>
                <span className="text-[11px] text-slate-600">
                  Expenses add in total, and only advance decreases the net balance.
                </span>
              </div>
            </div>
          </div>

          {/* Live Preview & Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 bg-slate-100/90 px-4 py-2.5 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-600 font-medium">
                Gross Total: <strong>Rs. {liveGrossTotal.toLocaleString()}</strong>
              </span>
              <span className="text-slate-400">|</span>
              <span className="text-slate-600 font-medium">
                Less Advance: <strong>- Rs. {liveAdvance.toLocaleString()}</strong>
              </span>
              <span className="text-slate-400">|</span>
              <span className="font-bold text-slate-800">Net Total / Balance:</span>
              <span className={`text-base font-black ${liveBaqaya >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                Rs. {liveBaqaya.toLocaleString()}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 sm:flex-none px-4 py-2.5 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100 transition"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 sm:flex-none px-6 py-2.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-black text-xs rounded-xl shadow-sm transition disabled:opacity-50"
              >
                {saving ? "Saving..." : editingId ? "Update Entry" : "Save Daily Entry"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row gap-2.5 justify-between">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-1">
          {/* Date Filter */}
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="text-xs border border-slate-300 rounded-xl px-2.5 py-2 focus:ring-2 focus:ring-amber-500"
            title="Filter by date"
          />

          {/* Vehicle Filter */}
          <input
            type="text"
            placeholder="Vehicle No..."
            value={filterGari}
            onChange={(e) => setFilterGari(e.target.value)}
            className="text-xs border border-slate-300 rounded-xl px-2.5 py-2 focus:ring-2 focus:ring-amber-500"
          />

          {/* Driver Filter */}
          <input
            type="text"
            placeholder="Driver Name..."
            value={filterDriver}
            onChange={(e) => setFilterDriver(e.target.value)}
            className="text-xs border border-slate-300 rounded-xl px-2.5 py-2 focus:ring-2 focus:ring-amber-500"
          />

          {/* Search Query */}
          <input
            type="text"
            placeholder="Search material / expense..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-xs border border-slate-300 rounded-xl px-2.5 py-2 focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {(filterDate || filterGari || filterDriver || searchQuery) && (
          <button
            onClick={() => {
              setFilterDate("");
              setFilterGari("");
              setFilterDriver("");
              setSearchQuery("");
            }}
            className="self-end text-xs text-rose-600 hover:text-rose-700 font-bold underline px-2 py-1"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Mobile Card Feed */}
      <div className="block lg:hidden space-y-3">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
            Loading Daily Ledger records...
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
            No Daily Ledger records found matching the criteria.
          </div>
        ) : (
          filteredEntries.map((row) => (
            <div
              key={row.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3"
            >
              <div className="flex justify-between items-start border-b border-slate-100 pb-2.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                      {row.gariNo}
                    </span>
                    <span className="font-bold text-xs text-slate-700">{row.driverName}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5 flex-wrap">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>{row.displayDate || row.date}</span>
                    {row.maal && <span>• {row.maal}</span>}
                    {row.unit && row.unitQuantity ? (
                      <span className="text-amber-700 font-semibold">
                        ({row.unitQuantity} {row.unit}{row.pricePerUnit ? ` @ Rs. ${row.pricePerUnit}` : ""})
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Net Total</span>
                  <span
                    className={`text-sm font-black ${
                      row.baqaya >= 0 ? "text-slate-900" : "text-rose-600"
                    }`}
                  >
                    Rs. {Number(row.baqaya || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs py-1">
                <div className="bg-emerald-50/60 p-2 rounded-xl border border-emerald-100">
                  <span className="text-[10px] text-emerald-800 font-semibold block">Freight</span>
                  <span className="font-bold text-emerald-700">Rs. {Number(row.kiraya || 0).toLocaleString()}</span>
                </div>
                <div className="bg-rose-50/60 p-2 rounded-xl border border-rose-100">
                  <span className="text-[10px] text-rose-800 font-semibold block">Expenses</span>
                  <span className="font-bold text-rose-700">
                    Rs. {(Number(row.kharcha || 0) + Number(row.otherExpenseAmount || 0)).toLocaleString()}
                  </span>
                </div>
                <div className="bg-amber-50/60 p-2 rounded-xl border border-amber-100">
                  <span className="text-[10px] text-amber-800 font-semibold block">Advance</span>
                  <span className="font-bold text-amber-700">Rs. {Number(row.advance || 0).toLocaleString()}</span>
                </div>
              </div>

              {/* Other Expense Details if present */}
              {row.otherExpenseAmount && row.otherExpenseAmount > 0 ? (
                <div className="text-[11px] text-slate-600 px-2.5 py-1 bg-slate-50 rounded-lg flex justify-between">
                  <span>Other: {row.otherExpenseName || "Expense"}</span>
                  <span className="font-bold">Rs. {Number(row.otherExpenseAmount).toLocaleString()}</span>
                </div>
              ) : null}

              {row.dieselLiter > 0 && (
                <div className="text-[11px] text-slate-600 flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-lg">
                  <Fuel className="w-3.5 h-3.5 text-amber-600" />
                  <span>Diesel Consumption: <strong>{row.dieselLiter} Liters</strong></span>
                </div>
              )}

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handlePrintReceipt(row)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-800 bg-amber-400 hover:bg-amber-500 rounded-lg shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Thermal Receipt</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(row)}
                    className="p-1.5 text-blue-600 bg-blue-50 rounded-lg border border-blue-200"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(row.id)}
                    className="p-1.5 text-rose-600 bg-rose-50 rounded-lg border border-rose-200"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white uppercase text-[11px] tracking-wider font-semibold">
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Vehicle Number</th>
                <th className="py-3 px-3">Driver Name</th>
                <th className="py-3 px-3">Material / Units</th>
                <th className="py-3 px-3 text-right">Diesel (Ltr)</th>
                <th className="py-3 px-3 text-right">Freight</th>
                <th className="py-3 px-3 text-right">Trip Expenses</th>
                <th className="py-3 px-3 text-right">Other Expense</th>
                <th className="py-3 px-3 text-right">Advance Paid</th>
                <th className="py-3 px-3 text-right">Net Total</th>
                <th className="py-3 px-3 text-center">Receipt & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400">
                    Loading records from database...
                  </td>
                </tr>
              ) : filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400">
                    No Daily Ledger records found matching the criteria.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((row) => (
                  <tr key={row.id} className="hover:bg-amber-50/40 transition">
                    <td className="py-2.5 px-3 font-medium text-slate-700">{row.displayDate || row.date}</td>
                    <td className="py-2.5 px-3">
                      <span className="inline-block bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded border border-slate-200">
                        {row.gariNo}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-800 font-medium">{row.driverName}</td>
                    <td className="py-2.5 px-3 text-slate-600">
                      <div>{row.maal || "—"}</div>
                      {row.unit && row.unitQuantity ? (
                        <div className="text-[10px] text-amber-700 font-medium">
                          {row.unitQuantity} {row.unit}
                          {row.pricePerUnit ? ` @ Rs. ${row.pricePerUnit}` : ""}
                        </div>
                      ) : null}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">{row.dieselLiter > 0 ? `${row.dieselLiter} L` : "—"}</td>
                    <td className="py-2.5 px-3 text-right font-semibold text-emerald-700">
                      Rs. {Number(row.kiraya || 0).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-rose-700">
                      Rs. {Number(row.kharcha || 0).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-700">
                      {row.otherExpenseAmount && row.otherExpenseAmount > 0 ? (
                        <div>
                          <span className="font-semibold text-rose-700">Rs. {Number(row.otherExpenseAmount).toLocaleString()}</span>
                          {row.otherExpenseName && (
                            <div className="text-[10px] text-slate-400">{row.otherExpenseName}</div>
                          )}
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-amber-700">
                      Rs. {Number(row.advance || 0).toLocaleString()}
                    </td>
                    <td className={`py-2.5 px-3 text-right font-bold ${row.baqaya >= 0 ? "text-slate-900" : "text-rose-600"}`}>
                      Rs. {Number(row.baqaya || 0).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex justify-center items-center gap-1.5">
                        <button
                          onClick={() => handlePrintReceipt(row)}
                          title="Print Thermal Receipt (80mm)"
                          className="p-1 hover:bg-amber-100 text-amber-700 bg-amber-50 rounded border border-amber-200"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleEdit(row)}
                          title="Edit"
                          className="p-1 hover:bg-slate-100 text-blue-600 rounded"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(row.id)}
                          title="Delete"
                          className="p-1 hover:bg-rose-50 text-rose-600 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-900">
              <tr>
                <td colSpan={4} className="py-2.5 px-3 font-black uppercase text-[11px]">
                  Grand Total ({totalTripsCount} Trips)
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-slate-800">
                  {totalDieselLiterSummary > 0 ? `${totalDieselLiterSummary} L` : "0 L"}
                </td>
                <td className="py-2.5 px-3 text-right font-black text-emerald-700">
                  Rs. {totalFreightSummary.toLocaleString()}
                </td>
                <td className="py-2.5 px-3 text-right font-bold text-rose-700">
                  Rs. {totalTripExpensesSummary.toLocaleString()}
                </td>
                <td className="py-2.5 px-3 text-right font-bold text-slate-700">
                  Rs. {totalOtherExpenseSummary.toLocaleString()}
                </td>
                <td className="py-2.5 px-3 text-right font-bold text-amber-700">
                  Rs. {totalAdvanceSummary.toLocaleString()}
                </td>
                <td className={`py-2.5 px-3 text-right font-black text-sm ${totalNetBalanceSummary >= 0 ? "text-slate-900" : "text-rose-700"}`}>
                  Rs. {totalNetBalanceSummary.toLocaleString()}
                </td>
                <td className="py-2.5 px-3 text-center text-[10px] text-slate-500 font-semibold">
                  Settled
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Thermal Receipt Print Modal (80mm Thermal Printer) */}
      {showReceiptModal && receiptItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 no-print">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Printer className="w-4 h-4 text-amber-600" />
                Thermal Receipt (80mm)
              </h3>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable Thermal Slip Area */}
            <div
              id="thermal-receipt-print-area"
              className="my-4 p-4 border border-dashed border-slate-300 rounded-lg bg-amber-50/20 font-mono text-xs text-slate-900 space-y-2 overflow-y-auto"
              style={{ width: "80mm", margin: "0 auto" }}
            >
              <div className="text-center space-y-0.5 border-b border-dashed border-slate-400 pb-2">
                <div className="text-base font-black tracking-wide">MUSLIM CONSTRUCTION</div>
                <div className="text-[10px] font-bold text-slate-700">DAILY TRIP RECEIPT & LEDGER</div>
                <div className="text-[10px] text-slate-600">Transport & Project Operations</div>
                <div className="text-[10px] text-slate-500">Receipt #{receiptItem.id} | {receiptItem.date}</div>
              </div>

              <div className="space-y-1 py-1 border-b border-dashed border-slate-400 text-[11px]">
                <div className="flex justify-between">
                  <span>Vehicle No:</span>
                  <span className="font-bold">{receiptItem.gariNo}</span>
                </div>
                <div className="flex justify-between">
                  <span>Driver:</span>
                  <span className="font-bold">{receiptItem.driverName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Material:</span>
                  <span className="font-semibold">{receiptItem.maal || "General Cargo"}</span>
                </div>
                {receiptItem.unit && (receiptItem.unitQuantity || 0) > 0 && (
                  <div className="flex justify-between">
                    <span>Quantity & Unit:</span>
                    <span className="font-bold">
                      {receiptItem.unitQuantity} {receiptItem.unit}
                      {(receiptItem.pricePerUnit || 0) > 0 ? ` @ Rs. ${receiptItem.pricePerUnit}` : ""}
                    </span>
                  </div>
                )}
                {receiptItem.dieselLiter > 0 && (
                  <div className="flex justify-between">
                    <span>Diesel Fuel:</span>
                    <span>{receiptItem.dieselLiter} Liters</span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5 py-1 border-b border-dashed border-slate-400 text-[11px]">
                <div className="flex justify-between">
                  <span>Freight:</span>
                  <span className="font-bold">Rs. {Number(receiptItem.kiraya || 0).toLocaleString()}</span>
                </div>
                {Number(receiptItem.kharcha || 0) > 0 && (
                  <div className="flex justify-between text-slate-700">
                    <span>Trip Expenses:</span>
                    <span>+ Rs. {Number(receiptItem.kharcha || 0).toLocaleString()}</span>
                  </div>
                )}
                {Number(receiptItem.otherExpenseAmount || 0) > 0 && (
                  <div className="flex justify-between text-slate-700">
                    <span>{receiptItem.otherExpenseName || "Other Expense"}:</span>
                    <span>+ Rs. {Number(receiptItem.otherExpenseAmount || 0).toLocaleString()}</span>
                  </div>
                )}
                {Number(receiptItem.materialAmount || 0) > 0 && (
                  <div className="flex justify-between text-slate-700">
                    <span>Material Charge:</span>
                    <span>+ Rs. {Number(receiptItem.materialAmount || 0).toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between font-bold border-t border-dotted border-slate-300 pt-1">
                  <span>Gross Total:</span>
                  <span>
                    Rs. {(
                      Number(receiptItem.kiraya || 0) +
                      Number(receiptItem.kharcha || 0) +
                      Number(receiptItem.otherExpenseAmount || 0) +
                      Number(receiptItem.materialAmount || 0)
                    ).toLocaleString()}
                  </span>
                </div>

                {Number(receiptItem.advance || 0) > 0 && (
                  <div className="flex justify-between text-amber-700">
                    <span>Advance Paid:</span>
                    <span>- Rs. {Number(receiptItem.advance || 0).toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="pt-1 text-xs font-black flex justify-between items-center border-t border-dashed border-slate-400">
                <span>Net Total / Balance:</span>
                <span className="text-sm">Rs. {Number(receiptItem.baqaya || 0).toLocaleString()}</span>
              </div>

              {/* Developer Attribution Required by User */}
              <div className="text-center pt-3 border-t border-dashed border-slate-400 space-y-0.5 text-[9px] text-slate-600">
                <p className="font-bold">Software By Roonjha Developers: 03152914836</p>
                <p className="text-[8px] text-slate-400">Thank you for your business!</p>
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-slate-200 no-print">
              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="flex-1 py-2 text-xs font-semibold text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-100"
              >
                Close
              </button>
              <button
                type="button"
                onClick={executePrint}
                className="flex-1 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center justify-center gap-1.5 shadow"
              >
                <Printer className="w-4 h-4" />
                Print Thermal Slip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
