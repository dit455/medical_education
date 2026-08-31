import { useState, useMemo } from "react";
import { FileText, Trash2, Search, Download, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import StatusBadge from "./StatusBadge.jsx";
import IconButton from "./IconButton.jsx";
import { passOrFail } from "../utils.js";
import ExportMenu from "./ExportMenu.jsx";

const STATUS_FILTERS = ["Pending", "Approved", "Rejected", "Verified", "Submitted"];

// Creator's own internal-marks submissions, with search, status filter,
// rows selector, PDF export and pagination. View/Edit/Delete unchanged;
// Approved rows stay locked (view only).
export default function MyRequestsTable({ changes, students = [], onView, onEdit, onDelete, footer }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const studentById = (id) => students.find((s) => String(s.id) === String(id));

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return changes.filter((c) => {
      const st = studentById(c.payload.studentId);
      const matchSearch = !q ||
        [st?.registerNo, st?.name, c.payload.scoredMarks, c.status]
          .filter((v) => v !== undefined && v !== null)
          .join(" ").toLowerCase().includes(q);
      const matchStatus = statusFilter === "All" || c.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [changes, students, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(rows.length / rowsPerPage));
  const currentPage = Math.min(page, totalPages);
  const pageRows = rows.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const rangeStart = rows.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const rangeEnd = Math.min(currentPage * rowsPerPage, rows.length);

  async function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) return resolve();
      const el = document.createElement("script");
      el.src = src; el.onload = resolve; el.onerror = reject;
      document.body.appendChild(el);
    });
  }

  async function handleExportPdf() {
    try {
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js");
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      doc.setFontSize(14);
      doc.text("My Requests — Internal Marks", 14, 16);
      doc.autoTable({
        startY: 22,
        head: [["Reg No", "Student", "Scored", "Total", "Result", "Status", "Uploaded"]],
        body: rows.map((c) => {
          const st = studentById(c.payload.studentId);
          const result = c.payload.result || passOrFail(c.payload.scoredMarks, c.payload.passMarks) || "-";
          return [
            st?.registerNo || "-",
            st?.name || `Student #${c.payload.studentId}`,
            c.payload.scoredMarks ?? "",
            c.payload.totalMarks ?? "",
            result,
            c.status ?? "",
            c.requestedDate?.slice(0, 10) ?? "",
          ];
        }),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [15, 118, 110] },
      });
      doc.save("my-requests.pdf");
    } catch (err) {
      alert("Could not generate PDF: " + err.message);
    }
  }

  return (
    <section className="data-table-card" style={{ width: "100%" }}>
      <div className="data-table-heading">
        <div><h3>My Requests</h3></div>
      </div>

      <div className="table-toolbar">
        <label className="search-box small">
          <Search size={15} />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search" />
        </label>
        <div className="table-toolbar-controls">
          <label className="select-box small">
            <Filter size={15} />
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
              <option>All</option>
              {STATUS_FILTERS.map((o) => <option key={o}>{o}</option>)}
            </select>
          </label>
          <label className="select-box small rows-select">
            Rows
            <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1); }}>
              {[5, 10, 20].map((o) => <option key={o}>{o}</option>)}
            </select>
          </label>
            <ExportMenu
            disabled={rows.length === 0}
            getData={() => ({
              title: "My Requests — Internal Marks",
              headers: ["Reg No", "Student", "Scored", "Total", "Result", "Status", "Uploaded"],
              rows: rows.map((c) => {
                const st = studentById(c.payload.studentId);
                const result = c.payload.result || passOrFail(c.payload.scoredMarks, c.payload.passMarks) || "-";
                return [st?.registerNo || "-", st?.name || `Student #${c.payload.studentId}`, c.payload.scoredMarks, c.payload.totalMarks, result, c.status, c.requestedDate?.slice(0, 10)];
              }),
            })}
          />
        </div>
      </div>

      <div className="table-wrap data-table-scroll">
        <table>
          <thead>
            <tr>
              <th>Reg No</th><th>Student Name</th><th>Scored Marks</th>
              <th>Total Marks</th><th>Result</th><th>Status</th>
              <th>Uploaded on</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={8} className="empty-state">
                  <div className="table-empty"><span>Nothing submitted yet</span></div>
                </td>
              </tr>
            ) : (
              pageRows.map((change) => {
                const student = studentById(change.payload.studentId);
                const isFinal = change.status === "Approved";
                const result = change.payload.result || passOrFail(change.payload.scoredMarks, change.payload.passMarks);
                return (
                  <tr key={change.id}>
                    <td data-label="Reg No">{student?.registerNo || "-"}</td>
                    <td data-label="Student Name">{student?.name || `Student #${change.payload.studentId}`}</td>
                    <td data-label="Scored Marks">{change.payload.scoredMarks}</td>
                    <td data-label="Total Marks">{change.payload.totalMarks}</td>
                    <td data-label="Result">
                      {result ? (
                        <span style={{ fontWeight: 700, color: result === "Pass" ? "#1e7e34" : "#b00020" }}>{result}</span>
                      ) : "-"}
                    </td>
                    <td data-label="Status"><StatusBadge status={change.status} /></td>
                    <td data-label="Uploaded on">{change.requestedDate?.slice(0, 10)}</td>
                    <td data-label="Actions">
                        <div className="action-group">
                        <IconButton
                          label={isFinal ? "View" : "View / Edit"}
                          icon={FileText}
                          title={isFinal ? "View (approved — locked)" : "View and correct"}
                          onClick={() => (isFinal ? onView?.(change) : onEdit?.(change))}
                        />
                        {!isFinal && (
                          <IconButton label="Delete" icon={Trash2} tone="danger" title="Withdraw this request" onClick={() => onDelete?.(change)} />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {footer}

      <div className="pagination">
        <span>{rangeStart}-{rangeEnd} of {rows.length}</span>
        <div>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} aria-label="Previous page">
            <ChevronLeft size={17} />
          </button>
          <strong>{currentPage} / {totalPages}</strong>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} aria-label="Next page">
            <ChevronRight size={17} />
          </button>
        </div>
      </div>
    </section>
  );
}