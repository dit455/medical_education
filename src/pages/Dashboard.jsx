import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  GraduationCap,
  Users,
  CalendarCheck,
  BadgeCheck,
  Building2,
  Layers,
  BookOpen,
  UserCheck,
  ClipboardCheck,
  Plus,
  Pencil,
  Trash2,
  Activity,
  X,
  FileText,
  Link2,
  ArrowLeft,
} from "lucide-react";
import StatusBadge from "../components/StatusBadge.jsx";
import DataTable from "../components/DataTable.jsx";
import RecordModal from "../components/RecordModal.jsx";
import SubjectEditModal from "../components/SubjectEditModal.jsx";
import CourseSelectModal from "../components/CourseSelectModal.jsx";
import RecordPickModal from "../components/RecordPickModal.jsx";
import ListViewModal from "../components/ListViewModal.jsx";
import ViewStudentsModal from "../components/ViewStudentsModal.jsx";
import SubjectMapModal from "../components/SubjectMapModal.jsx";
import AddSubjectModal from "../components/AddSubjectModal.jsx";
import CascadeEditModal from "../components/CascadeEditModal.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import KpiCard from "../components/KpiCard.jsx";
import Breadcrumb from "../components/Breadcrumb.jsx";
import { BOARD_ROLES, ENTITY_FIELDS, ENTITY_COLUMNS } from "../data.js";
import { isStatusVisibleForRole, emptyRowFromFields, formatDate } from "../utils.js";
import * as api from "../api.js";

export default function Dashboard({
  data,
  role,
  username,
  routes,
  setActiveRoute,
  dashboardView,
  dashboardViewCommand,
  onDashboardViewChange,
  onNavigateBack,
  onOpenAcademicMaster,
}) {
  if (BOARD_ROLES.includes(role)) {
    return (
      <BoardDashboard
        role={role}
        username={username}
        data={data}
        setActiveRoute={setActiveRoute}
        dashboardView={dashboardView}
        dashboardViewCommand={dashboardViewCommand}
        onDashboardViewChange={onDashboardViewChange}
        onNavigateBack={onNavigateBack}
        onOpenAcademicMaster={onOpenAcademicMaster}
      />
    );
  }

  const stats = [
    { label: "Students", value: data.students.length, meta: "Student records", icon: GraduationCap },
    { label: "Users", value: data.users.length, meta: "Active access", icon: Users },
    { label: "Schedules", value: data.schedules.length, meta: "Exam planning", icon: CalendarCheck },
    { label: "Marks", value: data.studentMarks.length, meta: "Marks entries", icon: BadgeCheck },
  ];
  const visibleWorkflows = data.workflows.filter((workflow) => isStatusVisibleForRole(workflow.status, role));

  return (
    <section className="content-stack dashboard-overview">
      <div className="kpi-grid">
        {stats.map((stat) => (
          <KpiCard key={stat.label} {...stat} />
        ))}
      </div>
      <div className="dashboard-support-grid two-column">
        <RecentActivities workflows={visibleWorkflows} />
        <section className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Access</p>
              <h2>Available Modules</h2>
            </div>
          </div>
          <div className="module-grid">
            {routes
              .filter((route) => route.type !== "dashboard" && !route.hidden)
              .slice(0, 8)
              .map((route) => {
                const Icon = route.icon;
                return (
                  <button className="module-tile" key={route.key} onClick={() => setActiveRoute(route.key)}>
                    <Icon size={18} />
                    <span>{route.label}</span>
                  </button>
                );
              })}
          </div>
        </section>
      </div>
    </section>
  );
}

