import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, CircleCheck, Trash2, ToggleLeft, ToggleRight } from "lucide-react";


// Combined view + edit modal for a student: edit fields inline, save,
// toggle Active/Inactive, or delete.
export default function StudentEditModal({
  student, institutions = [], courses = [], years = [], regions = [],
  onSave, onDelete, onClose,
}) {
  const [values, setValues] = useState({
    studentRegNo: student.registerNo || "",
    studentName: student.name || "",
    studentDob: student.dob || "",
    studentFatherName: student.fatherName || "",
    studentAddress: student.address || "",
    studentEmail: student.email || "",
    studentMobile: student.mobile || "",
    studentGender: student.gender || "",
    regionId: student.regionId ?? "",
    courseId: student.courseId ?? "",
    yearId: student.yearId ?? "",
    status: student.status || "Active",
  });

  const photoUrl = student.photo
    ? `http://${window.location.hostname}:5001/api/uploads/${student.photo}`
    : null;

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const set = (k, v) => setValues((p) => ({ ...p, [k]: v }));
  const isActive = String(values.status).toLowerCase() === "active";

    const textFields = [
    ["studentRegNo", "Register No"],
    ["studentName", "Student Name"],
    ["studentDob", "Date of Birth"],
    ["studentFatherName", "Father's Name"],
    ["studentAddress", "Address"],
    ["studentEmail", "Email"],
    ["studentMobile", "Mobile"],
  ];

  const genderOptions = ["Male", "Female"];

  const selectFields = [
    ["courseId", "Course", courses],
    ["yearId", "Year", years],
    ["regionId", "Region", regions],
  ];

  return createPortal(
    <div className="modal-backdrop" role="presentation">
      <section className="modal" role="dialog" aria-modal="true" aria-label="Student">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">edit</p>
            <h3>Student Details</h3>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

          <div className="view-grid">
          {photoUrl && (
            <div className="view-row" style={{ justifyContent: "center" }}>
              <img src={photoUrl} alt="student" style={{ width: 110, height: 110, objectFit: "cover", borderRadius: 10, border: "1px solid var(--line)" }} />
            </div>
          )}
          {textFields.map(([key, label]) => (
            <div className="view-row" key={key}>
              <span className="view-label">{label}</span>
              <input
                className="cell-input"
                value={values[key]}
                onChange={(e) => set(key, e.target.value)}
              />
            </div>
          ))}

          {selectFields.map(([key, label, list]) => (
            <div className="view-row" key={key}>
              <span className="view-label">{label}</span>
              <select
                className="cell-input"
                value={String(values[key] ?? "")}
                onChange={(e) => set(key, e.target.value)}
              >
                <option value="">—</option>
                {list.map((o) => (
                  <option key={o.id} value={String(o.id)}>{o.name}</option>
                ))}
              </select>
            </div>
          ))}

          <div className="view-row">
            <span className="view-label">Gender</span>
            <select
              className="cell-input"
              value={values.studentGender}
              onChange={(e) => set("studentGender", e.target.value)}
            >
              <option value="">—</option>
              {genderOptions.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <div className="view-row">
            <span className="view-label">Status</span>
            <span className="view-value" style={{ fontWeight: 700 }}>{values.status}</span>
          </div>
        </div>

        <div className="modal-actions">
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="secondary-btn" onClick={onClose}>Cancel</button>
            <button type="button" className="primary-btn" onClick={() => onSave(student, values)}>
              <CircleCheck size={18} /> Save
            </button>
          </div>
        </div>
      </section>
    </div>,
    document.body
  );
}