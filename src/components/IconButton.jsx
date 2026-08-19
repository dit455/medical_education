// Small icon-only button used for row actions (View/Edit/Delete/etc).
export default function IconButton({ label, onClick, icon: Icon, tone, disabled = false, title }) {
  return (
    <button
      className={`icon-btn ${tone || ""}`}
      onClick={onClick}
      aria-label={label}
      title={title || label}
      disabled={disabled}
      style={disabled ? { opacity: 0.35, cursor: "not-allowed" } : undefined}
    >
      <Icon size={16} />
    </button>
  );
}