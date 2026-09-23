import { useState, useEffect } from "react";
import { X, CircleCheck } from "lucide-react";

// Lets the user tick multiple master records at once instead of picking one
// at a time, then maps all of them on Save. Used for both "Add Existing
// Course" and "Add Existing Subject". `extraFields` (optional [key, label,
// options] tuples) renders inputs applied to every selected record. A tuple
// whose options array is empty renders a free-text input (e.g. Duration);
// otherwise it renders a dropdown (e.g. Year/Semester).
//
// A search box filters the visible checklist by any word in the record name.
//
// Pass `onInstituteChange` to dynamically filter out already-mapped courses
// when the user picks an institute in the modal. The callback receives the
// selected institute id and must return (or resolve to) an array of course
// name strings that are ALREADY mapped to that institute.
export default function CourseSelectModal({
  title = "Course",
  emptyMessage = "No more records available to add.",
  options,
  extraFields = [],
  onClose,
  onSave,
  onInstituteChange,
  initialMapped = [],
}) {
  const [selected, setSelected] = useState([]);
  const [extraValues, setExtraValues] = useState({});
  const [filteredOptions, setFilteredOptions] = useState(options);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [search, setSearch] = useState("");

  async function handleExtraChange(key, value) {
    const next = { ...extraValues, [key]: value };
    setExtraValues(next);

    if (key === "institute" && onInstituteChange) {
      setLoadingCourses(true);
      setSelected([]);
      try {
        const mappedNames = await onInstituteChange(value);
        const available = options.filter(
          (opt) => !mappedNames.some(
            (name) => name.trim().toLowerCase() === opt.label.trim().toLowerCase()
          )
        );
        setFilteredOptions(available);
      } catch {
        setFilteredOptions(options);
      } finally {
        setLoadingCourses(false);
      }
    }
  }

  useEffect(() => {
    if (!extraValues["institute"]) {
      if (initialMapped && initialMapped.length) {
        const available = options.filter(
          (opt) => !initialMapped.some(
            (name) => name.trim().toLowerCase() === opt.label.trim().toLowerCase()
          )
        );
        setFilteredOptions(available);
      } else {
        setFilteredOptions(options);
      }
    }
  }, [options, initialMapped]); // eslint-disable-line react-hooks/exhaustive-deps

  const visibleOptions = filteredOptions.filter((opt) =>
    String(opt.label ?? "").toLowerCase().includes(search.trim().toLowerCase())
  );

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
        <div className="course-select-search" style={{ padding: "0 0 12px" }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${title.toLowerCase()}...`}
            style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db" }}
          />
        </div>
        {extraFields.length > 0 && (
          <div className="form-grid">
            {extraFields.map(([key, label, fieldOptions]) => {
              const isText = !fieldOptions || fieldOptions.length === 0;
              return (
                <label key={key}>
                  <span>{label}</span>
                  {isText ? (
                    <input
                      type="text"
                      aria-label={label}
                      value={extraValues[key] || ""}
                      onChange={(e) => handleExtraChange(key, e.target.value)}
                      placeholder={`Enter ${label.toLowerCase()}`}
                    />
                  ) : (
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
                          {String(option.label ?? "").toUpperCase()}
                        </option>
                      ))}
                    </select>
                  )}
                </label>
              );
            })}
          </div>
        )}
        <div className="course-select-list">
          {loadingCourses && <p>Loading available courses…</p>}
          {!loadingCourses && visibleOptions.length === 0 && <p>{emptyMessage}</p>}
          {!loadingCourses &&
            visibleOptions.map((option) => (
              <label key={option.value} className="course-select-row">
                <input
                  type="checkbox"
                  checked={selected.includes(option.value)}
                  onChange={() => toggle(option.value)}
                />
                <span>{String(option.label ?? "").toUpperCase()}</span>
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