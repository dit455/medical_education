import { useState, useEffect, useMemo } from "react";
import { CircleCheck, X, FileText, Trash2 } from "lucide-react";
import * as api from "../api.js";
import { passOrFail, formatDate } from "../utils.js";
import MyRequestsTable from "../components/MyRequestsTable.jsx";
import StatusBadge from "../components/StatusBadge.jsx";

// Exam Schedule defines the exam context (course/year/semester/category/
// session/date). The Creator picks a course, sees that course's subjects as
// tabs, and under the active subject tab sees every enrolled student as a row
// with an inline Scored Marks entry, an auto-filled Total/Pass (from the
// Department's subject config), a live Pass/Fail result, and a per-row Submit
// button. exam_type_id is always Internal Assessment.
export default function InternalMarksPage({ institutionId, username }) {
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [institutionName, setInstitutionName] = useState("");
  const [years, setYears] = useState([]);
  const [sems, setSems] = useState([]);
  const [examCategories, setExamCategories] = useState([]);
  const [examSessions, setExamSessions] = useState([]);
  const [students, setStudents] = useState([]);

  const loadSchedule = () => {
    try {
      const raw = localStorage.getItem("ems_im_schedule");
      if (raw) return JSON.parse(raw);
    } catch {}
    return {
      courseId: "", admissionYear: "", yearId: "", semId: "", examCatId: "", examSessionId: "", examDate: "",
    };
  };
  const [schedule, setSchedule] = useState(loadSchedule);
  const [activeSubjectId, setActiveSubjectId] = useState("");
  const [rowScored, setRowScored] = useState({});
  const [rowState, setRowState] = useState({});
  const [shownStudentIds, setShownStudentIds] = useState([]);
  const persistKey = (cid, sid) => `ems_im_${cid || "x"}_${sid || "x"}`;
  const loadPersisted = (cid, sid) => {
    try {
      const raw = localStorage.getItem(persistKey(cid, sid));
      if (!raw) return { populated: [], absent: [] };
      const p = JSON.parse(raw);
      return { populated: p.populated || [], absent: p.absent || [] };
    } catch {
      return { populated: [], absent: [] };
    }
  };

  const [addRegNo, setAddRegNo] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [absentOpen, setAbsentOpen] = useState(false);
  const [absentRegNo, setAbsentRegNo] = useState("");
  const [highlightId, setHighlightId] = useState("");
  const [addError, setAddError] = useState("");
  const [absentError, setAbsentError] = useState("");

  const [error, setError] = useState("");
  const [touched, setTouched] = useState({});

  const [myRequests, setMyRequests] = useState([]);
  const [viewingRequest, setViewingRequest] = useState(null);
  const [editingRequest, setEditingRequest] = useState(null);

  function markTouched(key) {
    setTouched((prev) => ({ ...prev, [key]: true }));
  }
  function fieldError(key, errors) {
    return touched[key] && errors[key] ? errors[key] : null;
  }

  async function handleResubmitRequest(change, values) {
    try {
      await api.updatePendingChange(change.id, { ...change.payload, ...values }, username);
      setEditingRequest(null);
      refreshMyRequests();
    } catch (err) {
      alert(err.message || "Could not resubmit this request.");
    }
  }

  function refreshMyRequests() {
    api
      .getPendingChanges({ institutionId })
      .then((all) => setMyRequests(all.filter((c) => c.entityType === "internal_marks")))
      .catch(() => setMyRequests([]));
  }

  function refreshStudents() {
    api.getInstitutionStudents(institutionId).then(setStudents).catch(() => setStudents([]));
  }

  useEffect(() => {
    api.getCourses(institutionId).then(setCourses).catch(() => setCourses([]));
    api.getInstitution(institutionId).then((inst) => setInstitutionName(inst?.name || "")).catch(() => setInstitutionName(""));
    refreshStudents();
    api.getYears().then(setYears).catch(() => setYears([]));
    api.getExamSems().then(setSems).catch(() => setSems([]));
    api.getExamCategories().then(setExamCategories).catch(() => setExamCategories([]));
    api.getExamSessions().then(setExamSessions).catch(() => setExamSessions([]));
    refreshMyRequests();
  }, [institutionId]);

    useEffect(() => {
    if (courses.length === 0) return;
    Promise.all(courses.map((c) => api.getSubjects(c.id).catch(() => [])))
      .then((lists) => setAllSubjects(lists.flat()));
  }, [courses]);

  useEffect(() => {
    if (!schedule.courseId) {
      setSubjects([]);
      setActiveSubjectId("");
      return;
    }
    api
      .getSubjects(schedule.courseId)
      .then((list) => {
        // Only Active subjects should be selectable for marks entry — an
        // Inactive subject shouldn't appear as a tab here even though it
        // still exists in the course's subject mapping.
        const activeList = list.filter((s) => s.status !== "Inactive");
        setSubjects(activeList);
        let saved = "";
        try { saved = localStorage.getItem("ems_im_subject") || ""; } catch {}
        const match = activeList.find((s) => String(s.id) === String(saved));
        setActiveSubjectId(match ? String(saved) : (activeList.length ? String(activeList[0].id) : ""));
      })
      .catch(() => {
        setSubjects([]);
        setActiveSubjectId("");
      });
    setRowScored({});
    setShownStudentIds([]);
    setAddRegNo("");
    setAbsentRegNo("");
    setAddError("");
    setAbsentError("");
    setRowState({});
    setOptimisticLocks({});
  }, [schedule.courseId]);

    useEffect(() => {
    if (activeSubjectId) refreshMyRequests();
    try { localStorage.setItem("ems_im_subject", activeSubjectId || ""); } catch {}
    }, [activeSubjectId]);

  const activeSubject = useMemo(
    () => subjects.find((s) => String(s.id) === String(activeSubjectId)),
    [subjects, activeSubjectId],
  );
  const courseNameFor = (id) => (courses.find((c) => String(c.id) === String(id))?.name || "-").toUpperCase();
  const subjectNameFor = (id) => subjects.find((s) => String(s.id) === String(id))?.subject || "-";
  const subjectNameForAny = (id) => allSubjects.find((s) => String(s.id) === String(id))?.subject || "-";
    const examPeriodLabel = useMemo(() => {
    const d = activeSubject?.effectiveDate;
    if (!d) return "";
    const dt = new Date(d);
    if (isNaN(dt)) return "";
    return dt.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }, [activeSubject]);

      const internalDivision = useMemo(
        () => activeSubject?.divisions?.find((d) => Number(d.examTypeId) === 1),
        [activeSubject],
      );
  const configuredTotalMarks = internalDivision ? internalDivision.maxMarks : null;
  const configuredPassMarks = internalDivision ? internalDivision.passMarks : null;



  // Derive Year (1/2/3/4) from Year of Admission: current year − admission year.
  // Matches the computed number against the year options (by the digit in the
  // option name, e.g. "Year 3") and sets yearId automatically.
  useEffect(() => {
    if (!schedule.admissionYear || years.length === 0) return;
    const admitYear = new Date(schedule.admissionYear).getFullYear();
    if (!admitYear || Number.isNaN(admitYear)) return;
    const computed = new Date().getFullYear() - admitYear + 1;
    const match = years.find((y) => {
      const n = parseInt(String(y.name).replace(/\D/g, ""), 10);
      return n === computed;
    });
    setSchedule((prev) => {
      const next = { ...prev, yearId: match ? String(match.id) : "" };
      try { localStorage.setItem("ems_im_schedule", JSON.stringify(next)); } catch {}
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schedule.admissionYear, years]);



  function setScheduleField(key, value) {
    setSchedule((prev) => {
      const next = { ...prev, [key]: value };
      try { localStorage.setItem("ems_im_schedule", JSON.stringify(next)); } catch {}
      return next;
    });
  }

  const scheduleErrors = {
    courseId: !schedule.courseId && "Course is required.",
    admissionYear: !schedule.admissionYear && "Year of Admission is required.",
    yearId: !schedule.yearId && "Year is required.",
    semId: !schedule.semId && "Semester is required.",
    examCatId: !schedule.examCatId && "Exam Category is required.",
    examSessionId: !schedule.examSessionId && "Exam Session is required.",
    examDate: !schedule.examDate && "Month & Year of Exam is required.",
  };
  const scheduleValid = Object.values(scheduleErrors).every((e) => !e);

  const courseStudents = useMemo(
    () => students.filter((s) => String(s.courseId) === String(schedule.courseId)),
    [students, schedule.courseId],
  );

  const shownStudents = courseStudents;

  // When a course is selected, auto-fill Year of Admission from that course's
  // registered students. Uses the most recent batch's admission year if the
  // course has students from multiple years.
  useEffect(() => {
    if (!schedule.courseId) return;
    const withYear = courseStudents
      .map((s) => s.admissionYear)
      .filter(Boolean);
    // Pick the latest admission date among THIS course's students; if the course
    // has no students, clear the field instead of keeping the previous course's value.
    let iso = "";
    if (withYear.length > 0) {
      const latest = withYear
        .map((d) => ({ raw: d, t: new Date(d).getTime() }))
        .filter((x) => !Number.isNaN(x.t))
        .sort((a, b) => b.t - a.t)[0];
      if (latest) iso = String(latest.raw).slice(0, 10);
    }
    setSchedule((prev) => {
      if (prev.admissionYear === iso) return prev;
      const next = { ...prev, admissionYear: iso, yearId: iso ? prev.yearId : "" };
      try { localStorage.setItem("ems_im_schedule", JSON.stringify(next)); } catch {}
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schedule.courseId, courseStudents]);

    // Added / Absentees is derived entirely from tbl_pending_changes (myRequests)
  // for the active course+subject. No localStorage — so deleting/truncating rows
  // in the DB clears this table too.
  const [manuallyAdded, setManuallyAdded] = useState([]);

  const requestsForActive = useMemo(
    () => myRequests.filter(
      (c) =>
        String(c.payload.courseId) === String(schedule.courseId) &&
        String(c.payload.subjectId) === String(activeSubjectId)
    ),
    [myRequests, schedule.courseId, activeSubjectId],
  );

  useEffect(() => {
    setManuallyAdded([]);
  }, [schedule.courseId, activeSubjectId]);

  const absentIds = useMemo(
    () =>
      requestsForActive
        .filter((c) => c.payload?.isAbsent || c.payload?.result === "Absent")
        .map((c) => String(c.payload.studentId)),
    [requestsForActive],
  );

  // Added / Absentees shows ONLY students brought in via −Absentees or +Add.
  // Normal marks submissions stay in My Requests.
  const populatedIds = useMemo(
    () => Array.from(new Set([...absentIds, ...manuallyAdded])),
    [absentIds, manuallyAdded],
  );

  const populatedStudents = useMemo(
    () => courseStudents.filter((s) => populatedIds.includes(String(s.id))),
    [courseStudents, populatedIds],
  );

  const requestForStudent = (sid) => {  
  const exact = myRequests.find(
        (c) =>
          c.status !== "Rejected" &&
          String(c.payload.courseId) === String(schedule.courseId) &&
          String(c.payload.subjectId) === String(activeSubjectId) &&
          String(c.payload.studentId) === String(sid)
      );
      if (exact) return exact;
      // Fallback: same course + student, any subject — catches requests saved
      // under a differently-numbered subject entry that shows the same name.
      return (
        myRequests.find(
          (c) =>
            c.status !== "Rejected" &&
            String(c.payload.courseId) === String(schedule.courseId) &&
            String(c.payload.studentId) === String(sid)
        ) || null
      );
    };

  const lockedForSubject = useMemo(() => {
    const map = {};
    myRequests.forEach((c) => {
      if (
        c.status !== "Rejected" &&
        String(c.payload.courseId) === String(schedule.courseId) &&
        String(c.payload.subjectId) === String(activeSubjectId)
      ) {
        // Keep the scored marks alongside the status so the locked cell can
        // still show what was submitted (or what a rejected-then-corrected
        // resubmission was updated to), instead of just a dash.
        map[String(c.payload.studentId)] = { status: c.status, scoredMarks: c.payload.scoredMarks };
      }
    });
    return map;
  }, [myRequests, schedule.courseId, activeSubjectId]);

  // The list of "My Requests" only refreshes after a network round-trip, so
  // right after a successful submit there'd be a gap where the row shows an
  // empty, still-editable input even though the submit already went through.
  // Optimistic locks close that gap: as soon as a submit succeeds we lock
  // the row and show the value immediately, then once the real request list
  // catches up (lockedForSubject above) that becomes the source of truth and
  // the optimistic entry is dropped.
  const [optimisticLocks, setOptimisticLocks] = useState({});
  useEffect(() => {
    setOptimisticLocks((prev) => {
      const next = {};
      let changed = false;
      Object.keys(prev).forEach((key) => {
        const sid = key.split("::")[1];
        if (lockedForSubject[sid]) {
          changed = true; // real lock has arrived - drop the optimistic one
        } else {
          next[key] = prev[key];
        }
      });
      return changed ? next : prev;
    });
  }, [lockedForSubject]);

  // Scored-marks entry and per-row submit state must be scoped to a specific
  // subject + student combination - keying by student id alone caused a
  // value typed under one subject tab to "leak" into every other subject
  // tab for that same student (and a "done"/error state to leak the same
  // way), since all tabs shared the same rowScored[studentId] entry.
  function rowKey(subjectId, studentId) {
    return `${subjectId}::${studentId}`;
  }

  function rowResult(key) {
    const scored = rowScored[key];
    if (scored === "" || scored == null) return null;
    if (configuredTotalMarks != null && Number(scored) > Number(configuredTotalMarks)) return null;
    return passOrFail(scored, configuredPassMarks);
  }

      function normReg(v) {
        // lowercase, strip spaces, and drop leading zeros in the numeric part
        // so "S003", "s0003" and "S0003" all match.
        return String(v).trim().toLowerCase().replace(/\s+/g, "")
        .replace(/^([a-z]*)0*(\d+)$/, "$1$2");
      }
      function findByRegNo(regNo) {
        const target = normReg(regNo);
        return courseStudents.find((s) => normReg(s.registerNo) === target);
      }

    function focusRow(sid) {
    setHighlightId(sid);
    const el = document.getElementById(`marks-row-${sid}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => setHighlightId(""), 2500);
   }

    function handleAddStudent() {
    setAddError("");
    if (!scheduleValid) {
      setTouched({
        courseId: true, admissionYear: true, yearId: true, semId: true,
        examCatId: true, examSessionId: true, examDate: true,
      });
      setAddError("Complete the Exam Schedule first.");
      return;
    }
    if (!addRegNo.trim()) { setAddError("Enter a register number."); return; }
    const student = findByRegNo(addRegNo);
    if (!student) { setAddError("No student with that register number in this course."); return; }
    const sid = String(student.id);
    const isApproved = myRequests.some(
      (c) =>
        c.status === "Approved" &&
        String(c.payload?.courseId) === String(schedule.courseId) &&
        Number(c.payload?.subjectId) === Number(activeSubjectId) &&
        String(c.payload?.studentId) === sid,
    );
    if (!isApproved) {
      setAddError("Only students with an approved entry can be added.");
      return;
    }
    setManuallyAdded((p) => (p.includes(sid) ? p : [...p, sid]));
    focusRow(sid);
    setAddRegNo("");
    setAddOpen(false);
  }

  async function handleAddAbsentee() {
    setAbsentError("");
    if (!scheduleValid) {
      setTouched({
        courseId: true, admissionYear: true, yearId: true, semId: true,
        examCatId: true, examDate: true,
      });
      setAbsentError("Complete the Exam Schedule first.");
      return;
    }
    if (!absentRegNo.trim()) { setAbsentError("Enter a register number."); return; }
    const student = findByRegNo(absentRegNo);
    if (!student) { setAbsentError("No student with that register number in this course."); return; }
    const sid = String(student.id);
    const alreadyApproved = myRequests.some(
      (c) =>
        c.status === "Approved" &&
        Number(c.payload?.subjectId) === Number(activeSubjectId) &&
        String(c.payload?.studentId) === sid
    );
    if (alreadyApproved) {
      setAbsentError("This student already has an approved entry and cannot be marked absent.");
      return;
    }
    focusRow(sid);
    setAbsentRegNo("");
    setAbsentOpen(false);

    const key = rowKey(activeSubjectId, sid);
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
          subjectId: Number(activeSubjectId),
          admissionYear: schedule.admissionYear,
          yearId: Number(schedule.yearId),
          semId: Number(schedule.semId),
          examCatId: Number(schedule.examCatId),
          examSessionId: schedule.examSessionId ? Number(schedule.examSessionId) : null,
          examDate: schedule.examDate,
          studentId: Number(student.id),
          scoredMarks: null,
          totalMarks: configuredTotalMarks != null ? Number(configuredTotalMarks) : null,
          passMarks: configuredPassMarks != null ? Number(configuredPassMarks) : null,
          result: "Absent",
          isAbsent: true,
        },
      });
      setOptimisticLocks((p) => ({ ...p, [key]: { status: "Pending", scoredMarks: null, isAbsent: true } }));
      setRowState((p) => ({ ...p, [key]: "" }));
      refreshMyRequests();
    } catch (err) {
      setAbsentError(err.message || "Could not submit absentee.");
      setAbsentIds((p) => p.filter((id) => id !== sid));
    }
  }

  async function handleRowSubmit(student) {
    setError("");
    if (!scheduleValid) {
      setTouched({
        courseId: true, admissionYear: true, yearId: true, semId: true,
        examCatId: true, examDate: true,
      });
      setError("Please complete the Exam Schedule before submitting marks.");
      return;
    }
    const sid = String(student.id);
    const key = rowKey(activeSubjectId, sid);
    const scored = rowScored[key];
    if (scored === "" || scored == null) {
      setRowState((p) => ({ ...p, [key]: "Enter scored marks first." }));
      return;
    }
    if (configuredTotalMarks == null) {
      setRowState((p) => ({ ...p, [key]: "This subject has no marks configured by the Department." }));
      return;
    }
    if (Number(scored) > Number(configuredTotalMarks)) {
      setRowState((p) => ({ ...p, [key]: "Scored cannot exceed Total." }));
      return;
    }
    if (Number(scored) < 0) {
      setRowState((p) => ({ ...p, [key]: "Scored cannot be negative." }));
      return;
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
          subjectId: Number(activeSubjectId),
          admissionYear: schedule.admissionYear,
          yearId: Number(schedule.yearId),
          semId: Number(schedule.semId),
          examCatId: Number(schedule.examCatId),
          examDate: schedule.examDate,
          studentId: Number(student.id),
          scoredMarks: Number(scored),
          totalMarks: Number(configuredTotalMarks),
          passMarks: configuredPassMarks != null ? Number(configuredPassMarks) : null,
          result: rowResult(key),
        },
      });
      setOptimisticLocks((p) => ({ ...p, [key]: { status: "Pending", scoredMarks: Number(scored) } }));
      setRowScored((p) => ({ ...p, [key]: "" }));
      setRowState((p) => ({ ...p, [key]: "" }));
      refreshMyRequests();
    } catch (err) {
      setRowState((p) => ({ ...p, [key]: err.message || "Could not submit." }));
    }
  }

  return (
    <section className="content-stack" style={{ width: "100%", maxWidth: "none", padding: "0 32px" }}>
      <div className="page-heading">
        <div>
          <br></br>
          <h2>Internal Marks Management</h2>
        </div>
      </div>

      {error && <div className="login-error">{error}</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <section className="data-table-card" style={{ width: "100%" }}>
          <div className="data-table-heading">
            <div>
              <h3>Exam Schedule</h3>
            </div>
          </div>
          <div className="form-grid" style={{ gridTemplateColumns: "1fr 1fr 1fr", gap: "18px 24px" }}>
            <label>
              <span>Course *</span>
              <select
                value={schedule.courseId}
                onChange={(e) => setScheduleField("courseId", e.target.value)}
              >
                <option value="">Select course</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{(c.name || "").toUpperCase()}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Assessment Type</span>
              <input value="Internal Assessment" readOnly style={{ background: "var(--soft-gray)", cursor: "not-allowed" }} />
            </label>
              <label>
              <span>Year of Admission * (auto from students)</span>
              <input
                type="date"
                value={schedule.admissionYear}
                readOnly
                disabled
                style={{ background: "var(--soft-gray)", cursor: "not-allowed" }}
              />
              {fieldError("admissionYear", scheduleErrors) && <small style={{ color: "#b00020" }}>{scheduleErrors.admissionYear}</small>}
            </label>
            <label>
              <span>Year * (auto from admission year)</span>
              <select value={schedule.yearId} disabled onChange={() => {}}>
                <option value="">Auto from admission year</option>
                {years.map((y) => (
                  <option key={y.id} value={y.id}>{y.name}</option>
                ))}
              </select>
              {fieldError("yearId", scheduleErrors) && <small style={{ color: "#b00020" }}>{scheduleErrors.yearId}</small>}
            </label>
            <label>
              <span>Semester *</span>
              <select value={schedule.semId} onBlur={() => markTouched("semId")} onChange={(e) => setScheduleField("semId", e.target.value)}>
                <option value="">Select semester</option>
                {sems.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              {fieldError("semId", scheduleErrors) && <small style={{ color: "#b00020" }}>{scheduleErrors.semId}</small>}
            </label>
            <label>
              <span>Exam Category *</span>
              <select value={schedule.examCatId} onBlur={() => markTouched("examCatId")} onChange={(e) => setScheduleField("examCatId", e.target.value)}>
                <option value="">Select exam category</option>
                {examCategories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {fieldError("examCatId", scheduleErrors) && <small style={{ color: "#b00020" }}>{scheduleErrors.examCatId}</small>}
            </label>

            <label>
              <span>Exam Session *</span>
              <select value={schedule.examSessionId} onBlur={() => markTouched("examSessionId")} onChange={(e) => setScheduleField("examSessionId", e.target.value)}>
                <option value="">Select session (FN/AN)</option>
                {examSessions.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              {fieldError("examSessionId", scheduleErrors) && <small style={{ color: "#b00020" }}>{scheduleErrors.examSessionId}</small>}
            </label>

            <label>
              <span>Month & Year of Exam *</span>
              <input
                type="text"
                placeholder="e.g. Jan-Feb 2026"
                value={schedule.examDate}
                onBlur={() => markTouched("examDate")}
                onChange={(e) => setScheduleField("examDate", e.target.value)}
              />
              {fieldError("examDate", scheduleErrors) && <small style={{ color: "#b00020" }}>{scheduleErrors.examDate}</small>}
            </label>
          </div>
        </section>

        <section className="data-table-card" style={{ width: "100%" }}>
          <div className="data-table-heading">
            <div>
              <h3>Student Marks</h3>
            </div>
          </div>

          {!schedule.courseId ? (
            <div className="table-empty" style={{ padding: "24px 8px" }}>
              <span>Select a course to see its subjects and students.</span>
            </div>
            ) : subjects.length === 0 ? (
            <>
              <div style={{ marginBottom: 12, color: "var(--muted)", fontSize: "0.8rem" }}>
                No subjects mapped for this course yet — map subjects to enter marks.
              </div>
              <div className="table-wrap data-table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Reg No</th>
                      <th>List of Students</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courseStudents.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="empty-state">
                          <div className="table-empty"><span>No students registered for this course.</span></div>
                        </td>
                      </tr>
                    ) : (
                      courseStudents.map((s) => (
                        <tr key={s.id}>
                          <td>{s.regNo}</td>
                          <td>{s.name}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <>
              <div
                role="tablist"
                aria-label="Subjects"
                style={{ display: "flex", flexWrap: "wrap", gap: 8, borderBottom: "1px solid var(--line)", marginBottom: 16 }}
              >
                {subjects.map((s) => {
                  const active = String(s.id) === String(activeSubjectId);
                  return (
                    <button
                      key={s.id}
                      role="tab"
                      aria-selected={active}
                      onClick={() => setActiveSubjectId(String(s.id))}
                      style={{
                        padding: "10px 16px",
                        border: "none",
                        borderBottom: active ? "3px solid var(--brand)" : "3px solid transparent",
                        background: "none",
                        cursor: "pointer",
                        fontWeight: active ? 800 : 600,
                        color: active ? "var(--brand-dark)" : "var(--muted)",
                        fontSize: "0.9rem",
                      }}
                    >
                      {s.subject}
                    </button>
                  );
                })}
              </div>

              <div style={{ marginBottom: 12, color: "var(--muted)", fontSize: "0.8rem" }}>
                {internalDivision
                  ? `Total Marks ${configuredTotalMarks} \u00b7 Pass Marks ${configuredPassMarks} (from Department config)`
                  : "This subject has no Internal Assessment total/pass marks configured by the Department yet."}
              </div>

              <div className="table-wrap data-table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Reg No</th>
                      <th>List of Students</th>
                      <th>Scored Marks</th>
                      <th>Total Marks</th>
                      <th>Pass Marks</th>
                      <th>Result</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                      {shownStudents.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="empty-state">
                          <div className="table-empty"><span>Add a student by register number using the buttons below.</span></div>
                        </td>
                      </tr>
                    ) : (
                      shownStudents.map((student) => {
                        const sid = String(student.id);
                        const key = rowKey(activeSubjectId, sid);
                        // Prefer the real submitted request once it's loaded;
                        // fall back to the optimistic lock right after a
                        // submit, before the request list has refreshed.
                        const lockedReq = lockedForSubject[sid] || optimisticLocks[key];
                        const lockStatus = lockedReq?.status;
                        const scored = rowScored[key] ?? "";
                        const r = rowResult(key);
                        const exceeds =
                          scored !== "" && configuredTotalMarks != null && Number(scored) > Number(configuredTotalMarks);
                        const st = rowState[key];
                        const lockedResult = lockStatus
                          ? passOrFail(lockedReq.scoredMarks, configuredPassMarks)
                          : null;
                        return (
                            <tr
                            key={student.id}
                            id={`marks-row-${sid}`}
                            style={highlightId === sid ? { background: "var(--soft-gray)", transition: "background 0.3s" } : undefined}
                            >
                            <td data-label="Reg No">{student.registerNo}</td>
                            <td data-label="List of Students">{student.name}</td>
                            <td data-label="Scored Marks">
                              {lockStatus ? (
                                <input
                                  type="number"
                                  value={lockedReq.scoredMarks ?? ""}
                                  readOnly
                                  disabled
                                  style={{ width: 110, minHeight: 38, background: "var(--soft-gray)", cursor: "not-allowed" }}
                                />
                              ) : (
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  max={configuredTotalMarks ?? undefined}
                                  value={scored}
                                  onChange={(e) =>
                                    setRowScored((p) => ({ ...p, [key]: e.target.value }))
                                  }
                                  onWheel={(e) => e.currentTarget.blur()}
                                  style={{ width: 110, minHeight: 38 }}
                                />
                              )}
                              {exceeds && (
                                <div style={{ color: "#b00020", fontSize: "0.72rem" }}>
                                  Cannot exceed {configuredTotalMarks}
                                </div>
                              )}
                            </td>
                            <td data-label="Total Marks">{configuredTotalMarks ?? "-"}</td>
                            <td data-label="Pass Marks">{configuredPassMarks ?? "-"}</td>
                            <td data-label="Result">
                              {lockStatus ? (
                                lockedResult ? (
                                  <span style={{ fontWeight: 700, color: lockedResult === "Pass" ? "#1e7e34" : "#b00020" }}>
                                    {lockedResult}
                                  </span>
                                ) : (
                                  "-"
                                )
                              ) : r ? (
                                <span style={{ fontWeight: 700, color: r === "Pass" ? "#1e7e34" : "#b00020" }}>{r}</span>
                              ) : (
                                "-"
                              )}
                            </td>
                            <td data-label="Actions">
                              {lockStatus ? (
                                // Locks the instant a submit succeeds (optimistic lock)
                                // rather than waiting for My Requests to refresh, and
                                // continues to show the live status once it has.
                                <StatusBadge status={lockStatus} />
                              ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                  <button
                                    className="primary-btn"
                                    style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                                    disabled={st === "submitting" || scored === "" || exceeds || configuredTotalMarks == null}
                                    onClick={() => handleRowSubmit(student)}
                                  >
                                    {st === "submitting" ? "Submitting…" : "Submit"}
                                  </button>
                                  {st && st !== "submitting" && (
                                    <small style={{ color: "#b00020" }}>{st}</small>
                                  )}
                                </div>
                              )}
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

        <MyRequestsTable
        changes={myRequests.filter((c) => !c.payload?.isAbsent && c.payload?.result !== "Absent")}
        students={students}
        institutionName={institutionName}
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
        footer={
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button
                className="primary-btn"
                style={{ padding: "8px 16px", width: "fit-content" }}
                onClick={() => { setAddOpen((o) => !o); setAddError(""); }}
              >+ Add</button>
              {addOpen && (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                      autoFocus
                      placeholder="Enter Register No"
                      value={addRegNo}
                      onChange={(e) => setAddRegNo(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddStudent()}
                      style={{ minHeight: 38, width: 180 }}
                    />
                    <button className="primary-btn" style={{ padding: "8px 16px" }} onClick={handleAddStudent}>Populate</button>
                  </div>
                  {addError && <small style={{ color: "#b00020" }}>{addError}</small>}
                </div>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button
                className="primary-btn"
                style={{ padding: "8px 16px", width: "fit-content" }}
                onClick={() => { setAbsentOpen((o) => !o); setAbsentError(""); }}
              >− Absentees</button>
              {absentOpen && (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                      autoFocus
                      placeholder="Enter Register No"
                      value={absentRegNo}
                      onChange={(e) => setAbsentRegNo(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddAbsentee()}
                      style={{ minHeight: 38, width: 180 }}
                    />
                    <button className="primary-btn" style={{ padding: "8px 16px" }} onClick={handleAddAbsentee}>Mark Absent</button>
                  </div>
                  {absentError && <small style={{ color: "#b00020" }}>{absentError}</small>}
                </div>
              )}
            </div>
          </div>
        }
        />

      <section className="data-table-card" style={{ width: "100%", marginTop: 24 }}>
        <div className="data-table-head">
          <div>
            <h3>Added / Absentees</h3>
            <span>Students you populated by register number.</span>
          </div>
        </div>
        <div className="data-table-wrap">
          <table>
            <thead>
                <tr>
                <th>S.No</th>
                <th>Institution</th>
                <th>Course</th>
                <th>Subject</th>
                <th>Reg No</th>
                <th>Student Name</th>
                <th>Scored Marks</th>
                <th>Total Marks</th>
                <th>Pass Marks</th>
                <th>Result</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {populatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={13} className="empty-state">
                    <div className="table-empty"><span>Use + Add or − Absentees above to populate students here.</span></div>
                  </td>
                </tr>
              ) : (
                populatedStudents.map((student, i) => {
                  const sid = String(student.id);
                  const key = rowKey(activeSubjectId, sid);
                  const isAbsent = absentIds.includes(sid);
                  const lockedReq = lockedForSubject[sid] || optimisticLocks[key];
                  const lockStatus = lockedReq?.status;
                  const scored = rowScored[key] ?? "";
                  const r = rowResult(key);
                  const exceeds = scored !== "" && configuredTotalMarks != null && Number(scored) > Number(configuredTotalMarks);
                  const st = rowState[key];
                  const lockedResult = lockStatus ? passOrFail(lockedReq.scoredMarks, configuredPassMarks) : null;
                  return (
                    <tr key={student.id} id={`pop-row-${sid}`}>
                      <td data-label="S.No">{i + 1}</td>
                      <td data-label="Institution">{(institutionName || "-").toUpperCase()}</td>
                      <td data-label="Course">{courseNameFor(schedule.courseId)}</td>
                      <td data-label="Subject">{subjectNameFor(activeSubjectId)}</td>
                      <td data-label="Reg No">{student.registerNo}</td>
                      <td data-label="Student Name">{student.name}</td>
                      <td data-label="Scored Marks">
                        {isAbsent ? "-" : (lockedReq?.scoredMarks ?? scored ?? "-")}
                      </td>
                      <td data-label="Total Marks">{configuredTotalMarks ?? "-"}</td>
                      <td data-label="Pass Marks">{configuredPassMarks ?? "-"}</td>
                      <td data-label="Result">
                        {isAbsent ? (
                          <span style={{ fontWeight: 700, color: "#b00020" }}>Absent</span>
                        ) : lockStatus ? (
                          lockedResult ? (
                            <span style={{ fontWeight: 700, color: lockedResult === "Pass" ? "#1e7e34" : "#b00020" }}>{lockedResult}</span>
                          ) : "-"
                        ) : r ? (
                          <span style={{ fontWeight: 700, color: r === "Pass" ? "#1e7e34" : "#b00020" }}>{r}</span>
                        ) : "-"}
                      </td>
                      <td data-label="Status">
                        <StatusBadge status={lockStatus || "Pending"} />
                      </td>
                        <td data-label="Actions">
                        {(() => {
                          const req = requestForStudent(sid);
                          if (!req) return "-";
                          const isApproved = req.status === "Approved";
                          return (
                            <div className="action-group" style={{ display: "flex", flexWrap: "nowrap", gap: 6 }}>
                              <button type="button" className="icon-btn" title="View" onClick={() => setViewingRequest(req)}>
                                <FileText size={16} />
                              </button>
                              {!isApproved && (
                                <button type="button" className="icon-btn danger" title="Delete"
                                  onClick={async () => {
                                    try {
                                      await api.deletePendingChange(req.id);
                                      refreshMyRequests();
                                    } catch (err) {
                                      alert(err.message || "Could not delete this request.");
                                    }
                                  }}>
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {viewingRequest && (
        <div className="modal-backdrop" role="presentation">
          <section className="modal" role="dialog" aria-modal="true" aria-label="Request Details">
            <div className="modal-heading">
              <div>
                <p className="eyebrow">view</p>
                <h3>Marks Request</h3>
              </div>
              <button className="icon-btn" onClick={() => setViewingRequest(null)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className="preview-section-stack">
              <section className="preview-section">
                <dl>
                  <div><dt>Scored Marks</dt><dd>{viewingRequest.payload.scoredMarks}</dd></div>
                  <div><dt>Total Marks</dt><dd>{viewingRequest.payload.totalMarks}</dd></div>
                  <div><dt>Pass Marks</dt><dd>{viewingRequest.payload.passMarks ?? "-"}</dd></div>
                  <div>
                    <dt>Result</dt>
                    <dd>
                      {(() => {
                        const r = viewingRequest.payload.result || passOrFail(viewingRequest.payload.scoredMarks, viewingRequest.payload.passMarks);
                        return r ? (
                          <span style={{ fontWeight: 700, color: r === "Pass" ? "#1e7e34" : "#b00020" }}>{r}</span>
                        ) : "-";
                      })()}
                    </dd>
                  </div>
                  <div><dt>Exam Date</dt><dd>{formatDate(viewingRequest.payload.examDate)}</dd></div>
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

function ResubmitMarksModal({ change, onClose, onSave }) {
  const configuredTotal = change.payload.totalMarks;
  const passMarks = change.payload.passMarks;

  const [scoredMarks, setScoredMarks] = useState(
    change.payload.scoredMarks != null ? String(change.payload.scoredMarks) : "",
  );
  const [examDate, setExamDate] = useState(change.payload.examDate || "");

  const scoredNum = scoredMarks === "" ? null : Number(scoredMarks);
  const totalNum = configuredTotal == null ? null : Number(configuredTotal);

  const exceeds = scoredNum != null && totalNum != null && scoredNum > totalNum;
  const negative = scoredNum != null && scoredNum < 0;

  const result =
    scoredNum != null && !exceeds && !negative
      ? passOrFail(scoredNum, passMarks)
      : null;

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
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="form-grid">
          <label>
            <span>Scored Marks</span>
            <input
              type="number"
              min="0"
              max={totalNum ?? undefined}
              value={scoredMarks}
              onChange={(e) => setScoredMarks(e.target.value)}
            />
            {exceeds && (
              <small style={{ color: "#b00020" }}>
                Scored Marks cannot exceed Total Marks ({totalNum}).
              </small>
            )}
            {negative && (
              <small style={{ color: "#b00020" }}>Scored Marks cannot be negative.</small>
            )}
          </label>

          <label>
            <span>Total Marks</span>
            <input type="number" value={totalNum ?? ""} readOnly disabled />
            <small style={{ color: "#64748B" }}>Set by the Department — cannot be changed.</small>
          </label>

          

            <label>
            <span>Result</span>
            <input
              value={result ?? "—"}
              readOnly
              disabled
              style={{
                fontWeight: 700,
                color: result === "Pass" ? "#1e7e34" : result === "Fail" ? "#b00020" : "inherit",
              }}
            />
          </label>

          <label>
            <span>Pass Marks</span>
            <input value={passMarks ?? "—"} readOnly disabled />
            <small style={{ color: "#64748B" }}>Set by the Department.</small>
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
          <button className="secondary-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-btn" onClick={handleSave} disabled={!canSave}>
            <CircleCheck size={18} />
            Save
          </button>
        </div>
      </section>
    </div>
  );
}