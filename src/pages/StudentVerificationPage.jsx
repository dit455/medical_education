import { useState, useEffect, useMemo } from "react";
import { FileText, Search, Download, ChevronLeft, ChevronRight, Plus, Filter, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import * as api from "../api.js";
import StatusBadge from "../components/StatusBadge.jsx";
import RecordModal from "../components/RecordModal.jsx";
import StudentEditModal from "../components/StudentEditModal.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import ExportMenu from "../components/ExportMenu.jsx";


const STATUS_FILTERS = ["Active", "Inactive", "Draft", "Submitted", "Verified", "Approved"];

export default function StudentVerificationPage({ username }) {
  const [students, setStudents] = useState([]);
  const [regions, setRegions] = useState([]);
  const [years, setYears] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [viewing, setViewing] = useState(null);
  const [adding, setAdding] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  function refresh() {
    api.getAllStudents().then(setStudents).catch(() => setStudents([]));
  }

  useEffect(() => {
    refresh();
    api.getRegions().then(setRegions).catch(() => setRegions([]));
    api.getYears().then(setYears).catch(() => setYears([]));
    api.getInstitutions().then(setInstitutions).catch(() => setInstitutions([]));
    api.getListCourses().then(setCourses).catch(() => setCourses([]));
  }, []);

  const nameFor = (list, id) => list.find((x) => x.id === id)?.name ?? "—";

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
      doc.text("Registered Students — All Institutions", 14, 16);
      doc.autoTable({
        startY: 22,
        head: [["S.No", "Reg No", "Student", "Father", "Mobile", "Status"]],
        body: filtered.map((s, i) => [i + 1, s.registerNo ?? "", s.name ?? "", s.fatherName ?? "", s.mobile ?? "", s.status ?? ""]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [15, 118, 110] },
      });
      doc.save("registered-students.pdf");
    } catch (err) {
      alert("Could not generate PDF: " + err.message);
    }
  }


  async function toggleStatus(student) {
    const next = String(student.status).toLowerCase() === "active" ? "Inactive" : "Active";
    try {
      await api.updateStudentDirect(student.id, { status: next, actor: username });
      refresh();
    } catch (err) { alert(err.message); }
  }

  function removeStudent(student) {
    setDeleting(student);
  }

  async function confirmDelete() {
    try {
      await api.deleteStudent(deleting.id);
      setDeleting(null);
      refresh();
    } catch (err) { alert(err.message); }
  }

  function openAdd() {
    setAdding({
      __institution: "", studentName: "", studentDob: "", studentFatherName: "",
      studentAddress: "", studentEmail: "", studentMobile: "",
      regionId: "", courseId: "", yearId: "",
    });
  }

  async function handleAddSave(values) {
    const { __institution, ...rest } = values;
    if (!__institution) { alert("Please select an institution."); return; }
    try {
      await api.createStudentDirect(__institution, { ...rest, actor: username });
      setAdding(null);
      refresh();
    } catch (err) {
      alert(err.message);
    }
  }

  const addFields = [
    ["__institution", "Institution", institutions.map((i) => ({ value: String(i.id), label: i.name }))],
    ["studentName", "Student Name"],
    ["studentDob", "Date of Birth"],
    ["studentFatherName", "Father's Name"],
    ["studentAddress", "Address"],
    ["studentEmail", "Email"],
    ["studentMobile", "Mobile"],
    ["courseId", "Course", courses.map((c) => ({ value: String(c.id), label: c.name }))],
    ["yearId", "Year", years.map((y) => ({ value: String(y.id), label: y.name }))],
    ["regionId", "Region", regions.map((r) => ({ value: String(r.id), label: r.name }))],
  ];

  const viewFields = [
    ["registerNo", "Register No"], ["name", "Name"], ["fatherName", "Father"],
    ["dob", "DOB"], ["email", "Email"], ["mobile", "Mobile"],
    ["yearName", "Year"], ["regionName", "Region"], ["status", "Status"],
  ];

  return (
    <section className="data-table-card" style={{ width: "100%" }}>
      <div className="data-table-heading">
        <div>
          <h2>Records</h2>
        </div>
        <button className="primary-btn compact-btn" type="button" onClick={openAdd}>
          <Plus size={16} /> Add
        </button>
      </div>

      <div className="table-toolbar">
        <label className="search-box small">
          <Search size={15} />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search"
          />
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
              title: "Registered Students — All Institutions",
              headers: ["S.No", "Reg No", "Student", "Father", "Mobile", "Status"],
              rows: filtered.map((s, i) => [i + 1, s.registerNo, s.name, s.fatherName, s.mobile, s.status]),
            })}
          />
        </div>
      </div>

      <div className="table-wrap data-table-scroll">
        <table>
          <thead>
            <tr>
              <th>S.NO</th><th>STUDENT</th><th>STUDENT ID</th>
              <th>FATHER</th><th>MOBILE</th><th>STATUS</th><th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty-state">
                  <div className="table-empty"><span>No students found</span></div>
                </td>
              </tr>
            ) : (
              pageRows.map((student, i) => (
                <tr key={student.id}>
                  <td data-label="S.No">{(currentPage - 1) * rowsPerPage + i + 1}</td>
                  <td data-label="Student">{student.name}</td>
                  <td data-label="Student ID">{student.registerNo}</td>
                  <td data-label="Father">{student.fatherName}</td>
                  <td data-label="Mobile">{student.mobile}</td>
                  <td data-label="Status"><StatusBadge status={student.status} /></td>
                  <td data-label="Actions">
                    <div className="action-group">
                        <button
                            type="button" className="icon-btn" aria-label="View"
                            title="View student" onClick={() => setViewing(student)}>
                            <FileText size={16} />
                        </button>
                        <button
                            type="button" className="icon-btn"
                            aria-label="Toggle status"
                            title={String(student.status).toLowerCase() === "active" ? "Set Inactive" : "Set Active"}
                            onClick={() => toggleStatus(student)}>
                            {String(student.status).toLowerCase() === "active"
                            ? <ToggleRight size={16} />
                            : <ToggleLeft size={16} />}
                        </button>
                        <button
                            type="button" className="icon-btn danger"
                            aria-label="Delete"
                            title="Delete student"
                            onClick={() => removeStudent(student)}>
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

    {viewing && (
        <StudentEditModal
          student={viewing}
          institutions={institutions}
          courses={courses}
          years={years}
          regions={regions}
          onClose={() => setViewing(null)}
          onSave={async (student, values) => {
            try {
              await api.updateStudentDirect(student.id, { ...values, actor: username });
              setViewing(null);
              refresh();
            } catch (err) { alert(err.message); }
          }}
          onDelete={async (student) => {
            if (!window.confirm(`Delete ${student.name}? This cannot be undone.`)) return;
            try {
              await api.deleteStudent(student.id);
              setViewing(null);
              refresh();
            } catch (err) { alert(err.message); }
          }}
        />
      )}

      {adding && (
        <RecordModal
          mode="add" title="Add Student" fields={addFields} row={adding}
          onClose={() => setAdding(null)}
          onSave={handleAddSave}
        />
      )}

    {deleting && (
        <ConfirmDialog
          title={`Delete ${deleting.name}?`}
          message="This action cannot be undone."
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </section>
  );
}