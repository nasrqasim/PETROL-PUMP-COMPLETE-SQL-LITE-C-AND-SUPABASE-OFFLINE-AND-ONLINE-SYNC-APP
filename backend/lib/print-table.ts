/**
 * Universal Clean Table Printer for Muslim Construction ERP
 * Opens a clean, dedicated print preview containing ONLY the table,
 * grand total row, professional company header, and official attribution footer.
 * Eliminates top cards, search inputs, action buttons, and avoids blank pages.
 */

export interface PrintTableOptions {
  title: string;
  subtitle?: string;
  headers: string[];
  rows: (string | number)[][];
  footers?: (string | number)[]; // Grand totals row
  columnAlignments?: ("left" | "center" | "right")[];
  notes?: string;
}

export function printTableDocument(options: PrintTableOptions) {
  if (typeof window === "undefined") return;

  const {
    title,
    subtitle = "Official Record & Financial Statement",
    headers,
    rows,
    footers,
    columnAlignments = [],
    notes,
  } = options;

  const printDate = new Date().toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const printTime = new Date().toLocaleTimeString("en-PK", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const getAlign = (colIndex: number) => {
    return columnAlignments[colIndex] || "left";
  };

  const tableHeadersHtml = headers
    .map(
      (h, idx) =>
        `<th style="padding: 8px 10px; border: 1px solid #94a3b8; background-color: #f1f5f9; text-align: ${getAlign(
          idx
        )}; font-size: 11px; text-transform: uppercase; font-weight: 800; color: #0f172a;">${h}</th>`
    )
    .join("");

  const tableRowsHtml = rows
    .map((row, rIdx) => {
      const bg = rIdx % 2 === 0 ? "#ffffff" : "#f8fafc";
      const cells = row
        .map(
          (c, cIdx) =>
            `<td style="padding: 7px 10px; border: 1px solid #cbd5e1; background-color: ${bg}; text-align: ${getAlign(
              cIdx
            )}; font-size: 11px; color: #1e293b;">${c ?? "—"}</td>`
        )
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  const tableFootersHtml = footers
    ? `<tfoot><tr style="background-color: #e2e8f0; font-weight: 800; border-top: 2px solid #0f172a;">${footers
        .map(
          (f, fIdx) =>
            `<td style="padding: 9px 10px; border: 1px solid #94a3b8; text-align: ${getAlign(
              fIdx
            )}; font-size: 12px; font-weight: 800; color: #0f172a;">${f ?? ""}</td>`
        )
        .join("")}</tr></tfoot>`
    : "";

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title} - Muslim Construction</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 10mm 15mm 10mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
    }
    body {
      background: #ffffff;
      color: #0f172a;
      padding: 12px 16px;
    }
    .header-box {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 10px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .company-name {
      font-size: 18px;
      font-weight: 900;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .company-sub {
      font-size: 11px;
      font-weight: 600;
      color: #d97706;
      margin-top: 2px;
    }
    .report-title {
      font-size: 14px;
      font-weight: 800;
      color: #1e293b;
      margin-top: 6px;
    }
    .meta-box {
      text-align: right;
      font-size: 10px;
      color: #475569;
      line-height: 1.4;
    }
    .table-container {
      width: 100%;
      margin-top: 8px;
      margin-bottom: 16px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    .signature-row {
      margin-top: 24px;
      display: flex;
      justify-content: space-between;
      padding-top: 20px;
      font-size: 11px;
      font-weight: 700;
      color: #334155;
    }
    .sig-line {
      display: inline-block;
      width: 180px;
      border-bottom: 1px dashed #64748b;
      margin-left: 8px;
    }
    .footer-bar {
      margin-top: 20px;
      padding-top: 8px;
      border-top: 1px solid #cbd5e1;
      text-align: center;
      font-size: 10px;
      font-weight: 700;
      color: #475569;
    }
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="header-box">
    <div>
      <div class="company-name">Muslim Construction</div>
      <div class="company-sub">Construction & Transport Management System</div>
      <div class="report-title">${title}</div>
      <div style="font-size: 10px; color: #64748b; margin-top: 2px;">${subtitle}</div>
    </div>
    <div class="meta-box">
      <div><strong>Printed:</strong> ${printDate} ${printTime}</div>
      <div><strong>Dispatch / Support:</strong> 03152914836</div>
      <div>Hub & Lasbela Operations</div>
    </div>
  </div>

  <div class="table-container">
    <table>
      <thead>
        <tr>${tableHeadersHtml}</tr>
      </thead>
      <tbody>
        ${tableRowsHtml}
      </tbody>
      ${tableFootersHtml}
    </table>
  </div>

  ${notes ? `<div style="font-size: 10px; color: #475569; margin-bottom: 12px; font-style: italic;">* ${notes}</div>` : ""}

  <div class="signature-row">
    <div>Prepared By: <span class="sig-line"></span></div>
    <div>Checked By: <span class="sig-line"></span></div>
    <div>Authorized Signature: <span class="sig-line"></span></div>
  </div>

  <div class="footer-bar">
    Software By Roonjha Developers : 03152914836
  </div>

  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>
  `;

  const printWindow = window.open("", "_blank", "width=900,height=750");
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  } else {
    // If popups are blocked, create a hidden iframe
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 2000);
      }, 300);
    }
  }
}
