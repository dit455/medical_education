export default function QuickActions({ actions }) {
  return (
    <div className="quick-action-grid">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.label}
            type="button"
            className={`quick-action-card ${action.variant || "secondary"}`}
            onClick={action.onClick}
            disabled={action.disabled}
          >
            <span className="quick-action-icon" aria-hidden="true">
              <Icon size={18} />
            </span>
            <span>
              <strong>{action.label}</strong>
              {action.meta && <small>{action.meta}</small>}
            </span>
          </button>
        );
      })}
    </div>
  );
}
