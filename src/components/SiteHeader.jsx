import { useEffect, useRef, useState } from "react";
import { ArrowLeft, LogOut, UserRound, KeyRound, Search } from "lucide-react";

// ACC-04: header search on every page – opens the homepage with results
function HeaderSearch({ newTab = false }) {
  return (
    <form
      className="hdr-search"
      action="/"
      method="get"
      role="search"
      target={newTab ? "_blank" : undefined}
      rel={newTab ? "noopener" : undefined}
    >
      <label htmlFor="hdr-q" className="hdr-sr-only">Search this site</label>
      <Search size={24} aria-hidden="true" />
      <input id="hdr-q" name="q" type="search" placeholder="Search this site…" required />
    </form>
  );
}


// Top institute header bar shown on every screen (login, department select, app shell).
export default function SiteHeader({ showSearch = true, compact = false, role, username, onLogout, onBoardSwitch, onChangePassword }) {
  if (compact) {
    return (
      <header className="institute-header app-compact-header">
        <div className="app-header-inner">
            <div className="app-header-brand">
            <img
              className="hdr-emblem"
              src="/images/emblem_black.png" width="40" height="78"
              alt="State Emblem of India"
            />
            <div className="app-header-title">
              <strong className="bhashini-skip-translation">Examination Marks System (EMS)</strong>
              <span>Board of Medical Education &amp; Board of Examinations in Nursing</span>
            </div>
            <img
              className="hdr-state-logo"
              src="/images/govt_puducherry_black.png" width="57" height="70"
              alt="Government of Puducherry logo"
            />
          </div>
            <div className="app-header-actions">
            <HeaderSearch newTab />
            {onBoardSwitch && (
              <button className="secondary-btn switch-board-btn" onClick={onBoardSwitch}>
                <ArrowLeft size={24} />
                Switch BOME/BOEN
              </button>
            )}
            {onChangePassword && (
              <button className="secondary-btn" onClick={onChangePassword}>
                <KeyRound size={24} />
                Change Password
              </button>
            )}
            <ProfileMenu role={role} username={username} />
            <button className="secondary-btn logout-btn" onClick={onLogout}>
              <LogOut size={24} />
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
              src="/images/emblem_black.png" width="40" height="78"
              alt="Government emblem"
            />
          </div>
          <div className="identity-title">
            <b>BOME &amp; BOEN</b>
            <strong className="bhashini-skip-translation">Examination Marks System (EMS)</strong>
            <span>
              Board of Medical Education &amp; Board of Examinations in Nursing
            </span>
            {/* <em>Directorate of Information Technology, Government of Puducherry</em> */}
          </div>
          <img
            className="hdr-state-logo"
            src="/images/govt_puducherry_black.png" width="57" height="70"
            alt="Government of Puducherry logo"
           />
        </div>
        <div className="identity-search">
          <HeaderSearch />
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
        <UserRound size={24} />
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