function BoardDashboard({ role, username, data, setActiveRoute, dashboardView, dashboardViewCommand, onDashboardViewChange, onNavigateBack, onOpenAcademicMaster }) {
  const [view, setView] = useState(
    () => sessionStorage.getItem("ems_dash_view") || dashboardView || "overview"
  );
  const [institutions, setInstitutions] = useState([]);
  const [coursesForInstitution, setCoursesForInstitution] = useState([]);
  const [subjectsForCourse, setSubjectsForCourse] = useState([]);
  const [viewStudentsOpen, setViewStudentsOpen] = useState(false);
  const [regions, setRegions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [years, setYears] = useState([]);
  const [examSems, setExamSems] = useState([]);
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const numOrNull = (v) => (v == null || v === "" ? null : Number(v));
  const [selectedInstitutionId, setSelectedInstitutionId] = useState(
    () => numOrNull(sessionStorage.getItem("ems_dash_inst"))
  );
  const [selectedCourseId, setSelectedCourseId] = useState(
    () => numOrNull(sessionStorage.getItem("ems_dash_course"))
  );
  const [selectedSubjectId, setSelectedSubjectId] = useState(
    () => numOrNull(sessionStorage.getItem("ems_dash_subject"))
  );
  const [addModal, setAddModal] = useState(null);

  // Persist the current view + selection across reloads (per browser tab).
  useEffect(() => {
    if (view) sessionStorage.setItem("ems_dash_view", view);
  }, [view]);
  useEffect(() => {
    if (selectedInstitutionId == null) sessionStorage.removeItem("ems_dash_inst");
    else sessionStorage.setItem("ems_dash_inst", String(selectedInstitutionId));
  }, [selectedInstitutionId]);
  useEffect(() => {
    if (selectedCourseId == null) sessionStorage.removeItem("ems_dash_course");
    else sessionStorage.setItem("ems_dash_course", String(selectedCourseId));
  }, [selectedCourseId]);
  useEffect(() => {
    if (selectedSubjectId == null) sessionStorage.removeItem("ems_dash_subject");
    else sessionStorage.setItem("ems_dash_subject", String(selectedSubjectId));
  }, [selectedSubjectId]);
  const [newInstitutionCredentials, setNewInstitutionCredentials] = useState(null);
  const [isSubjectDetailsOpen, setIsSubjectDetailsOpen] = useState(false);

  const pendingApprovals = data.workflows.filter(
    (workflow) => workflow.board === role && ["Submitted", "Verified"].includes(workflow.status),
  );

  const refreshInstitutions = useCallback(() => {
      api.getInstitutions(role)
        .then((data) => setInstitutions([...data].sort((a, b) => a.name.localeCompare(b.name))))
        .catch(() => setInstitutions([]));
    }, [role]);

  const refreshCourses = useCallback((institutionId) => {
    if (!institutionId) {
      setCoursesForInstitution([]);
      return;
    }
    api.getCourses(institutionId).then(setCoursesForInstitution).catch(() => setCoursesForInstitution([]));
  }, []);

  const refreshSubjects = useCallback((courseId) => {
    if (!courseId) {
      setSubjectsForCourse([]);
      return;
    }
    api.getSubjects(courseId).then(setSubjectsForCourse).catch(() => setSubjectsForCourse([]));
  }, []);

  const didMountRef = useRef(false);
  useEffect(() => {
    refreshInstitutions();
    // Don't wipe the restored selection on the initial mount — only clear
    // when the role actually changes afterwards.
    if (didMountRef.current) {
      setSelectedInstitutionId(null);
      setSelectedCourseId(null);
      setSelectedSubjectId(null);
    } else {
      didMountRef.current = true;
    }
  }, [role, refreshInstitutions]);

  useEffect(() => {
    api.getRegions().then(setRegions).catch(() => setRegions([]));
    api.getCategories().then(setCategories).catch(() => setCategories([]));
    api.getYears().then(setYears).catch(() => setYears([]));
    api.getExamSems().then(setExamSems).catch(() => setExamSems([]));
    api.getListCourses().then(setCourses).catch(() => setCourses([]));
    api.getListSubjects().then(setSubjects).catch(() => setSubjects([]));
  }, []);

  useEffect(() => {
    refreshCourses(selectedInstitutionId);
  }, [selectedInstitutionId, refreshCourses]);

  useEffect(() => {
    refreshSubjects(selectedCourseId);
  }, [selectedCourseId, refreshSubjects]);

  const selectedInstitution = institutions.find((i) => i.id === selectedInstitutionId) || null;
  const selectedInstitutionIdResolved = selectedInstitution?.id || null;
  const selectedCourse = coursesForInstitution.find((c) => c.id === selectedCourseId) || null;
  const selectedCourseIdResolved = selectedCourse?.id || null;
  const selectedSubject = subjectsForCourse.find((s) => s.id === selectedSubjectId) || null;

  // Re-fetch whenever the Subjects view becomes active again (e.g. after
  // approving a pending mark change on the Approvals page and navigating
  // back here), so Total Max/Pass reflect the just-applied change.
  useEffect(() => {
    if (view === "subjects" && selectedCourseIdResolved) {
      refreshSubjects(selectedCourseIdResolved);
    }
  }, [view, selectedCourseIdResolved, refreshSubjects]);

  useEffect(() => {
    onDashboardViewChange?.(view);
  }, [view, onDashboardViewChange]);

  useEffect(() => {
    if (!dashboardViewCommand) return;
    setView(dashboardViewCommand.view);
    if (dashboardViewCommand.view === "overview" || dashboardViewCommand.view === "institutions") {
      setSelectedInstitutionId(null);
      setSelectedCourseId(null);
      setSelectedSubjectId(null);
      setIsSubjectDetailsOpen(false);
    }
    if (dashboardViewCommand.view === "courses") {
      setSelectedCourseId(null);
      setSelectedSubjectId(null);
      setIsSubjectDetailsOpen(false);
    }
    if (dashboardViewCommand.view === "subjects") {
      setSelectedSubjectId(null);
      setIsSubjectDetailsOpen(false);
    }
    if (dashboardViewCommand.add === "institution") openForm("institution", "add");
    if (dashboardViewCommand.add === "course") setAddCourseOpen(true);
    if (dashboardViewCommand.add === "subject") openAddModal("subject");
  }, [dashboardViewCommand]);

  const regionOptions = useMemo(
    () => regions.map((r) => ({ value: String(r.id), label: r.name })),
    [regions],
  );
  const categoryOptions = useMemo(
    () => categories.map((ct) => ({ value: String(ct.id), label: ct.name })),
    [categories],
  );
  const yearOptions = useMemo(
    () => years.map((y) => ({ value: String(y.id), label: y.name })),
    [years],
  );
  const semOptions = useMemo(
    () => examSems.map((s) => ({ value: String(s.id), label: s.name })),
    [examSems],
  );

  const institutionOptions = useMemo(
    () => institutions.map((i) => ({ value: String(i.id), label: (i.name || "").toUpperCase() })),
    [institutions],
  );
  const courseOptions = useMemo(
    () => courses.map((c) => ({ value: String(c.id), label: c.name })),
    [courses],
  );
  const subjectOptions = useMemo(
    () => subjects.map((s) => ({ value: String(s.id), label: s.name })),
    [subjects],
  );

  const institutionFields = useMemo(
    () =>
      ENTITY_FIELDS.institution
        .map(([key, label, options]) => {
          if (key === "region") return [key, label, regionOptions];
          if (key === "category") return [key, label, categoryOptions];
          return [key, label, options];
        }),
    [regionOptions, categoryOptions],
  );
  const subjectFields = useMemo(
    () =>
      ENTITY_FIELDS.boardSubject.map(([key, label, options]) => {
        if (key === "year") return [key, label, yearOptions];
        if (key === "semester") return [key, label, semOptions];
        return [key, label, options];
      }),
    [yearOptions, semOptions],
  );

  function resolveRegionId(regionValue) {
    if (!regionValue) return null;
    const byId = regions.find((r) => String(r.id) === String(regionValue));
    if (byId) return byId.id;
    const byName = regions.find((r) => r.name === regionValue);
    return byName ? byName.id : null;
  }

  function resolveCategoryId(categoryValue) {
    if (!categoryValue) return null;
    const byId = categories.find((ct) => String(ct.id) === String(categoryValue));
    if (byId) return byId.id;
    const byName = categories.find((ct) => ct.name === categoryValue);
    return byName ? byName.id : null;
  }

  function resolveYearId(yearValue) {
    if (!yearValue) return null;
    const byId = years.find((y) => String(y.id) === String(yearValue));
    if (byId) return byId.id;
    const byName = years.find((y) => y.name === yearValue);
    return byName ? byName.id : null;
  }

  function resolveSemId(semValue) {
    if (!semValue) return null;
    const byId = examSems.find((s) => String(s.id) === String(semValue));
    if (byId) return byId.id;
    const byName = examSems.find((s) => s.name === semValue);
    return byName ? byName.id : null;
  }

    async function saveInstitution(values) {
    const email = (values.email || "").trim();
    if (!/^[^\s@]+@gmail\.com$/i.test(email)) {
      alert("Please enter a valid Gmail address ending in @gmail.com");
      throw new Error("Invalid email");
    }
    const norm = (v) => (v || "").trim().toUpperCase();
    const others = institutions.filter((i) => String(i.id) !== String(values.id));

    // Email must be unique on its own.
    const emailClash = others.some((i) => norm(i.email) === norm(values.email));
    if (emailClash) {
      alert("This email is already registered to another institution.");
      throw new Error("Duplicate email");
    }

    // A full duplicate = same name, region and category.
    const fullDuplicate = others.some(
      (i) =>
        norm(i.name) === norm(values.name) &&
        norm(i.region) === norm(values.region) &&
        norm(i.category) === norm(values.category)
    );
    if (fullDuplicate) {
      alert("An institution with the same name, region and category already exists.");
      throw new Error("Duplicate institution");
    }
    const payload = {
      name: (values.name || "").toUpperCase(),
      email: values.email,
      abbreviation: (values.abbreviation || "").trim(),
      region_id: resolveRegionId(values.region),
      category_id: resolveCategoryId(values.category),
      status: values.status || "Active",
      board: role,
      actor: username,
    };
    if (values.id) {
      await api.updateInstitution(values.id, payload);
    } else {
      const created = await api.createInstitution(payload);
      setSelectedInstitutionId(created.id);
      setSelectedCourseId(null);
      setSelectedSubjectId(null);
      if (created.creatorLogin) {
        setNewInstitutionCredentials({
          name: created.name,
          creator: created.creatorLogin,
          approver: created.approverLogin,
        });
      }
    }
    refreshInstitutions();
  }

  async function deleteInstitutionRow(row) {
    await api.deleteInstitution(row.id);
    if (selectedInstitutionIdResolved === row.id) {
      setSelectedInstitutionId(null);
      setSelectedCourseId(null);
      setSelectedSubjectId(null);
    }
    refreshInstitutions();
  }

  async function toggleInstitutionRow(row) {
    const nextStatus = row.status === "Inactive" ? "Active" : "Inactive";
    await api.updateInstitution(row.id, {
      name: row.name,
      region_id: resolveRegionId(row.region),
      category_id: resolveCategoryId(row.category),
      status: nextStatus,
      actor: username,
    });
    refreshInstitutions();
  }

  async function saveCourse(values) {
    const payload = { name: (values.name || "").toUpperCase(), status: values.status || "Active", duration: values.duration || null, abbreviation: (values.abbreviation || "").trim(), actor: username };
    if (values.id) {
      await api.updateCourse(values.id, payload);
    } else {
      const created = await api.createCourse(selectedInstitutionIdResolved, payload);
      setSelectedCourseId(created.id);
      setSelectedSubjectId(null);
    }
    refreshCourses(selectedInstitutionIdResolved);
  }

  async function deleteCourseRow(row) {
    await api.deleteCourse(selectedInstitutionIdResolved, row.id);
    if (selectedCourseIdResolved === row.id) {
      setSelectedCourseId(null);
      setSelectedSubjectId(null);
    }
    refreshCourses(selectedInstitutionIdResolved);
  }

  async function toggleCourseRow(row) {
    const nextStatus = row.status === "Inactive" ? "Active" : "Inactive";
    await api.updateCourse(row.id, { name: row.name, status: nextStatus, actor: username });
    refreshCourses(selectedInstitutionIdResolved);
  }

  async function saveSubject(values) {
    const payload = {
      subject: (values.subject || "").toUpperCase(),
      year_id: resolveYearId(values.year),
      sem_id: resolveSemId(values.semester),
      priority: values.priority || null,
      status: values.status || "Active",
      actor: username,
    };
    if (values.id) {
      await api.updateSubject(values.id, payload);
    } else {
      const created = await api.createSubject(selectedCourseIdResolved, payload);
      setSelectedSubjectId(created.id);
    }
    refreshSubjects(selectedCourseIdResolved);
  }

  async function deleteSubjectRow(row) {
    await api.deleteSubject(row.id);
    if (selectedSubjectId === row.id) setSelectedSubjectId(null);
    refreshSubjects(selectedCourseIdResolved);
  }

  async function toggleSubjectRow(row) {
    const nextStatus = row.status === "Inactive" ? "Active" : "Inactive";
    await api.updateSubject(row.id, {
      subject: row.subject,
      year_id: resolveYearId(row.year),
      sem_id: resolveSemId(row.semester),
      priority: row.priority,
      status: nextStatus,
      actor: username,
    });
    refreshSubjects(selectedCourseIdResolved);
  }

  const addModalConfig = {
    institution: { title: "Institution", fields: institutionFields },
  };

  const [courseSelectOpen, setCourseSelectOpen] = useState(false);
  const courseSelectOptions = courseOptions.filter(
    (option) =>
      !coursesForInstitution.some(
        (c) => (c.name || "").trim().toLowerCase() === (option.label || "").trim().toLowerCase(),
      ),
  );

  const [subjectSelectOpen, setSubjectSelectOpen] = useState(false);
  const subjectSelectOptions = subjectOptions.filter(
    (option) =>
      !subjectsForCourse.some(
        (s) => (s.subject || "").trim().toLowerCase() === (option.label || "").trim().toLowerCase(),
      ),
  );

  // Unified add / edit / view modal driven by the action bar below the KPI
  // cards. Each entity maps to its field set and the matching save handler.
  const [formModal, setFormModal] = useState(null);
  const [subjectModalState, setSubjectModalState] = useState(null);
  const [editPick, setEditPick] = useState(null);
  const [editCourseOpen, setEditCourseOpen] = useState(false);
  const [editSubjectOpen, setEditSubjectOpen] = useState(false);
  const entityForm = {
    institution: { title: "Institute", fields: institutionFields, save: saveInstitution },
    course: { title: "Course", fields: ENTITY_FIELDS.course, save: saveCourse },
    subject: { title: "Subject", fields: subjectFields, save: saveSubject },
  };

  function openForm(entity, mode, row) {
    const cfg = entityForm[entity];
    setFormModal({ entity, mode, row: row || emptyRowFromFields(cfg.fields) });
  }

  async function handleFormSave(values) {
    await entityForm[formModal.entity].save(values);
    setFormModal(null);
  }

  // ---- Course dashboard action flows (Add / Map / View) -------------------
  const [addCourseOpen, setAddCourseOpen] = useState(false);
  const [mapCourseOpen, setMapCourseOpen] = useState(false);
  const [mapCoursePreMapped, setMapCoursePreMapped] = useState([]);
  const [mapCourseInstId, setMapCourseInstId] = useState(null);
  const [viewCourseOpen, setViewCourseOpen] = useState(false);

  // Add Course needs an Institute picker since the user may reach the Courses
  // view without first selecting an institution from the table.
  const addCourseFields = useMemo(
    () => [
      ["name", "Course"],
      ["abbreviation", "Abbreviation"],
      ["status", "Status", ["Active", "Inactive"]],
    ],
    [],
  );

  // Maps the chosen course names to the chosen institute. Switches the table
  // to that institute so the result is visible immediately.
  async function mapCoursesToInstitute(instituteId, names, status = "Active") {
    const id = Number(instituteId);
    if (!id || names.length === 0) return;
    for (const name of names) {
      await api.createCourse(id, { name, status, actor: username });
    }
    setSelectedInstitutionId(id);
    setSelectedCourseId(null);
    setSelectedSubjectId(null);
    setView("courses");
    refreshCourses(id);
    refreshInstitutions();
  }

  async function handleAddCourseSave(values) {
    if (!values.name?.trim()) {
      alert("Course name is required.");
      return;
    }
    try {
      await api.createMasterCourse({
        name: values.name.trim(),
        status: values.status || "Active",
        abbreviation: (values.abbreviation || "").trim(),
        actor: username,
      });
      setAddCourseOpen(false);
      if (typeof refreshCourseMaster === "function") refreshCourseMaster();
    } catch (err) {
      console.error("Add course failed:", err.message);
      alert(err.message);
    }
  }

  async function handleMapCourseSave(names, extra) {
    try {
      const instId = extra?.institute || mapCourseInstId || selectedInstitutionIdResolved;
      if (!instId) {
        alert("Please select an institution first.");
        return;
      }
      await mapCoursesToInstitute(instId, names);
      setMapCourseOpen(false);
    } catch (err) {
      alert(err.message || "Could not map courses.");
    }
  }

  // When the user picks an institute inside the Map Course modal, fetch that
  // institute's already-mapped courses and return their names so the modal can
  // hide them from the checklist.
  async function handleMapCourseInstituteChange(instituteId) {
    if (!instituteId) return [];
    try {
      const mapped = await api.getCourses(Number(instituteId));
      return mapped.map((c) => c.name);
    } catch {
      return [];
    }
  }

  // ---- Subject dashboard action flows (Add / Map / View) ------------------
  const [addSubjectOpen, setAddSubjectOpen] = useState(false);
  const [editMarksSubject, setEditMarksSubject] = useState(null);
  const [mapSubjectOpen, setMapSubjectOpen] = useState(false);
  const [viewSubjectOpen, setViewSubjectOpen] = useState(false);

  function refreshSubjectMaster() {
    api.getListSubjects().then(setSubjects).catch(() => {});
  }

  // Add Subject collects a subject + IA/EA/TP divisions (max/pass) + effective
  // date from AddSubjectModal. The modal shows its own confirmation popup after
  // save, so we DON'T close it here — the user closes it via "Done".
  async function handleAddSubjectSave(values) {
    if (!selectedCourseIdResolved) {
      alert("Please select a course first.");
      return;
    }
    if (!values.subjectName?.trim()) {
      alert("Subject is required.");
      return;
    }
    try {
      await api.createSubject(selectedCourseIdResolved, {
        subject: values.subjectName.trim(),
        year_id: years[0]?.id || null,
        sem_id: examSems[0]?.id || null,
        priority: subjectsForCourse.length + 1,
        status: "Active",
        divisions: values.divisions,
        effective_date: values.effectiveDate || null,
        totalMarks: values.totalMarks,
        signature_name: values.signatureName,
        actor: username,
      });
      refreshSubjects(selectedCourseIdResolved);
      refreshSubjectMaster();
    } catch (err) {
      console.error("Add subject failed:", err.message);
      alert(err.message);
      throw err;
    }
  }


   
    async function handleMergedSubjectSave(values) {
    if (!selectedCourseIdResolved || !selectedInstitutionIdResolved) {
      alert("Please select a course first.");
      return;
    }
    if (!selectedSubject) return;
    try {
      await api.updateSubject(selectedSubject.id, {
        courseId: selectedCourseIdResolved,
        subject: values.subjectName.trim(),
        yearId: resolveYearId(values.year) || years[0]?.id || null,
        semId: resolveSemId(values.semester) || examSems[0]?.id || null,
        priority: values.priority || 1,
        status: "Active",
        divisions: values.divisions,
        effectiveDate: values.effectiveDate,
        totalMarks: values.totalMarks,
        signatureName: values.signatureName,
        actor: username,
      });
      refreshSubjects(selectedCourseIdResolved);
    } catch (err) {
      alert(err.message);
    }
  }
  // Mark changes need approval by a competent official before they take
  // effect: this submits a pending-change instead of saving directly.
  // apply_create_subject (dispatched on approval) reuses the existing
  // course_subject_id, so no duplicate row is created.
  async function handleEditMarksSave(values) {
    if (!selectedCourseIdResolved || !selectedInstitutionIdResolved) {
      alert("Please select a course first.");
      return;
    }
    try {
      const defaultYear = years[0]?.id || null;
      const defaultSem = examSems[0]?.id || null;
      await api.updateSubject(editMarksSubject.id, {
        courseId: selectedCourseIdResolved,
        subject: values.subjectName.trim(),
        yearId: resolveYearId(editMarksSubject.year) || defaultYear,
        semId: resolveSemId(editMarksSubject.semester) || defaultSem,
        priority: editMarksSubject.priority || 1,
        status: "Active",
        divisions: values.divisions,
        effectiveDate: values.effectiveDate,
        totalMarks: values.totalMarks,
        signatureName: values.signatureName,
        actor: username,
      });
      refreshSubjects(selectedCourseIdResolved);
    } catch (err) {
      console.error("Submit mark change failed:", err.message);
      alert(err.message);
    }
  }

  async function handleMapSubjectSave(courseId, instituteId, names, extra) {
    if (!courseId || names.length === 0) return;
    const year_id = resolveYearId(extra.year);
    const sem_id = resolveSemId(extra.semester);
    // priority_id is NOT NULL in tbl_course_subject_map; assign sequential
    // priorities so each mapped subject gets a distinct, valid value.
    for (let i = 0; i < names.length; i++) {
      await api.createSubject(courseId, {
        subject: names[i],
        year_id,
        sem_id,
        priority: i + 1,
        status: "Active",
        actor: username,
      });
    }
    setSelectedInstitutionId(instituteId);
    setSelectedCourseId(courseId);
    setSelectedSubjectId(null);
    setView("subjects");
    refreshSubjectMaster();
    refreshSubjects(courseId);
    setMapSubjectOpen(false);
  }

  function openAddModal(type) {
    if (type === "course") {
      setCourseSelectOpen(true);
      return;
    }
    if (type === "subject") {
      setSubjectSelectOpen(true);
      return;
    }
    const fields = addModalConfig[type].fields;
    setAddModal({ type, row: emptyRowFromFields(fields) });
  }

  async function handleAddModalSave(values) {
    try {
      if (addModal.type === "institution") await saveInstitution(values);
      setAddModal(null);
    } catch (err) {
      alert(err.message || "Could not save institution.");
      // keep the modal open so the user can correct and retry
    }
  }

  async function handleCourseSelectSave(names, extraValues) {
    for (const name of names) {
      await saveCourse({ name, duration: extraValues?.duration });
    }
    setCourseSelectOpen(false);
  }

  async function handleSubjectSelectSave(names, extraValues) {
    // priority_id is NOT NULL in tbl_course_subject_map; assign sequential
    // priorities so each mapped subject gets a distinct, valid value.
    for (let i = 0; i < names.length; i++) {
      await saveSubject({
        subject: names[i],
        year: extraValues.year,
        semester: extraValues.semester,
        priority: i + 1,
      });
    }
    setSubjectSelectOpen(false);
  }

  function goToInstitutions() {
    setSelectedInstitutionId(null);
    setSelectedCourseId(null);
    setSelectedSubjectId(null);
    setIsSubjectDetailsOpen(false);
    setView("institutions");
  }

  function goToCourses() {
    setSelectedCourseId(null);
    setSelectedSubjectId(null);
    setIsSubjectDetailsOpen(false);
    setView(selectedInstitutionIdResolved ? "courses" : "institutions");
  }

  function openSubjectDetails(row) {
    setSelectedSubjectId(row.id);
    setIsSubjectDetailsOpen(true);
  }

  const metrics = [
    /*{
      label: "Institutions",
      value: institutions.length,
      meta: "Board master",
      icon: Building2,
    },
    {
      label: "Courses",
      value: coursesForInstitution.length,
      meta: selectedInstitution ? "Selected institution" : "Select institution",
      icon: Layers,
    },
    {
      label: "Subjects",
      value: subjectsForCourse.length,
      meta: selectedCourse ? "Selected course" : "Select course",
      icon: BookOpen,
    },
    {
      label: "Pending Approvals",
      value: pendingApprovals.length,
      meta: `${role} queue`,
      icon: ClipboardCheck,
    },*/
  ];

  const breadcrumbs = [
    { label: "Dashboard", onClick: view !== "overview" ? () => { setView("overview"); setSelectedInstitutionId(null); setSelectedCourseId(null); setSelectedSubjectId(null); setIsSubjectDetailsOpen(false); } : null },
    view !== "overview" && { label: "Academic Mapping", onClick: goToInstitutions },
    view === "institutions" && { label: "Institutions" },
    view === "courses" && !selectedInstitution && { label: "Courses" },
    view === "subjects" && !selectedCourse && { label: "Subjects" },
    selectedInstitution && { label: "Institutions", onClick: goToInstitutions },
    selectedInstitution && { label: selectedInstitution.name, onClick: selectedCourse ? goToCourses : null },
    selectedInstitution && view !== "institutions" && { label: "Courses", onClick: selectedCourse ? goToCourses : null },
    selectedCourse && { label: selectedCourse.name },
    selectedCourse && view === "subjects" && { label: "Subjects" },
  ].filter(Boolean);

  const tableConfig = {
    institutions: {
      title: "Institution Master",
      rows: institutions,
      columns: ENTITY_COLUMNS.institutions,
      fields: institutionFields,
      selectedId: selectedInstitutionIdResolved,
      emptyHint: "No institutions",
      emptyActionLabel: "Add Institution",
      onEmptyAction: () => openAddModal("institution"),
      onSelect: (row) => {
        setSelectedInstitutionId(row.id);
        setSelectedCourseId(null);
        setSelectedSubjectId(null);
        setView("courses");
      },
      onSave: saveInstitution,
      onDelete: deleteInstitutionRow,
      onToggle: toggleInstitutionRow,
    },
    courses: {
      title: `Course Master${selectedInstitution ? ` - ${selectedInstitution.name}` : ""}`,
      rows: selectedInstitutionIdResolved ? coursesForInstitution : [],
      columns: ENTITY_COLUMNS.courses,
      fields: ENTITY_FIELDS.course,
      selectedId: selectedCourseIdResolved,
      disabled: !selectedInstitutionIdResolved,
      disabledHint: "Select an institution from Institution Master",
      emptyHint: selectedInstitutionIdResolved ? "No courses mapped" : "Select an institution from Institution Master",
      emptyActionLabel: "Map Course to this Institute",
      onEmptyAction: () => openAddModal("course"),
      addLabel: "Add New Course",
      secondaryAddLabel: "Add Existing Course",
      onSecondaryAdd: () => setCourseSelectOpen(true),
      toolbarActionLabel: "Map Course to this Institute",
      onToolbarAction: () => setCourseSelectOpen(true),
      onSelect: (row) => {
        setSelectedCourseId(row.id);
        setSelectedSubjectId(null);
        setView("subjects");
      },
      onSave: saveCourse,
      onDelete: deleteCourseRow,
      onToggle: toggleCourseRow,
    },
    subjects: {
      title: `Subject Master${selectedInstitution ? ` - ${selectedInstitution.name}` : ""}${selectedCourse ? ` - ${selectedCourse.name}` : ""}`,
      rows: selectedCourseIdResolved ? subjectsForCourse : [],
      columns: ENTITY_COLUMNS.boardSubjects,
      fields: subjectFields,
      selectedId: selectedSubject?.id || null,
      disabled: !selectedCourseIdResolved,
      disabledHint: "Select a course from Course Master",
      emptyHint: selectedCourseIdResolved ? "No subjects mapped" : "Select a course from Course Master",
      emptyActionLabel: "Add Subject",
      onEmptyAction: () => openAddModal("subject"),
      addLabel: "Add New Subject",
      secondaryAddLabel: "Add Existing Subject",
      onSecondaryAdd: () => setSubjectSelectOpen(true),
      toolbarActionLabel: "Map Subject to this Institute",
      onToolbarAction: () => setSubjectSelectOpen(true),
      onSelect: openSubjectDetails,
      onView: openSubjectDetails,
      onSave: saveSubject,
      onDelete: deleteSubjectRow,
      onToggle: toggleSubjectRow,
    },
  }[view];

  // Per-view action buttons rendered directly under the KPI cards. These
  // replace the add buttons that used to live in the table-card header.
  const actionBar = {

    
    institutions: [
     /* { label: "Add Institute", icon: Plus, primary: true, onClick: () => openForm("institution", "add") },*/
      /*{
        label: "Edit Institute",
        icon: Pencil,
        disabled: institutions.length === 0,
        title: institutions.length === 0 ? "No institutions to edit" : "",
        onClick: () => setEditPick("institution"),
      },*/
      
    ],
    courses: [
      /*{
        label: "Add Course",
        icon: Plus,
        primary: true,
        disabled: institutions.length === 0,
        title: institutions.length === 0 ? "Add an institution first" : "",
        onClick: () => setAddCourseOpen(true),
      },
      {
        label: "Map Course",
        icon: Link2,
        disabled: institutions.length === 0 || courses.length === 0,
        title:
          institutions.length === 0
            ? "Add an institution first"
            : courses.length === 0
              ? "No existing courses to map"
              : "",
          onClick: async () => {
          const instId =
            selectedInstitutionIdResolved ||
            (sessionStorage.getItem("ems_dash_inst")
              ? Number(sessionStorage.getItem("ems_dash_inst"))
              : null);
          setMapCourseInstId(instId);
          if (instId) {
            const mapped = await handleMapCourseInstituteChange(instId);
            setMapCoursePreMapped(mapped);
          }
          setMapCourseOpen(true);
        },
      },
      {
        label: "Edit Course",
        icon: Pencil,
        disabled: institutions.length === 0,
        title: institutions.length === 0 ? "Add an institution first" : "",
        onClick: () => setEditCourseOpen(true),
      },
      {
        label: "View Course",
        icon: FileText,
        disabled: courses.length === 0,
        title: courses.length === 0 ? "No courses to view" : "",
        onClick: () => setViewCourseOpen(true),
      },*/
    ],
    subjects: [
      {
        label: "Assign Mark to existing Subject",
        icon: Plus,
        primary: true,
        disabled: courses.length === 0 || !selectedCourseIdResolved,
        title: courses.length === 0
          ? "Add a course first"
          : !selectedCourseIdResolved
            ? "Select a course from Course Master first"
            : "",
        onClick: () => setAddSubjectOpen(true),
      },
      /*{
        label: "Add Subject",
        icon: Plus,
        disabled: !selectedCourseIdResolved,
        title: !selectedCourseIdResolved ? "Select a course from Course Master first" : "",
        onClick: () =>
          setSubjectModalState({ mode: "add", row: emptyRowFromFields(subjectFields) }),
      },
      {
        label: "Map Subject",
        icon: Link2,
        disabled: institutions.length === 0 || subjects.length === 0,
        title:
          institutions.length === 0
            ? "Add an institution first"
            : subjects.length === 0
              ? "No existing subjects to map"
              : "",
        onClick: () => setMapSubjectOpen(true),
      },
      {
        label: "Edit Subject",
        icon: Pencil,
        disabled: institutions.length === 0,
        title: institutions.length === 0 ? "Add an institution first" : "",
        onClick: () => setEditSubjectOpen(true),
      },
      {
        label: "View Subject",
        icon: FileText,
        disabled: subjects.length === 0,
        title: subjects.length === 0 ? "No subjects to view" : "",
        onClick: () => setViewSubjectOpen(true),
      },
      {
        label: "View Student",
        icon: FileText,
        disabled: !selectedInstitutionIdResolved,
        title: !selectedInstitutionIdResolved ? "Select an institution first" : "",
        onClick: () => setViewStudentsOpen(true),
      },*/
    ],
    
  }[view];

  const canGoBack = view === "courses" || view === "subjects";
  function handleBack() {
    if (view === "subjects") {
      goToCourses();
    } else if (view === "courses") {
      goToInstitutions();
    }
  }

  return (
    <section className="board-dashboard">
      <div className="dashboard-command-row">
        <div>
          {canGoBack && (
            <button type="button" className="back-btn" onClick={handleBack}>
              <ArrowLeft size={16} />
              Back
            </button>
          )}
          <Breadcrumb items={breadcrumbs} />
          
        </div>
        <StatusBadge status={role} />
      </div>

      <div className="kpi-grid" aria-label="Board KPIs">
        {metrics.map((metric) => (
          <KpiCard key={metric.label} {...metric} />
        ))}
      </div>

      {view === "overview" && (
        <div className="overview-modules">
          <div className="overview-group">
            <p className="eyebrow">Academic Master</p>
            <div className="overview-module-grid">
              <button className="overview-module-tile" style={{ "--fc": "#12A37F", "--fb": "#e8f7f1" }} onClick={() => onOpenAcademicMaster("institutions")}>
                <span className="overview-module-icon"><Building2 size={26} /></span>
                <span>Institution Master</span>
               
              </button>
              <button className="overview-module-tile" style={{ "--fc": "#12A37F", "--fb": "#e8f7f1" }} onClick={() => onOpenAcademicMaster("courses")}>
                <span className="overview-module-icon"><Layers size={26} /></span>
                <span>Course Master</span>
           
              </button>
              <button className="overview-module-tile" style={{ "--fc": "#12A37F", "--fb": "#e8f7f1" }} onClick={() => onOpenAcademicMaster("subjects")}>
                <span className="overview-module-icon"><BookOpen size={26} /></span>
                <span>Subject Master</span>
             
              </button>
            </div>
          </div>

          <div className="overview-group">
            <p className="eyebrow">Academic Mapping</p>
            <div className="overview-module-grid">
              <button className="overview-module-tile" style={{ "--fc": "#12A37F", "--fb": "#e8f7f1" }} onClick={goToInstitutions}>
                <span className="overview-module-icon"><Building2 size={26} /></span>
                <span>Institutions</span>
         
              </button>
              <button className="overview-module-tile" style={{ "--fc": "#12A37F", "--fb": "#e8f7f1" }} onClick={() => setView("courses")}>
                <span className="overview-module-icon"><Layers size={26} /></span>
                <span>Courses</span>
           
              </button>
              <button className="overview-module-tile" style={{ "--fc": "#12A37F", "--fb": "#e8f7f1" }} onClick={() => setView("subjects")}>
                <span className="overview-module-icon"><BookOpen size={26} /></span>
                <span>Subjects</span>
             
              </button>
            </div>
          </div>

          <div className="overview-group">
            <p className="eyebrow">Approval Center</p>
            <div className="overview-module-grid">
              <button className="overview-module-tile" style={{ "--fc": "#12A37F", "--fb": "#e8f7f1" }} onClick={() => setActiveRoute("student-verification")}>
                <span className="overview-module-icon"><UserCheck size={26} /></span>
                <span>Registered Students</span>
              
              </button>
            </div>
          </div>
        </div>
      )}

      {view !== "overview" && actionBar && (
        <div className="dashboard-action-bar">
          {actionBar.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                type="button"
                className={action.primary ? "primary-btn" : "secondary-btn"}
                onClick={action.onClick}
                disabled={action.disabled}
                title={action.title || undefined}
              >
                <Icon size={16} />
                {action.label}
              </button>
            );
          })}
        </div>
      )}

      {view !== "overview" && (
        <div className="master-workspace">
          <DataTable
            key={`${view}-${selectedInstitutionIdResolved || "all"}-${selectedCourseIdResolved || "all"}`}
            title={tableConfig.title}
            rows={tableConfig.rows}
            columns={tableConfig.columns}
            fields={tableConfig.fields}
            selectedId={tableConfig.selectedId}
            disabled={tableConfig.disabled}
            disabledHint={tableConfig.disabledHint}
            emptyHint={tableConfig.emptyHint}
            emptyActionLabel={tableConfig.emptyActionLabel}
            onEmptyAction={tableConfig.onEmptyAction}
            addLabel={tableConfig.addLabel}
            secondaryAddLabel={tableConfig.secondaryAddLabel}
            onSecondaryAdd={tableConfig.onSecondaryAdd}
            toolbarActionLabel={tableConfig.toolbarActionLabel}
            onToolbarAction={tableConfig.onToolbarAction}
            onSelect={tableConfig.onSelect}
            onView={tableConfig.onView}
            onSave={tableConfig.onSave}
            onDelete={tableConfig.onDelete}
            onToggle={tableConfig.onToggle}
            statusFilterOptions={["Active", "Inactive"]}
            wide={view === "subjects"}
            hideHeaderAdd
          />
        </div>
      )}

      {view === "subjects" && isSubjectDetailsOpen && (
        <SubjectEditModal
          course={selectedCourse}
          subject={selectedSubject}
          subjectCount={subjectsForCourse.length}
          yearOptions={years}
          semOptions={examSems}
          username={username}
          onClose={() => setIsSubjectDetailsOpen(false)}
          onDelete={(row) => deleteSubjectRow(row)}
            onSave={async (values) => {
            await handleMergedSubjectSave(values);
            setIsSubjectDetailsOpen(false);
          }}
        />
      )}

      {addModal && (
        <RecordModal
          mode="add"
          row={addModal.row}
          fields={addModalConfig[addModal.type].fields}
          title={addModalConfig[addModal.type].title}
          onClose={() => setAddModal(null)}
          onSave={handleAddModalSave}
        />
      )}
      {formModal && (
        <RecordModal
          mode={formModal.mode}
          row={formModal.row}
          fields={entityForm[formModal.entity].fields}
          title={entityForm[formModal.entity].title}
          onClose={() => {
            const wasInstitutionAdd = formModal.entity === "institution" && formModal.mode === "add";
            setFormModal(null);
            // Add Institute is launched from the Academic Master page via a
            // route switch (not a same-page modal), so closing it should
            // send the user back there instead of leaving them stranded on
            // Academic Mapping.
            if (wasInstitutionAdd && onNavigateBack) onNavigateBack();
          }}
          onSave={handleFormSave}
        />
      )}
      {subjectModalState && (
        <RecordModal
          mode={subjectModalState.mode}
          row={subjectModalState.row}
          fields={subjectFields}
          title="Add Subject"
          onClose={() => setSubjectModalState(null)}
          onSave={async (values) => {
            await saveSubject(values);
            setSubjectModalState(null);
          }}
        />
      )}
      {newInstitutionCredentials && (
        <div className="modal-backdrop" role="presentation">
          <section className="modal" role="dialog" aria-modal="true" aria-label="Institution Login Created">
            <div className="modal-heading">
              <div>
                <p className="eyebrow">login created</p>
                <h3>{newInstitutionCredentials.name}</h3>
              </div>
            </div>
            <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginBottom: 16 }}>
              Share these one-time credentials with the institution. They will be required to
              set a new password on first login. This password will not be shown again.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { label: "Creator", data: newInstitutionCredentials.creator },
                { label: "Approver", data: newInstitutionCredentials.approver },
              ].map(({ label, data }) => (
                <div key={label} style={{ padding: "12px 14px", borderRadius: 10, background: "var(--soft-gray)" }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--brand-dark)", textTransform: "uppercase", marginBottom: 6 }}>
                    {label}
                  </div>
                  <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>
                    Username
                  </div>
                  <div style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 6 }}>{data.username}</div>
                  <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>
                    Temporary Password
                  </div>
                  <div style={{ fontSize: "1rem", fontWeight: 700 }}>{data.password}</div>
                </div>
              ))}
            </div>
            <div className="modal-actions">
              <button className="primary-btn" onClick={() => setNewInstitutionCredentials(null)}>
                Done
              </button>
            </div>
          </section>
        </div>
      )}
      {addCourseOpen && (
        <RecordModal
          mode="add"
          row={{
            ...emptyRowFromFields(addCourseFields),
            status: "Active",
          }}
          fields={addCourseFields}
          title="Add Course"
          onClose={() => setAddCourseOpen(false)}
          onSave={handleAddCourseSave}
        />
      )}
      {mapCourseOpen && (
        <CourseSelectModal
          title="Course"
          emptyMessage="No courses available to map."
          options={courseOptions}
            extraFields={
            mapCourseInstId
              ? []
              : [["institute", "Institute", institutionOptions]]
          }
          initialMapped={mapCourseInstId ? mapCoursePreMapped : []}
          onClose={() => setMapCourseOpen(false)}
          onSave={handleMapCourseSave}
          onInstituteChange={handleMapCourseInstituteChange}
        />
      )}
      {viewCourseOpen && (
        <ListViewModal
          title="Existing Courses"
          items={courses.map((c, i) => ({ id: i + 1, label: c.name, status: c.status }))}
          emptyMessage="No courses found."
          onClose={() => setViewCourseOpen(false)}
        />
      )}
      {addSubjectOpen && (
        <AddSubjectModal
          subjectOptions={subjectSelectOptions}
          username={username}
          onClose={() => setAddSubjectOpen(false)}
          onSave={handleAddSubjectSave}
        />
      )}
      {editMarksSubject && (
        <AddSubjectModal
          editMode
          initialSubject={editMarksSubject}
          subjectOptions={[]}
          username={username}
          onClose={() => setEditMarksSubject(null)}
          onSave={handleEditMarksSave}
        />
      )}
      {viewStudentsOpen && (
        <ViewStudentsModal
          institutionId={selectedInstitutionIdResolved}
          institutionName={selectedInstitution?.name}
          onClose={() => setViewStudentsOpen(false)}
        />
      )}
      {mapSubjectOpen && (
        <SubjectMapModal
          instituteOptions={institutionOptions}
          subjectOptions={subjectOptions}
          yearOptions={yearOptions}
          semOptions={semOptions}
          fixedInstituteId={selectedInstitutionIdResolved}
          fixedCourseId={selectedCourseIdResolved}
          onClose={() => setMapSubjectOpen(false)}
          onSave={handleMapSubjectSave}
        />
      )}
      {viewSubjectOpen && (
        <ListViewModal
          title="Existing Subjects"
          items={subjects.map((s, i) => ({ id: i + 1, label: s.name, status: s.status }))}
          emptyMessage="No subjects found."
          onClose={() => setViewSubjectOpen(false)}
        />
      )}
      {editCourseOpen && (
        <CascadeEditModal
          level="course"
          title="Course"
          instituteOptions={institutionOptions}
          fixedInstituteId={selectedInstitutionIdResolved}
          onClose={() => setEditCourseOpen(false)}
          onPick={(row, ctx) => {
            setEditCourseOpen(false);
            setSelectedInstitutionId(Number(ctx.instituteId));
            setSelectedCourseId(null);
            setSelectedSubjectId(null);
            setView("courses");
            openForm("course", "edit", row);
          }}
        />
      )}
      {editSubjectOpen && (
        <CascadeEditModal
          level="subject"
          title="Subject"
          instituteOptions={institutionOptions}
          fixedInstituteId={selectedInstitutionIdResolved}
          fixedCourseId={selectedCourseIdResolved}
          onClose={() => setEditSubjectOpen(false)}
          onPick={(row, ctx) => {
            setEditSubjectOpen(false);
            setSelectedInstitutionId(Number(ctx.instituteId));
            setSelectedCourseId(Number(ctx.courseId));
            setSelectedSubjectId(null);
            setView("subjects");
            openForm("subject", "edit", row);
          }}
        />
      )}
      {editPick && (
        <RecordPickModal
          title={
            editPick === "institution" ? "Institute" : editPick === "course" ? "Course" : "Subject"
          }
          rows={
            editPick === "institution"
              ? institutions
              : editPick === "course"
                ? coursesForInstitution
                : subjectsForCourse
          }
          getLabel={(row) => (editPick === "subject" ? row.subject : row.name)}
          emptyMessage={`No ${editPick === "institution" ? "institutions" : `${editPick}s`} available to edit.`}
          onClose={() => setEditPick(null)}
          onPick={(row) => {
            setEditPick(null);
            openForm(editPick, "edit", row);
          }}
        />
      )}
      {courseSelectOpen && (
        <CourseSelectModal
          title="Course"
          emptyMessage="No more courses available to add."
          options={courseSelectOptions}
          extraFields={[["duration", "Duration", []]]}
          onClose={() => setCourseSelectOpen(false)}
          onSave={handleCourseSelectSave}
        />
      )}
      {subjectSelectOpen && (
        <CourseSelectModal
          title="Subject"
          emptyMessage="No more subjects available to add."
          options={subjectSelectOptions}
          extraFields={[
            ["year", "Year", yearOptions],
            ["semester", "Semester", semOptions],
          ]}
          onClose={() => setSubjectSelectOpen(false)}
          onSave={handleSubjectSelectSave}
        />
      )}
    </section>
  );
}

