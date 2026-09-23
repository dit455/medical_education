// Shared table export helpers — bundled (no CDN), so exports work offline.
// Usage:
//   import { exportToPdf, exportToExcel } from "../utils/exportTable.js";
//   exportToPdf({ title, headers, rows, filename });
//   exportToExcel({ title, headers, rows, filename });
// headers: string[]   rows: (string|number)[][]

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

function safeName(s, ext) {
  const base = (s || "export").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return `${base || "export"}.${ext}`;
}

export function exportToPdf({ title = "Export", headers = [], rows = [], filename }) {
  const doc = new jsPDF();
  doc.setFontSize(14);
  const pageWidth = doc.internal.pageSize.getWidth();
  const titleLines = doc.splitTextToSize(title, pageWidth - 28);
  doc.text(titleLines, 14, 16);
  const startY = 16 + titleLines.length * 7 + 2;
  autoTable(doc, {
    startY,
    head: [headers],
    body: rows.map((r) => r.map((c) => (c == null ? "" : String(c)))),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [15, 118, 110] },
  });
  doc.save(filename || safeName(title, "pdf"));
}

export function exportToExcel({ title = "Export", headers = [], rows = [], filename }) {
  const data = [headers, ...rows.map((r) => r.map((c) => (c == null ? "" : c)))];
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(wb, filename || safeName(title, "xlsx"));
}