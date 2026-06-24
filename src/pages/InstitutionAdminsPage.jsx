import { useState, useEffect, useMemo } from "react";
import { Plus, Trash2 } from "lucide-react";
import RecordModal from "../components/RecordModal.jsx";
import IconButton from "../components/IconButton.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import { emptyRowFromFields } from "../utils.js";
import * as api from "../api.js";

// Super Admin only: create/list/delete Institution-login accounts (DB-backed,
// `users` table with role='Institution' and inst_id set). Each account is
// tied to exactly one institution - that's what scopes its InstitutionPortal
// view and its pending-change submissions.
export default function InstitutionAdminsPage({ username }) {
  const [accounts, setAccounts] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [error, setError] = useState("");

  function refresh() {
    api.getInstitutionUsers().then(setAccounts).catch(() => setAccounts([]));
  }

  useEffect(refresh, []);
  useEffect(() => {
    api.getInstitutions().then(setInstitutions).catch(() => setInstitutions([]));
  }, []);

  const institutionOptions = useMemo(
    () => institutions.map((i) => ({ value: String(i.id), label: i.name })),
    [institutions],
  );

  const fields = useMemo(
    () => [
      ["username", "Username"],
      ["password", "Password"],
      ["institutionId", "Institution", institutionOptions],
    ],
    [institutionOptions],
  );

  function institutionName(id) {
    return institutions.find((i) => i.id === id)?.name || `Institution #${id}`;
  }

  async function handleSave(values) {
    try {
      await api.createInstitutionUser({
        username: values.username,
        password: values.password,
        institutionId: values.institutionId,
        actor: username,
      });
      setModalOpen(false);
      setError("");
      refresh();
    } catch (err) {
      setError(err.message || "Could not create institution account.");
    }
  }

  async function handleDelete(account) {
    await api.deleteInstitutionUser(account.id);
    setDeleteCandidate(null);
    refresh();
  }

  return (
    <section className="content-stack">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Super Admin</p>
          <h2>Institution Accounts</h2>
        </div>
      </div>
      <section className="data-table-card">
        <div className="data-table-heading">
          <div>
            <h3>Accounts</h3>
            <span>Each account logs straight into that institution's portal to submit changes for approval.</span>
          </div>
          <button
            className="primary-btn compact-btn"
            onClick={() => setModalOpen(true)}
            disabled={institutionOptions.length === 0}
          >
            <Plus size={16} />
            Add
          </button>
        </div>
        {error && <div className="login-error">{error}</div>}
        <div className="table-wrap data-table-scroll">
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>Institution</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {accounts.length === 0 ? (
                <tr>
                  <td colSpan={3} className="empty-state">
                    <div className="table-empty">
                      <span>No institution accounts yet</span>
                      <button
                        className="secondary-btn compact-action"
                        onClick={() => setModalOpen(true)}
                        disabled={institutionOptions.length === 0}
                      >
                        <Plus size={15} />
                        Add Institution Account
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                accounts.map((account) => (
                  <tr key={account.id}>
                    <td data-label="Username">{account.username}</td>
                    <td data-label="Institution">{institutionName(account.institutionId)}</td>
                    <td data-label="Actions">
                      <div className="action-group">
                        <IconButton label="Delete" onClick={() => setDeleteCandidate(account)} icon={Trash2} tone="danger" />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
      {modalOpen && (
        <RecordModal
          mode="add"
          row={emptyRowFromFields(fields)}
          fields={fields}
          title="Institution Account"
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
        />
      )}
      {deleteCandidate && (
        <ConfirmDialog
          title="Delete this institution account?"
          message="This action cannot be undone."
          onConfirm={() => handleDelete(deleteCandidate)}
          onCancel={() => setDeleteCandidate(null)}
        />
      )}
    </section>
  );
}
