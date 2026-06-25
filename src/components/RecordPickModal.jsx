import { useState } from "react";
import { X, CircleCheck } from "lucide-react";

// Single-select picker: shows a dropdown of existing records and calls
// onPick(row) with the chosen one. Used by the "Edit" buttons so the user can
// pick which record to edit from the existing list.
export default function RecordPickModal({
  title = "Record",
  rows = [],
  getLabel = (row) => row.name,
  emptyMessage = "No records available.",
  onClose,
  onPick,
}) {
  const [selectedId, setSelectedId] = useState("");

  const selectedRow = rows.find((row) => String(row.id) === String(selectedId)) || null;
  const isEmpty = rows.length === 0;

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal" role="dialog" aria-modal="true" aria-label={`Select ${title}`}>
        <div className="modal-heading">
          <div>
            <p className="eyebrow">edit</p>
            <h3>Select {title}</h3>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        {isEmpty ? (
          <p className="record-pick-empty">{emptyMessage}</p>
        ) : (
          <div className="form-grid">
            <label>
              <span>{title}</span>
              <select
                aria-label={`Select ${title}`}
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                autoFocus
              >
                <option value="" disabled>
                  Select {title.toLowerCase()}
                </option>
                {rows.map((row) => (
                  <option key={row.id} value={row.id}>
                    {getLabel(row)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
        <div className="modal-actions">
          <button className="secondary-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="primary-btn"
            disabled={!selectedRow}
            onClick={() => selectedRow && onPick(selectedRow)}
          >
            <CircleCheck size={18} />
            Edit Selected
          </button>
        </div>
      </section>
    </div>
  );
}
