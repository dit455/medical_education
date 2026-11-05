import { useState, useEffect, useMemo } from "react";
import { CircleCheck } from "lucide-react";
import * as api from "../api.js";
import { formatDate } from "../utils.js";
import AlertDialog from "../components/AlertDialog.jsx";

// Today's date as YYYY-MM-DD in local (India) time — avoids UTC off-by-one
function todayLocalISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_PATTERN = /^[6-9][0-9]{9}$/;

// Upload rules for the Documents section (all three are mandatory).
const DOC_RULES = {
  photo: {
    label: "Student Photo",
    accept: "image/jpeg,image/png,image/webp",
    exts: [".jpg", ".jpeg", ".png", ".webp"],
    maxKb: 100,
    hint: "JPG, PNG or WEBP · max 100 KB",
  },
  tc: {
    label: "12th Transfer Certificate (TC)",
    accept: "application/pdf,image/jpeg,image/png",
    exts: [".pdf", ".jpg", ".jpeg", ".png"],
    maxKb: 300,
    hint: "PDF, JPG or PNG · max 300 KB",
  },
  marksheet: {
    label: "12th Marksheet",
    accept: "application/pdf,image/jpeg,image/png",
    exts: [".pdf", ".jpg", ".jpeg", ".png"],
    maxKb: 300,
    hint: "PDF, JPG or PNG · max 300 KB",
  },
};

const ERR = { color: "#b00020" };

