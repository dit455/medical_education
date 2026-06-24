import { useMemo, useState } from "react";
import SiteHeader from "../components/SiteHeader.jsx";
import SiteFooter from "../components/SiteFooter.jsx";
import Sidebar from "./Sidebar.jsx";
import Topbar from "./Topbar.jsx";
import Dashboard from "./Dashboard.jsx";
import CrudPage from "./CrudPage.jsx";
import DepartmentAdminsPage from "./DepartmentAdminsPage.jsx";
import InstitutionAdminsPage from "./InstitutionAdminsPage.jsx";
import InstitutionPortal from "./InstitutionPortal.jsx";
import ApprovalsPage from "./ApprovalsPage.jsx";
import { ROUTES } from "../routes.js";
import { ENTITY_COLUMNS } from "../data.js";

export default function AppShell({
  role,
  username,
  institutionId,
  data,
  activeRoute,
  setActiveRoute,
  updateEntity,
  onLogout,
  onBoardSwitch,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dashboardView, setDashboardView] = useState("overview");
  const [dashboardViewCommand, setDashboardViewCommand] = useState(null);
  const routesForRole = useMemo(() => ROUTES.filter((route) => route.roles.includes(role)), [role]);
  const currentRoute = routesForRole.find((route) => route.key === activeRoute) || routesForRole[0];
  console.log("AppShell: currentRoute", currentRoute, "activeRoute", activeRoute, "routesForRole", routesForRole);

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
          ) : currentRoute.type === "institution-portal" ? (
            <InstitutionPortal institutionId={institutionId} username={username} />
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
