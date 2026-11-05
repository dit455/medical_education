import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, CircleCheck, Trash2 } from "lucide-react";
import StatusBadge from "./StatusBadge.jsx";
import ConfirmDialog from "./ConfirmDialog.jsx";
import AlertDialog from "./AlertDialog.jsx";




const READONLY_STYLE = {
  background: "var(--soft-gray)",
  cursor: "not-allowed",
  color: "var(--ink)",
  WebkitTextFillColor: "var(--ink)",
  opacity: 1,
};

const DIVISIONS = [
  { key: "ia", examTypeId: 1, label: "Internal Assessment" },
  { key: "ea", examTypeId: 2, label: "External Assessment" },
  { key: "tp", examTypeId: 3, label: "Theory / Practical" },
];

// One merged view+edit modal for a subject: subject info AND marks divisions
// are all editable, saved together in a single api.updateSubject call
// (performed by the onSave handler passed from Dashboard).
export default function SubjectEditModal({
  course, subject, subjectCount,
  yearOptions = [], semOptions = [],
  username = "",
  role = "",
  onClose, onSave, onDelete,
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");

  const [subjectName, setSubjectName] = useState(subject?.subject || "");
  const [year, setYear] = useState(subject?.year || "");
  const [semester, setSemester] = useState(subject?.semester || "");
  const [priority, setPriority] = useState(subject?.priority ?? 1);
  const [effectiveDate, setEffectiveDate] = useState(subject?.effectiveDate || "");

  const preload = () => {
    const base = { ia: { max: "", pass: "" }, ea: { max: "", pass: "" }, tp: { max: "", pass: "" } };
    const byId = { 1: "ia", 2: "ea", 3: "tp" };
    (subject?.divisions || []).forEach((d) => {
      const k = byId[d.examTypeId];
      if (k) base[k] = { max: String(d.maxMarks ?? ""), pass: String(d.passMarks ?? "") };
    });
    return base;
  };
  const [marks, setMarks] = useState(preload);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const setMark = (key, field, value) =>
    setMarks((m) => ({ ...m, [key]: { ...m[key], [field]: value } }));

  const totalMax = DIVISIONS.reduce((s, d) => s + (Number(marks[d.key].max) || 0), 0);
  const totalPass = DIVISIONS.reduce((s, d) => s + (Number(marks[d.key].pass) || 0), 0);

  function buildSignature() {
    const now = new Date();
    const p = (n) => String(n).padStart(2, "0");
    const stamp = `${now.getFullYear()}${p(now.getMonth() + 1)}${p(now.getDate())}_${p(now.getHours())}${p(now.getMinutes())}${p(now.getSeconds())}`;
    return `${username || "user"}_${stamp}`;
  }

  function validateMarks() {
    const scored = DIVISIONS.filter((x) => x.key !== "tp");
    let sumMax = 0;
    let sumPass = 0;

    for (const d of scored) {
      if (role === "BOEN" && (marks[d.key].max === "" || marks[d.key].pass === "")) {
        return `${d.label}: Max and Pass marks are mandatory for BOEN.`;
      }
      const max = marks[d.key].max === "" ? null : Number(marks[d.key].max);
      const pass = marks[d.key].pass === "" ? null : Number(marks[d.key].pass);

      if (max !== null && (Number.isNaN(max) || max < 0)) {
        return `${d.label}: Max marks must be 0 or more.`;
      }
      if (pass !== null && (Number.isNaN(pass) || pass < 0)) {
        return `${d.label}: Pass marks must be 0 or more.`;
      }
      // If this assessment has anything typed in it, Max must be greater than Pass.
      if ((max !== null || pass !== null) && (max ?? 0) <= (pass ?? 0)) {
        return `${d.label}: Max marks must be greater than Pass marks.`;
      }
      sumMax += max ?? 0;
      sumPass += pass ?? 0;
    }
    if (sumMax === 0 && sumPass === 0) {
      return "Enter Internal and/or External Max and Pass marks.";
    }
    if (sumMax === sumPass) {
      return "Total Max marks cannot be equal to Total Pass marks.";
    }
    return null;
  }

  function handleSave() {
    const error = validateMarks();
    if (error) {
      setAlertMsg(error);
      return;
    }
    const divisions = DIVISIONS
      .filter((d) => marks[d.key].max !== "" || marks[d.key].pass !== "")
      .map((d) => ({
        examTypeId: d.examTypeId,
        maxMarks: Number(marks[d.key].max) || 0,
        passMarks: Number(marks[d.key].pass) || 0,
      }));
    onSave({
      subjectName,
      year,
      semester,
      priority: Number(priority) || 1,
      divisions,
      effectiveDate,
      totalMarks: totalMax,
      signatureName: buildSignature(),
    });
  }

  async function handleDelete() {
    await onDelete(subject);
    setConfirmingDelete(false);
    onClose();
  }

  return createPortal(
    <>
      <div className="modal-backdrop" role="presentation">
        <section className="modal" role="dialog" aria-modal="true" aria-label="Subject Information">
          <div className="modal-heading">
            <div>
              <p className="eyebrow">Edit</p>
              <h3>Subject Information</h3>
            </div>
            <button className="icon-btn" onClick={onClose} aria-label="Close">
              <X size={24} />
            </button>
          </div>

            <div className="view-grid">
            {course && (
              <>
                <div className="view-row">
                  <span className="view-label">Course</span>
                  <span className="view-value" style={{ fontWeight: 700 }}>{course.name}</span>
                </div>
                <div className="view-row">
                  <span className="view-label">Subjects</span>
                  <span className="view-value">{subjectCount}</span>
                </div>
              </>
            )}

            <div className="view-row">
              <span className="view-label">Subject</span>
              <input className="cell-input" value={subjectName} readOnly style={{ background: "var(--soft-gray)", cursor: "not-allowed", color: "var(--ink)", WebkitTextFillColor: "var(--ink)", opacity: 1 }} />
            </div>
            <div className="view-row">
              <span className="view-label">Year</span>
              <input className="cell-input" value={year} readOnly style={READONLY_STYLE} />
            </div>
            <div className="view-row">
              <span className="view-label">Semester</span>
              <input className="cell-input" value={semester} readOnly style={READONLY_STYLE} />
            </div>
            <div className="view-row">
              <span className="view-label">Priority</span>
              <input className="cell-input" type="number" value={priority} onChange={(e) => setPriority(e.target.value)} />
            </div>

            {DIVISIONS.filter((d) => d.key !== "tp").map((d) => (
              <div className="view-row" key={d.key}>
                <span className="view-label">{d.label} (Max / Pass)</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <input className="cell-input" type="number" placeholder="Max" min="0"
                    value={marks[d.key].max} onChange={(e) => setMark(d.key, "max", e.target.value)} />
                  <input className="cell-input" type="number" placeholder="Pass" min="0"
                    value={marks[d.key].pass} onChange={(e) => setMark(d.key, "pass", e.target.value)} />
                </div>
              </div>
            ))}

            <div className="view-row">
              <span className="view-label">Total (Max / Pass)</span>
              <span className="view-value" style={{ fontWeight: 700 }}>{totalMax} / {totalPass}</span>
            </div>
          </div>

            <div className="modal-actions">
            <button type="button" className="secondary-btn" onClick={onClose}>Cancel</button>
            <button
              type="button"
              className="primary-btn"
              onClick={handleSave}
            >
              <CircleCheck size={24} /> Save
            </button>
          </div>
        </section>
      </div>

      {alertMsg && (
        <AlertDialog
          title="Invalid marks"
          message={alertMsg}
          onClose={() => setAlertMsg("")}
        />
      )}
      {confirmingDelete && (
        <ConfirmDialog
          title="Delete this subject?"
          message="This action cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </>,
    document.body
  );
}