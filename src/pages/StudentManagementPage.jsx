import { useState, useEffect, useMemo } from "react";
import { FileText, Search, Download, ChevronLeft, ChevronRight, Filter, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import * as api from "../api.js";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import StudentEditModal from "../components/StudentEditModal.jsx";
import ExportMenu from "../components/ExportMenu.jsx";

const STATUS_FILTERS = ["Active", "Inactive", "Draft", "Submitted", "Verified", "Approved"];

// Lists every student registered at this institution, with search, status
// filter, rows selector, PDF export, pagination, and a merged view+edit modal.
export default function StudentManagementPage({ institutionId, username }) {
  const [regions, setRegions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [years, setYears] = useState([]);
  const [students, setStudents] = useState([]);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [institutionName, setInstitutionName] = useState("");
  const [subjectsByCourse, setSubjectsByCourse] = useState({});

  function refreshStudents() {
    api.getInstitutionStudents(institutionId).then(setStudents).catch(() => setStudents([]));
  }

    useEffect(() => {
    api.getRegions().then(setRegions).catch(() => setRegions([]));
    api.getCourses(institutionId)
      .then((list) => {
        setCourses(list);
        list.forEach((c) => {
          api.getSubjects(c.id)
            .then((subs) =>
              setSubjectsByCourse((prev) => ({
                ...prev,
                [String(c.id)]: subs.map((s) => s.subject).filter(Boolean),
              }))
            )
            .catch(() => {});
        });
      })
      .catch(() => setCourses([]));
    api.getYears().then(setYears).catch(() => setYears([]));
    api.getInstitution(institutionId)
      .then((inst) => setInstitutionName(inst?.name || ""))
      .catch(() => setInstitutionName(""));
    refreshStudents();
  }, [institutionId]);

  const nameFor = (list, id) => list.find((x) => String(x.id) === String(id))?.name || "-";
  const subjectsFor = (courseId) => {
    const subs = subjectsByCourse[String(courseId)];
    return subs && subs.length ? subs.join(", ") : "-";
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter((s) => {
      const matchSearch = !q ||
        [s.registerNo, s.name, s.fatherName, s.mobile, s.status]
          .filter(Boolean).join(" ").toLowerCase().includes(q);
      const matchStatus = statusFilter === "All" || s.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [students, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const rangeEnd = Math.min(currentPage * rowsPerPage, filtered.length);

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
      doc.text("Registered Students", 14, 16);
      doc.autoTable({
        startY: 22,
        head: [["S.No", "Reg No", "Student", "Course", "Status"]],
        body: filtered.map((s, i) => [
          i + 1, s.registerNo ?? "", s.name ?? "",
          nameFor(courses, s.courseId), s.status ?? "",
        ]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [15, 118, 110] },
      });
      doc.save("students.pdf");
    } catch (err) {
      alert("Could not generate PDF: " + err.message);
    }
  }

  async function toggleStatus(student) {
    const next = String(student.status).toLowerCase() === "active" ? "Inactive" : "Active";
    try {
      await api.updateStudentDirect(student.id, { status: next, actor: username });
      refreshStudents();
    } catch (err) { alert(err.message); }
  }

  async function handleUpdate(student, values) {
    try {
      await api.updateStudentDirect(student.id, { ...values, actor: username });
      setEditing(null);
      refreshStudents();
    } catch (err) { alert(err.message || "Could not update this student."); }
  }

  async function handleDelete(student) {
    try {
      await api.deleteStudent(student.id);
      setDeleting(null);
      refreshStudents();
    } catch (err) { alert(err.message || "Could not delete this student."); }
  }

  return (
    <section className="content-stack" style={{ width: "100%", maxWidth: "none", padding: "0 32px" }}>
      <div className="page-heading"><div><br /><h2>Student Management</h2></div></div>

      <section className="data-table-card" style={{ width: "100%" }}>
        <div className="data-table-heading">
          <div>
            <h3>Registered Students</h3>
          </div>
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
              disabled={filtered.length === 0}
              getData={() => ({
                title: "Registered Students",
                headers: ["S.No", "Reg No", "Student", "Course", "Status"],
                rows: filtered.map((s, i) => [i + 1, s.registerNo, s.name, nameFor(courses, s.courseId), s.status]),
              })}
            />
          </div>
        </div>

        <div className="table-wrap data-table-scroll">
          <table>
            <thead>
              <tr>
                <th>S.NO</th><th>INSTITUTION</th><th>COURSE</th>
                <th>REG NO</th><th>STUDENT NAME</th>
                <th>STATUS</th><th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="empty-state">
                    <div className="table-empty"><span>No students registered yet</span></div>
                  </td>
                </tr>
              ) : (
                pageRows.map((student, i) => (
                  <tr key={student.id}>
                    <td data-label="S.No">{(currentPage - 1) * rowsPerPage + i + 1}</td>
                    <td data-label="Institution">{(institutionName || "-").toUpperCase()}</td>
                    <td data-label="Course">{nameFor(courses, student.courseId).toUpperCase()}</td>
                    <td data-label="Student ID">{student.registerNo}</td>
                    <td data-label="Student Name">{student.name}</td>
                    <td data-label="Status"><StatusBadge status={student.status} /></td>
                    <td data-label="Actions">
                      <div className="action-group">
                        <button type="button" className="icon-btn" title="View / Edit" onClick={() => setEditing(student)}>
                          <FileText size={16} />
                        </button>
                        <button type="button" className="icon-btn" title={String(student.status).toLowerCase() === "active" ? "Set Inactive" : "Set Active"} onClick={() => toggleStatus(student)}>
                          {String(student.status).toLowerCase() === "active" ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                        </button>
                        <button type="button" className="icon-btn danger" title="Delete student" onClick={() => setDeleting(student)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <span>{rangeStart}-{rangeEnd} of {filtered.length}</span>
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

      {editing && (
        <StudentEditModal
          student={editing}
          courses={courses}
          years={years}
          regions={regions}
          username={username}
          onClose={() => setEditing(null)}
          onSave={(student, values) => handleUpdate(student, values)}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title="Delete this student?"
          message="This action cannot be undone."
          onConfirm={() => handleDelete(deleting)}
          onCancel={() => setDeleting(null)}
        />
      )}
    </section>
  );
}