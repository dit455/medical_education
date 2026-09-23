import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, CircleCheck, Trash2 } from "lucide-react";
import StatusBadge from "./StatusBadge.jsx";
import ConfirmDialog from "./ConfirmDialog.jsx";

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
  onClose, onSave, onDelete,
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

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

  function handleSave() {
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
              <X size={18} />
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
              <select className="cell-input" value={year} onChange={(e) => setYear(e.target.value)}>
                <option value="">—</option>
                {yearOptions.map((y) => <option key={y.id ?? y} value={y.name ?? y}>{y.name ?? y}</option>)}
              </select>
            </div>
            <div className="view-row">
              <span className="view-label">Semester</span>
              <select className="cell-input" value={semester} onChange={(e) => setSemester(e.target.value)}>
                <option value="">—</option>
                {semOptions.map((s) => <option key={s.id ?? s} value={s.name ?? s}>{s.name ?? s}</option>)}
              </select>
            </div>
            <div className="view-row">
              <span className="view-label">Priority</span>
              <input className="cell-input" type="number" value={priority} onChange={(e) => setPriority(e.target.value)} />
            </div>

            {DIVISIONS.filter((d) => d.key !== "tp").map((d) => (
              <div className="view-row" key={d.key}>
                <span className="view-label">{d.label} (Max / Pass)</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <input className="cell-input" type="number" placeholder="Max"
                    value={marks[d.key].max} onChange={(e) => setMark(d.key, "max", e.target.value)} />
                  <input className="cell-input" type="number" placeholder="Pass"
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
              <CircleCheck size={18} /> Save
            </button>
          </div>
        </section>
      </div>
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