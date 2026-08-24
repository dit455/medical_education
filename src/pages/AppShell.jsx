import { useEffect, useMemo, useState } from "react";
import SiteHeader from "../components/SiteHeader.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import * as api from "../api.js";
import SiteFooter from "../components/SiteFooter.jsx";
import Sidebar from "./Sidebar.jsx";
import Topbar from "./Topbar.jsx";
import Dashboard from "./Dashboard.jsx";
import CrudPage from "./CrudPage.jsx";
import DepartmentAdminsPage from "./DepartmentAdminsPage.jsx";
import InstitutionAdminsPage from "./InstitutionAdminsPage.jsx";
import StudentRegistrationPage from "./StudentRegistrationPage.jsx";
import StudentManagementPage from "./StudentManagementPage.jsx";
import InternalMarksPage from "./InternalMarksPage.jsx";
import InstitutionPortal from "./InstitutionPortal.jsx";
import ApprovalsPage from "./ApprovalsPage.jsx";
import { ROUTES } from "../routes.js";
import { ENTITY_COLUMNS } from "../data.js";

export default function AppShell({
  role,
  username,
  institutionId,
  institutionRole,
  data,
  activeRoute,
  setActiveRoute,
  updateEntity,
  onLogout,
  onBoardSwitch,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [institution, setInstitution] = useState(null);

  useEffect(() => {
    if (role !== "Institution" || !institutionId) {
      setInstitution(null);
      return;
    }
    let cancelled = false;
    api
      .getInstitution(institutionId)
      .then((inst) => {
        if (!cancelled) setInstitution(inst || null);
      })
      .catch(() => {
        if (!cancelled) setInstitution(null);
      });
    return () => {
      cancelled = true;
    };
  }, [role, institutionId]);

  const [dashboardView, setDashboardView] = useState("overview");
  const [dashboardViewCommand, setDashboardViewCommand] = useState(null);
  const routesForRole = useMemo(
    () =>
      ROUTES.filter(
        (route) =>
          route.roles.includes(role) &&
          (!route.institutionRoles || route.institutionRoles.includes(institutionRole)),
      ),
    [role, institutionRole],
  );
  const currentRoute = routesForRole.find((route) => route.key === activeRoute) || routesForRole[0];

  function handleNavigate(routeKey, view) {
    setActiveRoute(routeKey);
    if (view) {
      setDashboardView(view);
      setDashboardViewCommand({ view, id: Date.now() });
    }
    setSidebarOpen(false);
  }

  return (
    <div className="page-with-header">
      <SiteHeader compact role={role} username={username} onLogout={onLogout} onBoardSwitch={onBoardSwitch} />
      <div className="app-shell">
        <Sidebar
          role={role}
          routes={routesForRole}
          activeRoute={currentRoute.key}
          activeDashboardView={dashboardView}
          onNavigate={handleNavigate}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="main-panel">
          <Topbar
            route={currentRoute}
            onMenuClick={() => setSidebarOpen(true)}
          />
          {institutionRole === "Creator" &&
            ["student-registration", "student-management", "internal-marks"].includes(currentRoute.type) && (
              <section className="content-stack institution-portal" style={{ padding: "0 32px" }}>
                <section className="board-summary-card">
                  <div className="board-summary-head">
                    <div>
                      <p className="eyebrow">Institution Portal</p>
                      <h2>{institution?.name || "Loading..."}</h2>
                      <span>Creator</span>
                    </div>
                    {institution && <StatusBadge status={institution.status} />}
                  </div>
                </section>
              </section>
            )}

            
          {currentRoute.type === "dashboard" ? (
            <Dashboard
              data={data}
              role={role}
              username={username}
              routes={routesForRole}
              setActiveRoute={setActiveRoute}
              updateEntity={updateEntity}
              dashboardView={dashboardView}
              dashboardViewCommand={dashboardViewCommand}
              onDashboardViewChange={setDashboardView}
            />
          ) : currentRoute.type === "department-admins" ? (
            <DepartmentAdminsPage username={username} />
          ) : currentRoute.type === "institution-admins" ? (
            <InstitutionAdminsPage username={username} />
          ) : currentRoute.type === "student-registration" ? (
            <StudentRegistrationPage institutionId={institutionId} username={username} />
          ) : currentRoute.type === "student-management" ? (
            <StudentManagementPage institutionId={institutionId} username={username} />
          ) : currentRoute.type === "internal-marks" ? (
            <InternalMarksPage institutionId={institutionId} username={username} />
          ) : currentRoute.type === "institution-approvals-portal" ? (
            <InstitutionPortal institutionId={institutionId} username={username} institutionRole={institutionRole} />
          ) : currentRoute.type === "approvals" ? (
            <ApprovalsPage role={role} username={username} />
          ) : (
            <CrudPage
              route={currentRoute}
              rows={data[currentRoute.entity] || []}
              columns={ENTITY_COLUMNS[currentRoute.entity] || []}
              onChange={(rows) => updateEntity(currentRoute.entity, rows)}
              role={role}
            />
          )}
        </main>
      </div>
      <SiteFooter />
    </div>
  );
}