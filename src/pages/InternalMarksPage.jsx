import { useState, useEffect, useMemo } from "react";
import { CircleCheck, X } from "lucide-react";
import * as api from "../api.js";
import { passOrFail, formatDate } from "../utils.js";
import MyRequestsTable from "../components/MyRequestsTable.jsx";
import StatusBadge from "../components/StatusBadge.jsx";

// Internal Marks Management (Institution -> Creator)
// Layout mirrors the paper "xerox" sheet:
//   LEFT  : Course, Subject
//   RIGHT : Assessment Type, Year, Semester, Month & Year of Exam, Year of Admission
//   BELOW : table of the course's students (Sl.No, Student, Attendance, Scored Marks,
//           Total Marks, Pass Marks, Actions). After Submit the row stays, locked with
//           Submit disabled, and the entry also appears in the My Requests table.
// Total / Pass marks come from the Department's subject config.
// Absent students are marked with the Present/Absent toggle.

const EMPTY_SCHEDULE = { courseId: "", subjectId: "", admissionYear: "", yearId: "", semId: "", examMonth: "", examYear: "" };

export default function InternalMarksPage({ institutionId, username }) {
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [years, setYears] = useState([]);
  const [sems, setSems] = useState([]);
  const [students, setStudents] = useState([]);

  const [schedule, setSchedule] = useState(() => {
    try {
      const raw = localStorage.getItem("ems_im_schedule_v2");
      if (raw) return { ...EMPTY_SCHEDULE, ...JSON.parse(raw) };
    } catch {}
    return EMPTY_SCHEDULE;
  });

  // Month and Year of the exam are entered separately; the saved value is "<month> <year>".
  const examDateLabel = `${schedule.examMonth.trim()} ${schedule.examYear.trim()}`.trim();

  // Per-row state is keyed by `${subjectId}::${studentId}` so nothing leaks between subjects.
  const [rowScored, setRowScored] = useState({});
  const [rowAbsent, setRowAbsent] = useState({});
  const [rowState, setRowState] = useState({});
  const [optimisticLocks, setOptimisticLocks] = useState({});

  const [error, setError] = useState("");
  const [touched, setTouched] = useState({});

  const [myRequests, setMyRequests] = useState([]);
  const [viewingRequest, setViewingRequest] = useState(null);
  const [editingRequest, setEditingRequest] = useState(null);

  const rowKey = (subjectId, studentId) => `${subjectId}::${studentId}`;
  const markTouched = (key) => setTouched((p) => ({ ...p, [key]: true }));

  function setScheduleField(key, value) {
    setSchedule((prev) => {
      const next = { ...prev, [key]: value };
      try { localStorage.setItem("ems_im_schedule_v2", JSON.stringify(next)); } catch {}
      return next;
    });
  }

  function refreshMyRequests() {
    api
      .getPendingChanges({ institutionId })
      .then((all) => setMyRequests(all.filter((c) => c.entityType === "internal_marks")))
      .catch(() => setMyRequests([]));
  }

  async function handleResubmitRequest(change, values) {
    try {
      // a corrected entry with marks is a Present entry
      await api.updatePendingChange(change.id, { ...change.payload, ...values, isAbsent: false }, username);
      setEditingRequest(null);
      refreshMyRequests();
    } catch (err) {
      alert(err.message || "Could not resubmit this request.");
    }
  }

  // ---------- data loading ----------
  useEffect(() => {
    api.getCourses(institutionId).then(setCourses).catch(() => setCourses([]));
    api.getInstitutionStudents(institutionId).then(setStudents).catch(() => setStudents([]));
    api.getYears().then(setYears).catch(() => setYears([]));
    api.getExamSems().then(setSems).catch(() => setSems([]));
    refreshMyRequests();
  }, [institutionId]);

  // all subjects of all courses - only used to show subject names in My Requests
  useEffect(() => {
    if (courses.length === 0) return;
    Promise.all(courses.map((c) => api.getSubjects(c.id).catch(() => []))).then((l) => setAllSubjects(l.flat()));
  }, [courses]);

  // Course -> its Active subjects fill the Subject dropdown
  useEffect(() => {
    if (!schedule.courseId) { setSubjects([]); return; }
    api
      .getSubjects(schedule.courseId)
      .then((list) => {
        const active = list.filter((s) => s.status !== "Inactive");
        setSubjects(active);
        // keep the saved subject only if it belongs to this course
        setSchedule((prev) =>
          active.some((s) => String(s.id) === String(prev.subjectId)) ? prev : { ...prev, subjectId: "" },
        );
      })
      .catch(() => setSubjects([]));
  }, [schedule.courseId]);

  // changing course or subject starts a fresh sheet
  useEffect(() => {
    setRowScored({});
    setRowAbsent({});
    setRowState({});
    setOptimisticLocks({});
    setError("");
    if (schedule.subjectId) refreshMyRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schedule.courseId, schedule.subjectId]);

  // ---------- derived values ----------
  const activeSubject = useMemo(
    () => subjects.find((s) => String(s.id) === String(schedule.subjectId)),
    [subjects, schedule.subjectId],
  );
  const internalDivision = useMemo(
    () => activeSubject?.divisions?.find((d) => Number(d.examTypeId) === 1),
    [activeSubject],
  );
  const totalMarks = internalDivision ? internalDivision.maxMarks : null;
  const passMarks = internalDivision ? internalDivision.passMarks : null;

  const courseNameFor = (id) => (courses.find((c) => String(c.id) === String(id))?.name || "-").toUpperCase();
  const subjectNameForAny = (id) => allSubjects.find((s) => String(s.id) === String(id))?.subject || "-";

  const scheduleErrors = {
    courseId: !schedule.courseId && "Course is required.",
    subjectId: !schedule.subjectId && "Subject is required.",
    yearId: !schedule.yearId && "Year is required.",
    semId: !schedule.semId && "Semester is required.",
    examMonth: !schedule.examMonth.trim() && "Month of Exam is required.",
    examYear: !/^\d{4}$/.test(schedule.examYear.trim()) && "Enter a 4-digit year, e.g. 2026.",
    admissionYear: !/^\d{4}$/.test(String(schedule.admissionYear).trim()) && "Enter a 4-digit year, e.g. 2025.",
  };
  const scheduleValid = Object.values(scheduleErrors).every((e) => !e);
  const fieldError = (key) =>
    touched[key] && scheduleErrors[key] ? <small style={{ color: "#b00020" }}>{scheduleErrors[key]}</small> : null;

  const courseStudents = useMemo(
    () => students.filter((s) => String(s.courseId) === String(schedule.courseId)),
    [students, schedule.courseId],
  );

  // Existing (non-rejected) requests for this course + subject + semester + exam month.
  const lockedForSubject = useMemo(() => {
    const map = {};
    myRequests.forEach((c) => {
      const p = c.payload || {};
      if (
        c.status !== "Rejected" &&
        String(p.courseId) === String(schedule.courseId) &&
        String(p.subjectId) === String(schedule.subjectId) &&
        String(p.semId) === String(schedule.semId) &&
        String(p.examDate || "").trim() === examDateLabel
      ) {
        map[String(p.studentId)] = {
          status: c.status,
          scoredMarks: p.scoredMarks,
          isAbsent: !!p.isAbsent || p.result === "Absent",
        };
      }
    });
    return map;
  }, [myRequests, schedule.courseId, schedule.subjectId, schedule.semId, examDateLabel]);

  // drop an optimistic lock once the real request has loaded
  useEffect(() => {
    setOptimisticLocks((prev) => {
      const next = {};
      let changed = false;
      Object.keys(prev).forEach((k) => {
        if (lockedForSubject[k.split("::")[1]]) changed = true;
        else next[k] = prev[k];
      });
      return changed ? next : prev;
    });
  }, [lockedForSubject]);

  // Students of this course admitted in the typed year.
  const yearStudents = useMemo(() => {
    const yr = String(schedule.admissionYear).trim();
    const yearOf = (s) => String(s.admissionYear || "").slice(0, 4);
    return /^\d{4}$/.test(yr) ? courseStudents.filter((s) => yearOf(s) === yr) : courseStudents;
  }, [courseStudents, schedule.admissionYear]);

  // Every student stays in the table; a submitted one is shown locked (Submit disabled).
  const shownStudents = yearStudents;

  // ---------- submit one row ----------
  async function handleRowSubmit(student) {
    setError("");
    if (!scheduleValid) {
      setTouched({ courseId: true, subjectId: true, yearId: true, semId: true, examMonth: true, examYear: true, admissionYear: true });
      setError("Please complete the exam details before submitting marks.");
      return;
    }
    const sid = String(student.id);
    const key = rowKey(schedule.subjectId, sid);
    const absent = !!rowAbsent[key];
    const scored = rowScored[key];

    if (!absent) {
      if (scored === "" || scored == null) return setRowState((p) => ({ ...p, [key]: "Enter scored marks first." }));
      if (totalMarks == null) return setRowState((p) => ({ ...p, [key]: "No marks configured by the Department." }));
      if (Number(scored) > Number(totalMarks)) return setRowState((p) => ({ ...p, [key]: "Cannot exceed Total." }));
      if (Number(scored) < 0) return setRowState((p) => ({ ...p, [key]: "Cannot be negative." }));
    }

    setRowState((p) => ({ ...p, [key]: "submitting" }));
    try {
      await api.submitPendingChange({
        entityType: "internal_marks",
        action: "create",
        entityId: null,
        institutionId,
        actor: username,
        payload: {
          courseId: Number(schedule.courseId),
          subjectId: Number(schedule.subjectId),
          admissionYear: String(schedule.admissionYear).trim(),
          yearId: Number(schedule.yearId),
          semId: Number(schedule.semId),
          examCatId: null,
          examSessionId: null,
          examDate: examDateLabel,
          studentId: Number(student.id),
          scoredMarks: absent ? null : Number(scored),
          totalMarks: totalMarks != null ? Number(totalMarks) : null,
          passMarks: passMarks != null ? Number(passMarks) : null,
          result: absent ? "Absent" : passOrFail(scored, passMarks),
          isAbsent: absent,
        },
      });
      setOptimisticLocks((p) => ({
        ...p,
        [key]: { status: "Pending", scoredMarks: absent ? null : Number(scored), isAbsent: absent },
      }));
      setRowScored((p) => ({ ...p, [key]: "" }));
      setRowState((p) => ({ ...p, [key]: "" }));
      refreshMyRequests();
    } catch (err) {
      setRowState((p) => ({ ...p, [key]: err.message || "Could not submit." }));
    }
  }

  const segBtn = (active, danger) => ({
    padding: "6px 12px",
    border: "1px solid var(--line)",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "0.8rem",
    background: active ? (danger ? "#b00020" : "#1e7e34") : "#fff",
    color: active ? "#fff" : "var(--muted)",
  });

  // ---------- render ----------
  return (
    <section className="content-stack" style={{ width: "100%", maxWidth: "none", padding: "0 32px" }}>
      <div className="page-heading">
        <div><h2>Internal Marks Management</h2></div>
      </div>

      {error && <div className="login-error">{error}</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* ===== Exam details (one grid, so every field is aligned and styled the same) ===== */}
        <section className="data-table-card" style={{ width: "100%" }}>
          <div className="data-table-heading"><div><h3>Exam Details</h3></div></div>

          <style>{`
            .im-exam-grid { display: grid; grid-template-columns: 1.4fr 1fr 1fr 1fr; gap: 18px 24px; align-items: start; }
            @media (max-width: 1100px) { .im-exam-grid { grid-template-columns: 1fr 1fr; } }
            @media (max-width: 600px)  { .im-exam-grid { grid-template-columns: 1fr; } }
          `}</style>

          <div className="form-grid im-exam-grid">
            {/* row 1 */}
            <label>
              <span>Course *</span>
              <select
                value={schedule.courseId}
                onBlur={() => markTouched("courseId")}
                onChange={(e) => setSchedule((p) => {
                  const next = { ...p, courseId: e.target.value, subjectId: "" };
                  try { localStorage.setItem("ems_im_schedule_v2", JSON.stringify(next)); } catch {}
                  return next;
                })}
              >
                <option value="">Select course</option>
                {[...courses].sort((a, b) => a.name.localeCompare(b.name)).map((c) => (
                  <option key={c.id} value={c.id}>{(c.name || "").toUpperCase()}</option>
                ))}
              </select>
              {fieldError("courseId")}
            </label>

            <label>
              <span>Assessment Type</span>
              <input value="Internal Assessment" readOnly style={{ background: "var(--soft-gray)", cursor: "not-allowed" }} />
            </label>

            <label>
              <span>Year *</span>
              <select value={schedule.yearId} onBlur={() => markTouched("yearId")} onChange={(e) => setScheduleField("yearId", e.target.value)}>
                <option value="">Select year</option>
                {years.map((y) => (<option key={y.id} value={y.id}>{y.name}</option>))}
              </select>
              {fieldError("yearId")}
            </label>

            <label>
              <span>Semester *</span>
              <select value={schedule.semId} onBlur={() => markTouched("semId")} onChange={(e) => setScheduleField("semId", e.target.value)}>
                <option value="">Select semester</option>
                {sems.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
              </select>
              {fieldError("semId")}
            </label>

            {/* row 2 */}
            <label>
              <span>Subject *</span>
              <select
                value={schedule.subjectId}
                disabled={!schedule.courseId}
                onBlur={() => markTouched("subjectId")}
                onChange={(e) => setScheduleField("subjectId", e.target.value)}
              >
                <option value="">{schedule.courseId ? "Select subject" : "Select a course first"}</option>
                {subjects.map((s) => (<option key={s.id} value={s.id}>{s.subject}</option>))}
              </select>
              {fieldError("subjectId")}
            </label>

            {/* TODO: replace Month of Exam with a master-data dropdown once the master is ready */}
            <label>
              <span>Month of Exam *</span>
              <input
                type="text"
                placeholder="e.g. Feb-March"
                value={schedule.examMonth}
                onBlur={() => markTouched("examMonth")}
                onChange={(e) => setScheduleField("examMonth", e.target.value)}
              />
              {fieldError("examMonth")}
            </label>

            <label>
              <span>Year of Exam *</span>
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                placeholder="e.g. 2026"
                value={schedule.examYear}
                onBlur={() => markTouched("examYear")}
                onChange={(e) => setScheduleField("examYear", e.target.value.replace(/\D/g, ""))}
              />
              {fieldError("examYear")}
            </label>

            <label>
              <span>Year of Admission *</span>
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                placeholder="e.g. 2025"
                value={schedule.admissionYear}
                onBlur={() => markTouched("admissionYear")}
                onChange={(e) => setScheduleField("admissionYear", e.target.value.replace(/\D/g, ""))}
              />
              {fieldError("admissionYear")}
            </label>
          </div>
        </section>

        {/* ===== Students table ===== */}
        <section className="data-table-card" style={{ width: "100%" }}>
          <div className="data-table-heading"><div><h3>Student Marks</h3></div></div>

          {!schedule.courseId || !schedule.subjectId ? (
            <div className="table-empty" style={{ padding: "24px 8px" }}>
              <span>Select a course and subject to see its students.</span>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 12, color: "var(--muted)", fontSize: "0.8rem" }}>
                {internalDivision
                  ? `Total Marks ${totalMarks} \u00b7 Pass Marks ${passMarks} (from Department config)`
                  : "This subject has no Internal Assessment total/pass marks configured by the Department yet."}
              </div>

              <div className="table-wrap data-table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Sl.No</th>
                      <th>Reg No</th>
                      <th>Student Name</th>
                      <th>Attendance</th>
                      <th>Scored Marks</th>
                      <th>Total Marks</th>
                      <th>Pass Marks</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shownStudents.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="empty-state">
                          <div className="table-empty">
                            <span>
                              {yearStudents.length > 0
                                ? "No students to show."
                                : "No students found for this course and year of admission."}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      shownStudents.map((student, i) => {
                        const sid = String(student.id);
                        const key = rowKey(schedule.subjectId, sid);
                        const locked = lockedForSubject[sid] || optimisticLocks[key];
                        const absent = locked ? locked.isAbsent : !!rowAbsent[key];
                        const scored = locked ? (locked.scoredMarks ?? "") : (rowScored[key] ?? "");
                        const exceeds = scored !== "" && totalMarks != null && Number(scored) > Number(totalMarks);
                        const st = rowState[key];
                        return (
                          <tr key={sid}>
                            <td data-label="Sl.No">{i + 1}</td>
                            <td data-label="Reg No">{student.registerNo}</td>
                            <td data-label="Student Name">{student.name}</td>
                            <td data-label="Attendance">
                              <div style={{ display: "inline-flex", borderRadius: 6, overflow: "hidden", opacity: locked ? 0.6 : 1 }}>
                                <button type="button" disabled={!!locked} style={segBtn(!absent, false)}
                                  onClick={() => setRowAbsent((p) => ({ ...p, [key]: false }))}>Present</button>
                                <button type="button" disabled={!!locked} style={segBtn(absent, true)}
                                  onClick={() => { setRowAbsent((p) => ({ ...p, [key]: true })); setRowScored((p) => ({ ...p, [key]: "" })); }}>Absent</button>
                              </div>
                            </td>
                            <td data-label="Scored Marks">
                              <input
                                type="number" step="0.01" min="0" max={totalMarks ?? undefined}
                                value={absent ? "" : scored}
                                placeholder={absent ? "-" : ""}
                                disabled={absent || !!locked}
                                onChange={(e) => setRowScored((p) => ({ ...p, [key]: e.target.value }))}
                                onWheel={(e) => e.currentTarget.blur()}
                                style={{ width: 110, minHeight: 38, ...(locked ? { background: "var(--soft-gray)", cursor: "not-allowed" } : {}) }}
                              />
                              {exceeds && <div style={{ color: "#b00020", fontSize: "0.72rem" }}>Cannot exceed {totalMarks}</div>}
                            </td>
                            <td data-label="Total Marks">{totalMarks ?? "-"}</td>
                            <td data-label="Pass Marks">{passMarks ?? "-"}</td>
                            <td data-label="Actions">
                              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                <button
                                  className="primary-btn"
                                  style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                                  disabled={!!locked || st === "submitting" || exceeds || totalMarks == null || (!absent && scored === "")}
                                  onClick={() => handleRowSubmit(student)}
                                >
                                  {locked ? "Submitted" : st === "submitting" ? "Submitting\u2026" : "Submit"}
                                </button>
                                {st && st !== "submitting" && <small style={{ color: "#b00020" }}>{st}</small>}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </div>

      {/* ===== My Requests ===== */}
      <MyRequestsTable
        changes={myRequests}
        students={students}
        courseNameFor={courseNameFor}
        subjectNameFor={subjectNameForAny}
        onView={setViewingRequest}
        onEdit={setEditingRequest}
        onDelete={async (change) => {
          try {
            await api.deletePendingChange(change.id);
            refreshMyRequests();
          } catch (err) {
            alert(err.message || "Could not delete this request.");
          }
        }}
      />

      {viewingRequest && (
        <div className="modal-backdrop" role="presentation">
          <section className="modal" role="dialog" aria-modal="true" aria-label="Request Details">
            <div className="modal-heading">
              <div>
                <p className="eyebrow">view</p>
                <h3>Marks Request</h3>
              </div>
              <button className="icon-btn" onClick={() => setViewingRequest(null)} aria-label="Close"><X size={24} /></button>
            </div>
            <div className="preview-section-stack">
              <section className="preview-section">
                <dl>
                  <div><dt>Attendance</dt><dd>{viewingRequest.payload.isAbsent || viewingRequest.payload.result === "Absent" ? "Absent" : "Present"}</dd></div>
                  <div><dt>Scored Marks</dt><dd>{viewingRequest.payload.scoredMarks ?? "-"}</dd></div>
                  <div><dt>Total Marks</dt><dd>{viewingRequest.payload.totalMarks}</dd></div>
                  <div><dt>Pass Marks</dt><dd>{viewingRequest.payload.passMarks ?? "-"}</dd></div>
                  <div><dt>Exam Month &amp; Year</dt><dd>{formatDate(viewingRequest.payload.examDate)}</dd></div>
                  <div><dt>Status</dt><dd><StatusBadge status={viewingRequest.status} /></dd></div>
                  {viewingRequest.reviewNote && <div><dt>Note</dt><dd>{viewingRequest.reviewNote}</dd></div>}
                </dl>
              </section>
            </div>
            <div className="modal-actions">
              <button className="primary-btn" onClick={() => setViewingRequest(null)}>Close</button>
            </div>
          </section>
        </div>
      )}

      {editingRequest && (
        <ResubmitMarksModal
          change={editingRequest}
          onClose={() => setEditingRequest(null)}
          onSave={(values) => handleResubmitRequest(editingRequest, values)}
        />
      )}
    </section>
  );
}

// ResubmitMarksModal - unchanged from the current file
function ResubmitMarksModal({ change, onClose, onSave }) {
  const configuredTotal = change.payload.totalMarks;
  const passMarks = change.payload.passMarks;

  const [scoredMarks, setScoredMarks] = useState(
    change.payload.scoredMarks != null ? String(change.payload.scoredMarks) : "",
  );
  const [examDate] = useState(change.payload.examDate || "");

  const scoredNum = scoredMarks === "" ? null : Number(scoredMarks);
  const totalNum = configuredTotal == null ? null : Number(configuredTotal);
  const exceeds = scoredNum != null && totalNum != null && scoredNum > totalNum;
  const negative = scoredNum != null && scoredNum < 0;
  const result = scoredNum != null && !exceeds && !negative ? passOrFail(scoredNum, passMarks) : null;
  const canSave = scoredMarks !== "" && !exceeds && !negative;

  function handleSave() {
    if (!canSave) return;
    onSave({
      scoredMarks: scoredNum,
      totalMarks: totalNum,
      passMarks: passMarks != null ? Number(passMarks) : null,
      result,
      examDate,
    });
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal" role="dialog" aria-modal="true" aria-label="Correct and Resubmit">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">edit</p>
            <h3>Correct and Resubmit</h3>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><X size={24} /></button>
        </div>

        <div className="form-grid">
          <label>
            <span>Scored Marks</span>
            <input type="number" min="0" max={totalNum ?? undefined} value={scoredMarks} onChange={(e) => setScoredMarks(e.target.value)} />
            {exceeds && <small style={{ color: "#b00020" }}>Scored Marks cannot exceed Total Marks ({totalNum}).</small>}
            {negative && <small style={{ color: "#b00020" }}>Scored Marks cannot be negative.</small>}
          </label>

          <label>
            <span>Total Marks</span>
            <input type="number" value={totalNum ?? ""} readOnly disabled />
          </label>

          <label>
            <span>Pass Marks</span>
            <input value={passMarks ?? "—"} readOnly disabled />
          </label>

          <label>
            <span>Status</span>
            <input value={change.status} readOnly disabled />
          </label>

          {change.reviewNote && (
            <label>
              <span>Review Note</span>
              <input value={change.reviewNote} readOnly disabled />
            </label>
          )}
        </div>

        <div className="modal-actions">
          <button className="secondary-btn" onClick={onClose}>Cancel</button>
          <button className="primary-btn" onClick={handleSave} disabled={!canSave}>
            <CircleCheck size={24} />
            Save
          </button>
        </div>
      </section>
    </div>
  );
}