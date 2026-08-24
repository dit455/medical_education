import { useState, useEffect, useMemo } from "react";
import { X, Pencil, FileText, Trash2 } from "lucide-react";
import * as api from "../api.js";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import IconButton from "../components/IconButton.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import RecordModal from "../components/RecordModal.jsx";

// Lists every student registered at this institution (tbl_student_det +
// tbl_student_enrol, via api.getInstitutionStudents). Split out of Student
// Registration so registering a new student and managing existing ones are
// two separate menu items.
export default function StudentManagementPage({ institutionId, username }) {
  const [regions, setRegions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [years, setYears] = useState([]);
  const [students, setStudents] = useState([]);
  const [viewingStudent, setViewingStudent] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [deletingStudent, setDeletingStudent] = useState(null);

  function refreshStudents() {
    api.getInstitutionStudents(institutionId).then(setStudents).catch(() => setStudents([]));
  }

  useEffect(() => {
    api.getRegions().then(setRegions).catch(() => setRegions([]));
    api.getCourses(institutionId).then(setCourses).catch(() => setCourses([]));
    api.getYears().then(setYears).catch(() => setYears([]));
    refreshStudents();
  }, [institutionId]);

  function nameFor(list, id) {
    return list.find((x) => String(x.id) === String(id))?.name || "-";
  }

  const REG_EDIT_FIELDS = useMemo(
    () => [
      ["studentName", "Student Name"],
      ["studentDob", "Date of Birth"],
      ["studentFatherName", "Father's Name"],
      ["studentAddress", "Address"],
      ["studentEmail", "Email"],
      ["studentMobile", "Mobile"],
    ],
    [courses],
  );

  function toFormShape(student) {
    return {
      studentRegNo: student.registerNo || "",
      studentName: student.name || "",
      studentDob: student.dob || "",
      studentFatherName: student.fatherName || "",
      studentAddress: student.address || "",
      studentEmail: student.email || "",
      studentMobile: student.mobile || "",
      regionId: student.regionId || "",
      courseId: student.courseId || "",
      yearId: student.yearId || "",
    };
  }

  async function handleUpdateStudent(student, values) {
    try {
      await api.updateStudentDirect(student.id, { ...values, actor: username });
      setEditingStudent(null);
      refreshStudents();
    } catch (err) {
      alert(err.message || "Could not update this student.");
    }
  }

  async function handleDeleteStudent(student) {
    try {
      await api.deleteStudent(student.id);
      setDeletingStudent(null);
      refreshStudents();
    } catch (err) {
      alert(err.message || "Could not delete this student.");
    }
  }

  return (
    <section className="content-stack" style={{ width: "100%", maxWidth: "none", padding: "0 32px" }}>
      <div className="page-heading">
        <div>
          <h2>Student Management</h2>
        </div>
      </div>

      <section className="data-table-card" style={{ width: "100%" }}>
        <div className="data-table-heading">
          <div>
            <h3>Registered Students</h3>
            <span>Students registered at your institution, saved directly to the database.</span>
          </div>
        </div>
        <div className="table-wrap data-table-scroll">
          <table>
            <thead>
              <tr>
                <th>Reg No</th>
                <th>Student Name</th>
                <th>Course</th>
                <th>Year</th>
                <th>Region</th>
                <th>Details</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan={8} className="empty-state">
                    <div className="table-empty">
                      <span>No students registered yet</span>
                    </div>
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id}>
                    <td data-label="Reg No">{student.registerNo}</td>
                    <td data-label="Student Name">{student.name}</td>
                    <td data-label="Course">{nameFor(courses, student.courseId)}</td>
                    <td data-label="Year">{nameFor(years, student.yearId)}</td>
                    <td data-label="Region">{nameFor(regions, student.regionId)}</td>
                    <td data-label="Details">
                      <div style={{ display: "flex", flexDirection: "column", gap: 2, fontSize: "0.82rem" }}>
                        <span>DOB {student.dob}</span>
                        <span>Father: {student.fatherName}</span>
                        <span>{student.email}</span>
                        <span>{student.mobile}</span>
                      </div>
                    </td>
                    <td data-label="Status">
                      <StatusBadge status={student.status} />
                    </td>
                    <td data-label="Actions">
                      <div className="action-group">
                        <IconButton label="View" icon={FileText} onClick={() => setViewingStudent(student)} />
                        <IconButton
                          label="Edit"
                          icon={Pencil}
                          title="Edit this student"
                          onClick={() => setEditingStudent(student)}
                        />
                        <IconButton
                          label="Delete"
                          icon={Trash2}
                          tone="danger"
                          title="Remove this student"
                          onClick={() => setDeletingStudent(student)}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {viewingStudent && (
        <div className="modal-backdrop" role="presentation">
          <section className="modal" role="dialog" aria-modal="true" aria-label="Student Details">
            <div className="modal-heading">
              <div>
                <p className="eyebrow">view</p>
                <h3>{viewingStudent.name}</h3>
              </div>
              <button className="icon-btn" onClick={() => setViewingStudent(null)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className="preview-section-stack">
              <section className="preview-section">
                <dl>
                  <div><dt>Register No</dt><dd>{viewingStudent.registerNo}</dd></div>
                  <div><dt>Date of Birth</dt><dd>{viewingStudent.dob}</dd></div>
                  <div><dt>Father's Name</dt><dd>{viewingStudent.fatherName}</dd></div>
                  <div><dt>Address</dt><dd>{viewingStudent.address}</dd></div>
                  <div><dt>Email</dt><dd>{viewingStudent.email}</dd></div>
                  <div><dt>Mobile</dt><dd>{viewingStudent.mobile}</dd></div>
                  <div><dt>Course</dt><dd>{nameFor(courses, viewingStudent.courseId)}</dd></div>
                  <div><dt>Year</dt><dd>{nameFor(years, viewingStudent.yearId)}</dd></div>
                  <div><dt>Region</dt><dd>{nameFor(regions, viewingStudent.regionId)}</dd></div>
                  <div><dt>Status</dt><dd><StatusBadge status={viewingStudent.status} /></dd></div>
                </dl>
              </section>
            </div>
            <div className="modal-actions">
              <button className="primary-btn" onClick={() => setViewingStudent(null)}>Close</button>
            </div>
          </section>
        </div>
      )}
      {editingStudent && (
        <RecordModal
          mode="edit"
          row={toFormShape(editingStudent)}
          fields={REG_EDIT_FIELDS}
          title="Edit Student"
          onClose={() => setEditingStudent(null)}
          onSave={(values) => handleUpdateStudent(editingStudent, values)}
        />
      )}
      {deletingStudent && (
        <ConfirmDialog
          title="Delete this student?"
          message="This action cannot be undone."
          onConfirm={() => handleDeleteStudent(deletingStudent)}
          onCancel={() => setDeletingStudent(null)}
        />
      )}
    </section>
  );
}