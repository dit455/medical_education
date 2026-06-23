// Renders a status string as a colored badge, e.g. <span className="status-badge active">Active</span>
export default function StatusBadge({ status }) {
  const slug = String(status || "")
    .toLowerCase()
    .replace(/\s/g, "-");
  return (
    <span className={`status-badge ${slug}`}>
      <i aria-hidden="true" />
      <span>{status || "Draft"}</span>
    </span>
  );
}
