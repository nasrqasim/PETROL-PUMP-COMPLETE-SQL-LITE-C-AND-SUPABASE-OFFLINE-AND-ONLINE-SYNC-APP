"use client";

// High-Definition Canvas-based WhatsApp Image Generator for Muslim Construction ERP
// Pixel-perfect branding, 2x Retina rendering, mobile-friendly share & download

export interface ShareOptions {
  blob: Blob;
  filename: string;
  shareTitle: string;
  shareText: string;
  whatsappPhone?: string;
}

export async function shareOrDownloadWhatsApp(options: ShareOptions): Promise<void> {
  const { blob, filename, shareTitle, shareText, whatsappPhone } = options;
  const file = new File([blob], filename, { type: "image/png" });

  // 1. Try Native Mobile Web Share API with image file
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title: shareTitle,
        text: shareText,
        files: [file],
      });
      return;
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.warn("Native share failed, falling back to download & direct link:", err);
      } else {
        return; // User cancelled the share dialog
      }
    }
  }

  // 2. Fallback: Download the generated PNG receipt/statement image
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  // 3. Open WhatsApp Web or Mobile WhatsApp
  setTimeout(() => {
    URL.revokeObjectURL(url);
    const cleanPhone = (whatsappPhone || "").replace(/[^0-9]/g, "");
    const encodedText = encodeURIComponent(`${shareText}\n\n[Image receipt downloaded to your device - attach to send]`);
    const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodedText}` : `https://wa.me/?text=${encodedText}`;
    window.open(waUrl, "_blank");
  }, 400);
}

// ==========================================
// 1. DAILY ROZNAMCHA TRIP RECEIPT IMAGE
// ==========================================

