import { useState, useEffect, useCallback } from "react";
import { CircleCheck, X } from "lucide-react";
import StatusBadge from "../components/StatusBadge.jsx";
import IconButton from "../components/IconButton.jsx";
import AddSubjectModal from "../components/AddSubjectModal.jsx";
import * as api from "../api.js";

// Board-side inbox for reviewing changes Institution accounts have
// submitted (tbl_pending_changes). Approving applies the change to the real
// tables (see backend/routes/approvals.py); rejecting never does.
export default function ApprovalsPage({ role, username }) {
  const [institutions, setInstitutions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [changes, setChanges] = useState([]);
  const [statusFilter, setStatusFilter] = useState("Pending");
  const [rejecting, setRejecting] = useState(null);
  const [editingChange, setEditingChange] = useState(null);
  const [error, setError] = useState("");

  const refresh = useCallback(() => {
    api.getInstitutions(role).then(setInstitutions).catch(() => setInstitutions([]));
    api.getListCourses().then(setCourses).catch(() => setCourses([]));
    api.getListSubjects().then(setSubjects).catch(() => setSubjects([]));
    api
      .getPendingChanges(statusFilter === "All" ? {} : { status: statusFilter })
      .then(setChanges)
      .catch(() => setChanges([]));
  }, [role, statusFilter]);

  useEffect(refresh, [refresh]);

  const institutionIds = new Set(institutions.map((i) => i.id));
  const institutionName = (id) => institutions.find((i) => i.id === id)?.name || `Institution #${id}`;
  const courseName = (id) => courses.find((c) => c.id === id)?.name || (id ? `Course #${id}` : "-");
  const subjectName = (id) => subjects.find((s) => s.id === id)?.name || (id ? `Subject #${id}` : "-");
  const visibleChanges = changes.filter(
    (c) =>
      institutionIds.has(c.institutionId) &&
      c.entityType !== "student_with_marks" &&
      c.entityType !== "student" &&
      c.entityType !== "student_marks" &&
      c.entityType !== "student_registration" &&
      c.entityType !== "internal_marks",
  );

  async function handleResubmit(change, payload) {
    setError("");
    try {
      await api.updatePendingChange(change.id, payload, username);
      setEditingChange(null);
      refresh();
    } catch (err) {
      setError(err.message || "Could not resubmit this change.");
    }
  }

  async function handleApprove(change) {
    setError("");
    try {
      await api.approvePendingChange(change.id, username);
      refresh();
    } catch (err) {
      setError(err.message || "Could not approve this change.");
    }
  }

  async function handleReject(change, note) {
    setError("");
    try {
      await api.rejectPendingChange(change.id, username, note);
      setRejecting(null);
      refresh();
    } catch (err) {
      setError(err.message || "Could not reject this change.");
    }
  }

  return (
    <section className="content-stack">
      <div className="page-heading">
        <div>
          <p className="eyebrow">{role} Board</p>
          <h2>Institution Approvals</h2>
        </div>
      </div>
      <section className="data-table-card">
        <div className="data-table-heading">
          <div>
            <h3>Pending Changes</h3>
            <span>Changes submitted by Institution accounts under your board.</span>
          </div>
        </div>
        <div className="table-toolbar">
          <label className="select-box small">
            Status
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              {["Pending", "Approved", "Rejected", "All"].map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
        </div>
        {error && <div className="login-error">{error}</div>}
        <div className="table-wrap data-table-scroll">
          <table>
            <thead>
              <tr>
                <th>Institution</th>
                <th>Course</th>
                <th>Subject</th>
                <th>Details</th>
                <th>Requested By</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleChanges.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-state">
                    <div className="table-empty">
                      <span>No {statusFilter === "All" ? "" : statusFilter.toLowerCase()} requests</span>
                    </div>
                  </td>
                </tr>
              ) : (
                visibleChanges.map((change) => (
                  <tr key={change.id}>
                    <td data-label="Institution">{institutionName(change.institutionId)}</td>
                    <td data-label="Course">{courseName(change.payload?.courseId)}</td>
                    <td data-label="Subject">{change.payload?.subject || subjectName(change.payload?.subjectId)}</td>
                    <td data-label="Details">
                      {change.entityType === "subject" && change.payload?.divisions ? (
                        <MarksChangeSummary payload={change.payload} />
                      ) : (
                        summarizePayload(change.payload)
                      )}
                    </td>
                    <td data-label="Requested By">{change.requestedBy}</td>
                    <td data-label="Status">
                      <StatusBadge status={change.status} />
                    </td>
                    <td data-label="Actions">
                      <div className="action-group">
                        {change.status === "Pending" && (
                          <>
                            <IconButton label="Approve" onClick={() => handleApprove(change)} icon={CircleCheck} />
                            <IconButton label="Reject" onClick={() => setRejecting(change)} icon={X} tone="danger" />
                          </>
                        )}
                        
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
      {rejecting && (
        <RejectDialog
          change={rejecting}
          onCancel={() => setRejecting(null)}
          onConfirm={(note) => handleReject(rejecting, note)}
        />
      )}
      {editingChange && (
        <AddSubjectModal
          editMode
          username={username}
          subjectOptions={[]}
          initialSubject={{
            id: editingChange.payload.subjectId,
            name: editingChange.payload.subject,
            divisions: editingChange.payload.divisions,
            effectiveDate: editingChange.payload.effectiveDate,
          }}
          onClose={() => setEditingChange(null)}
          onSave={(values) =>
            handleResubmit(editingChange, {
              ...editingChange.payload,
              subject: values.subjectName,
              divisions: values.divisions,
              totalMarks: values.totalMarks,
              effectiveDate: values.effectiveDate,
              signatureName: values.signatureName,
            })
          }
        />
      )}

      </section>
  );
}

function MarksChangeSummary({ payload }) {
  const typeLabel = { 1: "Internal Assessment", 2: "External Assessment", 3: "Theory / Practical" };
  const divisions = (payload.divisions || []).filter((d) => d.maxMarks > 0 || d.passMarks > 0);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 220 }}>
      {divisions.map((d) => (
        <span key={d.examTypeId} style={{ fontSize: "0.82rem", color: "var(--ink)" }}>
          <strong>{typeLabel[d.examTypeId] || d.examTypeId}:</strong> {d.maxMarks} / {d.passMarks}
        </span>
      ))}
      <div style={{ fontSize: "0.76rem", color: "var(--muted)", marginTop: 2 }}>
        Total {payload.totalMarks ?? 100} &middot; Effective {payload.effectiveDate || "-"} &middot; Signed{" "}
        <strong style={{ color: "var(--ink)" }}>{payload.signatureName}</strong>
      </div>
    </div>
  );
}

function summarizePayload(payload) {
  return Object.entries(payload || {})
    .filter(([, value]) => value !== null && value !== undefined && value !== "")
    .map(([key, value]) => `${key}: ${value}`)
    .join(", ");
}

function RejectDialog({ change, onCancel, onConfirm }) {
  const [note, setNote] = useState("");

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal confirm-dialog" role="alertdialog" aria-modal="true" aria-label="Reject this change?">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Confirm</p>
            <h3>Reject this {change.entityType} request?</h3>
          </div>
          <button className="icon-btn" onClick={onCancel} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <label>
          <span>Reason (optional)</span>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Let the institution know why" />
        </label>
        <div className="modal-actions">
          <button className="secondary-btn" onClick={onCancel}>
            Cancel
          </button>
          <button className="primary-btn danger-btn" onClick={() => onConfirm(note)}>
            Reject
          </button>
        </div>
      </section>
    </div>
  );
}
