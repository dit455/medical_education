import { useState, useMemo } from "react";
import { X, CircleCheck } from "lucide-react";

// Add Subject per the marks-entry spec:
//  - Pick the Subject first.
//  - Enter Max + Pass for each division: IA (Internal), EA (External),
//    Theory/Practical.
//  - Sum of the three Max values must equal 100.
//  - Each division's Pass must be <= its Max.
//  - An effective start date applies to this marks entry.
// examTypeId maps to tbl_exam_type_master (1=IA, 2=EA, 3=TH).
const DIVISIONS = [
  { key: "ia", examTypeId: 1, label: "Internal Assessment" },
  { key: "ea", examTypeId: 2, label: "External Assessment" },
];

export default function AddSubjectModal({
  subjectOptions = [],
  onClose,
  onSave,
  editMode = false,
  initialSubject = null, // { id, name, divisions:[{examTypeId,maxMarks,passMarks,totalMarks}], effectiveDate }
  username = "",
}) {
  const [subjectId, setSubjectId] = useState(
    editMode && initialSubject ? String(initialSubject.id) : "",
  );

  // Map any preloaded divisions (from the API) back into the ia/ea/tp cells.
  const preloadMarks = () => {
    const base = {
      ia: { max: "", pass: "" },
      ea: { max: "", pass: "" },
      tp: { max: "", pass: "" },
    };
    const byId = { 1: "ia", 2: "ea", 3: "tp" };
    (initialSubject?.divisions || []).forEach((d) => {
      const key = byId[d.examTypeId];
      if (key) base[key] = { max: String(d.maxMarks ?? ""), pass: String(d.passMarks ?? "") };
    });
    return base;
  };

  const [marks, setMarks] = useState(editMode ? preloadMarks() : {
    ia: { max: "", pass: "" },
    ea: { max: "", pass: "" },
    tp: { max: "", pass: "" },
  });
  const [effectiveDate, setEffectiveDate] = useState(
    editMode && initialSubject?.effectiveDate ? initialSubject.effectiveDate : "",
  );
  // Auto-populated, tamper-evident signature: username_timestamp - not
  // user-editable, so it always reflects who actually clicked Save and when.
  function buildSignature() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const stamp =
      `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
      `_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    return `${username || "unknown"}_${stamp}`;
  }
  const [signatureName, setSignatureName] = useState(buildSignature());
  
  const totalMode = "100";

  function setCell(div, field, value) {
    setMarks((prev) => ({ ...prev, [div]: { ...prev[div], [field]: value } }));
  }

  const totalMax = DIVISIONS.reduce((s, d) => s + (Number(marks[d.key].max) || 0), 0);
  const totalPass = DIVISIONS.reduce((s, d) => s + (Number(marks[d.key].pass) || 0), 0);

  const error = useMemo(() => {
    if (!subjectId) return null; // marks section not shown yet
    for (const d of DIVISIONS) {
      const max = Number(marks[d.key].max);
      const pass = Number(marks[d.key].pass);
      // A division counts as "not used" whether the fields are left empty
      // or explicitly typed as 0 - both mean this division doesn't apply.
      const blank = !Number(marks[d.key].max) && !Number(marks[d.key].pass);
      if (blank) continue;
      if (max <= 0) return `${d.label}: enter valid maximum marks.`;
      if (pass < 0) return `${d.label}: enter valid pass marks.`;
      if (pass > max) return `${d.label}: pass cannot exceed maximum.`;
    }
    if (totalMax !== 100)
      return `Total maximum must equal 100 (currently ${totalMax}).`;
    return null;
  }, [subjectId, marks, totalMax]);

  const selectedSubject = subjectOptions.find((o) => String(o.value) === String(subjectId));
  const canSave = subjectId && !error;

  const [submitted, setSubmitted] = useState(false);

  function handleSave() {
    if (!canSave) return;
    const finalSignature = buildSignature();
    Promise.resolve(
    onSave({
      subjectId,
      subjectName: (selectedSubject?.label || initialSubject?.name || initialSubject?.subject || "").trim(),
      divisions: DIVISIONS.map((d) => ({
        examTypeId: d.examTypeId,
        label: d.label,
        maxMarks: Number(marks[d.key].max) || 0,
        passMarks: Number(marks[d.key].pass) || 0,
      })),
      totalMarks: 100,
      totalMax,
      totalPass,
      effectiveDate,
      signatureName: finalSignature,
      }),
      ).then(() => {
      if (editMode) {
        onClose();
      } else {
        setSubmitted(true);
      }
    });
  }

  if (submitted) {
    return (
      <div className="modal-backdrop" role="presentation">
        <section className="modal" role="dialog" aria-modal="true" aria-label="Submitted">
          <div style={{ textAlign: "center", padding: "28px 16px" }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "var(--brand-soft)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <CircleCheck size={30} color="var(--brand)" />
            </div>
            <h3 style={{ margin: "0 0 8px" }}>
              {editMode ? "Changes Saved" : "Subject Added"}
            </h3>
            <p style={{ color: "var(--muted)", margin: "0 0 20px", fontSize: "0.9rem" }}>
              {editMode
                ? "This mark change is now pending review. It will apply once a competent official approves it."
                : "The subject and its marks have been saved."}
            </p>
            <button className="primary-btn" onClick={onClose}>
              Done
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal" role="dialog" aria-modal="true" aria-label="Add Subject">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">{editMode ? "edit" : "add"}</p>
            <h3>{editMode ? "Edit Subject Marks" : "Add Subject"}</h3>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="form-grid">
          <label>
            <span>Subject</span>
            <select
              aria-label="Subject"
              value={subjectId}
              disabled={editMode}
              onChange={(e) => setSubjectId(e.target.value)}
            >
              <option value="" disabled>
                {subjectOptions.length ? "Select subject" : "No subjects available"}
              </option>
              {editMode && initialSubject && (
                <option value={String(initialSubject.id)}>
                  {initialSubject.name || initialSubject.subject}
                </option>
              )}
              {subjectOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {subjectId && (
          <>
            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 96px 96px",
                  gap: 12,
                  padding: "0 4px",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  color: "var(--muted)",
                }}
              >
                <span>Assessment Type</span>
                <span style={{ textAlign: "center" }}>Max</span>
                <span style={{ textAlign: "center" }}>Pass</span>
              </div>

              {DIVISIONS.map((d) => {
                const filled = marks[d.key].max || marks[d.key].pass;
                return (
                  <div
                    key={d.key}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 96px 96px",
                      gap: 12,
                      alignItems: "center",
                      padding: "12px 14px",
                      borderRadius: 12,
                      border: `1px solid ${filled ? "var(--brand)" : "var(--line)"}`,
                      background: filled ? "var(--brand-soft)" : "var(--soft-gray)",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <span style={{ fontWeight: 600, color: "var(--ink)", fontSize: "0.9rem" }}>
                      {d.label}
                    </span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      aria-label={`${d.label} Max`}
                      value={marks[d.key].max}
                      onChange={(e) => setCell(d.key, "max", e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: 8,
                        border: "1px solid var(--line-strong)",
                        textAlign: "center",
                        fontWeight: 600,
                        background: "var(--white)",
                      }}
                    />
                    <input
                      type="number"
                      min="0"
                      max="100"
                      aria-label={`${d.label} Pass`}
                      value={marks[d.key].pass}
                      onChange={(e) => setCell(d.key, "pass", e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: 8,
                        border: "1px solid var(--line-strong)",
                        textAlign: "center",
                        fontWeight: 600,
                        background: "var(--white)",
                      }}
                    />
                  </div>
                );
              })}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 96px 96px",
                  gap: 12,
                  alignItems: "center",
                  padding: "12px 14px",
                  borderRadius: 12,
                  background: "var(--deep-navy)",
                  color: "var(--white)",
                }}
              >
                <span style={{ fontWeight: 700, letterSpacing: "0.03em" }}>TOTAL</span>
                <span
                  style={{
                    textAlign: "center",
                    fontWeight: 700,
                    fontSize: "1.05rem",
                    color: totalMax === 100 ? "#4ade80" : "var(--heritage-yellow)",
                  }}
                >
                  {totalMax}
                </span>
                <span style={{ textAlign: "center", fontWeight: 700, fontSize: "1.05rem" }}>
                  {totalPass}
                </span>
              </div>
            </div>

            <div className="form-grid" style={{ marginTop: 12 }}>
              <label>
                <span>Digital Signature</span>
                <input
                  type="text"
                  aria-label="Digital Signature"
                  value={signatureName}
                  readOnly
                  style={{ background: "var(--soft-gray)", cursor: "not-allowed" }}
                />
              </label>
            </div>

            <p style={{ margin: "8px 2px 0", fontSize: "0.85rem", color: error ? "#b00020" : "#1a7f37" }}>
              {error || `Total maximum = ${totalMode === "custom" ? customTotal : 100} ✓`}
            </p>
          </>
        )}

        <div className="modal-actions">
          <button className="secondary-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-btn" disabled={!canSave} onClick={handleSave}>
            <CircleCheck size={18} />
              {editMode ? "Save Changes" : "Save"}
          </button>
        </div>
      </section>
    </div>
  );
}