export function createDailyEntryImageBlob(item: any): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const width = 600;
    const height = 820;
    const scale = 2; // Retina 2x scale
    canvas.width = width * scale;
    canvas.height = height * scale;

    const ctx = canvas.getContext("2d");
    if (!ctx) return reject(new Error("Canvas context not available"));

    ctx.scale(scale, scale);

    // Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    // Top Brand Header Banner (Navy)
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, width, 120);

    // Gold/Orange Accent Line
    ctx.fillStyle = "#f59e0b";
    ctx.fillRect(0, 116, width, 4);

    // Brand Title
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 24px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("MUSLIM CONSTRUCTION", width / 2, 45);

    ctx.fillStyle = "#f59e0b";
    ctx.font = "bold 13px Arial, sans-serif";
    ctx.fillText("CONSTRUCTION & TRANSPORT MANAGEMENT SYSTEM", width / 2, 70);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "11px Arial, sans-serif";
    ctx.fillText("Site Area Hub, Lasbela & Transport Operations", width / 2, 92);

    // Receipt Badge
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(20, 135, width - 40, 48);
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    ctx.strokeRect(20, 135, width - 40, 48);

    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 15px Arial, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`TRIP DISPATCH RECEIPT #${item.id || ""}`, 35, 165);

    ctx.fillStyle = "#64748b";
    ctx.font = "12px Arial, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(`Date: ${item.displayDate || item.date || ""}`, width - 35, 165);

    // Trip Info Table
    let y = 210;
    const drawRow = (label: string, value: string, isHighlight = false) => {
      ctx.fillStyle = isHighlight ? "#f1f5f9" : "#ffffff";
      ctx.fillRect(20, y - 18, width - 40, 28);
      ctx.strokeStyle = "#f1f5f9";
      ctx.strokeRect(20, y - 18, width - 40, 28);

      ctx.fillStyle = "#475569";
      ctx.font = "12px Arial, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(label, 35, y);

      ctx.fillStyle = isHighlight ? "#0f172a" : "#1e293b";
      ctx.font = isHighlight ? "bold 13px Arial, sans-serif" : "12px Arial, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(value, width - 35, y);

      y += 30;
    };

    drawRow("Vehicle Number", item.gariNo || "—", true);
    drawRow("Driver Name", item.driverName || "—");
    if (item.customerName) drawRow("Customer", item.customerName);
    if (item.fromLocation || item.toLocation) {
      drawRow("Route", `${item.fromLocation || "Origin"} → ${item.toLocation || "Destination"}`);
    }
    drawRow("Material / Cargo", item.maal || "General Cargo");
    if (item.unit && item.unitQuantity) {
      drawRow(
        "Quantity & Rate",
        `${item.unitQuantity} ${item.unit} ${item.pricePerUnit ? `@ Rs. ${item.pricePerUnit}` : ""}`
      );
    }
    if (item.dieselLiter > 0) drawRow("Diesel Fuel", `${item.dieselLiter} Liters`);

    y += 10;
    // Financial Breakdown Box
    ctx.fillStyle = "#fefce8";
    ctx.fillRect(20, y, width - 40, 180);
    ctx.strokeStyle = "#fef08a";
    ctx.strokeRect(20, y, width - 40, 180);

    y += 28;
    ctx.fillStyle = "#854d0e";
    ctx.font = "bold 13px Arial, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("FINANCIAL BREAKDOWN", 35, y);
    y += 26;

    const drawFinRow = (label: string, val: number, sign = "") => {
      ctx.fillStyle = "#475569";
      ctx.font = "12px Arial, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(label, 35, y);

      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 13px Arial, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(`${sign}Rs. ${val.toLocaleString()}`, width - 35, y);
      y += 24;
    };

    drawFinRow("Trip Freight", Number(item.kiraya) || 0);
    if (Number(item.kharcha) > 0) drawFinRow("Trip Expenses", Number(item.kharcha), "+ ");
    if (Number(item.otherExpenseAmount) > 0) {
      drawFinRow(item.otherExpenseName || "Other Expense", Number(item.otherExpenseAmount), "+ ");
    }
    if (Number(item.materialAmount) > 0) drawFinRow("Material Charge", Number(item.materialAmount), "+ ");
    if (Number(item.advance) > 0) drawFinRow("Advance Paid", Number(item.advance), "- ");

    // Net Total Bar
    y = 660;
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(20, y, width - 40, 48);

    ctx.fillStyle = "#f59e0b";
    ctx.font = "bold 14px Arial, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("NET BALANCE / DUE:", 35, y + 30);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 20px Arial, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(`Rs. ${Number(item.baqaya || 0).toLocaleString()}`, width - 35, y + 32);

    // Footer Attribution
    y = 740;
    ctx.strokeStyle = "#e2e8f0";
    ctx.beginPath();
    ctx.moveTo(20, y);
    ctx.lineTo(width - 20, y);
    ctx.stroke();

    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 12px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Software By Roonjha Developers : 03152914836", width / 2, y + 26);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "10px Arial, sans-serif";
    ctx.fillText("Muslim Construction ERP • Verified Trip Dispatch", width / 2, y + 44);

    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Failed to create blob"));
    }, "image/png");
  });
}

// ==========================================
// 2. UNIVERSAL LEDGER STATEMENT IMAGE
// ==========================================