function Section({ number, title, subtitle, children }) {
  return (
    <section
      style={{
        border: "1px solid var(--line)",
        borderRadius: 16,
        padding: "22px 24px",
        marginBottom: 22,
        background: "#fff",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
        <span
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "var(--brand)",
            color: "#fff",
            display: "grid",
            placeItems: "center",
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {number}
        </span>
        <div>
          <h3 style={{ margin: 0 }}>{title}</h3>
          {subtitle && (
            <p style={{ margin: "2px 0 0", color: "var(--muted)", fontSize: "0.85rem" }}>{subtitle}</p>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}

// Step 1 -> tbl_student_det + tbl_student_enrol, then the photo / 12th TC /
// 12th marksheet are uploaded. Submitted directly (no approval queue). All
// three sections live on ONE page: details, documents, review & submit.
export default function StudentRegistrationPage({ institutionId, username }) {
  const [courses, setCourses] = useState([]);
  const [years, setYears] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState({});
  const [attempted, setAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dup, setDup] = useState({ email: "", mobile: "" });
  const [dialog, setDialog] = useState(null); // { title, message }

  const [form, setForm] = useState({
    studentName: "",
    studentFatherName: "",
    studentDob: "",
    admissionYear: "",
    studentGender: "",
    courseId: "",
    studentMobile: "",
    studentEmail: "",
    addrLine: "",
    addrPincode: "",
    addrState: "",
    addrCity: "",
  });
  const [pinLookup, setPinLookup] = useState({ loading: false, cities: [], error: "" });

  const [files, setFiles] = useState({ photo: null, tc: null, marksheet: null });
  const [fileErrors, setFileErrors] = useState({ photo: "", tc: "", marksheet: "" });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [preview, setPreview] = useState(null); // { url, name, label, isPdf }

  useEffect(() => {
    api.getCourses(institutionId).then(setCourses).catch(() => setCourses([]));
    api.getYears().then(setYears).catch(() => setYears([]));
  }, [institutionId]);

  useEffect(() => {
    const dirty =
      !submitted && (form.studentName || form.studentFatherName || files.photo || files.tc || files.marksheet);
    if (!dirty) return;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [form, files, submitted]);

  const UPPERCASE_FIELDS = ["studentName", "studentFatherName", "addrLine"];
  // Names: letters + space only. Address: letters, digits, space and comma only.
  const CHAR_FILTERS = {
    studentName: /[^A-Z ]/g,
    studentFatherName: /[^A-Z ]/g,
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
      const data = await api.lookupPincode(pin);
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

  // ---- file handling -----------------------------------------------------
  function pickFile(key, input) {
    const rule = DOC_RULES[key];
    const f = input.files?.[0] || null;
    if (!f) return;
    const ext = f.name.slice(f.name.lastIndexOf(".")).toLowerCase();
    if (!rule.exts.includes(ext)) {
      setFileErrors((p) => ({ ...p, [key]: `Only ${rule.hint.split(" · ")[0]} files are allowed.` }));
      setFiles((p) => ({ ...p, [key]: null }));
      if (key === "photo") setPhotoPreview(null);
      input.value = "";
      return;
    }
    if (f.size > rule.maxKb * 1024) {
      setFileErrors((p) => ({
        ...p,
        [key]: `${rule.label} must not exceed ${rule.maxKb >= 1024 ? rule.maxKb / 1024 + " MB" : rule.maxKb + " KB"} (selected: ${Math.round(f.size / 1024)} KB).`,
      }));
      setFiles((p) => ({ ...p, [key]: null }));
      if (key === "photo") setPhotoPreview(null);
      input.value = "";
      return;
    }
    setFileErrors((p) => ({ ...p, [key]: "" }));
    setFiles((p) => ({ ...p, [key]: f }));
    markTouched(key);
    if (key === "photo") {
      const reader = new FileReader();
      reader.onload = () => setPhotoPreview(reader.result);
      reader.readAsDataURL(f);
    }
  }
  function clearFile(key) {
    setFiles((p) => ({ ...p, [key]: null }));
    setFileErrors((p) => ({ ...p, [key]: "" }));
    if (key === "photo") setPhotoPreview(null);
  }

  function openPreview(key) {
    const f = files[key];
    if (!f) return;
    setPreview({
      url: URL.createObjectURL(f),
      name: f.name,
      label: DOC_RULES[key].label,
      isPdf: f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"),
    });
  }
  function closePreview() {
    if (preview) URL.revokeObjectURL(preview.url);
    setPreview(null);
  }

  // ---- validation ----------------------------------------------------------
  const errors = {
    studentName: !form.studentName.trim() && "Student Name is required.",
    studentFatherName: !form.studentFatherName.trim() && "Father's Name is required.",
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
    admissionYear: !form.admissionYear
      ? "Year of Admission is required."
      : form.admissionYear > todayLocalISO() && "Year of Admission cannot be in the future.",
    studentGender: !form.studentGender && "Gender is required.",
    courseId: !form.courseId && "Course is required.",
    // ---- optional fields: validated only when something is entered ----
    studentEmail:
      form.studentEmail.trim() &&
      (!EMAIL_PATTERN.test(form.studentEmail)
        ? "Enter a valid email, e.g. name@example.com."
        : dup.email || false),
    studentMobile:
      form.studentMobile.trim() &&
      (!MOBILE_PATTERN.test(form.studentMobile)
        ? "Enter a valid 10-digit mobile number starting with 6, 7, 8 or 9."
        : dup.mobile || false),
    addrPincode: form.addrPincode.trim() && !/^\d{6}$/.test(form.addrPincode) && "Enter a valid 6-digit pincode.",
    addrCity: /^\d{6}$/.test(form.addrPincode) && !form.addrCity.trim() && "Select a city.",
    // ---- mandatory documents ----
    photo: (!files.photo && (fileErrors.photo || "Student Photo is required.")) || false,
    tc: (!files.tc && (fileErrors.tc || "12th Transfer Certificate is required.")) || false,
    marksheet: (!files.marksheet && (fileErrors.marksheet || "12th Marksheet is required.")) || false,
  };

  const FIELD_LABELS = {
    studentName: "Student name",
    studentFatherName: "Father's name",
    studentDob: "Date of birth",
    admissionYear: "Year of admission",
    studentGender: "Gender",
    courseId: "Course",
    studentEmail: "Email",
    studentMobile: "Mobile",
    addrPincode: "Pincode",
    addrCity: "City",
    photo: "Student photo",
    tc: "12th TC",
    marksheet: "12th marksheet",
  };
  const ALL_KEYS = Object.keys(FIELD_LABELS);
  const invalidKeys = ALL_KEYS.filter((k) => errors[k]);

  const show = (key) => (touched[key] || attempted) && errors[key];
  const fieldErr = (key) => (show(key) ? <small style={ERR}>{errors[key]}</small> : null);

  const courseName = useMemo(
    () => courses.find((c) => String(c.id) === String(form.courseId))?.name || "-",
    [courses, form.courseId],
  );

  const combinedAddress = (() => {
    const tail = [form.addrCity, form.addrState].filter(Boolean).join(", ");
    const withPin = form.addrPincode ? `${tail}${tail ? " - " : ""}${form.addrPincode}` : tail;
    return [form.addrLine, withPin].filter(Boolean).join(", ");
  })();

  async function handleSubmit() {
    if (submitting) return;
    setAttempted(true);
    if (invalidKeys.length > 0) {
      setDialog({
        title: "Please complete the form",
        message: `Please fix: ${invalidKeys.map((k) => FIELD_LABELS[k]).join(", ")}.`,
      });
      return;
    }
    setSubmitting(true);
    try {
      const created = await api.createStudentDirect(institutionId, {
        studentName: form.studentName,
        studentFatherName: form.studentFatherName,
        studentDob: form.studentDob,
        admissionYear: form.admissionYear,
        studentGender: form.studentGender,
        courseId: form.courseId,
        studentMobile: form.studentMobile || null,
        studentEmail: form.studentEmail || null,
        studentAddress: combinedAddress || null,
        regionId: null,
        otherState: form.addrState || null,
        yearId: years[0]?.id || null,
        actor: username,
      });

      const failed = [];
      if (created?.id) {
        try {
          await api.uploadStudentPhoto(created.id, files.photo);
        } catch (err) {
          failed.push(`Photo (${err.message})`);
        }
        try {
          await api.uploadStudentDocument(created.id, "tc12", files.tc);
        } catch (err) {
          failed.push(`12th TC (${err.message})`);
        }
        try {
          await api.uploadStudentDocument(created.id, "marksheet12", files.marksheet);
        } catch (err) {
          failed.push(`12th Marksheet (${err.message})`);
        }
      }
      setSubmitted(true);
      if (failed.length) {
        setDialog({
          title: "Registered, but some uploads failed",
          message: `The student was saved, but these files could not be uploaded: ${failed.join("; ")}.`,
        });
      }
    } catch (err) {
      setDialog({ title: "Could not register", message: err.message || "Could not register this student." });
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setForm({
      studentName: "", studentFatherName: "", studentDob: "", admissionYear: "", studentGender: "",
      courseId: "", studentMobile: "", studentEmail: "", addrLine: "", addrPincode: "",
      addrState: "", addrCity: "",
    });
    setFiles({ photo: null, tc: null, marksheet: null });
    setFileErrors({ photo: "", tc: "", marksheet: "" });
    setPhotoPreview(null);
    setPinLookup({ loading: false, cities: [], error: "" });
    setTouched({});
    setAttempted(false);
    setDup({ email: "", mobile: "" });
    setSubmitted(false);
  }

  const optional = <span style={{ color: "var(--muted)", fontWeight: 400 }}> (optional)</span>;

  function renderUploadBox(k) {
    const rule = DOC_RULES[k];
    const file = files[k];
    return (
      <div
        style={{
          border: "1px dashed var(--line)",
          borderRadius: 14,
          padding: 16,
          background: "var(--soft-gray)",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <strong style={{ fontSize: "0.9rem" }}>{rule.label} *</strong>
        {k === "photo" && photoPreview && (
          <img
            src={photoPreview}
            alt="preview"
            style={{ width: 100, height: 120, objectFit: "cover", borderRadius: 10, border: "1px solid var(--line)" }}
          />
        )}
        <input
          key={file ? file.name : "empty"}
          type="file"
          accept={rule.accept}
          style={{ padding: "9px 12px", background: "#fff" }}
          onChange={(e) => pickFile(k, e.target)}
        />
        {file && (
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 10, fontSize: "0.85rem" }}>
            <span style={{ color: "#1e7e34", fontWeight: 700 }}>✓ {file.name}</span>
            <button type="button" className="secondary-btn" style={{ padding: "2px 10px" }} onClick={() => openPreview(k)}>
              Preview
            </button>
            <button type="button" className="secondary-btn" style={{ padding: "2px 10px" }} onClick={() => clearFile(k)}>
              Remove
            </button>
          </div>
        )}
        <small style={{ color: "var(--muted)" }}>{rule.hint}</small>
        {(fileErrors[k] || (attempted && errors[k])) && (
          <small style={ERR}>{fileErrors[k] || errors[k]}</small>
        )}
      </div>
    );
  }

  const docRow = (k) => (
    <div key={k}>
      <dt>{DOC_RULES[k].label}</dt>
      <dd style={{ color: files[k] ? "#1e7e34" : "#b00020", fontWeight: 600 }}>
        {files[k] ? (
          <>
            ✓ {files[k].name}
            <button
              type="button"
              className="secondary-btn"
              style={{ padding: "2px 10px", marginLeft: 12 }}
              onClick={() => openPreview(k)}
            >
              Preview
            </button>
          </>
        ) : (
          "Not uploaded"
        )}
      </dd>
    </div>
  );

  return (
    <section className="content-stack" style={{ width: "100%", maxWidth: "none", padding: "0 32px" }}>
      <div className="page-heading">
        <div>
          <h2>Student Registration</h2>
          <p>Fields marked * are mandatory.</p>
        </div>
      </div>

      {submitted ? (
        <section className="data-table-card" style={{ width: "100%" }}>
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
        </section>
      ) : (
        <>
          {/* ───────── 1. Student Details ───────── */}
          <Section number={1} title="Student Details" subtitle="Name, gender, father's name, date of birth, year of admission and course are mandatory.">
            <div className="form-grid reg-grid">
              <label>
                <span>Student name *</span>
                <input value={form.studentName} onChange={(e) => setField("studentName", e.target.value)} onBlur={() => markTouched("studentName")} />
                {fieldErr("studentName")}
              </label>
              <label>
                <span>Father's name *</span>
                <input value={form.studentFatherName} onChange={(e) => setField("studentFatherName", e.target.value)} onBlur={() => markTouched("studentFatherName")} />
                {fieldErr("studentFatherName")}
              </label>
              <label>
                <span>Gender *</span>
                <select value={form.studentGender} onChange={(e) => setField("studentGender", e.target.value)} onBlur={() => markTouched("studentGender")}>
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Others">Others</option>
                </select>
                {fieldErr("studentGender")}
              </label>
              <label>
                <span>Date of birth *</span>
                <input type="date" max={todayLocalISO()} value={form.studentDob} onChange={(e) => setField("studentDob", e.target.value)} onBlur={() => markTouched("studentDob")} />
                {fieldErr("studentDob")}
              </label>
              <label>
                <span>Year of admission *</span>
                <input type="date" max={todayLocalISO()} value={form.admissionYear} onChange={(e) => setField("admissionYear", e.target.value)} onBlur={() => markTouched("admissionYear")} />
                {fieldErr("admissionYear")}
              </label>
              <label>
                <span>Course *</span>
                <select value={form.courseId} onChange={(e) => setField("courseId", e.target.value)} onBlur={() => markTouched("courseId")}>
                  <option value="">Select course</option>
                  {[...courses].sort((a, b) => a.name.localeCompare(b.name)).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {fieldErr("courseId")}
              </label>

              <label>
                <span>Mobile{optional}</span>
                <input
                  placeholder="10-digit mobile number"
                  inputMode="numeric"
                  maxLength={10}
                  value={form.studentMobile}
                  onChange={(e) => {
                    setField("studentMobile", e.target.value.replace(/\D/g, "").slice(0, 10));
                    setDup((prev) => ({ ...prev, mobile: "" }));
                  }}
                  onBlur={() => { markTouched("studentMobile"); checkDuplicate("mobile"); }}
                />
                {fieldErr("studentMobile")}
              </label>
              <label>
                <span>Email{optional}</span>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={form.studentEmail}
                  onChange={(e) => {
                    setField("studentEmail", e.target.value.trim().toLowerCase());
                    setDup((prev) => ({ ...prev, email: "" }));
                  }}
                  onBlur={() => { markTouched("studentEmail"); checkDuplicate("email"); }}
                />
                {fieldErr("studentEmail")}
              </label>
              <label className="span-2">
                <span>Address{optional}</span>
                <textarea
                  rows={2}
                  placeholder="House no, street, area"
                  style={{ resize: "vertical", width: "100%", borderRadius: 12, border: "1px solid var(--line)", padding: "10px 14px", font: "inherit" }}
                  value={form.addrLine}
                  onChange={(e) => setField("addrLine", e.target.value)}
                />
              </label>
              <label>
                <span>Pincode{optional}</span>
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
                    else setForm((prev) => ({ ...prev, addrState: "", addrCity: "" }));
                  }}
                  onBlur={() => markTouched("addrPincode")}
                />
                {pinLookup.loading && <small style={{ color: "var(--muted)" }}>Looking up…</small>}
                {pinLookup.error && <small style={ERR}>{pinLookup.error}</small>}
                {fieldErr("addrPincode")}
              </label>
              <label>
                <span>State{optional}</span>
                <input type="text" readOnly placeholder="Auto from pincode" value={form.addrState} style={{ background: "var(--soft-gray)" }} />
              </label>
              <label>
                <span>City{optional}</span>
                <select value={form.addrCity} onChange={(e) => setField("addrCity", e.target.value)} onBlur={() => markTouched("addrCity")}>
                  <option value="">{pinLookup.cities.length ? "Select city" : "Enter pincode first"}</option>
                  {[...pinLookup.cities].sort().map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                {fieldErr("addrCity")}
              </label>
            </div>
          </Section>

          {/* ───────── 2. Upload Documents ───────── */}
          <Section number={2} title="Upload Documents" subtitle="Student photo, 12th Transfer Certificate and 12th Marksheet are all mandatory.">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18 }}>
              {renderUploadBox("photo")}
              {renderUploadBox("tc")}
              {renderUploadBox("marksheet")}
            </div>
          </Section>

          {/* ───────── 3. Review & Submit ───────── */}
          <Section number={3} title="Review & Submit" subtitle="Check everything below, then register the student.">
            <div className="preview-section-stack">
              <section className="preview-section">
                <h4>Student Details</h4>
                <dl>
                  <div><dt>Register No</dt><dd>Assigned automatically on registration</dd></div>
                  <div><dt>Name</dt><dd>{form.studentName || "-"}</dd></div>
                  <div><dt>Father's Name</dt><dd>{form.studentFatherName || "-"}</dd></div>
                  <div><dt>Gender</dt><dd>{form.studentGender || "-"}</dd></div>
                  <div><dt>Date of Birth</dt><dd>{form.studentDob ? formatDate(form.studentDob) : "-"}</dd></div>
                  <div><dt>Year of Admission</dt><dd>{form.admissionYear ? formatDate(form.admissionYear) : "-"}</dd></div>
                  <div><dt>Course</dt><dd>{courseName}</dd></div>
                  <div><dt>Mobile</dt><dd>{form.studentMobile || "-"}</dd></div>
                  <div><dt>Email</dt><dd>{form.studentEmail || "-"}</dd></div>
                  <div><dt>Address</dt><dd>{combinedAddress || "-"}</dd></div>
                </dl>
              </section>
              <section className="preview-section">
                <h4>Documents</h4>
                <dl>{["photo", "tc", "marksheet"].map(docRow)}</dl>
              </section>
            </div>

            <div className="modal-actions" style={{ marginTop: 24 }}>
              <button className="secondary-btn" onClick={resetForm} disabled={submitting}>
                Clear Form
              </button>
              <button className="primary-btn" onClick={handleSubmit} disabled={submitting}>
                <CircleCheck size={24} /> {submitting ? "Registering..." : "Register Student"}
              </button>
            </div>
          </Section>
        </>
      )}

      {preview && (
        <div className="modal-backdrop" role="presentation" style={{ zIndex: 2500 }}>
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label="Document preview"
            style={{ maxWidth: 900, width: "92vw" }}
          >
            <div className="modal-heading">
              <div>
                <p className="eyebrow">Preview</p>
                <h3>{preview.label}</h3>
              </div>
              <button className="icon-btn" onClick={closePreview} aria-label="Close">
                ✕
              </button>
            </div>
            <div style={{ display: "grid", placeItems: "center", background: "var(--soft-gray)", borderRadius: 12, padding: 8 }}>
              {preview.isPdf ? (
                <iframe
                  title={preview.name}
                  src={preview.url}
                  style={{ width: "100%", height: "70vh", border: "none", borderRadius: 8, background: "#fff" }}
                />
              ) : (
                <img
                  src={preview.url}
                  alt={preview.name}
                  style={{ maxWidth: "100%", maxHeight: "70vh", objectFit: "contain", borderRadius: 8 }}
                />
              )}
            </div>
            <div className="modal-actions">
              <button className="primary-btn" onClick={closePreview}>
                Close
              </button>
            </div>
          </section>
        </div>
      )}

      {dialog && (
        <AlertDialog title={dialog.title} message={dialog.message} onClose={() => setDialog(null)} />
      )}
    </section>
  );
}