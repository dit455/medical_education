import { useEffect, useRef, useState } from "react";
import { ArrowLeft, LogOut, UserRound } from "lucide-react";

// Top institute header bar shown on every screen (login, department select, app shell).
export default function SiteHeader({ showSearch = true, compact = false, role, username, onLogout, onBoardSwitch }) {
  if (compact) {
    return (
      <header className="institute-header app-compact-header">
        <div className="app-header-inner">
          <div className="app-header-brand">
            <div className="identity-logo-shell app-header-logo">
              <img
                className="identity-logo-img identity-logo-emblem"
                src="/images/emblem.png"
                alt="Government emblem"
              />
            </div>
            <div>
              <strong>Examination Marks Software (EMS)</strong>
              <span>BOME &amp; BOEN / Directorate of IT, Government of Puducherry</span>
            </div>
          </div>
          <div className="app-header-actions">
            {onBoardSwitch && (
              <button className="secondary-btn switch-board-btn" onClick={onBoardSwitch}>
                <ArrowLeft size={17} />
                Switch BOME/BOEN
              </button>
            )}
            <ProfileMenu role={role} username={username} />
            <button className="secondary-btn logout-btn" onClick={onLogout}>
              <LogOut size={17} />
              Logout
            </button>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="institute-header">
      <div className="identity-bar">
        <div className={showSearch ? "identity-inner" : "identity-inner centered"}>
          <div className="identity-logo-shell identity-logo-left">
            <img
              className="identity-logo-img identity-logo-emblem"
              src="/images/emblem.png"
              alt="Government emblem"
            />
          </div>
          <div className="identity-title">
            <b>BOME &amp; BOEN</b>
            <strong>Examination Marks Software (EMS)</strong>
            <span>
              Board of Medical Education &amp; Board of Examination in Nursing
            </span>
            <em>Directorate of Information Technology, Government of Puducherry</em>
          </div>
          <div className="identity-logo-shell identity-logo-right">
            <img
              className="identity-logo-img identity-logo-institute"
              src="/images/header_logo.png"
              alt="Institute logo"
            />
          </div>
        </div>
      </div>
    </header>
  );
}

// Profile button in the compact header - shows a small popover with the
// signed-in user's username/role instead of doing nothing on click.
function ProfileMenu({ role, username }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleOutsideClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open]);

  return (
    <div className="profile-menu" ref={containerRef}>
      <button
        className="secondary-btn profile-btn"
        type="button"
        title={role || "Profile"}
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <UserRound size={17} />
        Profile
      </button>
      {open && (
        <div className="profile-menu-popover" role="menu">
          <div className="profile-menu-row">
            <span>Username</span>
            <strong>{username || "-"}</strong>
          </div>
          <div className="profile-menu-row">
            <span>Role</span>
            <strong>{role || "-"}</strong>
          </div>
        </div>
      )}
    </div>
  );
}
