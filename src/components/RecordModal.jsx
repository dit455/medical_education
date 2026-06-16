import { useState } from "react";
import { X, CircleCheck } from "lucide-react";

// Generic field-driven form modal used for add/edit/view of any entity row.
// `fields` is an array of [key, label, options?] tuples; an `options` array
// renders a <select>, otherwise a plain text <input>.
export default function RecordModal({ mode, row, fields, title, onClose, onSave }) {
  const [formValues, setFormValues] = useState(row);
  const isViewMode = mode === "view";

  function setField(key, value) {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-heading">
          <div>
            <p className="eyebrow">{mode}</p>
            <h3>{title}</h3>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="form-grid">
          {fields.map(([key, label, options]) => {
            // Options can be plain strings (legacy) or { value, label } objects
            // (used for DB-backed dropdowns like region/year/semester, where the
            // stored value is an id but the user should see a readable name).
            const normalizedOptions = options
              ? options.map((option) =>
                  typeof option === "object" && option !== null
                    ? option
                    : { value: option, label: option },
                )
              : null;
            // The stored row value may be the option's id (value) or, for rows
            // loaded from the API with a human-readable display field (e.g. an
            // institution's region name), its label - match either way so the
            // <select> shows the right entry instead of falling back to blank.
            const currentValue = normalizedOptions
              ? normalizedOptions.find(
                  (option) => option.value === formValues[key] || option.label === formValues[key],
                )?.value ?? normalizedOptions[0]?.value ?? ""
              : null;
            return (
              <label key={key}>
                <span>{label}</span>
                {normalizedOptions ? (
                  <select
                    aria-label={label}
                    data-field={key}
                    name={key}
                    value={currentValue}
                    onChange={(e) => setField(key, e.target.value)}
                    disabled={isViewMode}
                  >
                    {normalizedOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={key === "password" ? "password" : "text"}
                    aria-label={label}
                    data-field={key}
                    name={key}
                    value={formValues[key] || ""}
                    onChange={(e) => setField(key, e.target.value)}
                    disabled={isViewMode}
                  />
                )}
              </label>
            );
          })}
        </div>
        <div className="modal-actions">
          <button className="secondary-btn" onClick={onClose}>
            Cancel
          </button>
          {!isViewMode && (
            <button className="primary-btn" onClick={() => onSave(formValues)}>
              <CircleCheck size={18} />
              Save
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
