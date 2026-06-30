import { X } from "lucide-react";
import StatusBadge from "./StatusBadge.jsx";

// Read-only list of records, used by the "View" buttons (e.g. View Course) to
// show every existing record without any editing. `items` is an array of
// { id, label, status? }.
export default function ListViewModal({
  title = "Records",
  items = [],
  emptyMessage = "No records found.",
  onClose,
}) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-heading">
          <div>
            <p className="eyebrow">view</p>
            <h3>{title}</h3>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        {items.length === 0 ? (
          <p className="record-pick-empty">{emptyMessage}</p>
        ) : (
          <ol className="list-view">
    {items.map((item, index) => (
     <li key={item.id ?? index} className="list-view-row">
       <span className="list-view-label">{item.label}</span>
       {item.status && <StatusBadge status={item.status} />}
     </li>
  ))}
</ol>
        )}
        <div className="modal-actions">
          <button className="secondary-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </section>
    </div>
  );
}
