import { useState, useRef, useEffect } from "react";
import { Download, ChevronDown } from "lucide-react";
import { exportToPdf, exportToExcel } from "../utils/exportTable.js";

// Single "Export" button with a PDF / Excel dropdown.
// Pass a getData() that returns { title, headers, rows } at click time
// (so it always exports the current filtered data).
export default function ExportMenu({ getData, disabled }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function run(fn) {
    setOpen(false);
    try {
      fn(getData());
    } catch (err) {
      alert("Could not export: " + (err?.message || err));
    }
  }

  return (
    <div className="export-menu" ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        className="secondary-btn compact-btn export-btn"
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
      >
        <Download size={15} /> Export <ChevronDown size={14} />
      </button>
      {open && (
        <div
          className="export-menu-list"
          style={{
            position: "absolute", right: 0, top: "calc(100% + 6px)", zIndex: 30,
            background: "#fff", border: "1px solid var(--line)", borderRadius: 10,
            boxShadow: "var(--shadow-strong)", minWidth: 150, overflow: "hidden",
          }}
        >
          <button className="export-menu-item" type="button" onClick={() => run(exportToPdf)}
            style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 14px", border: "none", background: "none", cursor: "pointer", font: "inherit" }}>
            Export as PDF
          </button>
          <button className="export-menu-item" type="button" onClick={() => run(exportToExcel)}
            style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 14px", border: "none", background: "none", cursor: "pointer", font: "inherit", borderTop: "1px solid var(--line)" }}>
            Export as Excel
          </button>
        </div>
      )}
    </div>
  );
}