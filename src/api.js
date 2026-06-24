// Thin fetch wrappers for the Flask API backing the Institutions / Courses /
// Subjects hierarchy on the BOME/BOEN board dashboard. Everything else in the
// app keeps reading from the mock SEED_DATA - only these endpoints are real.

// Use whatever host the frontend itself was loaded from (localhost, a LAN IP,
// etc.) instead of hardcoding "localhost" - otherwise a browser on another
// machine would try to reach its OWN localhost:5000, not this one.
const BASE_URL = `http://${window.location.hostname}:5000/api`;
//const BASE_URL = "/api";

async function request(path, options) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    let message = `Request failed: ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // ignore non-JSON error bodies
    }
    throw new Error(message);
  }
  return res.json();
}

export function getRegions() {
  return request("/regions");
}

export function getYears() {
  return request("/years");
}

export function getExamSems() {
  return request("/exam-sems");
}

export function getListCourses() {
  return request("/courses");
}

export function getListSubjects() {
  return request("/subjects");
}

export function getInstitutions(board) {
  const query = board ? `?board=${encodeURIComponent(board)}` : "";
  return request(`/institutions${query}`);
}

export function getInstitution(id) {
  return request(`/institutions/${id}`);
}

export function createInstitution(payload) {
  return request("/institutions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateInstitution(id, payload) {
  return request(`/institutions/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteInstitution(id) {
  return request(`/institutions/${id}`, { method: "DELETE" });
}

export function getCourses(institutionId) {
  return request(`/institutions/${institutionId}/courses`);
}

export function createCourse(institutionId, payload) {
  return request(`/institutions/${institutionId}/courses`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateCourse(courseId, payload) {
  return request(`/courses/${courseId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteCourse(institutionId, courseId) {
  return request(`/institutions/${institutionId}/courses/${courseId}`, { method: "DELETE" });
}

export function getSubjects(courseId) {
  return request(`/courses/${courseId}/subjects`);
}

export function createSubject(courseId, payload) {
  return request(`/courses/${courseId}/subjects`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateSubject(courseSubjectId, payload) {
  return request(`/subjects/${courseSubjectId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteSubject(courseSubjectId) {
  return request(`/subjects/${courseSubjectId}`, { method: "DELETE" });
}

export function login(username, password) {
  return request("/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export function getDepartmentAdmins() {
  return request("/users");
}

export function createDepartmentAdmin(payload) {
  return request("/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function deleteDepartmentAdmin(id) {
  return request(`/users/${id}`, { method: "DELETE" });
}

// --------------------------------------------------------------------------
// Institution-login accounts and the pending-changes approval queue. Not
// wired into any UI yet - see backend/routes/approvals.py for the design.
// --------------------------------------------------------------------------

export function getInstitutionUsers(institutionId) {
  const query = institutionId ? `?institution_id=${institutionId}` : "";
  return request(`/institution-users${query}`);
}

export function createInstitutionUser(payload) {
  return request("/institution-users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function deleteInstitutionUser(id) {
  return request(`/institution-users/${id}`, { method: "DELETE" });
}

export function getPendingChanges({ institutionId, status } = {}) {
  const params = new URLSearchParams();
  if (institutionId) params.set("institution_id", institutionId);
  if (status) params.set("status", status);
  const query = params.toString() ? `?${params.toString()}` : "";
  return request(`/pending-changes${query}`);
}

export function submitPendingChange(payload) {
  return request("/pending-changes", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function approvePendingChange(changeId, actor) {
  return request(`/pending-changes/${changeId}/approve`, {
    method: "POST",
    body: JSON.stringify({ actor }),
  });
}

export function rejectPendingChange(changeId, actor, note) {
  return request(`/pending-changes/${changeId}/reject`, {
    method: "POST",
    body: JSON.stringify({ actor, note }),
  });
}

// --------------------------------------------------------------------------
// Students / Marks / Attendance - direct CRUD (used by approved-change
// application server-side; not called from the UI yet).
// --------------------------------------------------------------------------

export function getStudents(institutionId, courseId) {
  const query = courseId ? `?course_id=${courseId}` : "";
  return request(`/institutions/${institutionId}/students${query}`);
}

export function createStudent(institutionId, payload) {
  return request(`/institutions/${institutionId}/students`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateStudent(studentId, payload) {
  return request(`/students/${studentId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteStudent(studentId) {
  return request(`/students/${studentId}`, { method: "DELETE" });
}

export function getStudentMarks(studentId) {
  return request(`/students/${studentId}/marks`);
}

export function createStudentMarks(studentId, payload) {
  return request(`/students/${studentId}/marks`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateStudentMarks(markId, payload) {
  return request(`/marks/${markId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteStudentMarks(markId) {
  return request(`/marks/${markId}`, { method: "DELETE" });
}

export function getAttendance(studentId) {
  return request(`/students/${studentId}/attendance`);
}

export function createAttendance(studentId, payload) {
  return request(`/students/${studentId}/attendance`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAttendance(attendanceId, payload) {
  return request(`/attendance/${attendanceId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteAttendance(attendanceId) {
  return request(`/attendance/${attendanceId}`, { method: "DELETE" });
}
