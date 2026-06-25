import { useState, useEffect } from "react";
import { X, CircleCheck } from "lucide-react";
import * as api from "../api.js";

// Cascading mapper for subjects: pick an Institute, then a Course mapped to
// that institute, then tick the existing subjects (plus Year/Semester required
// by the mapping table) and Save maps them all to the chosen course.
//
// When a Course is selected, already-mapped subjects for that course are
// fetched and removed from the checklist — same behaviour as Map Course.
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
  const [filteredSubjects, setFilteredSubjects] = useState(subjectOptions);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  // When institute changes, reload its courses and reset everything below
  useEffect(() => {
    if (!instituteId) {
      setCourses([]);
      setCourseId("");
      setFilteredSubjects(subjectOptions);
      return;
    }
    setCourseId("");
    setSelected([]);
    setFilteredSubjects(subjectOptions);
    api.getCourses(Number(instituteId)).then(setCourses).catch(() => setCourses([]));
  }, [instituteId]); // eslint-disable-line react-hooks/exhaustive-deps

  // When course changes, fetch already-mapped subjects and remove them
  useEffect(() => {
    if (!courseId) {
      setFilteredSubjects(subjectOptions);
      setSelected([]);
      return;
    }
    setLoadingSubjects(true);
    setSelected([]);
    api.getSubjects(Number(courseId))
      .then((mappedSubjects) => {
        // mappedSubjects is [{id, subject, ...}] — filter by name
        const available = subjectOptions.filter(
          (opt) =>
            !mappedSubjects.some(
              (ms) =>
                ms.subject.trim().toLowerCase() === opt.label.trim().toLowerCase()
            )
        );
        setFilteredSubjects(available);
      })
      .catch(() => setFilteredSubjects(subjectOptions))
      .finally(() => setLoadingSubjects(false));
  }, [courseId]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggle(value) {
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  }

  const canSave = courseId && selected.length > 0 && year && semester;

  function handleSave() {
    const names = filteredSubjects
      .filter((option) => selected.includes(option.value))
      .map((option) => option.label);
    onSave(Number(courseId), Number(instituteId), names, { year, semester });
  }

  const emptyMessage = !instituteId
    ? "Select an institute first."
    : !courseId
    ? "Select a course to see available subjects."
    : loadingSubjects
    ? "Loading subjects…"
    : filteredSubjects.length === 0
    ? "All subjects are already mapped to this course."
    : null;

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
          {emptyMessage && <p>{emptyMessage}</p>}
          {!emptyMessage &&
            filteredSubjects.map((option) => (
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