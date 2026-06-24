import { useState, useEffect, useMemo, useCallback } from "react";
import { Layers, BookOpen, Users, BadgeCheck, ClipboardCheck, ListChecks } from "lucide-react";
import DataTable from "../components/DataTable.jsx";
import CourseSelectModal from "../components/CourseSelectModal.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { ENTITY_FIELDS, ENTITY_COLUMNS } from "../data.js";
import * as api from "../api.js";

// Institution-login landing page. Nothing here writes to the live tables
// directly - every save/delete/toggle is submitted as a row in
// tbl_pending_changes (see backend/routes/approvals.py) and only takes
// effect once a board user approves it from the Approvals inbox.
const TABS = [
  { key: "courses", label: "Courses", icon: Layers },
  { key: "subjects", label: "Subjects", icon: BookOpen },
  { key: "students", label: "Students", icon: Users },
  { key: "marks", label: "Marks", icon: BadgeCheck },
  { key: "attendance", label: "Attendance", icon: ClipboardCheck },
  { key: "requests", label: "My Requests", icon: ListChecks },
];

export default function InstitutionPortal({ institutionId, username }) {
  const [tab, setTab] = useState("courses");
  const [institution, setInstitution] = useState(null);
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [pendingChanges, setPendingChanges] = useState([]);
  const [masterCourses, setMasterCourses] = useState([]);
  const [masterSubjects, setMasterSubjects] = useState([]);
  const [years, setYears] = useState([]);
  const [examSems, setExamSems] = useState([]);

  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [courseSelectOpen, setCourseSelectOpen] = useState(false);
  const [subjectSelectOpen, setSubjectSelectOpen] = useState(false);

  const refreshCourses = useCallback(() => {
    api.getCourses(institutionId).then(setCourses).catch(() => setCourses([]));
  }, [institutionId]);

  const refreshSubjects = useCallback((courseId) => {
    if (!courseId) {
      setSubjects([]);
      return;
    }
    api.getSubjects(courseId).then(setSubjects).catch(() => setSubjects([]));
  }, []);

  const refreshStudents = useCallback((courseId) => {
    if (!courseId) {
      setStudents([]);
      return;
    }
    api.getStudents(institutionId, courseId).then(setStudents).catch(() => setStudents([]));
  }, [institutionId]);

  const refreshMarks = useCallback((studentId) => {
    if (!studentId) {
      setMarks([]);
      return;
    }
    api.getStudentMarks(studentId).then(setMarks).catch(() => setMarks([]));
  }, []);

  const refreshAttendance = useCallback((studentId) => {
    if (!studentId) {
      setAttendance([]);
      return;
    }
    api.getAttendance(studentId).then(setAttendance).catch(() => setAttendance([]));
  }, []);

  const refreshPendingChanges = useCallback(() => {
    api.getPendingChanges({ institutionId }).then(setPendingChanges).catch(() => setPendingChanges([]));
  }, [institutionId]);

  useEffect(() => {
    api.getInstitution(institutionId).then(setInstitution).catch(() => setInstitution(null));
    api.getYears().then(setYears).catch(() => setYears([]));
    api.getExamSems().then(setExamSems).catch(() => setExamSems([]));
    api.getListCourses().then(setMasterCourses).catch(() => setMasterCourses([]));
    api.getListSubjects().then(setMasterSubjects).catch(() => setMasterSubjects([]));
    refreshCourses();
    refreshPendingChanges();
  }, [institutionId, refreshCourses, refreshPendingChanges]);

  useEffect(() => {
    refreshSubjects(selectedCourseId);
    refreshStudents(selectedCourseId);
    setSelectedStudentId(null);
  }, [selectedCourseId, refreshSubjects, refreshStudents]);

  useEffect(() => {
    refreshMarks(selectedStudentId);
    refreshAttendance(selectedStudentId);
  }, [selectedStudentId, refreshMarks, refreshAttendance]);

  const selectedCourse = courses.find((c) => c.id === selectedCourseId) || null;
  const selectedStudent = students.find((s) => s.id === selectedStudentId) || null;

  const yearOptions = useMemo(() => years.map((y) => ({ value: String(y.id), label: y.name })), [years]);
  const semOptions = useMemo(() => examSems.map((s) => ({ value: String(s.id), label: s.name })), [examSems]);
  const courseOptions = useMemo(
    () => masterCourses.map((c) => ({ value: String(c.id), label: c.name })),
    [masterCourses],
  );
  const subjectMasterOptions = useMemo(
    () => masterSubjects.map((s) => ({ value: String(s.id), label: s.name })),
    [masterSubjects],
  );
  const subjectOptions = useMemo(
    () => subjects.map((s) => ({ value: String(s.id), label: s.subject })),
    [subjects],
  );

  const courseSelectOptions = courseOptions.filter(
    (option) => !courses.some((c) => c.name === option.label),
  );
  const subjectSelectOptions = subjectMasterOptions.filter(
    (option) => !subjects.some((s) => s.subject === option.label),
  );

  const courseFields = ENTITY_FIELDS.course;
  const subjectFields = useMemo(
    () =>
      ENTITY_FIELDS.boardSubject.map(([key, label, options]) => {
        if (key === "year") return [key, label, yearOptions];
        if (key === "semester") return [key, label, semOptions];
        return [key, label, options];
      }),
    [yearOptions, semOptions],
  );
  const studentFields = ENTITY_FIELDS.institutionStudent;
  const marksFields = useMemo(
    () =>
      ENTITY_FIELDS.institutionMarks.map(([key, label, options]) =>
        key === "subject" ? [key, label, subjectOptions] : [key, label, options],
      ),
    [subjectOptions],
  );
  const attendanceFields = useMemo(
    () =>
      ENTITY_FIELDS.institutionAttendance.map(([key, label, options]) =>
        key === "subject" ? [key, label, subjectOptions] : [key, label, options],
      ),
    [subjectOptions],
  );

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

  function resolveSubjectId(subjectValue) {
    if (!subjectValue) return null;
    const byId = subjects.find((s) => String(s.id) === String(subjectValue));
    if (byId) return byId.id;
    const byName = subjects.find((s) => s.subject === subjectValue);
    return byName ? byName.id : null;
  }

  async function submitChange(entityType, action, entityId, payload) {
    await api.submitPendingChange({
      entityType,
      action,
      entityId,
      institutionId,
      payload,
      actor: username,
    });
    refreshPendingChanges();
  }

  // --- Courses --------------------------------------------------------
  async function saveCourse(row) {
    const payload = { name: row.name, status: row.status || "Active" };
    if (row.id) await submitChange("course", "update", row.id, payload);
    else await submitChange("course", "create", null, payload);
  }
  async function deleteCourseRow(row) {
    await submitChange("course", "delete", row.id, {});
  }
  async function toggleCourseRow(row) {
    const nextStatus = row.status === "Inactive" ? "Active" : "Inactive";
    await submitChange("course", "update", row.id, { name: row.name, status: nextStatus });
  }
  async function handleCourseSelectSave(names) {
    for (const name of names) await submitChange("course", "create", null, { name });
    setCourseSelectOpen(false);
  }

  // --- Subjects ---------------------------------------------------------
  async function saveSubject(row) {
    const payload = {
      subject: row.subject,
      yearId: resolveYearId(row.year),
      semId: resolveSemId(row.semester),
      priority: row.priority || null,
      status: row.status || "Active",
    };
    if (row.id) await submitChange("subject", "update", row.id, payload);
    else await submitChange("subject", "create", null, { ...payload, courseId: selectedCourseId });
  }
  async function deleteSubjectRow(row) {
    await submitChange("subject", "delete", row.id, {});
  }
  async function toggleSubjectRow(row) {
    const nextStatus = row.status === "Inactive" ? "Active" : "Inactive";
    await submitChange("subject", "update", row.id, {
      subject: row.subject,
      yearId: resolveYearId(row.year),
      semId: resolveSemId(row.semester),
      priority: row.priority,
      status: nextStatus,
    });
  }
  async function handleSubjectSelectSave(names, extraValues) {
    for (const name of names) {
      await submitChange("subject", "create", null, {
        subject: name,
        courseId: selectedCourseId,
        yearId: extraValues.year,
        semId: extraValues.semester,
      });
    }
    setSubjectSelectOpen(false);
  }

  // --- Students -----------------------------------------------------------
  async function saveStudent(row) {
    const payload = {
      name: row.name,
      registerNo: row.registerNo,
      term: row.term,
      status: row.status || "Active",
    };
    if (row.id) await submitChange("student", "update", row.id, payload);
    else await submitChange("student", "create", null, { ...payload, courseId: selectedCourseId });
  }
  async function deleteStudentRow(row) {
    await submitChange("student", "delete", row.id, {});
  }
  async function toggleStudentRow(row) {
    const nextStatus = row.status === "Inactive" ? "Active" : "Inactive";
    await submitChange("student", "update", row.id, {
      name: row.name,
      registerNo: row.registerNo,
      term: row.term,
      status: nextStatus,
    });
  }

  // --- Marks ------------------------------------------------------------
  async function saveMarks(row) {
    const payload = {
      subjectId: resolveSubjectId(row.subject),
      internal: row.internal,
      exam: row.exam,
      result: row.result,
      status: row.status || "Active",
    };
    if (row.id) await submitChange("student_marks", "update", row.id, payload);
    else await submitChange("student_marks", "create", null, { ...payload, studentId: selectedStudentId });
  }
  async function deleteMarksRow(row) {
    await submitChange("student_marks", "delete", row.id, {});
  }

  // --- Attendance ---------------------------------------------------------
  async function saveAttendance(row) {
    const payload = {
      subjectId: resolveSubjectId(row.subject),
      examType: row.examType,
      attendance: row.attendance,
      status: row.status || "Active",
    };
    if (row.id) await submitChange("attendance", "update", row.id, payload);
    else await submitChange("attendance", "create", null, { ...payload, studentId: selectedStudentId });
  }
  async function deleteAttendanceRow(row) {
    await submitChange("attendance", "delete", row.id, {});
  }

  const marksRows = marks.map((m) => ({
    ...m,
    subject: subjects.find((s) => s.id === m.subjectId)?.subject || m.subjectId,
  }));
  const attendanceRows = attendance.map((a) => ({
    ...a,
    subject: subjects.find((s) => s.id === a.subjectId)?.subject || a.subjectId,
  }));

  return (
    <section className="content-stack institution-portal">
      <section className="board-summary-card">
        <div className="board-summary-head">
          <div>
            <p className="eyebrow">Institution Portal</p>
            <h2>{institution?.name || "Loading..."}</h2>
          </div>
          {institution && <StatusBadge status={institution.status} />}
        </div>
        <div className="institution-tab-strip" role="tablist" aria-label="Institution sections">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                type="button"
                className={tab === t.key ? "secondary-btn compact-action active" : "secondary-btn compact-action"}
                onClick={() => setTab(t.key)}
              >
                <Icon size={16} />
                {t.label}
                {t.key === "requests" && pendingChanges.some((c) => c.status === "Pending") && (
                  <span className="count-pill">{pendingChanges.filter((c) => c.status === "Pending").length}</span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {tab === "courses" && (
        <DataTable
          title="Courses"
          rows={courses}
          columns={ENTITY_COLUMNS.courses}
          fields={courseFields}
          addLabel="Add New Course"
          secondaryAddLabel="Add Existing Course"
          onSecondaryAdd={() => setCourseSelectOpen(true)}
          onSelect={(row) => setSelectedCourseId(row.id)}
          selectedId={selectedCourseId}
          onSave={saveCourse}
          onDelete={deleteCourseRow}
          onToggle={toggleCourseRow}
          emptyHint="No courses yet"
          statusFilterOptions={["Active", "Inactive"]}
        />
      )}

      {tab === "subjects" && (
        <>
          {!selectedCourse && <p className="preview-empty small">Select a course from the Courses tab first.</p>}
          {selectedCourse && (
            <DataTable
              key={selectedCourseId}
              title={`Subjects - ${selectedCourse.name}`}
              rows={subjects}
              columns={ENTITY_COLUMNS.boardSubjects}
              fields={subjectFields}
              addLabel="Add New Subject"
              secondaryAddLabel="Add Existing Subject"
              onSecondaryAdd={() => setSubjectSelectOpen(true)}
              onSave={saveSubject}
              onDelete={deleteSubjectRow}
              onToggle={toggleSubjectRow}
              emptyHint="No subjects mapped"
              statusFilterOptions={["Active", "Inactive"]}
            />
          )}
        </>
      )}

      {tab === "students" && (
        <>
          {!selectedCourse && <p className="preview-empty small">Select a course from the Courses tab first.</p>}
          {selectedCourse && (
            <DataTable
              key={selectedCourseId}
              title={`Students - ${selectedCourse.name}`}
              rows={students}
              columns={ENTITY_COLUMNS.institutionStudents}
              fields={studentFields}
              onSelect={(row) => setSelectedStudentId(row.id)}
              selectedId={selectedStudentId}
              onSave={saveStudent}
              onDelete={deleteStudentRow}
              onToggle={toggleStudentRow}
              emptyHint="No students yet"
              statusFilterOptions={["Active", "Inactive"]}
            />
          )}
        </>
      )}

      {tab === "marks" && (
        <>
          {!selectedStudent && <p className="preview-empty small">Select a student from the Students tab first.</p>}
          {selectedStudent && (
            <DataTable
              key={selectedStudentId}
              title={`Marks - ${selectedStudent.name}`}
              rows={marksRows}
              columns={ENTITY_COLUMNS.institutionMarks}
              fields={marksFields}
              onSave={saveMarks}
              onDelete={deleteMarksRow}
              emptyHint="No marks recorded"
              statusFilterOptions={["Active", "Inactive"]}
            />
          )}
        </>
      )}

      {tab === "attendance" && (
        <>
          {!selectedStudent && <p className="preview-empty small">Select a student from the Students tab first.</p>}
          {selectedStudent && (
            <DataTable
              key={selectedStudentId}
              title={`Attendance - ${selectedStudent.name}`}
              rows={attendanceRows}
              columns={ENTITY_COLUMNS.institutionAttendance}
              fields={attendanceFields}
              onSave={saveAttendance}
              onDelete={deleteAttendanceRow}
              emptyHint="No attendance recorded"
              statusFilterOptions={["Active", "Inactive"]}
            />
          )}
        </>
      )}

      {tab === "requests" && (
        <section className="data-table-card">
          <div className="data-table-heading">
            <div>
              <h3>My Requests</h3>
              <span>Every change you submit waits here until a board user approves or rejects it.</span>
            </div>
          </div>
          <div className="table-wrap data-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Action</th>
                  <th>Details</th>
                  <th>Status</th>
                  <th>Requested</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {pendingChanges.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="empty-state">
                      <div className="table-empty">
                        <span>No requests submitted yet</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  pendingChanges.map((change) => (
                    <tr key={change.id}>
                      <td data-label="Type">{change.entityType}</td>
                      <td data-label="Action">{change.action}</td>
                      <td data-label="Details">{summarizePayload(change.payload)}</td>
                      <td data-label="Status">
                        <StatusBadge status={change.status} />
                      </td>
                      <td data-label="Requested">{change.requestedDate?.slice(0, 10)}</td>
                      <td data-label="Note">{change.reviewNote || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
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

function summarizePayload(payload) {
  return Object.entries(payload || {})
    .filter(([, value]) => value !== null && value !== undefined && value !== "")
    .map(([key, value]) => `${key}: ${value}`)
    .join(", ");
}
