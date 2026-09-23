// Clickable status switch: green when Active, red when Inactive. Clicking it
// calls onToggle to flip the record's status.
export default function StatusToggle({ status, onToggle, disabled = false }) {
  const isActive = String(status || "").toLowerCase() === "active";
  return (
    <button
      type="button"
      className={`status-toggle ${isActive ? "on" : "off"}`}
      role="switch"
      aria-checked={isActive}
      aria-label={isActive ? "Active — click to deactivate" : "Inactive — click to activate"}
      title={isActive ? "Active" : "Inactive"}
      disabled={disabled}
      onClick={(e) => { e.stopPropagation(); onToggle && onToggle(); }}
    >
      <span className="status-toggle-knob" />
      <span className="status-toggle-label">{isActive ? "Active" : "Inactive"}</span>
    </button>
  );
}