function RecentActivities({ workflows }) {
  const rows = workflows.slice(0, 4);
  return (
    <section className="panel activity-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Recent Activities</p>
          <h2>Updates</h2>
        </div>
        <Activity size={18} />
      </div>
      <div className="activity-list">
        {rows.length ? (
          rows.map((workflow) => (
            <div className="activity-row" key={workflow.id}>
              <span aria-hidden="true" />
              <div>
                <strong>{workflow.task}</strong>
                <small>
                  {workflow.module} / {workflow.college}
                </small>
              </div>
              <StatusBadge status={workflow.status} />
            </div>
          ))
        ) : (
          <div className="preview-empty small">No recent updates</div>
        )}
      </div>
    </section>
  );
}

function SubjectDetailsModal({ course, subject, subjectCount, subjectFields, onClose, onAdd, onEdit, onDelete, onEditMarks }) {
  const [modalState, setModalState] = useState(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function handleSave(row) {
    if (modalState?.mode === "add") onAdd(row);
    else onEdit(row);
    setModalState(null);
  }

  async function handleDelete() {
    if (!subject) return;
    await onDelete(subject);
    setConfirmingDelete(false);
    onClose();
  }

  // Friendly labels for the marks divisions coming back from the API.
  const DIV_LABEL = {
    "Internal Assessment": "Internal Assessment (Max / Pass)",
    "External Assessment": "External Assessment (Max / Pass)",
    "Theory/Practical": "Theory/Practical (Max / Pass)",
  };
  const sections = [
    course && {
      title: "Course Detail",
      rows: [
        ["Course", course.name],
        ["Subjects", subjectCount],
      ],
    },
    subject && {
      title: "Subject Information",
      rows: [
        ["Subject", subject.subject],
        ["Year", subject.year],
        ["Semester", subject.semester],
        ["Priority", subject.priority],
        ["Total Max", subject.totalMax],
        ["Total Pass", subject.totalPass],
        ["Effective Date", formatDate(subject.effectiveDate)],
        ...(subject.divisions || []).map((d) => [
          DIV_LABEL[d.type] || `${d.type} (Max / Pass)`,
          `${d.maxMarks} / ${d.passMarks}`,
        ]),
      ],
    },
  ].filter(Boolean);

  const actions = [
    subject && {
      label: "Edit Info",
      icon: Pencil,
      onClick: () => setModalState({ mode: "edit", row: subject }),
    },
    subject && {
      label: "Edit Marks",
      icon: Pencil,
      onClick: () => onEditMarks(subject),
    },
    subject && {
      label: "Delete",
      icon: Trash2,
      tone: "danger",
      onClick: () => setConfirmingDelete(true),
    },
  ].filter(Boolean);

  return (
    <>
      <div className="modal-backdrop" role="presentation">
        <section className="modal subject-details-modal" role="dialog" aria-modal="true" aria-label="Subject Information">
          <div className="modal-heading">
            <div>
              <p className="eyebrow">Details</p>
              <h3>Subject Information</h3>
            </div>
            <div className="subject-modal-head-actions">
              <StatusBadge status={subject?.status || course?.status || "Active"} />
              <button className="icon-btn" onClick={onClose} aria-label="Close">
                <X size={18} />
              </button>
            </div>
          </div>

          {sections.length ? (
            <div className="preview-section-stack subject-modal-content">
              {sections.map((section) => (
                <section className="preview-section" key={section.title}>
                  <h4>{section.title}</h4>
                  <dl>
                    {section.rows.map(([label, value]) => (
                      <div key={label}>
                        <dt>{label}</dt>
                        <dd>{value || "-"}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ))}
            </div>
          ) : (
            <div className="preview-empty">{course ? "Select a subject" : "Select a course"}</div>
          )}

          {actions.length > 0 && (
            <div className="modal-actions subject-modal-actions">
              {actions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    type="button"
                    className={action.tone === "danger" ? "secondary-btn danger-text" : "secondary-btn"}
                    onClick={action.onClick}
                    disabled={action.disabled}
                  >
                    <Icon size={16} />
                    {action.label}
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>
      {modalState && (
        <RecordModal
          mode={modalState.mode}
          row={modalState.row}
          fields={subjectFields}
          title="Subject Details"
          onClose={() => setModalState(null)}
          onSave={handleSave}
        />
      )}
      {confirmingDelete && (
        <ConfirmDialog
          title="Delete this subject?"
          message="This action cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </>
  );
}