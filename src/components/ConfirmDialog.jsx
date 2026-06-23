import { TriangleAlert, X } from "lucide-react";

// Small confirmation popup shown before any destructive delete action.
export default function ConfirmDialog({
  title = "Delete this record?",
  message = "This action cannot be undone.",
  onConfirm,
  onCancel,
}) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal confirm-dialog" role="alertdialog" aria-modal="true" aria-label={title}>
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Confirm</p>
            <h3>{title}</h3>
          </div>
          <button className="icon-btn" onClick={onCancel} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="confirm-dialog-body">
          <TriangleAlert size={20} />
          <p>{message}</p>
        </div>
        <div className="modal-actions">
          <button className="secondary-btn" onClick={onCancel}>
            Cancel
          </button>
          <button className="primary-btn danger-btn" onClick={onConfirm}>
            Delete
          </button>
        </div>
      </section>
    </div>
  );
}
