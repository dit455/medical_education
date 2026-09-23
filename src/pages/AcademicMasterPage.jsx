import { useEffect, useMemo, useState } from "react";
import { Search, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import * as api from "../api.js";
import ExportMenu from "../components/ExportMenu.jsx";
import Breadcrumb from "../components/Breadcrumb.jsx";
import RecordModal from "../components/RecordModal.jsx";
import StatusToggle from "../components/StatusToggle.jsx";
import StatusBadge from "../components/StatusBadge.jsx";

// Read-only "Academic Master" screen. The active tab is driven ENTIRELY by the
// left sidebar (Institutions / Courses / Subjects), passed in as `initialTab`.
// Each tab is a plain searchable + exportable table of ALL master records,
// showing Sl. No + name only. No add / edit / map / delete here.

const TABS = {
  institutions: { label: "Institution Master", header: "Institution" },
  courses: { label: "Course Master", header: "Course" },
  subjects: { label: "Subject Master", header: "Subject" },
};

export default function AcademicMasterPage({ initialTab, tabCommand, onNavigate, username }) {
  const valid = ["institutions", "courses", "subjects"];
  const [tab, setTab] = useState(valid.includes(initialTab) ? initialTab : "institutions");
  const [data, setData] = useState({ institutions: [], courses: [], subjects: [] });
  const [search, setSearch] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(1);

  const [addCourseOpen, setAddCourseOpen] = useState(false);
  const [addSubjectOpen, setAddSubjectOpen] = useState(false);

  // Load all three master lists once. include_inactive=true so this admin
  // screen shows every record, Inactive ones included, with their real
  // status — unlike the Active-only lookups used for dropdown pickers
  // elsewhere in the app.
  const byName = (a, b) => (a.name || "").localeCompare(b.name || "");
  function loadCourses() {
    api.getListCourses(true).then((d) => setData((s) => ({ ...s, courses: [...d].sort(byName) }))).catch(() => {});
  }
  function loadSubjects() {
    api.getListSubjects(true).then((d) => setData((s) => ({ ...s, subjects: [...d].sort(byName) }))).catch(() => {});
  }
  useEffect(() => {
    api.getInstitutions().then((d) => setData((s) => ({ ...s, institutions: [...d].sort(byName) }))).catch(() => {});
    loadCourses();
    loadSubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAddCourse(values) {
    await api.createMasterCourse({
      name: (values.name || "").trim(),
      status: values.status || "Active",
      abbreviation: (values.abbreviation || "").trim(),
    });
    setAddCourseOpen(false);
    loadCourses();
  }

  async function handleAddSubject(values) {
    await api.createMasterSubject({
      name: (values.name || "").trim(),
      status: values.status || "Active",
    });
    setAddSubjectOpen(false);
    loadSubjects();
  }

  async function handleToggleStatus(row) {
    const next = (row.status || "Active") === "Active" ? "Inactive" : "Active";
    // Update the row immediately so the switch feels instant.
    setData((s) => ({
      ...s,
      [tab]: s[tab].map((r) => (r.id === row.id ? { ...r, status: next } : r)),
    }));
    try {
      if (tab === "institutions") await api.setInstitutionStatus(row.id, next, username);
      else if (tab === "courses") await api.setCourseStatus(row.id, next, username);
      else await api.setMasterSubjectStatus(row.id, next, username);
    } catch (err) {
      // Revert if the save failed.
      setData((s) => ({
        ...s,
        [tab]: s[tab].map((r) => (r.id === row.id ? { ...r, status: row.status } : r)),
      }));
      alert(err.message || "Could not update status.");
    }
  }


  // Follow the sidebar click into the matching tab.
  useEffect(() => {
    if (valid.includes(initialTab)) setTab(initialTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabCommand, initialTab]);

  // Reset search + paging whenever the tab changes.
  useEffect(() => {
    setSearch("");
    setPage(1);
  }, [tab]);

  const meta = TABS[tab];
  const rows = data[tab] || [];

  const filtered = useMemo(
    () => rows.filter((r) => (r.name || "").toLowerCase().includes(search.toLowerCase())),
    [rows, search],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const pageRows = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  function exportData() {
    return {
      title: meta.label,
      headers: (tab === "institutions" || tab === "courses") ? ["Sl. No", meta.header, "Abbreviation", "Status"] : ["Sl. No", meta.header, "Status"],
      rows: filtered.map((r, i) =>
        (tab === "institutions" || tab === "courses") ? [i + 1, r.name, r.abbreviation || "", r.status || "Active"] : [i + 1, r.name, r.status || "Active"]),
    };
  }

  const crumbLabel = { institutions: "Institutions", courses: "Courses", subjects: "Subjects" }[tab];

  return (
    <section className="content-stack" style={{ padding: "0 32px" }}>
       <Breadcrumb
        items={[
          { label: "Dashboard", onClick: () => onNavigate && onNavigate("dashboard", "overview") },
          { label: "Academic Master", onClick: () => setTab("institutions") },
          { label: crumbLabel },
        ]}
      />
      {(() => {
        const addConfig = {
          institutions: { label: "Add Institute", view: "institutions", add: "institution" },
          courses: { label: "Add Course", view: "courses", add: "course" },
          subjects: { label: "Add Subject", view: "subjects", add: "subject" },
        }[tab];
        return (
          <div className="dashboard-action-bar">
            <button
              type="button"
              className="primary-btn"
                onClick={() => {
                if (tab === "courses") setAddCourseOpen(true);
                else if (tab === "subjects") setAddSubjectOpen(true);
                else if (onNavigate) onNavigate("dashboard", addConfig.view, addConfig.add);
              }}
            >
              <Plus size={16} /> {addConfig.label}
            </button>
          </div>
        );
      })()}
      <section className="data-table-card">
        <div className="data-table-heading">
          <div>
            <h3>{meta.label}</h3>
          </div>
        </div>

        <div className="table-toolbar">
          <label className="search-box small">
            <Search size={15} />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search"
            />
          </label>
          <div className="table-toolbar-controls">
            <label className="select-box small rows-select">
              Rows
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setPage(1);
                }}
              >
                {[5, 10, 20, 50].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </label>
            <ExportMenu getData={exportData} disabled={filtered.length === 0} />
          </div>
        </div>

          <div className="table-wrap data-table-scroll">
          <table>
            <thead>
              <tr>
                <th>Sl. No</th>
                <th>{meta.header}</th>
                {(tab === "institutions" || tab === "courses") && <th>Abbreviation</th>}
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                    <td colSpan={(tab === "institutions" || tab === "courses") ? 4 : 3} className="empty-state">
                    <div className="table-empty">
                      <span>No records found</span>
                    </div>
                  </td>
                </tr>
              ) : (
                pageRows.map((r, i) => (
                  <tr key={r.id ?? i}>
                    <td>{(page - 1) * rowsPerPage + i + 1}</td>
                    <td style={{ textTransform: "uppercase" }}>{r.name}</td>
                    {(tab === "institutions" || tab === "courses") && <td>{r.abbreviation || "-"}</td>}
                    <td>
                      {/*<StatusToggle status={r.status || "Active"} onToggle={() => handleToggleStatus(r)} />*/}
                       <StatusBadge status={r.status || "Active"} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <span>
            {filtered.length === 0
              ? "0 of 0"
              : `${(page - 1) * rowsPerPage + 1}-${Math.min(page * rowsPerPage, filtered.length)} of ${filtered.length}`}
          </span>
          <div>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
              <ChevronLeft size={17} />
            </button>
            <strong>
              {page} / {totalPages}
            </strong>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </section>
      {addCourseOpen && (
        <RecordModal
          mode="add"
          row={{ name: "", abbreviation: "", status: "Active" }}
          fields={[
            ["name", "Course"],
            ["abbreviation", "Abbreviation"],
            ["status", "Status", ["Active", "Inactive"]],
          ]}
          title="Add Course"
          onClose={() => setAddCourseOpen(false)}
          onSave={handleAddCourse}
        />
      )}
      {addSubjectOpen && (
        <RecordModal
          mode="add"
          row={{ name: "", status: "Active" }}
          fields={[
            ["name", "Subject"],
            ["status", "Status", ["Active", "Inactive"]],
          ]}
          title="Add Subject"
          onClose={() => setAddSubjectOpen(false)}
          onSave={handleAddSubject}
        />
      )}
    </section>
  );
}