import { useState, useEffect, useMemo, useCallback } from "react";
import { CircleCheck, X, Pencil, FileText, Trash2, Search, Download, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import ExportMenu from "../components/ExportMenu.jsx";
import { passOrFail, formatDate } from "../utils.js";
import DataTable from "../components/DataTable.jsx";
import RecordModal from "../components/RecordModal.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import IconButton from "../components/IconButton.jsx";
import { ENTITY_FIELDS, ENTITY_COLUMNS } from "../data.js";
import * as api from "../api.js";

// Institution-login landing page, scoped to Students + Internal Marks only.
// Creator: picks Course -> Subject (existing academic master data - not
// created here), then adds a student and their internal marks together as
// one request. Approver: reviews and approves/rejects those requests.
// Nothing here writes to the live tables directly - every add is submitted
// as a row in tbl_pending_changes (see backend/routes/approvals.py) and
// only takes effect once the institution's Approver approves it.
export default function InstitutionPortal({ institutionId, username, institutionRole = "Creator" }) {
  const isApprover = institutionRole === "Approver";

  const [institution, setInstitution] = useState(null);
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [pendingChanges, setPendingChanges] = useState([]);

  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [editingCreatorChange, setEditingCreatorChange] = useState(null);
  const [viewingChange, setViewingChange] = useState(null);
  const [lookups, setLookups] = useState({ courses: [], subjects: [], years: [], sems: [], examCats: [], examSessions: [] });

  const courseSubjectChanges = pendingChanges.filter(
    (c) =>
      c.entityType === "student_with_marks" &&
      c.payload?.courseId === selectedCourseId &&
      c.payload?.subjectId === selectedSubjectId,
  );

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

  const refreshStudents = useCallback(() => {
    api.getInstitutionStudents(institutionId).then(setStudents).catch(() => setStudents([]));
  }, [institutionId]);

  const refreshPendingChanges = useCallback(() => {
    api.getPendingChanges({ institutionId }).then(setPendingChanges).catch(() => setPendingChanges([]));
  }, [institutionId]);

  useEffect(() => {
    api.getInstitution(institutionId).then(setInstitution).catch(() => setInstitution(null));
  }, [institutionId]);

  useEffect(() => {
    refreshCourses();
    refreshStudents();
    refreshPendingChanges();
  }, [refreshCourses, refreshStudents, refreshPendingChanges]);

  useEffect(() => {
  Promise.all([
    api.getListCourses().catch(() => []),
    api.getYears().catch(() => []),
    api.getExamSems().catch(() => []),
    api.getExamCategories().catch(() => []),
    api.getExamSessions().catch(() => []),
  ]).then(([courses, years, sems, examCats, examSessions]) =>
    setLookups((prev) => ({ ...prev, courses, years, sems, examCats, examSessions }))
  );
}, []);

useEffect(() => {
  if (courses.length === 0) return;
  Promise.all(courses.map((c) => api.getSubjects(c.id).catch(() => [])))
    .then((lists) =>
      setLookups((prev) => ({
        ...prev,
        subjects: lists.flat().map((s) => ({ id: s.id, name: s.subject })),
      }))
    );
}, [courses]);

  const nameFrom = (list, id) => list.find((x) => String(x.id) === String(id))?.name ?? id;
  const PAYLOAD_LABELS = {
    courseId: "Course", subjectId: "Subject", yearId: "Year", semId: "Semester",
    examCatId: "Exam Category", examSessionId: "Exam Session", studentId: "Student",
    scoredMarks: "Scored Marks", totalMarks: "Total Marks", examDate: "Exam Date",
    passMarks: "Pass Marks", result: "Result",
  };
    function toDMY(v) {
    // Accepts an ISO date like "2026-09-01" (optionally with time) and returns
    // "01/09/2026". Returns null if it isn't an ISO-style date.
    const m = String(v).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return null;
    return `${m[3]}/${m[2]}/${m[1]}`;
  }
  function renderPayloadValue(key, value) {
    if (key === "courseId") return nameFrom(lookups.courses, value);
    if (key === "subjectId") return nameFrom(lookups.subjects, value);
    if (key === "yearId") return nameFrom(lookups.years, value);
    if (key === "semId") return nameFrom(lookups.sems, value);
    if (key === "examCatId") return nameFrom(lookups.examCats, value);
    if (key === "examSessionId") return nameFrom(lookups.examSessions, value);
    if (key === "studentId") return students.find((s) => String(s.id) === String(value))?.name ?? value;
    const dmy = toDMY(value);
    if (dmy) return dmy;
    return String(value);
  }

  useEffect(() => {
    refreshSubjects(selectedCourseId);
    setSelectedSubjectId(null);
  }, [selectedCourseId, refreshSubjects]);

  const selectedCourse = courses.find((c) => c.id === selectedCourseId) || null;
  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId) || null;

  const courseOptions = useMemo(() => courses.map((c) => ({ value: String(c.id), label: c.name })), [courses]);
  const subjectOptions = useMemo(
    () => subjects.map((s) => ({ value: String(s.id), label: s.subject })),
    [subjects],
  );

  const studentWithMarksFields = useMemo(
    () => [
      ["name", "Student Name"],
      ["registerNo", "Register No"],
      ["term", "Term"],
      ["internal", "Scored Marks"],
      ["exam", "Total Marks"],
      ["result", "Result", ["Pass", "Fail"]],
      ["status", "Status", ["Active", "Inactive"]],
    ],
    [],
  );

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

  // Creator: student profile + internal marks for the selected course +
  // subject, submitted together as one request.
  async function saveStudentWithMarks(row) {
    if (!selectedCourseId || !selectedSubjectId) return;
    try {
      await submitChange("student_with_marks", "create", null, {
        name: row.name,
        registerNo: row.registerNo,
        term: row.term,
        status: row.status || "Active",
        courseId: selectedCourseId,
        subjectId: selectedSubjectId,
        internal: row.internal,
        exam: row.exam,
        result: row.result,
      });
      setAddStudentOpen(false);
    } catch (err) {
      alert(err.message || "Could not submit this request.");
    }
  }

  async function handleCreatorResubmit(change, values) {
    try {
      await api.updatePendingChange(change.id, {
        name: values.name,
        registerNo: values.registerNo,
        term: values.term,
        status: values.status || "Active",
        courseId: change.payload.courseId,
        subjectId: change.payload.subjectId,
        internal: values.internal,
        exam: values.exam,
        result: values.result,
      }, username);
      setEditingCreatorChange(null);
      refreshPendingChanges();
    } catch (err) {
      alert(err.message || "Could not resubmit this request.");
    }
  }

  const [deletingChange, setDeletingChange] = useState(null);

  async function handleDeleteCreatorChange(change) {
    try {
      await api.deletePendingChange(change.id);
      setDeletingChange(null);
      refreshPendingChanges();
    } catch (err) {
      alert(err.message || "Could not delete this request.");
    }
  }

  // --- Approvals (Approver role) ------------------------------------------
  const [reviewError, setReviewError] = useState("");
  const [rejectingChange, setRejectingChange] = useState(null);
  const [reviewSearch, setReviewSearch] = useState("");
  const [reviewStatusFilter, setReviewStatusFilter] = useState("All");
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewRowsPerPage, setReviewRowsPerPage] = useState(5);
  const [editingChange, setEditingChange] = useState(null);

  // Student registration is created directly (no approval step) - only
  // Internal Marks requests need Approver review. Any leftover
  // "student_registration" rows in tbl_pending_changes (from before this
  // was direct-write) are intentionally excluded here so they never surface
  // on this page again.
  const reviewChanges = pendingChanges.filter((c) => c.entityType === "internal_marks");

  function studentById(id) {
    return students.find((s) => String(s.id) === String(id));
  }

  const REVIEW_STATUS_FILTERS = ["Pending", "Approved", "Rejected"];

  const filteredReviews = useMemo(() => {
    const q = reviewSearch.trim().toLowerCase();
    return reviewChanges.filter((c) => {
      const v = rowView(c);
      const matchSearch = !q ||
        [v.regNo, v.name, v.scored, v.total, c.status]
          .filter((x) => x !== undefined && x !== null)
          .join(" ").toLowerCase().includes(q);
      const matchStatus = reviewStatusFilter === "All" || c.status === reviewStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [reviewChanges, reviewSearch, reviewStatusFilter]);

  const reviewTotalPages = Math.max(1, Math.ceil(filteredReviews.length / reviewRowsPerPage));
  const reviewCurrentPage = Math.min(reviewPage, reviewTotalPages);
  const reviewPageRows = filteredReviews.slice((reviewCurrentPage - 1) * reviewRowsPerPage, reviewCurrentPage * reviewRowsPerPage);
  const reviewRangeStart = filteredReviews.length === 0 ? 0 : (reviewCurrentPage - 1) * reviewRowsPerPage + 1;
  const reviewRangeEnd = Math.min(reviewCurrentPage * reviewRowsPerPage, filteredReviews.length);

  // Normalizes either entity type into the same display shape for the table.
  function rowView(change) {
    if (change.entityType === "student_registration") {
      return {
        name: change.payload.studentName,
        regNo: change.payload.studentRegNo,
        scored: "-",
        total: "-",
        email: change.payload.studentEmail,
        phone: change.payload.studentMobile,
      };
    }
    if (change.entityType === "internal_marks") {
      const student = studentById(change.payload.studentId);
      return {
        name: student?.name || `Student #${change.payload.studentId}`,
        regNo: student?.registerNo || "-",
        scored: change.payload.scoredMarks,
        total: change.payload.totalMarks,
        pass: change.payload.passMarks ?? "-",
        course: String(nameFrom(lookups.courses, change.payload.courseId) || "-").toUpperCase(),
        subject: nameFrom(lookups.subjects, change.payload.subjectId) || "-",
        result: change.payload.result || passOrFail(change.payload.scoredMarks, change.payload.passMarks),
        email: student?.email || "-",
        phone: student?.mobile || "-",
      };
    }
    return {
      name: change.payload.name, regNo: change.payload.registerNo,
      scored: change.payload.internal, total: change.payload.exam,
      result: null,
      email: "-", phone: "-",
    };
  }

  const [viewingReview, setViewingReview] = useState(null);
  const [editingReview, setEditingReview] = useState(null);
  const [deletingReview, setDeletingReview] = useState(null);

  async function handleDeleteReview(change) {
    try {
      await api.deletePendingChange(change.id);
      setDeletingReview(null);
      refreshPendingChanges();
    } catch (err) {
      setReviewError(err.message || "Could not delete this request.");
    }
  }

  const STUDENT_REG_EDIT_FIELDS = [
    ["studentName", "Student Name"],
    ["studentRegNo", "Register No"],
    ["studentDob", "Date of Birth"],
    ["studentFatherName", "Father's Name"],
    ["studentAddress", "Address"],
    ["studentEmail", "Email"],
    ["studentMobile", "Mobile"],
  ];
  const INTERNAL_MARKS_EDIT_FIELDS = [
    ["scoredMarks", "Scored Marks"],
    ["totalMarks", "Total Marks"],
    ["examDate", "Exam Date"],
  ];

  async function handleResubmitReview(change, values) {
    try {
      await api.updatePendingChange(change.id, { ...change.payload, ...values }, username);
      setEditingReview(null);
      refreshPendingChanges();
    } catch (err) {
      setReviewError(err.message || "Could not resubmit this request.");
    }
  }

  async function handleApproveChange(change) {
    setReviewError("");
    try {
      await api.approvePendingChange(change.id, username);
      refreshPendingChanges();
    } catch (err) {
      setReviewError(err.message || "Could not approve this request.");
    }
  }

  async function handleRejectChange(change, note) {
    setReviewError("");
    try {
      await api.rejectPendingChange(change.id, username, note);
      setRejectingChange(null);
      refreshPendingChanges();
    } catch (err) {
      setReviewError(err.message || "Could not reject this request.");
    }
  }

  async function handleResubmitChange(change, values) {
    await api.updatePendingChange(change.id, {
      name: values.name,
      registerNo: values.registerNo,
      term: values.term,
      status: values.status || "Active",
      courseId: change.payload.courseId,
      subjectId: change.payload.subjectId,
      internal: values.internal,
      exam: values.exam,
      result: values.result,
    }, username);
    setEditingChange(null);
    refreshPendingChanges();
  }

  return (
    <section className="content-stack institution-portal">
      <section className="board-summary-card">
        <div className="board-summary-head">
          <div>
            <p className="eyebrow">Institution Portal</p>
            <h2>{institution?.name || "Loading..."}</h2>
            <span>{username}</span>
          </div>
          {institution && <StatusBadge status={institution.status} />}
        </div>
      </section>

      {!isApprover && (
        <>
          <section className="data-table-card">
            <div className="data-table-heading">
              <div>
                <h3>Student &amp; Internal Marks Entry</h3>
                <span>Select the course and subject, then add the student and their internal marks together.</span>
              </div>
            </div>
            <div className="form-grid" style={{ padding: "0 4px 16px" }}>
              <label>
                <span>Course</span>
                <select
                  value={selectedCourseId || ""}
                  onChange={(e) => setSelectedCourseId(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">Select course</option>
                  {courseOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Subject</span>
                <select
                  value={selectedSubjectId || ""}
                  disabled={!selectedCourseId}
                  onChange={(e) => setSelectedSubjectId(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">{selectedCourseId ? "Select subject" : "Select a course first"}</option>
                  {subjectOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {selectedCourse && selectedSubject && (
              <>
                <div className="dashboard-action-bar">
                  <button type="button" className="primary-btn" onClick={() => setAddStudentOpen(true)}>
                    Add Student &amp; Internal Marks
                  </button>
                </div>
                <div className="table-wrap data-table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Reg No</th>
                        <th>Student Name</th>
                        <th>Scored Marks</th>
                        <th>Total Marks</th>
                        <th>Status</th>
                        <th>Uploaded on</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courseSubjectChanges.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="empty-state">
                            <div className="table-empty">
                              <span>No students yet</span>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        courseSubjectChanges.map((change) => (
                          <tr key={change.id}>
                            <td data-label="Student Name">{change.payload.name}</td>
                            <td data-label="Register No">{change.payload.registerNo}</td>
                            <td data-label="Term">{change.payload.term}</td>
                            <td data-label="Scored Marks">{change.payload.internal}</td>
                            <td data-label="Total Marks">{change.payload.exam}</td>
                            <td data-label="Result">{change.payload.result}</td>
                            <td data-label="Status">
                              <StatusBadge status={change.status} />
                            </td>
                            <td data-label="Actions">
                              <div className="action-group">
                                <IconButton label="View" icon={FileText} onClick={() => setViewingChange(change)} />
                                <IconButton
                                  label="Delete"
                                  icon={Trash2}
                                  tone="danger"
                                  disabled={change.status === "Approved"}
                                  title={change.status === "Approved" ? "Approved requests cannot be deleted" : "Withdraw this request"}
                                  onClick={() => change.status !== "Approved" && setDeletingChange(change)}
                                />
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>
        </>
      )}

      {isApprover && (
        <section className="data-table-card">
          <div className="data-table-heading">
            <div>
              <h3>Marks Approvals</h3>
            </div>
          </div>
          {reviewError && <div className="login-error">{reviewError}</div>}

          <div className="table-toolbar">
            <label className="search-box small">
              <Search size={15} />
              <input value={reviewSearch} onChange={(e) => { setReviewSearch(e.target.value); setReviewPage(1); }} placeholder="Search" />
            </label>
            <div className="table-toolbar-controls">
              <label className="select-box small">
                <Filter size={15} />
                <select value={reviewStatusFilter} onChange={(e) => { setReviewStatusFilter(e.target.value); setReviewPage(1); }}>
                  <option>All</option>
                  {REVIEW_STATUS_FILTERS.map((o) => <option key={o}>{o}</option>)}
                </select>
              </label>
              <label className="select-box small rows-select">
                Rows
                <select value={reviewRowsPerPage} onChange={(e) => { setReviewRowsPerPage(Number(e.target.value)); setReviewPage(1); }}>
                  {[5, 10, 20].map((o) => <option key={o}>{o}</option>)}
                </select>
              </label>
              <ExportMenu
                disabled={filteredReviews.length === 0}
                getData={() => ({
                  title: "Marks Approvals",
                  headers: ["Reg No", "Student", "Scored", "Total", "Result", "Status", "Uploaded"],
                  rows: filteredReviews.map((c) => {
                    const v = rowView(c);
                    return [v.regNo, v.name, v.scored, v.total, v.result || "-", c.status, formatDate(c.requestedDate?.slice(0, 10))];
                  }),
                })}
              />
            </div>
          </div>

          <div className="table-wrap data-table-scroll">
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
                  <th>Uploaded on</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                  {reviewPageRows.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="empty-state">
                      <div className="table-empty">
                        <span>No marks requests to review</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                    reviewPageRows.map((change, i) => {
                    const v = rowView(change);
                    const isFinal = change.status === "Approved";
                    return (
                      <tr key={change.id}>
                        <td data-label="S.No">{i + 1}</td>
                        <td data-label="Institution">{(institution?.name || "-").toUpperCase()}</td>
                        <td data-label="Course">{v.course || "-"}</td>
                        <td data-label="Subject">{v.subject || "-"}</td>
                        <td data-label="Reg No">{v.regNo}</td>
                        <td data-label="Student Name">{v.name}</td>
                        <td data-label="Scored Marks">{v.scored}</td>
                        <td data-label="Total Marks">{v.total}</td>
                        <td data-label="Pass Marks">{v.pass ?? "-"}</td>
                        <td data-label="Result">
                          {v.result ? (
                            <span style={{ fontWeight: 700, color: v.result === "Pass" ? "#1e7e34" : "#b00020" }}>{v.result}</span>
                          ) : "-"}
                        </td>
                        <td data-label="Status">
                          <StatusBadge status={change.status} />
                        </td>
                        <td data-label="Uploaded on">{formatDate(change.requestedDate?.slice(0, 10))}</td>
                        <td data-label="Actions">
                          <div className="action-group">
                            {change.status === "Pending" && (
                              <>
                                <IconButton label="Approve" onClick={() => handleApproveChange(change)} icon={CircleCheck} />
                                <IconButton label="Reject" onClick={() => setRejectingChange(change)} icon={X} tone="danger" />
                              </>
                            )}
                            <IconButton label="View" icon={FileText} onClick={() => setViewingReview(change)} />
                            {!isFinal && (
                              <>
                                <IconButton
                                  label="Delete"
                                  icon={Trash2}
                                  tone="danger"
                                  title="Withdraw this request"
                                  onClick={() => setDeletingReview(change)}
                                />
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              </table>
          </div>

          <div className="pagination">
            <span>{reviewRangeStart}-{reviewRangeEnd} of {filteredReviews.length}</span>
            <div>
              <button onClick={() => setReviewPage((p) => Math.max(1, p - 1))} disabled={reviewCurrentPage === 1} aria-label="Previous page">
                <ChevronLeft size={17} />
              </button>
              <strong>{reviewCurrentPage} / {reviewTotalPages}</strong>
              <button onClick={() => setReviewPage((p) => Math.min(reviewTotalPages, p + 1))} disabled={reviewCurrentPage === reviewTotalPages} aria-label="Next page">
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        </section>
      )}

      {addStudentOpen && (
        <RecordModal
          mode="add"
          row={{ name: "", registerNo: "", term: "", internal: "", exam: "", result: "Pass", status: "Active" }}
          fields={studentWithMarksFields}
          title="Add Student & Internal Marks"
          onClose={() => setAddStudentOpen(false)}
          onSave={saveStudentWithMarks}
        />
      )}
      {rejectingChange && (
        <ReviewRejectDialog
          change={rejectingChange}
          onCancel={() => setRejectingChange(null)}
          onConfirm={(note) => handleRejectChange(rejectingChange, note)}
        />
      )}
      {editingChange && (
        <RecordModal
          mode="edit"
          row={{ ...editingChange.payload }}
          fields={studentWithMarksFields}
          title="Correct Student & Marks"
          onClose={() => setEditingChange(null)}
          onSave={(values) => handleResubmitChange(editingChange, values)}
        />
      )}
      {editingCreatorChange && (
        <RecordModal
          mode="edit"
          row={{ ...editingCreatorChange.payload }}
          fields={studentWithMarksFields}
          title="Correct Student & Marks"
          onClose={() => setEditingCreatorChange(null)}
          onSave={(values) => handleCreatorResubmit(editingCreatorChange, values)}
        />
      )}

      {deletingChange && (
        <ConfirmDialog
          title="Delete this request?"
          message="This action cannot be undone."
          onConfirm={() => handleDeleteCreatorChange(deletingChange)}
          onCancel={() => setDeletingChange(null)}
        />
      )}
    
      {viewingChange && (
        <div className="modal-backdrop" role="presentation">
          <section className="modal" role="dialog" aria-modal="true" aria-label="Student Details">
            <div className="modal-heading">
              <div>
                <p className="eyebrow">view</p>
                <h3>{viewingChange.payload.name}</h3>
              </div>
              <button className="icon-btn" onClick={() => setViewingChange(null)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className="preview-section-stack">
              <section className="preview-section">
                <dl>
                  <div><dt>Register No</dt><dd>{viewingChange.payload.registerNo}</dd></div>
                  <div><dt>Term</dt><dd>{viewingChange.payload.term}</dd></div>
                  <div><dt>Scored Marks</dt><dd>{viewingChange.payload.internal}</dd></div>
                  <div><dt>Total Marks</dt><dd>{viewingChange.payload.exam}</dd></div>
                  <div><dt>Result</dt><dd>{viewingChange.payload.result}</dd></div>
                  <div><dt>Status</dt><dd><StatusBadge status={viewingChange.status} /></dd></div>
                  {viewingChange.reviewNote && <div><dt>Note</dt><dd>{viewingChange.reviewNote}</dd></div>}
                </dl>
              </section>
            </div>
            <div className="modal-actions">
              <button className="primary-btn" onClick={() => setViewingChange(null)}>
                Close
              </button>
            </div>
          </section>
        </div>
      )}
      {viewingReview && (
        <div className="modal-backdrop" role="presentation">
          <section className="modal" role="dialog" aria-modal="true" aria-label="Request Details">
            <div className="modal-heading">
              <div>
                <p className="eyebrow">view</p>
                <h3>{rowView(viewingReview).name}</h3>
              </div>
              <button className="icon-btn" onClick={() => setViewingReview(null)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className="preview-section-stack">
              <section className="preview-section">
                <dl>
                  {Object.entries(viewingReview.payload).map(([key, value]) => (
                    <div key={key}><dt>{PAYLOAD_LABELS[key] || key}</dt><dd>{renderPayloadValue(key, value)}</dd></div>
                  ))}
                  <div><dt>Status</dt><dd><StatusBadge status={viewingReview.status} /></dd></div>
                </dl>
              </section>
            </div>
            <div className="modal-actions">
              <button className="primary-btn" onClick={() => setViewingReview(null)}>Close</button>
            </div>
          </section>
        </div>
      )}
      {editingReview && (
        <RecordModal
          mode="edit"
          row={{ ...editingReview.payload }}
          fields={editingReview.entityType === "student_registration" ? STUDENT_REG_EDIT_FIELDS : INTERNAL_MARKS_EDIT_FIELDS}
          title="Correct and Resubmit"
          onClose={() => setEditingReview(null)}
          onSave={(values) => handleResubmitReview(editingReview, values)}
        />
      )}
      {deletingReview && (
        <ConfirmDialog
          title="Delete this request?"
          message="This action cannot be undone."
          onConfirm={() => handleDeleteReview(deletingReview)}
          onCancel={() => setDeletingReview(null)}
        />
      )}
    </section>
  );
}

function StudentMarksSummary({ payload }) {
  const passed = payload.result === "Pass";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 260 }}>
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: "var(--brand-soft)",
          color: "var(--deep-navy)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          fontSize: "0.85rem",
          flexShrink: 0,
        }}
      >
        {(payload.name || "?").trim().charAt(0).toUpperCase()}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <strong style={{ fontSize: "0.92rem", color: "var(--ink)" }}>{payload.name}</strong>
          <span style={{ fontSize: "0.76rem", color: "var(--muted)" }}>Reg. {payload.registerNo}</span>
          <span style={{ fontSize: "0.76rem", color: "var(--muted)" }}>&middot; Term {payload.term}</span>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span
            style={{
              fontSize: "0.74rem",
              fontWeight: 600,
              padding: "2px 9px",
              borderRadius: 999,
              background: "var(--soft-gray)",
              color: "var(--ink)",
            }}
          >
            Internal {payload.internal}
          </span>
          <span
            style={{
              fontSize: "0.74rem",
              fontWeight: 600,
              padding: "2px 9px",
              borderRadius: 999,
              background: "var(--soft-gray)",
              color: "var(--ink)",
            }}
          >
            Exam {payload.exam}
          </span>
          <span
            style={{
              fontSize: "0.74rem",
              fontWeight: 700,
              padding: "2px 9px",
              borderRadius: 999,
              background: passed ? "rgba(34,197,94,0.14)" : "rgba(239,68,68,0.14)",
              color: passed ? "#15803d" : "#b91c1c",
            }}
          >
            {payload.result}
          </span>
        </div>
      </div>
    </div>
  );
}

function summarizePayload(payload) {
  return Object.entries(payload || {})
    .filter(([, value]) => value !== null && value !== undefined && value !== "")
    .map(([key, value]) => `${key}: ${value}`)
    .join(", ");
}

function ReviewRejectDialog({ change, onCancel, onConfirm }) {
  const [note, setNote] = useState("");
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal confirm-dialog" role="alertdialog" aria-modal="true" aria-label="Reject this request?">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Confirm</p>
            <h3>Reject this student request?</h3>
          </div>
          <button className="icon-btn" onClick={onCancel} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <label>
          <span>Reason (optional)</span>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Let the Creator know why" />
        </label>
        <div className="modal-actions">
          <button className="secondary-btn" onClick={onCancel}>
            Cancel
          </button>
          <button className="primary-btn" onClick={() => onConfirm(note)}>
            <X size={16} />
            Reject
          </button>
        </div>
      </section>
    </div>
  );
}