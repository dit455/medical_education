import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, CircleCheck, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { formatDate, parseDisplayDate } from "../utils.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_PATTERN = /^[6-9][0-9]{9}$/;


// Combined view + edit modal for a student: edit fields inline, save,
// toggle Active/Inactive, or delete.
export default function StudentEditModal({
  student, institutions = [], courses = [], years = [], regions = [],
  onSave, onDelete, onClose,
}) {
  console.log("STUDENT PASSED TO MODAL:", student, "email value:", student.email);
  const [values, setValues] = useState({
    studentRegNo: student.registerNo || "",
    studentName: student.name || "",
    studentDob: formatDate((student.dob || "").slice(0, 10)) || "",
    admissionYear: formatDate((student.admissionYear || "").slice(0, 10)) || "",
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
  const [errors, setErrors] = useState({});
  
  const isActive = String(values.status).toLowerCase() === "active";
    // Fields that should NOT be auto-capitalised.
  const noUpper = ["studentEmail", "studentMobile", "studentDob", "admissionYear"];
    const handleText = (k, v) => {
    if (k === "studentRegNo") return; // Register No is locked
    if (k === "studentDob" || k === "admissionYear") {
      // Auto-format as DD/MM/YYYY while typing
      const d = v.replace(/\D/g, "").slice(0, 8);
      const masked = d.length > 4 ? `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}` : d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
      set(k, masked);
      setErrors((p) => ({ ...p, [k]: "" }));
      return;
    }
      if (k === "studentMobile") {
      set(k, v.replace(/\D/g, "").slice(0, 10));
      setErrors((p) => ({ ...p, [k]: "" }));
      return;
    }
    if (k === "studentEmail") setErrors((p) => ({ ...p, [k]: "" }));
    set(k, noUpper.includes(k) ? v : v.toUpperCase());
  };

  function validateDates() {
    const parse = (s) => {
      const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s || "");
      if (!m) return null;
      const [, dd, mm, yyyy] = m;
      const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
      const ok = d.getFullYear() === Number(yyyy) && d.getMonth() === Number(mm) - 1 && d.getDate() === Number(dd);
      return ok ? d : null;
    };
    const found = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dob = parse(values.studentDob);
    if (!values.studentDob) found.studentDob = "Date of Birth is required.";
    else if (!dob) found.studentDob = "Enter a valid date as DD/MM/YYYY.";
    else if (dob > today) found.studentDob = "Date of Birth cannot be in the future.";
    else {
      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
      if (age < 17) found.studentDob = "Student must be at least 17 years old.";
      else if (age > 100) found.studentDob = "Enter a valid Date of Birth.";
    }

    if (values.admissionYear) {
      const adm = parse(values.admissionYear);
      if (!adm) found.admissionYear = "Enter a valid date as DD/MM/YYYY.";
      else if (adm > today) found.admissionYear = "Year of Admission cannot be in the future.";
      else if (dob && adm < dob) found.admissionYear = "Admission date cannot be before Date of Birth.";
    }

    const email = (values.studentEmail || "").trim();
    if (!email) found.studentEmail = "Email is required.";
    else if (!EMAIL_PATTERN.test(email)) found.studentEmail = "Enter a valid email, e.g. name@example.com.";

    const mobile = (values.studentMobile || "").trim();
    if (!mobile) found.studentMobile = "Mobile number is required.";
    else if (!MOBILE_PATTERN.test(mobile)) found.studentMobile = "Enter a valid 10-digit mobile number starting with 6–9.";
    setErrors(found);
    return Object.keys(found).length === 0;
  }

  function handleSave() {
    if (!validateDates()) return;
    const upper = (s) => (typeof s === "string" ? s.trim().toUpperCase() : s);
    onSave(student, {
      ...values,
      studentRegNo: upper(values.studentRegNo),
      studentName: upper(values.studentName),
      studentFatherName: upper(values.studentFatherName),
      studentAddress: upper(values.studentAddress),
      studentEmail: (values.studentEmail || "").trim().toLowerCase(),
      // Convert DD/MM/YYYY back to YYYY-MM-DD for MySQL.
      studentDob: parseDisplayDate(values.studentDob) || null,
      admissionYear: parseDisplayDate(values.admissionYear) || null,
      // Empty dropdowns must be null, not "" (MySQL rejects "" for integer columns).
      regionId: values.regionId === "" ? null : Number(values.regionId),
      courseId: values.courseId === "" ? null : Number(values.courseId),
      yearId: values.yearId === "" ? null : Number(values.yearId),
      studentGender: values.studentGender || null,
    });
  }

    const textFields = [
    ["studentRegNo", "Register No"],
    ["studentName", "Student Name"],
    ["studentDob", "Date of Birth"],
    ["admissionYear", "Year of Admission"],
    ["studentFatherName", "Father's Name"],
    ["studentAddress", "Address"],
    ["studentEmail", "Email"],
    ["studentMobile", "Mobile"],
  ];

  const genderOptions = ["Male", "Female", "Others"];

  const selectFields = [
    ["courseId", "Course", courses],
    ["yearId", "Year", years],
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
            <X size={24} />
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
                <div style={{ flex: 1, minWidth: 0 }}>
                <input
                  className="cell-input"
                  value={values[key]}
                  readOnly={key === "studentRegNo"}
                  placeholder={key === "studentDob" || key === "admissionYear" ? "DD/MM/YYYY" : undefined}
                  style={key === "studentRegNo" ? { background: "var(--soft-gray)", cursor: "not-allowed" } : undefined}
                  onChange={(e) => handleText(key, e.target.value)}
                  onBlur={() => { if (["studentDob", "admissionYear", "studentEmail", "studentMobile"].includes(key)) validateDates(); }}
                  inputMode={key === "studentMobile" ? "numeric" : key === "studentEmail" ? "email" : undefined}
                  maxLength={key === "studentMobile" ? 10 : undefined}
                />
                {errors[key] && <small style={{ color: "#b00020", display: "block", marginTop: 4 }}>{errors[key]}</small>}
              </div>
            </div>
          ))}

          {selectFields.map(([key, label, list]) => (
            <div className="view-row" key={key}>
              <span className="view-label">{label}</span>
              <select
                className="cell-input"
                value={String(values[key] ?? "")}
                onChange={(e) => handleText(key, e.target.value)}
              >
                <option value="">—</option>
                {list.map((o) => (
                  <option key={o.id} value={String(o.id)}>{(o.name || "").toUpperCase()}</option>
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
            <button type="button" className="primary-btn" onClick={handleSave}>
              <CircleCheck size={24} /> Save
            </button>
          </div>
        </div>
      </section>
    </div>,
    document.body
  );
}