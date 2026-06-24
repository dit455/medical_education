import { useState, useEffect, useCallback } from "react";
import { CircleCheck, X } from "lucide-react";
import StatusBadge from "../components/StatusBadge.jsx";
import IconButton from "../components/IconButton.jsx";
import * as api from "../api.js";

// Board-side inbox for reviewing changes Institution accounts have
// submitted (tbl_pending_changes). Approving applies the change to the real
// tables (see backend/routes/approvals.py); rejecting never does.
export default function ApprovalsPage({ role, username }) {
  const [institutions, setInstitutions] = useState([]);
  const [changes, setChanges] = useState([]);
  const [statusFilter, setStatusFilter] = useState("Pending");
  const [rejecting, setRejecting] = useState(null);
  const [error, setError] = useState("");

  const refresh = useCallback(() => {
    api.getInstitutions(role).then(setInstitutions).catch(() => setInstitutions([]));
    api
      .getPendingChanges(statusFilter === "All" ? {} : { status: statusFilter })
      .then(setChanges)
      .catch(() => setChanges([]));
  }, [role, statusFilter]);

  useEffect(refresh, [refresh]);

  const institutionIds = new Set(institutions.map((i) => i.id));
  const institutionName = (id) => institutions.find((i) => i.id === id)?.name || `Institution #${id}`;
  const visibleChanges = changes.filter((c) => institutionIds.has(c.institutionId));

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
                <th>Type</th>
                <th>Action</th>
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
                    <td data-label="Type">{change.entityType}</td>
                    <td data-label="Action">{change.action}</td>
                    <td data-label="Details">{summarizePayload(change.payload)}</td>
                    <td data-label="Requested By">{change.requestedBy}</td>
                    <td data-label="Status">
                      <StatusBadge status={change.status} />
                    </td>
                    <td data-label="Actions">
                      {change.status === "Pending" ? (
                        <div className="action-group">
                          <IconButton label="Approve" onClick={() => handleApprove(change)} icon={CircleCheck} />
                          <IconButton label="Reject" onClick={() => setRejecting(change)} icon={X} tone="danger" />
                        </div>
                      ) : (
                        <span>{change.reviewedBy}</span>
                      )}
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
    </section>
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
