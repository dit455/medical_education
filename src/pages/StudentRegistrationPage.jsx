import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, CircleCheck } from "lucide-react";
import * as api from "../api.js";
import { formatDate } from "../utils.js";

// Today's date as YYYY-MM-DD in local (India) time — avoids UTC off-by-one
function todayLocalISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_PATTERN = /^[6-9][0-9]{9}$/;

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
  const [submitting, setSubmitting] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpBusy, setOtpBusy] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [dup, setDup] = useState({ email: "", mobile: "" });

  const [form, setForm] = useState({
    studentName: "",
    studentDob: "",
    admissionYear: "",
    studentFatherName: "",
    studentAddress: "",
    addrLine: "",
    addrPincode: "",
    addrState: "",
    addrCity: "",
    studentEmail: "",
    studentMobile: "",
    studentGender: "",
    regionId: "",
    otherState: "",
    courseId: "",
  });

  const [pinLookup, setPinLookup] = useState({ loading: false, cities: [], error: "" });

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const MAX_PHOTO_KB = 200;
  const [photoError, setPhotoError] = useState("");

  useEffect(() => {
    api.getRegions().then(setRegions).catch(() => setRegions([]));
    api.getCourses(institutionId).then(setCourses).catch(() => setCourses([]));
    api.getYears().then(setYears).catch(() => setYears([]));
  }, [institutionId]);

  useEffect(() => {
  const dirty = !submitted && (form.studentName || form.studentFatherName || form.addrLine || photoFile);
  if (!dirty) return;
  const warn = (e) => { e.preventDefault(); e.returnValue = ""; };
  window.addEventListener("beforeunload", warn);
  return () => window.removeEventListener("beforeunload", warn);
}, [form, photoFile, submitted]);

  const UPPERCASE_FIELDS = ["studentName", "studentFatherName", "studentAddress", "addrLine", "otherState"];
  // Characters removed as the user types. Names: letters + space only.
  // Address: letters, digits, space and comma only.
  const CHAR_FILTERS = {
    studentName: /[^A-Z ]/g,
    studentFatherName: /[^A-Z ]/g,
    otherState: /[^A-Z ]/g,
    addrLine: /[^A-Z0-9 ,]/g,
  };
  function setField(key, value) {
    let next = UPPERCASE_FIELDS.includes(key) && typeof value === "string" ? value.toUpperCase() : value;
    if (CHAR_FILTERS[key] && typeof next === "string") {
      next = next.replace(CHAR_FILTERS[key], "").replace(/^\s+/, "").replace(/\s{2,}/g, " ");
    }
    setForm((prev) => ({ ...prev, [key]: next }));
  }
  function markTouched(key) {
    setTouched((prev) => ({ ...prev, [key]: true }));
  }

  async function lookupPincode(pin) {
    if (!/^\d{6}$/.test(pin)) return;
    setPinLookup({ loading: true, cities: [], error: "" });
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      const data = await res.json();
      const entry = data && data[0];
      if (!entry || entry.Status !== "Success" || !entry.PostOffice?.length) {
        setPinLookup({ loading: false, cities: [], error: "No location found for this pincode." });
        setForm((prev) => ({ ...prev, addrState: "", addrCity: "" }));
        return;
      }
      const state = entry.PostOffice[0].State;
      const cities = [...new Set(entry.PostOffice.map((p) => p.District))];
      setPinLookup({ loading: false, cities, error: "" });
      setForm((prev) => ({ ...prev, addrState: state, addrCity: cities[0] || "" }));
    } catch {
      setPinLookup({ loading: false, cities: [], error: "Could not look up pincode." });
    }
  }

  const step1Fields = ["studentName", "studentDob", "admissionYear", "studentFatherName", "addrLine", "addrPincode", "addrState", "addrCity", "studentGender", "studentPhoto", "studentMobile", "studentEmail"];
  const step2Fields = ["courseId"];

  const step1Errors = {
    studentName: !form.studentName.trim() && "Student Name is required.",
        studentDob: !form.studentDob
      ? "Date of Birth is required."
      : (() => {
          const dob = new Date(form.studentDob);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (dob > today) return "Date of Birth cannot be in the future.";
          let age = today.getFullYear() - dob.getFullYear();
          const m = today.getMonth() - dob.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
          if (age < 17) return "Student must be at least 17 years old.";
          if (age > 100) return "Enter a valid Date of Birth.";
          return false;
        })(),
    admissionYear: (() => {
      if (!form.admissionYear) return "Year of Admission is required.";
      if (form.admissionYear > todayLocalISO()) return "Year of Admission cannot be in the future.";
      return false;
    })(),
    studentFatherName: !form.studentFatherName.trim() && "Father's Name is required.",
    addrLine: !form.addrLine.trim() && "Address is required.",
    addrPincode: !/^\d{6}$/.test(form.addrPincode) && "Enter a valid 6-digit pincode.",
    addrState: !form.addrState.trim() && "State is required (auto-filled from pincode).",
    addrCity: !form.addrCity.trim() && "City is required.",
    studentEmail: !form.studentEmail.trim()
      ? "Email is required."
      : !EMAIL_PATTERN.test(form.studentEmail)
        ? "Enter a valid email, e.g. name@example.com."
        : dup.email || (!emailVerified && "Verify your email with the OTP."),
    studentMobile: !MOBILE_PATTERN.test(form.studentMobile)
      ? "Enter a valid 10-digit mobile number starting with 6, 7, 8 or 9."
      : dup.mobile || false,
    studentGender: !form.studentGender && "Gender is required.",
    studentPhoto: !photoFile && "Photo is required.",
  };
  const step2Errors = {
    courseId: !form.courseId && "Course is required.",
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

async function checkDuplicate(which) {
  const value = which === "email" ? form.studentEmail : form.studentMobile;
  const valid = which === "email" ? EMAIL_PATTERN.test(value) : MOBILE_PATTERN.test(value);
  if (!valid) return;
  try {
    const res = await api.checkStudentDuplicate(which === "email" ? { email: value } : { mobile: value });
    const taken = which === "email" ? res.emailTaken : res.mobileTaken;
    setDup((prev) => ({
      ...prev,
      [which]: taken ? `This ${which === "email" ? "email" : "mobile number"} is already registered.` : "",
    }));
  } catch {
    // Ignored here - the server checks again when the form is submitted.
  }
}

async function handleSendOtp() {
  if (!EMAIL_PATTERN.test(form.studentEmail) || dup.email) return;
  setOtpBusy(true);
  try {
    await api.sendStudentOtp(form.studentEmail);
    setOtpSent(true);
    alert(`OTP sent to ${form.studentEmail}. Enter the 6-digit code to verify.`);
  } catch (err) {
    alert(err.message || "Could not send OTP.");
  } finally {
    setOtpBusy(false);
  }
}

async function handleVerifyOtp() {
  if (!/^\d{6}$/.test(otpCode)) {
    alert("Enter the 6-digit OTP sent to the email.");
    return;
  }
  try {
    await api.verifyStudentOtp(form.studentEmail, otpCode);
    setEmailVerified(true);
  } catch (err) {
    alert(err.message || "Incorrect OTP.");
  }
}

async function handleSubmit() {
  if (submitting) return;
  setSubmitting(true);
  setError("");
  try {
    const combinedAddress = `${form.addrLine}, ${form.addrCity}, ${form.addrState} - ${form.addrPincode}`;
    const created = await api.createStudentDirect(institutionId, {
      ...form,
      studentAddress: combinedAddress,
      regionId: null,
      otherState: form.addrState || null,
      yearId: years[0]?.id || null,
      actor: username,
      otp: otpCode,
    });
    if (photoFile && created?.id) {
      try { await api.uploadStudentPhoto(created.id, photoFile); }
      catch (err) { console.error("Photo upload failed:", err); }
    }
    setSubmitted(true);
  } catch (err) {
    setError(err.message || "Could not register this student.");
  } finally {
    setSubmitting(false);
  }
}

  function resetForm() {
    setForm({
      studentRegNo: "", studentName: "", studentDob: "", admissionYear: "", studentFatherName: "",
      studentAddress: "", studentEmail: "", studentMobile: "", studentGender: "",
      regionId: "", otherState: "", courseId: "", examSessionId: "",
    });
    setPhotoFile(null);
    setPhotoPreview(null);
    setTouched({});
    setOtpSent(false);
    setOtpCode("");
    setEmailVerified(false);
    setDup({ email: "", mobile: "" });
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
          <p>Fields marked * are mandatory.</p>
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
            <CircleCheck size={48} color="var(--brand)" style={{ marginBottom: 14 }} />
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
              <div className="form-grid reg-grid">
                <label>
                  <span>Student name *</span>
                  <input value={form.studentName} onChange={(e) => setField("studentName", e.target.value)} onBlur={() => markTouched("studentName")} />
                  {fieldError("studentName", step1Errors) && <small style={{ color: "#b00020" }}>{step1Errors.studentName}</small>}
                </label>
                <label>
                  <span>Father's name *</span>
                  <input value={form.studentFatherName} onChange={(e) => setField("studentFatherName", e.target.value)} onBlur={() => markTouched("studentFatherName")} />
                  {fieldError("studentFatherName", step1Errors) && <small style={{ color: "#b00020" }}>{step1Errors.studentFatherName}</small>}
                </label>
                <label>
                  <span>Date of birth *</span>
                  <input type="date" max={new Date().toISOString().slice(0, 10)} value={form.studentDob} onChange={(e) => setField("studentDob", e.target.value)} onBlur={() => markTouched("studentDob")} />
                  {fieldError("studentDob", step1Errors) && <small style={{ color: "#b00020" }}>{step1Errors.studentDob}</small>}
                </label>
                <label>
                  <span>Year of admission *</span>
                  <input type="date" max={new Date().toISOString().slice(0, 10)} value={form.admissionYear} onChange={(e) => setField("admissionYear", e.target.value)} onBlur={() => markTouched("admissionYear")} />
                  {fieldError("admissionYear", step1Errors) && <small style={{ color: "#b00020" }}>{step1Errors.admissionYear}</small>}
                </label>
                <label>
                  <span>Gender *</span>
                  <select value={form.studentGender} onChange={(e) => setField("studentGender", e.target.value)} onBlur={() => markTouched("studentGender")}>
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Others">Others</option>
                  </select>
                  {fieldError("studentGender", step1Errors) && <small style={{ color: "#b00020" }}>{step1Errors.studentGender}</small>}
                </label>
                <label>
                  <span>Mobile *</span>
                  <input
                    placeholder="10-digit mobile number"
                    inputMode="numeric"
                    value={form.studentMobile}
                    onChange={(e) => {
                      setField("studentMobile", e.target.value.replace(/\D/g, "").slice(0, 10));
                      setDup((prev) => ({ ...prev, mobile: "" }));
                    }}
                    onBlur={() => { markTouched("studentMobile"); checkDuplicate("mobile"); }}
                    maxLength={10}
                  />
                  {fieldError("studentMobile", step1Errors) && <small style={{ color: "#b00020" }}>{step1Errors.studentMobile}</small>}
                </label>
                <label>
                  <span>Email *</span>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={form.studentEmail}
                    onChange={(e) => {
                      setField("studentEmail", e.target.value.trim().toLowerCase());
                      setEmailVerified(false);
                      setOtpSent(false);
                      setOtpCode("");
                      setDup((prev) => ({ ...prev, email: "" }));
                    }}
                    onBlur={() => { markTouched("studentEmail"); checkDuplicate("email"); }}
                  />
                  {emailVerified ? (
                    <small style={{ color: "#1e7e34", fontWeight: 700 }}>✓ Email verified</small>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="secondary-btn"
                        style={{ marginTop: 6 }}
                        onClick={handleSendOtp}
                        disabled={otpBusy || !EMAIL_PATTERN.test(form.studentEmail) || Boolean(dup.email)}
                      >
                        {otpBusy ? "Sending..." : otpSent ? "Resend OTP" : "Send OTP"}
                      </button>
                      {otpSent && (
                        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            placeholder="6-digit code"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                          />
                          <button type="button" className="primary-btn" onClick={handleVerifyOtp}>Verify</button>
                        </div>
                      )}
                    </>
                  )}
                  {fieldError("studentEmail", step1Errors) && <small style={{ color: "#b00020" }}>{step1Errors.studentEmail}</small>}
                </label>
                <label className="span-2">
                  <span>Address *</span>
                  <textarea rows={2} placeholder="House no, street, area" style={{ resize: "vertical", width: "100%", borderRadius: 12, border: "1px solid var(--line)", padding: "10px 14px", font: "inherit" }} value={form.addrLine} onChange={(e) => setField("addrLine", e.target.value)} onBlur={() => markTouched("addrLine")} />
                  {fieldError("addrLine", step1Errors) && <small style={{ color: "#b00020" }}>{step1Errors.addrLine}</small>}
                </label>
                <label>
                  <span>Pincode *</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="6-digit pincode"
                    value={form.addrPincode}
                    onChange={(e) => {
                      const pin = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setField("addrPincode", pin);
                      if (pin.length === 6) lookupPincode(pin);
                    }}
                    onBlur={() => markTouched("addrPincode")}
                  />
                  {pinLookup.loading && <small style={{ color: "var(--muted)" }}>Looking up…</small>}
                  {pinLookup.error && <small style={{ color: "#b00020" }}>{pinLookup.error}</small>}
                  {fieldError("addrPincode", step1Errors) && <small style={{ color: "#b00020" }}>{step1Errors.addrPincode}</small>}
                </label>
                <label>
                  <span>State *</span>
                  <input type="text" readOnly placeholder="Auto from pincode" value={form.addrState} style={{ background: "var(--soft-gray)" }} />
                  {fieldError("addrState", step1Errors) && <small style={{ color: "#b00020" }}>{step1Errors.addrState}</small>}
                </label>
                <label>
                  <span>City *</span>
                  <select value={form.addrCity} onChange={(e) => setField("addrCity", e.target.value)} onBlur={() => markTouched("addrCity")}>
                    <option value="">{pinLookup.cities.length ? "Select city" : "Enter pincode first"}</option>
                    {[...pinLookup.cities].sort().map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  {fieldError("addrCity", step1Errors) && <small style={{ color: "#b00020" }}>{step1Errors.addrCity}</small>}
                </label>
                <label>
                  <span>Photo *</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    style={{ padding: "9px 12px" }}
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      if (f && f.size > MAX_PHOTO_KB * 1024) {
                        setPhotoError(`Photo must not exceed ${MAX_PHOTO_KB} KB (selected: ${Math.round(f.size / 1024)} KB).`);
                        setPhotoFile(null);
                        setPhotoPreview(null);
                        e.target.value = "";
                        return;
                      }
                      setPhotoError("");
                      setPhotoFile(f);
                      setPhotoPreview(f ? URL.createObjectURL(f) : null);
                    }}
                  />
                  {photoPreview && (
                    <img src={photoPreview} alt="preview" style={{ marginTop: 6, display: "block", width: 100, height: 120, objectFit: "cover", borderRadius: 10, border: "1px solid var(--line)" }} />
                  )}
                  <small style={{ color: "var(--muted)" }}>JPG, PNG or WEBP · max {MAX_PHOTO_KB} KB</small>
                  {photoError && <small style={{ color: "#b00020" }}>{photoError}</small>}
                  {!photoError && touched.studentPhoto && !photoFile && <small style={{ color: "#b00020" }}>Photo is required.</small>}
                </label>
              </div>
            )}

            {step === 2 && (
              <div className="form-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "18px 24px", maxWidth: 560 }}>
                <label>
                  <span>Course *</span>
                  <select value={form.courseId} onChange={(e) => setField("courseId", e.target.value)} onBlur={() => markTouched("courseId")}>
                    <option value="">Select course</option>
                    {[...courses].sort((a, b) => a.name.localeCompare(b.name)).map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  {fieldError("courseId", step2Errors) && <small style={{ color: "#b00020" }}>{step2Errors.courseId}</small>}
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
                    <div><dt>Date of Birth</dt><dd>{formatDate(form.studentDob)}</dd></div>
                    <div><dt>Year of Admission</dt><dd>{formatDate(form.admissionYear)}</dd></div>
                    <div><dt>Father's Name</dt><dd>{form.studentFatherName}</dd></div>
                    <div><dt>Address</dt><dd>{`${form.addrLine}, ${form.addrCity}, ${form.addrState} - ${form.addrPincode}`}</dd></div>
                    <div><dt>Email</dt><dd>{form.studentEmail}</dd></div>
                    <div><dt>Gender</dt><dd>{form.studentGender}</dd></div>
                    <div><dt>Mobile</dt><dd>{form.studentMobile}</dd></div>
                  </dl>
                </section>
                <section className="preview-section">
                  <h4>Enrolment</h4>
                  <dl>
                    <div><dt>Course</dt><dd>{courseName}</dd></div>
                  </dl>
                </section>
              </div>
            )}

            <div className="modal-actions" style={{ marginTop: 24 }}>
              {step > 1 && (
                <button className="secondary-btn" onClick={() => setStep(step - 1)}>
                  <ChevronLeft size={24} /> Back
                </button>
              )}
              {step === 1 && (
                <button className="primary-btn" onClick={() => goNext(step1Fields, step1Valid)}>
                  Next <ChevronRight size={24} />
                </button>
              )}
              {step === 2 && (
                <button className="primary-btn" onClick={() => goNext(step2Fields, step2Valid)}>
                  Next <ChevronRight size={24} />
                </button>
              )}
              {step === 3 && (
                <button className="primary-btn" onClick={handleSubmit} disabled={submitting}>
                  <CircleCheck size={24} /> {submitting ? "Registering..." : "Register Student"}
                </button>
              )}
            </div>
          </>
        )}
      </section>
    </section>
  );
}