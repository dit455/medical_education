import { useState, useMemo } from "react";
import { FileText, Trash2, Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import StatusBadge from "./StatusBadge.jsx";
import IconButton from "./IconButton.jsx";
import { formatDate } from "../utils.js";
import ExportMenu from "./ExportMenu.jsx";

const STATUS_FILTERS = ["Pending", "Approved", "Rejected", "Verified", "Submitted"];

// Creator's own internal-marks submissions.
// Columns: Sl.No, Reg No, Course, Subject, Scored Marks, Total Marks, Pass Marks,
//          Present/Absent, Status, Uploaded On, Actions
export default function MyRequestsTable({
  changes,
  students = [],
  onView,
  onEdit,
  onDelete,
  courseNameFor = () => "-",
  subjectNameFor = () => "-",
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const studentById = (id) => students.find((s) => String(s.id) === String(id));
  const isAbsent = (c) => !!c.payload?.isAbsent || c.payload?.result === "Absent";
  const attendanceOf = (c) => (isAbsent(c) ? "Absent" : "Present");
  const show = (v) => (v === null || v === undefined || v === "" ? "-" : v);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return changes.filter((c) => {
      const st = studentById(c.payload.studentId);
      const matchSearch =
        !q ||
        [st?.registerNo, st?.name, c.payload.scoredMarks, attendanceOf(c), c.status]
          .filter((v) => v !== undefined && v !== null)
          .join(" ")
          .toLowerCase()
          .includes(q);
      const matchStatus = statusFilter === "All" || c.status === statusFilter;
      return matchSearch && matchStatus;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [changes, students, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(rows.length / rowsPerPage));
  const currentPage = Math.min(page, totalPages);
  const pageRows = rows.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const rangeStart = rows.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const rangeEnd = Math.min(currentPage * rowsPerPage, rows.length);

  const exportRow = (c, i) => {
    const st = studentById(c.payload.studentId);
    return [
      i + 1,
      st?.registerNo || "-",
      st?.name || "-",
      courseNameFor(c.payload.courseId),
      subjectNameFor(c.payload.subjectId),
      show(c.payload.scoredMarks),
      show(c.payload.totalMarks),
      show(c.payload.passMarks),
      attendanceOf(c),
      c.status ?? "",
      formatDate(c.requestedDate?.slice(0, 10)) ?? "",
    ];
  };

  return (
    <section className="data-table-card" style={{ width: "100%" }}>
      <div className="data-table-heading">
        <div><h3>My Requests</h3></div>
      </div>

      <div className="table-toolbar">
        <label className="search-box small">
          <Search size={24} />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search" />
        </label>
        <div className="table-toolbar-controls">
          <label className="select-box small">
            <Filter size={24} />
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
              title: "My Requests - Internal Marks",
              headers: ["Sl.No", "Reg No", "Student Name", "Course", "Subject", "Scored Marks", "Total Marks", "Pass Marks", "Present/Absent", "Status", "Uploaded On"],
              rows: rows.map(exportRow),
            })}
          />
        </div>
      </div>

      <div className="table-wrap data-table-scroll">
        <table>
          <thead>
            <tr>
              <th>Sl.No</th><th>Reg No</th><th>Student Name</th><th>Course</th><th>Subject</th>
              <th>Scored Marks</th><th>Total Marks</th><th>Pass Marks</th>
              <th>Present/Absent</th><th>Status</th><th>Uploaded On</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={12} className="empty-state">
                  <div className="table-empty"><span>Nothing submitted yet</span></div>
                </td>
              </tr>
            ) : (
              pageRows.map((change, i) => {
                const student = studentById(change.payload.studentId);
                const isFinal = change.status === "Approved";
                const absent = isAbsent(change);
                return (
                  <tr key={change.id}>
                    <td data-label="Sl.No">{(currentPage - 1) * rowsPerPage + i + 1}</td>
                    <td data-label="Reg No">{student?.registerNo || "-"}</td>
                    <td data-label="Student Name">{student?.name || `Student #${change.payload.studentId}`}</td>
                    <td data-label="Course">{courseNameFor(change.payload.courseId)}</td>
                    <td data-label="Subject">{subjectNameFor(change.payload.subjectId)}</td>
                    <td data-label="Scored Marks">{show(change.payload.scoredMarks)}</td>
                    <td data-label="Total Marks">{show(change.payload.totalMarks)}</td>
                    <td data-label="Pass Marks">{show(change.payload.passMarks)}</td>
                    <td data-label="Present/Absent">
                      <span style={{ fontWeight: 700, color: absent ? "#b00020" : "#1e7e34" }}>
                        {absent ? "Absent" : "Present"}
                      </span>
                    </td>
                    <td data-label="Status"><StatusBadge status={change.status} /></td>
                    <td data-label="Uploaded On">{formatDate(change.requestedDate?.slice(0, 10))}</td>
                    <td data-label="Actions">
                      <div className="action-group">
                        <IconButton
                          label={isFinal ? "View" : "View / Edit"}
                          icon={FileText}
                          title={isFinal ? "View (approved — locked)" : "View and correct"}
                          onClick={() => (isFinal ? onView?.(change) : onEdit?.(change))}
                        />
                        {!isFinal && change.status !== "Rejected" && (
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

      <div className="pagination">
        <span>{rangeStart}-{rangeEnd} of {rows.length}</span>
        <div>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} aria-label="Previous page">
            <ChevronLeft size={24} />
          </button>
          <strong>{currentPage} / {totalPages}</strong>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} aria-label="Next page">
            <ChevronRight size={24} />
          </button>
        </div>
      </div>
    </section>
  );
}