import { Menu } from "lucide-react";

export default function Topbar({ route, onMenuClick }) {
  const title = route?.type === "dashboard" ? "Dashboard" : route?.title || "Dashboard";
  if (route?.type === "dashboard") {
    return (
      <button className="icon-btn mobile-menu-btn dashboard-mobile-menu" type="button" onClick={onMenuClick} aria-label="Open menu">
        <Menu size={18} />
      </button>
    );
  }

  return (
    <header className="topbar">
      <div className="topbar-title-row">
        <button className="icon-btn mobile-menu-btn" type="button" onClick={onMenuClick} aria-label="Open menu">
          <Menu size={18} />
        </button>
        <div>
          <p className="eyebrow">EMS Workspace</p>
          <h1>{title}</h1>
        </div>
      </div>
    </header>
  );
}
