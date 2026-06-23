import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BadgeCheck,
  BookOpen,
  Building2,
  CalendarCheck,
  ChevronDown,
  CircleCheck,
  FileCheck2,
  FileText,
  LayoutDashboard,
  Layers,
  Settings,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { BOARD_ROLES } from "../data.js";

const BOARD_MENU = [
  {
    label: "Dashboard",
    items: [{ label: "Dashboard", icon: LayoutDashboard, routeKey: "dashboard", view: "overview" }],
  },
  {
    label: "Academic Master",
    items: [
      { label: "Institutions", icon: Building2, routeKey: "dashboard", view: "institutions" },
      { label: "Courses", icon: Layers, routeKey: "dashboard", view: "courses" },
      { label: "Subjects", icon: BookOpen, routeKey: "dashboard", view: "subjects" },
    ],
  },
  {
    label: "Examination",
    items: [
      { label: "Exam Schedule", icon: CalendarCheck, routeKey: "schedule-approval" },
      { label: "Subject Marks", icon: BadgeCheck, routeKey: "subject-marks" },
    ],
  },
  {
    label: "Approval Center",
    items: [
      { label: "Student Verification", icon: UserCheck, routeKey: "student-verification" },
      { label: "Marks Approval", icon: CircleCheck, routeKey: "marks-approval" },
      { label: "Marksheet Approval", icon: FileCheck2, routeKey: "marksheet-approval" },
    ],
  },
  {
    label: "Reports",
    items: [{ label: "MIS Reports", icon: FileText, routeKey: "reports" }],
  },
  {
    label: "Administration",
    items: [
      { label: "Users", icon: Users, routeKey: "users" },
      { label: "Settings", icon: Settings, routeKey: "features" },
    ],
  },
];

const SUPER_ADMIN_MENU = [
  { label: "Dashboard", items: [{ label: "Dashboard", icon: LayoutDashboard, routeKey: "dashboard" }] },
  {
    label: "Administration",
    items: [
      { label: "Users", icon: Users, routeKey: "users" },
      { label: "Department Admins", icon: UserCheck, routeKey: "department-admins" },
      { label: "User Roles", icon: FileCheck2, routeKey: "roles" },
      { label: "User Mapping", icon: Layers, routeKey: "mappings" },
      { label: "Settings", icon: Settings, routeKey: "features" },
    ],
  },
  { label: "Academic Master", items: [{ label: "Master Data", icon: BookOpen, routeKey: "masters" }] },
  { label: "Reports", items: [{ label: "MIS Reports", icon: FileText, routeKey: "reports" }] },
];

function fallbackMenu(routes) {
  return [
    {
      label: "Modules",
      items: routes.map((route) => ({
        label: route.label,
        icon: route.icon,
        routeKey: route.key,
      })),
    },
  ];
}

function buildMenu(routes, role) {
  const allowedKeys = new Set(routes.map((route) => route.key));
  const source = BOARD_ROLES.includes(role) ? BOARD_MENU : role === "Super Admin" ? SUPER_ADMIN_MENU : fallbackMenu(routes);
  return source
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => allowedKeys.has(item.routeKey) || (item.routeKey === "dashboard" && allowedKeys.has("dashboard"))),
    }))
    .filter((group) => group.items.length > 0);
}

function getActiveGroup(menuGroups, activeRoute, activeDashboardView) {
  return menuGroups.find((group) =>
    group.items.some((item) => {
      if (item.routeKey !== activeRoute) return false;
      if (item.routeKey === "dashboard" && item.view) return activeDashboardView === item.view;
      return true;
    }),
  )?.label;
}

function getDefaultOpenGroups(menuGroups, activeRoute, activeDashboardView) {
  const activeGroup = getActiveGroup(menuGroups, activeRoute, activeDashboardView);
  const fallbackGroup = menuGroups[0]?.label;
  return new Set(activeGroup ? [activeGroup] : fallbackGroup ? [fallbackGroup] : []);
}

export default function Sidebar({ role, routes, activeRoute, activeDashboardView, onNavigate, isOpen, onClose }) {
  const menuGroups = useMemo(() => buildMenu(routes, role), [routes, role]);
  const [openGroups, setOpenGroups] = useState(() =>
    getDefaultOpenGroups(menuGroups, activeRoute, activeDashboardView),
  );

  useEffect(() => {
    setOpenGroups(getDefaultOpenGroups(menuGroups, activeRoute, activeDashboardView));
  }, [menuGroups, activeRoute, activeDashboardView]);

  function toggleGroup(label) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  function isActive(item) {
    if (item.routeKey !== activeRoute) return false;
    if (item.routeKey === "dashboard" && item.view) return activeDashboardView === item.view;
    return true;
  }

  return (
    <>
      <button className={isOpen ? "sidebar-backdrop open" : "sidebar-backdrop"} type="button" onClick={onClose} aria-label="Close menu" />
      <aside className={isOpen ? "sidebar open" : "sidebar"}>
        <div className="brand">
          <div className="brand-mark">
            <Activity size={22} />
          </div>
          <div>
            <strong>EMS</strong>
            <span>BOME &amp; BOEN</span>
          </div>
          <button className="icon-btn sidebar-close" type="button" onClick={onClose} aria-label="Close menu">
            <X size={17} />
          </button>
        </div>
        <nav className="nav-list" aria-label="Role modules">
          {menuGroups.map((group) => {
            const isOpenGroup = openGroups.has(group.label);
            return (
              <section className="nav-group" key={group.label}>
                <button className="nav-group-toggle" type="button" onClick={() => toggleGroup(group.label)}>
                  <span>{group.label}</span>
                  <ChevronDown size={15} className={isOpenGroup ? "open" : ""} />
                </button>
                {isOpenGroup && (
                  <div className="nav-group-items">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={`${group.label}-${item.label}`}
                          className={isActive(item) ? "nav-item active" : "nav-item"}
                          onClick={() => onNavigate(item.routeKey, item.view)}
                        >
                          <Icon size={18} />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
