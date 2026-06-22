export default function KpiCard({ label, value, meta, icon: Icon }) {
  return (
    <article className="kpi-card">
      <div className="kpi-icon" aria-hidden="true">
        <Icon size={20} />
      </div>
      <div className="kpi-copy">
        <span>{label}</span>
        <strong>{value}</strong>
        {meta && <small>{meta}</small>}
      </div>
    </article>
  );
}
