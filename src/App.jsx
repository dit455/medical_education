import { useEffect, useState } from "react";
import HomePage from "./pages/HomePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import DepartmentSelectPage from "./pages/DepartmentSelectPage.jsx";
import AppShell from "./pages/AppShell.jsx";
import { SEED_DATA } from "./data.js";

const DEFAULT_SESSION = { screen: "home", role: null, loginType: null, username: null };
const SESSION_STORAGE_KEY = "ems-session";
const ACTIVE_ROUTE_STORAGE_KEY = "ems-active-route";

function readStoredSession() {
  try {
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!stored) return DEFAULT_SESSION;
    const parsed = JSON.parse(stored);
    if (!["home", "login", "department-select", "app"].includes(parsed?.screen)) return DEFAULT_SESSION;
    if (parsed.screen === "app" && !parsed.role) return DEFAULT_SESSION;
    return {
      screen: parsed.screen,
      role: parsed.role || null,
      loginType: parsed.loginType || null,
      username: parsed.username || null,
    };
  } catch {
    return DEFAULT_SESSION;
  }
}

function readStoredActiveRoute() {
  try {
    return sessionStorage.getItem(ACTIVE_ROUTE_STORAGE_KEY) || "dashboard";
  } catch {
    return "dashboard";
  }
}

export default function App() {
  const [session, setSession] = useState(readStoredSession);
  const [activeRoute, setActiveRoute] = useState(readStoredActiveRoute);
  const [data, setData] = useState(SEED_DATA);

  useEffect(() => {
    if (session.screen === "home" || session.screen === "login") {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      sessionStorage.removeItem(ACTIVE_ROUTE_STORAGE_KEY);
      return;
    }
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  }, [session]);

  useEffect(() => {
    if (session.screen === "app") {
      sessionStorage.setItem(ACTIVE_ROUTE_STORAGE_KEY, activeRoute);
    }
  }, [activeRoute, session.screen]);

  function handleLoginEntry() {
    setSession({ screen: "login", role: null, loginType: null });
    setActiveRoute("dashboard");
  }

  function handleBackHome() {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    sessionStorage.removeItem(ACTIVE_ROUTE_STORAGE_KEY);
    setSession(DEFAULT_SESSION);
    setActiveRoute("dashboard");
  }

  // Both login tabs hit the same `/api/login` endpoint - the role that comes
  // back from the `users` DB table decides what happens next. Super Admin
  // (and any other non department-admin role) goes straight into the app;
  // a department-admin account still has to pick BOME or BOEN afterwards.
  function handleLogin(user) {
    if (user.role === "department-admin") {
      setSession({ screen: "department-select", role: null, loginType: "department", username: user.username });
      return;
    }
    setSession({ screen: "app", role: user.role, loginType: "super-admin", username: user.username });
    setActiveRoute("dashboard");
  }

  function handleDepartmentSelect(board) {
    setSession((prev) => ({ screen: "app", role: board, loginType: "department", username: prev.username }));
    setActiveRoute("dashboard");
  }

  function handleBoardSwitch() {
    sessionStorage.removeItem(ACTIVE_ROUTE_STORAGE_KEY);
    setSession({ screen: "department-select", role: null, loginType: "department" });
    setActiveRoute("dashboard");
  }

  function handleLogout() {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    sessionStorage.removeItem(ACTIVE_ROUTE_STORAGE_KEY);
    setSession(DEFAULT_SESSION);
    setActiveRoute("dashboard");
  }

  function updateEntity(entity, rows) {
    setData((prev) => ({ ...prev, [entity]: rows }));
  }

  if (session.screen === "home") {
    return <HomePage onLoginClick={handleLoginEntry} />;
  }
  if (session.screen === "login") {
    return <LoginPage onLogin={handleLogin} onBackHome={handleBackHome} />;
  }
  if (session.screen === "department-select") {
    return <DepartmentSelectPage onBack={handleLogout} onSelect={handleDepartmentSelect} />;
  }
  return (
    <AppShell
      role={session.role}
      username={session.username}
      data={data}
      activeRoute={activeRoute}
      setActiveRoute={setActiveRoute}
      updateEntity={updateEntity}
      onLogout={handleLogout}
      onBoardSwitch={session.loginType === "department" ? handleBoardSwitch : null}
    />
  );
}
