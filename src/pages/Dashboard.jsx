import { useState, useEffect, useMemo, useCallback } from "react";
import {
  GraduationCap,
  Users,
  CalendarCheck,
  BadgeCheck,
  Building2,
  Layers,
  BookOpen,
  ClipboardCheck,
  Plus,
  Pencil,
  Trash2,
  Activity,
  X,
} from "lucide-react";
import StatusBadge from "../components/StatusBadge.jsx";
import DataTable from "../components/DataTable.jsx";
import RecordModal from "../components/RecordModal.jsx";
import CourseSelectModal from "../components/CourseSelectModal.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import KpiCard from "../components/KpiCard.jsx";
import Breadcrumb from "../components/Breadcrumb.jsx";
import { BOARD_ROLES, ENTITY_FIELDS, ENTITY_COLUMNS } from "../data.js";
import { isStatusVisibleForRole, emptyRowFromFields } from "../utils.js";
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
              .filter((route) => route.type !== "dashboard")
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

function BoardDashboard({ role, username, data, setActiveRoute, dashboardView, dashboardViewCommand, onDashboardViewChange }) {
  const [view, setView] = useState(dashboardView || "overview");
  const [institutions, setInstitutions] = useState([]);
  const [coursesForInstitution, setCoursesForInstitution] = useState([]);
  const [subjectsForCourse, setSubjectsForCourse] = useState([]);
  const [regions, setRegions] = useState([]);
  const [years, setYears] = useState([]);
  const [examSems, setExamSems] = useState([]);
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [selectedInstitutionId, setSelectedInstitutionId] = useState(null);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [addModal, setAddModal] = useState(null);
  const [isSubjectDetailsOpen, setIsSubjectDetailsOpen] = useState(false);

  const pendingApprovals = data.workflows.filter(
    (workflow) => workflow.board === role && ["Submitted", "Verified"].includes(workflow.status),
  );

  const refreshInstitutions = useCallback(() => {
    api.getInstitutions(role).then(setInstitutions).catch(() => setInstitutions([]));
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

  useEffect(() => {
    refreshInstitutions();
    setSelectedInstitutionId(null);
    setSelectedCourseId(null);
    setSelectedSubjectId(null);
  }, [role, refreshInstitutions]);

  useEffect(() => {
    api.getRegions().then(setRegions).catch(() => setRegions([]));
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
  }, [dashboardViewCommand]);

  const regionOptions = useMemo(
    () => regions.map((r) => ({ value: String(r.id), label: r.name })),
    [regions],
  );
  const yearOptions = useMemo(
    () => years.map((y) => ({ value: String(y.id), label: y.name })),
    [years],
  );
  const semOptions = useMemo(
    () => examSems.map((s) => ({ value: String(s.id), label: s.name })),
    [examSems],
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
      ENTITY_FIELDS.institution.map(([key, label, options]) =>
        key === "region" ? [key, label, regionOptions] : [key, label, options],
      ),
    [regionOptions],
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
    const payload = {
      name: values.name,
      region_id: resolveRegionId(values.region),
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
      status: nextStatus,
      actor: username,
    });
    refreshInstitutions();
  }

  async function saveCourse(values) {
    const payload = { name: values.name, status: values.status || "Active", actor: username };
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
      subject: values.subject,
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
    (option) => !coursesForInstitution.some((c) => c.name === option.label),
  );

  const [subjectSelectOpen, setSubjectSelectOpen] = useState(false);
  const subjectSelectOptions = subjectOptions.filter(
    (option) => !subjectsForCourse.some((s) => s.subject === option.label),
  );

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
    if (addModal.type === "institution") await saveInstitution(values);
    setAddModal(null);
  }

  async function handleCourseSelectSave(names) {
    for (const name of names) {
      await saveCourse({ name });
    }
    setCourseSelectOpen(false);
  }

  async function handleSubjectSelectSave(names, extraValues) {
    for (const name of names) {
      await saveSubject({ subject: name, year: extraValues.year, semester: extraValues.semester });
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
    {
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
    },
  ];

  const breadcrumbs = [
    { label: "Dashboard", onClick: view !== "overview" ? () => setView("overview") : null },
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
      emptyActionLabel: "Add Course",
      onEmptyAction: () => openAddModal("course"),
      addLabel: "Add New Course",
      secondaryAddLabel: "Add Existing Course",
      onSecondaryAdd: () => setCourseSelectOpen(true),
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
      title: `Subject Master${selectedCourse ? ` - ${selectedCourse.name}` : ""}`,
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
      onSelect: openSubjectDetails,
      onView: openSubjectDetails,
      onSave: saveSubject,
      onDelete: deleteSubjectRow,
      onToggle: toggleSubjectRow,
    },
  }[view];

  return (
    <section className="board-dashboard">
      <div className="dashboard-command-row">
        <div>
          <Breadcrumb items={breadcrumbs} />
          <h2>Academic Command Center</h2>
        </div>
        <StatusBadge status={role} />
      </div>

      <div className="kpi-grid" aria-label="Board KPIs">
        {metrics.map((metric) => (
          <KpiCard key={metric.label} {...metric} />
        ))}
      </div>

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
            onSelect={tableConfig.onSelect}
            onView={tableConfig.onView}
            onSave={tableConfig.onSave}
            onDelete={tableConfig.onDelete}
            onToggle={tableConfig.onToggle}
            statusFilterOptions={["Active", "Inactive"]}
            wide={view === "subjects"}
          />
        </div>
      )}

      {view === "subjects" && isSubjectDetailsOpen && (
        <SubjectDetailsModal
          course={selectedCourse}
          subject={selectedSubject}
          subjectCount={subjectsForCourse.length}
          subjectFields={subjectFields}
          onClose={() => setIsSubjectDetailsOpen(false)}
          onAdd={(row) => saveSubject(row)}
          onEdit={(row) => saveSubject(row)}
          onDelete={(row) => deleteSubjectRow(row)}
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
      {courseSelectOpen && (
        <CourseSelectModal
          title="Course"
          emptyMessage="No more courses available to add."
          options={courseSelectOptions}
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

function SubjectDetailsModal({ course, subject, subjectCount, subjectFields, onClose, onAdd, onEdit, onDelete }) {
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
      ],
    },
  ];

  const actions = [
    {
      label: "Add",
      icon: Plus,
      disabled: !course,
      onClick: () => setModalState({ mode: "add", row: emptyRowFromFields(subjectFields) }),
    },
    subject && {
      label: "Edit",
      icon: Pencil,
      onClick: () => setModalState({ mode: "edit", row: subject }),
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