export function createLedgerStatementImageBlob(params: {
  title: string;
  subtitle: string;
  partyName: string;
  partyPhone?: string;
  dateRange: string;
  openingBalance: number;
  totalIn: number;
  totalOut: number;
  closingBalance: number;
  transactions: Array<{
    date: string;
    voucher: string;
    desc: string;
    inAmount?: number;
    outAmount?: number;
    balance: number;
  }>;
}): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const width = 720;
    const maxRows = Math.min(params.transactions.length, 15);
    const height = 500 + maxRows * 30;
    const scale = 2;

    canvas.width = width * scale;
    canvas.height = height * scale;

    const ctx = canvas.getContext("2d");
    if (!ctx) return reject(new Error("Canvas context not available"));

    ctx.scale(scale, scale);

    // Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    // Header (Navy)
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, width, 110);

    ctx.fillStyle = "#f59e0b";
    ctx.fillRect(0, 106, width, 4);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 22px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("MUSLIM CONSTRUCTION", width / 2, 40);

    ctx.fillStyle = "#f59e0b";
    ctx.font = "bold 13px Arial, sans-serif";
    ctx.fillText(params.title.toUpperCase(), width / 2, 65);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "11px Arial, sans-serif";
    ctx.fillText(`${params.subtitle} • Period: ${params.dateRange}`, width / 2, 88);

    // Account Summary Card
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(20, 125, width - 40, 75);
    ctx.strokeStyle = "#e2e8f0";
    ctx.strokeRect(20, 125, width - 40, 75);

    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 16px Arial, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(params.partyName, 35, 155);

    if (params.partyPhone) {
      ctx.fillStyle = "#64748b";
      ctx.font = "12px Arial, sans-serif";
      ctx.fillText(`Phone: ${params.partyPhone}`, 35, 178);
    }

    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 12px Arial, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(`Opening: Rs. ${params.openingBalance.toLocaleString()}`, width - 35, 150);
    ctx.fillText(
      `In: Rs. ${params.totalIn.toLocaleString()}  |  Out: Rs. ${params.totalOut.toLocaleString()}`,
      width - 35,
      170
    );

    ctx.fillStyle = "#059669";
    ctx.font = "bold 14px Arial, sans-serif";
    ctx.fillText(`Closing Balance: Rs. ${params.closingBalance.toLocaleString()}`, width - 35, 190);

    // Table Header
    let y = 225;
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(20, y, width - 40, 30);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 11px Arial, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("DATE", 35, y + 19);
    ctx.fillText("VOUCHER", 115, y + 19);
    ctx.fillText("DESCRIPTION", 220, y + 19);
    ctx.textAlign = "right";
    ctx.fillText("IN / DR", 480, y + 19);
    ctx.fillText("OUT / CR", 580, y + 19);
    ctx.fillText("BALANCE", width - 35, y + 19);

    y += 30;

    // Table Rows
    const rows = params.transactions.slice(0, maxRows);
    rows.forEach((row, i) => {
      ctx.fillStyle = i % 2 === 0 ? "#ffffff" : "#f8fafc";
      ctx.fillRect(20, y, width - 40, 28);
      ctx.strokeStyle = "#f1f5f9";
      ctx.strokeRect(20, y, width - 40, 28);

      ctx.fillStyle = "#334155";
      ctx.font = "11px Arial, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(row.date, 35, y + 18);
      ctx.fillText(row.voucher.substring(0, 12), 115, y + 18);

      const descTrunc = row.desc.length > 25 ? row.desc.substring(0, 23) + "..." : row.desc;
      ctx.fillText(descTrunc, 220, y + 18);

      ctx.textAlign = "right";
      ctx.fillStyle = "#047857";
      ctx.fillText(row.inAmount ? `Rs. ${row.inAmount.toLocaleString()}` : "—", 480, y + 18);

      ctx.fillStyle = "#b91c1c";
      ctx.fillText(row.outAmount ? `Rs. ${row.outAmount.toLocaleString()}` : "—", 580, y + 18);

      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 11px Arial, sans-serif";
      ctx.fillText(`Rs. ${row.balance.toLocaleString()}`, width - 35, y + 18);

      y += 28;
    });

    if (params.transactions.length > maxRows) {
      y += 18;
      ctx.fillStyle = "#64748b";
      ctx.font = "italic 11px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(
        `Showing first ${maxRows} of ${params.transactions.length} entries. Download full statement in ERP.`,
        width / 2,
        y
      );
    }

    // Bottom Attribution
    y = height - 55;
    ctx.strokeStyle = "#e2e8f0";
    ctx.beginPath();
    ctx.moveTo(20, y);
    ctx.lineTo(width - 20, y);
    ctx.stroke();

    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 12px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Software By Roonjha Developers : 03152914836", width / 2, y + 26);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "10px Arial, sans-serif";
    ctx.fillText("Muslim Construction ERP • Verified Financial Statement", width / 2, y + 42);

    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Failed to create blob"));
    }, "image/png");
  });
}
