import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, CircleCheck } from "lucide-react";
import * as api from "../api.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_PATTERN = /^[0-9]{10}$/;

// Step 1 -> tbl_student_det, Step 2 -> tbl_student_enrol. Submitted directly
// (no approval queue) - the student is a real, live record the moment this
// is submitted, and immediately selectable in Internal Marks Management.
// The registered-students list itself lives on its own page, Student
// Management (see StudentManagementPage.jsx).
export default function StudentRegistrationPage({ institutionId, username }) {
  const [step, setStep] = useState(1);
  const [regions, setRegions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [years, setYears] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [touched, setTouched] = useState({});

  const [form, setForm] = useState({
    studentName: "",
    studentDob: "",
    studentFatherName: "",
    studentAddress: "",
    studentEmail: "",
    studentMobile: "",
    regionId: "",
    courseId: "",
    yearId: "",
  });

  useEffect(() => {
    api.getRegions().then(setRegions).catch(() => setRegions([]));
    api.getCourses(institutionId).then(setCourses).catch(() => setCourses([]));
    api.getYears().then(setYears).catch(() => setYears([]));
  }, [institutionId]);

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }
  function markTouched(key) {
    setTouched((prev) => ({ ...prev, [key]: true }));
  }

  const step1Fields = ["studentName", "studentDob", "studentFatherName", "studentAddress", "studentEmail", "studentMobile", "regionId"];
  const step2Fields = ["courseId", "yearId"];

  const step1Errors = {
    studentName: !form.studentName.trim() && "Student Name is required.",
    studentDob: !form.studentDob && "Date of Birth is required.",
    studentFatherName: !form.studentFatherName.trim() && "Father's Name is required.",
    studentAddress: !form.studentAddress.trim() && "Address is required.",
    studentEmail: !EMAIL_PATTERN.test(form.studentEmail) && "Enter a valid email, e.g. name@example.com.",
    studentMobile: !MOBILE_PATTERN.test(form.studentMobile) && "Enter a valid 10-digit mobile number.",
    regionId: !form.regionId && "Region is required.",
  };
  const step2Errors = {
    courseId: !form.courseId && "Course is required.",
    yearId: !form.yearId && "Year is required.",
  };

  const step1Valid = step1Fields.every((k) => !step1Errors[k]);
  const step2Valid = step2Fields.every((k) => !step2Errors[k]);

  function touchAll(fields) {
    setTouched((prev) => {
      const next = { ...prev };
      fields.forEach((f) => (next[f] = true));
      return next;
    });
  }
  function goNext(fields, valid) {
    touchAll(fields);
    if (valid) setStep(step + 1);
  }

  const courseName = useMemo(
    () => courses.find((c) => String(c.id) === String(form.courseId))?.name || "-",
    [courses, form.courseId],
  );
  const yearName = useMemo(
    () => years.find((y) => String(y.id) === String(form.yearId))?.name || "-",
    [years, form.yearId],
  );
  const regionName = useMemo(
    () => regions.find((r) => String(r.id) === String(form.regionId))?.name || "-",
    [regions, form.regionId],
  );

  async function handleSubmit() {
    setError("");
    try {
      await api.createStudentDirect(institutionId, { ...form, actor: username });
      setSubmitted(true);
    } catch (err) {
      setError(err.message || "Could not register this student.");
    }
  }

  function resetForm() {
    setForm({
      studentRegNo: "", studentName: "", studentDob: "", studentFatherName: "",
      studentAddress: "", studentEmail: "", studentMobile: "",
      regionId: "", courseId: "", yearId: "",
    });
    setTouched({});
    setStep(1);
    setSubmitted(false);
  }

  function fieldError(key, errors) {
    return touched[key] && errors[key] ? errors[key] : null;
  }

  return (
    <section className="content-stack" style={{ width: "100%", maxWidth: "none", padding: "0 32px" }}>
      <div className="page-heading">
        <div>
          <br></br>
          <h2>Student Registration</h2>
        </div>
      </div>

      <section className="data-table-card" style={{ width: "100%" }}>
        <div className="stepper-track" style={{ display: "flex", gap: 10, marginBottom: 28 }}>
          {["Student Details", "Enrolment", "Review & Submit"].map((label, idx) => (
            <div
              key={label}
              style={{
                flex: 1,
                textAlign: "center",
                padding: "12px 8px",
                borderRadius: 10,
                fontSize: "0.88rem",
                fontWeight: 700,
                background: step === idx + 1 ? "var(--brand-soft)" : "var(--soft-gray)",
                color: step === idx + 1 ? "var(--brand-dark)" : "var(--muted)",
                border: step === idx + 1 ? "1px solid var(--brand)" : "1px solid transparent",
              }}
            >
              {idx + 1}. {label}
            </div>
          ))}
        </div>

        {error && <div className="login-error">{error}</div>}

        {submitted ? (
          <div style={{ textAlign: "center", padding: "40px 8px" }}>
            <CircleCheck size={44} color="var(--brand)" style={{ marginBottom: 14 }} />
            <h3 style={{ margin: "0 0 8px" }}>Student Registered</h3>
            <p style={{ color: "var(--muted)", marginBottom: 22 }}>
              This student has been saved and is ready for Internal Marks entry.
            </p>
            <button className="primary-btn" onClick={resetForm}>
              Register Another Student
            </button>
          </div>
        ) : (
          <>
            {step === 1 && (
              <div className="form-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "18px 24px" }}>
                <label>
                  <span>Student Name *</span>
                  <input value={form.studentName} onChange={(e) => setField("studentName", e.target.value)} onBlur={() => markTouched("studentName")} />
                  {fieldError("studentName", step1Errors) && <small style={{ color: "#b00020" }}>{step1Errors.studentName}</small>}
                </label>
                <label>
                  <span>Date of Birth *</span>
                  <input type="date" max={new Date().toISOString().slice(0, 10)} value={form.studentDob} onChange={(e) => setField("studentDob", e.target.value)} onBlur={() => markTouched("studentDob")} />
                  {fieldError("studentDob", step1Errors) && <small style={{ color: "#b00020" }}>{step1Errors.studentDob}</small>}
                </label>
                <label>
                  <span>Father's Name *</span>
                  <input value={form.studentFatherName} onChange={(e) => setField("studentFatherName", e.target.value)} onBlur={() => markTouched("studentFatherName")} />
                  {fieldError("studentFatherName", step1Errors) && <small style={{ color: "#b00020" }}>{step1Errors.studentFatherName}</small>}
                </label>
                <label style={{ gridColumn: "1 / -1" }}>
                  <span>Address *</span>
                  <input value={form.studentAddress} onChange={(e) => setField("studentAddress", e.target.value)} onBlur={() => markTouched("studentAddress")} />
                  {fieldError("studentAddress", step1Errors) && <small style={{ color: "#b00020" }}>{step1Errors.studentAddress}</small>}
                </label>
                <label>
                  <span>Email *</span>
                  <input type="email" placeholder="name@example.com" value={form.studentEmail} onChange={(e) => setField("studentEmail", e.target.value)} onBlur={() => markTouched("studentEmail")} />
                  {fieldError("studentEmail", step1Errors) && <small style={{ color: "#b00020" }}>{step1Errors.studentEmail}</small>}
                </label>
                <label>
                  <span>Mobile *</span>
                  <input placeholder="10-digit mobile number" value={form.studentMobile} onChange={(e) => setField("studentMobile", e.target.value.replace(/\D/g, ""))} onBlur={() => markTouched("studentMobile")} maxLength={10} />
                  {fieldError("studentMobile", step1Errors) && <small style={{ color: "#b00020" }}>{step1Errors.studentMobile}</small>}
                </label>
                <label>
                  <span>Region *</span>
                  <select value={form.regionId} onChange={(e) => setField("regionId", e.target.value)} onBlur={() => markTouched("regionId")}>
                    <option value="">Select region</option>
                    {regions.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                  {fieldError("regionId", step1Errors) && <small style={{ color: "#b00020" }}>{step1Errors.regionId}</small>}
                </label>
              </div>
            )}

            {step === 2 && (
              <div className="form-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "18px 24px", maxWidth: 560 }}>
                <label>
                  <span>Course *</span>
                  <select value={form.courseId} onChange={(e) => setField("courseId", e.target.value)} onBlur={() => markTouched("courseId")}>
                    <option value="">Select course</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  {fieldError("courseId", step2Errors) && <small style={{ color: "#b00020" }}>{step2Errors.courseId}</small>}
                </label>
                <label>
                  <span>Year *</span>
                  <select value={form.yearId} onChange={(e) => setField("yearId", e.target.value)} onBlur={() => markTouched("yearId")}>
                    <option value="">Select year</option>
                    {years.map((y) => (
                      <option key={y.id} value={y.id}>{y.name}</option>
                    ))}
                  </select>
                  {fieldError("yearId", step2Errors) && <small style={{ color: "#b00020" }}>{step2Errors.yearId}</small>}
                </label>
              </div>
            )}

            {step === 3 && (
              <div className="preview-section-stack">
                <section className="preview-section">
                  <h4>Student Details</h4>
                  <dl>
                    <div><dt>Register No</dt><dd>Assigned automatically on registration</dd></div>
                    <div><dt>Name</dt><dd>{form.studentName}</dd></div>
                    <div><dt>Date of Birth</dt><dd>{form.studentDob}</dd></div>
                    <div><dt>Father's Name</dt><dd>{form.studentFatherName}</dd></div>
                    <div><dt>Address</dt><dd>{form.studentAddress}</dd></div>
                    <div><dt>Email</dt><dd>{form.studentEmail}</dd></div>
                    <div><dt>Mobile</dt><dd>{form.studentMobile}</dd></div>
                    <div><dt>Region</dt><dd>{regionName}</dd></div>
                  </dl>
                </section>
                <section className="preview-section">
                  <h4>Enrolment</h4>
                  <dl>
                    <div><dt>Course</dt><dd>{courseName}</dd></div>
                    <div><dt>Year</dt><dd>{yearName}</dd></div>
                  </dl>
                </section>
              </div>
            )}

            <div className="modal-actions" style={{ marginTop: 24 }}>
              {step > 1 && (
                <button className="secondary-btn" onClick={() => setStep(step - 1)}>
                  <ChevronLeft size={16} /> Back
                </button>
              )}
              {step === 1 && (
                <button className="primary-btn" onClick={() => goNext(step1Fields, step1Valid)}>
                  Next <ChevronRight size={16} />
                </button>
              )}
              {step === 2 && (
                <button className="primary-btn" onClick={() => goNext(step2Fields, step2Valid)}>
                  Next <ChevronRight size={16} />
                </button>
              )}
              {step === 3 && (
                <button className="primary-btn" onClick={handleSubmit}>
                  <CircleCheck size={16} /> Register Student
                </button>
              )}
            </div>
          </>
        )}
      </section>
    </section>
  );
}