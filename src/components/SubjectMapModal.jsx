import { useState, useEffect } from "react";
import { X, CircleCheck } from "lucide-react";
import * as api from "../api.js";

// Cascading mapper for subjects: pick an Institute, then a Course mapped to
// that institute, then tick the existing subjects (plus Year/Semester required
// by the mapping table) and Save maps them all to the chosen course.
export default function SubjectMapModal({
  instituteOptions = [],
  subjectOptions = [],
  yearOptions = [],
  semOptions = [],
  onClose,
  onSave,
}) {
  const [instituteId, setInstituteId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [courses, setCourses] = useState([]);
  const [selected, setSelected] = useState([]);
  const [year, setYear] = useState("");
  const [semester, setSemester] = useState("");

  useEffect(() => {
    if (!instituteId) {
      setCourses([]);
      setCourseId("");
      return;
    }
    setCourseId("");
    api.getCourses(Number(instituteId)).then(setCourses).catch(() => setCourses([]));
  }, [instituteId]);

  function toggle(value) {
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  }

  const canSave = courseId && selected.length > 0 && year && semester;

  function handleSave() {
    const names = subjectOptions
      .filter((option) => selected.includes(option.value))
      .map((option) => option.label);
    onSave(Number(courseId), Number(instituteId), names, { year, semester });
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal" role="dialog" aria-modal="true" aria-label="Map Subject">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">map</p>
            <h3>Map Subject</h3>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="form-grid">
          <label>
            <span>Institute</span>
            <select
              aria-label="Institute"
              value={instituteId}
              onChange={(e) => setInstituteId(e.target.value)}
            >
              <option value="" disabled>
                Select institute
              </option>
              {instituteOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Course</span>
            <select
              aria-label="Course"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              disabled={!instituteId}
            >
              <option value="" disabled>
                {instituteId
                  ? courses.length
                    ? "Select course"
                    : "No courses for this institute"
                  : "Select institute first"}
              </option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Year</span>
            <select aria-label="Year" value={year} onChange={(e) => setYear(e.target.value)}>
              <option value="" disabled>
                Select year
              </option>
              {yearOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Semester</span>
            <select aria-label="Semester" value={semester} onChange={(e) => setSemester(e.target.value)}>
              <option value="" disabled>
                Select semester
              </option>
              {semOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="course-select-list">
          {subjectOptions.length === 0 && <p>No subjects available to map.</p>}
          {subjectOptions.map((option) => (
            <label key={option.value} className="course-select-row">
              <input
                type="checkbox"
                checked={selected.includes(option.value)}
                onChange={() => toggle(option.value)}
                disabled={!courseId}
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
