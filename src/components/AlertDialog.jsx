import { TriangleAlert, X } from "lucide-react";

// Centered message popup (replaces the browser's alert()).
export default function AlertDialog({
  title = "Please check",
  message = "",
  onClose,
  buttonLabel = "OK",
}) {
  return (
    <div className="modal-backdrop" role="presentation" style={{ zIndex: 3000 }}>
      <section
        className="modal confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Alert</p>
            <h3>{title}</h3>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={24} />
          </button>
        </div>
        <div className="confirm-dialog-body">
          <TriangleAlert size={24} />
          <p>{message}</p>
        </div>
        <div className="modal-actions">
          <button className="primary-btn" onClick={onClose} autoFocus>
            {buttonLabel}
          </button>
        </div>
      </section>
    </div>
  );
}