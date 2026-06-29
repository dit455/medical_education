import { useState, useEffect } from "react";
import { X, CircleCheck } from "lucide-react";

// Lets the user tick multiple master records at once instead of picking one
// at a time, then maps all of them on Save. Used for both "Add Existing
// Course" and "Add Existing Subject". `extraFields` (optional [key, label,
// options] tuples) renders dropdowns applied to every selected record - e.g.
// subjects also need a Year/Semester to satisfy the mapping table's NOT NULL
// columns, which a plain name checklist can't supply on its own.
//
// NEW: Pass `onInstituteChange` to dynamically filter out already-mapped
// courses when the user picks an institute in the modal. The callback receives
// the selected institute id and must return (or resolve to) an array of course
// name strings that are ALREADY mapped to that institute.
export default function CourseSelectModal({
  title = "Course",
  emptyMessage = "No more records available to add.",
  options,
  extraFields = [],
  onClose,
  onSave,
  onInstituteChange,   // NEW: async (instituteId) => string[]  (already-mapped course names)
}) {
  const [selected, setSelected] = useState([]);
  const [extraValues, setExtraValues] = useState({});
  const [filteredOptions, setFilteredOptions] = useState(options);
  const [loadingCourses, setLoadingCourses] = useState(false);

  // When the institute dropdown changes, fetch already-mapped courses and
  // remove them from the visible checklist so the user only sees what's
  // available to map.
  async function handleExtraChange(key, value) {
    const next = { ...extraValues, [key]: value };
    setExtraValues(next);

    if (key === "institute" && onInstituteChange) {
      setLoadingCourses(true);
      setSelected([]); // reset checkboxes when institute switches
      try {
        const mappedNames = await onInstituteChange(value); // string[]
        const available = options.filter(
          (opt) => !mappedNames.some(
            (name) => name.trim().toLowerCase() === opt.label.trim().toLowerCase()
          )
        );
        setFilteredOptions(available);
      } catch {
        setFilteredOptions(options); // on error fall back to all options
      } finally {
        setLoadingCourses(false);
      }
    }
  }

  // Keep filteredOptions in sync if parent updates options (e.g. after a save)
  useEffect(() => {
    // Only reset if no institute is currently selected (i.e. fresh open)
    if (!extraValues["institute"]) {
      setFilteredOptions(options);
    }
  }, [options]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggle(value) {
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  }

  function handleSave() {
    const names = filteredOptions
      .filter((option) => selected.includes(option.value))
      .map((option) => option.label);
    onSave(names, extraValues);
  }

  const canSave =
    selected.length > 0 && extraFields.every(([key]) => extraValues[key]);

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal" role="dialog" aria-modal="true" aria-label={`Add ${title}`}>
        <div className="modal-heading">
          <div>
            <p className="eyebrow">add</p>
            <h3>{title}</h3>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        {extraFields.length > 0 && (
          <div className="form-grid">
            {extraFields.map(([key, label, fieldOptions]) => (
              <label key={key}>
                <span>{label}</span>
                <select
                  aria-label={label}
                  value={extraValues[key] || ""}
                  onChange={(e) => handleExtraChange(key, e.target.value)}
                >
                  <option value="" disabled>
                    Select {label}
                  </option>
                  {fieldOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        )}
        <div className="course-select-list">
          {loadingCourses && <p>Loading available courses…</p>}
          {!loadingCourses && filteredOptions.length === 0 && <p>{emptyMessage}</p>}
          {!loadingCourses &&
            filteredOptions.map((option) => (
              <label key={option.value} className="course-select-row">
                <input
                  type="checkbox"
                  checked={selected.includes(option.value)}
                  onChange={() => toggle(option.value)}
                />
                <span>{option.label}</span>
              </label>
            ))}
        </div>
        <div className="modal-actions">
          <button className="secondary-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-btn" disabled={!canSave} onClick={handleSave}>
            <CircleCheck size={18} />
            Add Selected
          </button>
        </div>
      </section>
    </div>
  );
}