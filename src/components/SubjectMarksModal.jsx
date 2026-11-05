import { useState } from "react";
import { CircleCheck, X } from "lucide-react";

// Step 2 of "Map Subject to this Institute": after choosing the subjects (and
// each one's Year / Semester), ask for the Internal and External assessment
// Max / Pass marks of every selected subject, then save.
//   subjects: [{ name, yearLabel, semesterLabel }]
//   onSave(marksByName)  ->  { [name]: { ia: {max, pass}, ea: {max, pass} } }
const FIELDS = [
  ["iaMax", "Internal Max"],
  ["iaPass", "Internal Pass"],
  ["eaMax", "External Max"],
  ["eaPass", "External Pass"],
];

const inputStyle = {
  height: 38,
  padding: "0 12px",
  boxSizing: "border-box",
  fontSize: "1rem",
  borderRadius: 8,
  border: "1px solid #d1d5db",
  width: "100%",
};

export default function SubjectMarksModal({ subjects, role = "", saving = false, onClose, onSave }) {
  const isBoen = role === "BOEN"; // BOEN: all four fields mandatory. BOME: optional.
  const [marks, setMarks] = useState({});
  const [attempted, setAttempted] = useState(false);

  function setMark(name, field, value) {
    setMarks((prev) => ({ ...prev, [name]: { ...(prev[name] || {}), [field]: value } }));
  }

  // Marks are optional (blank counts as 0). Returns an error message for one
  // subject, or "" when it is valid.
  const num = (v) => (v === undefined || String(v).trim() === "" ? 0 : Number(v));

  function errorFor(name) {
    const m = marks[name] || {};
    if (isBoen && FIELDS.some(([k]) => m[k] === undefined || String(m[k]).trim() === "")) {
      return "Internal and External Max / Pass marks are mandatory.";
    }
    if (FIELDS.some(([k]) => Number.isNaN(num(m[k])) || num(m[k]) < 0)) {
      return "Marks must be 0 or more.";
    }
    // An assessment that has anything typed in it needs Max greater than Pass.
    const filled = (a, b) => String(m[a] ?? "").trim() !== "" || String(m[b] ?? "").trim() !== "";
    if (filled("iaMax", "iaPass") && num(m.iaMax) <= num(m.iaPass)) {
      return "Internal: Max marks must be greater than Pass marks.";
    }
    if (filled("eaMax", "eaPass") && num(m.eaMax) <= num(m.eaPass)) {
      return "External: Max marks must be greater than Pass marks.";
    }
    const totalMax = num(m.iaMax) + num(m.eaMax);
    const totalPass = num(m.iaPass) + num(m.eaPass);
    if (totalMax === 0 && totalPass === 0) {
      return "Enter Internal and/or External Max and Pass marks.";
    }
    if (totalMax === totalPass) {
      return "Total Max marks cannot be equal to Total Pass marks.";
    }
    return "";
  }

  const allValid = subjects.every((s) => !errorFor(s.name));

  function handleSave() {
    setAttempted(true);
    if (!allValid) return;
    const result = {};
    subjects.forEach((s) => {
      const m = marks[s.name] || {};
      result[s.name] = {
        ia: { max: num(m.iaMax), pass: num(m.iaPass) },
        ea: { max: num(m.eaMax), pass: num(m.eaPass) },
      };
    });
    onSave(result);
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal" role="dialog" aria-modal="true" aria-label="Subject marks" style={{ maxWidth: 820, width: "92vw" }}>
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Add</p>
            <h3>Subject Marks</h3>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={24} />
          </button>
        </div>

        <div style={{ maxHeight: "60vh", overflowY: "auto", padding: "4px 2px", display: "flex", flexDirection: "column", gap: 14 }}>
          {subjects.map((s) => {
            const err = errorFor(s.name);
            const m = marks[s.name] || {};
            const total =
              (m.iaMax !== undefined && m.iaMax !== "") || (m.eaMax !== undefined && m.eaMax !== "")
                ? num(m.iaMax) + num(m.eaMax)
                : null;
            return (
              <div
                key={s.name}
                style={{ border: "1px solid var(--line)", borderRadius: 14, padding: "14px 16px", background: "#fff" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
                  <strong>{String(s.name).toUpperCase()}</strong>
                  <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
                    {[s.yearLabel, s.semesterLabel].filter(Boolean).join(" · ")}
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                  {FIELDS.map(([field, label]) => (
                    <label key={field} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span style={{ fontSize: "0.78rem", fontWeight: 700 }}>
                        {label}{isBoen && <span style={{ color: "#000" }}> *</span>}
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={m[field] ?? ""}
                        onChange={(e) => setMark(s.name, field, e.target.value)}
                        onWheel={(e) => e.currentTarget.blur()}
                        style={inputStyle}
                      />
                    </label>
                  ))}
                </div>
                <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <small style={{ color: "#b00020" }}>
                      {(attempted || Object.keys(m).length > 0) ? err : ""}
                    </small>
                  {total !== null && <small style={{ color: "var(--muted)" }}>Total: {total}</small>}
                </div>
              </div>
            );
          })}
        </div>

        <div className="modal-actions">
          <button className="secondary-btn" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="primary-btn" onClick={handleSave} disabled={saving}>
            <CircleCheck size={24} />
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </section>
    </div>
  );
}