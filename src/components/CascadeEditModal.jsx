import { useState, useEffect } from "react";
import { X, CircleCheck } from "lucide-react";
import * as api from "../api.js";

// Cascading single-select picker used by "Edit Course" / "Edit Subject".
// Walks Institute -> Course (-> Subject for level="subject"), then hands the
// chosen record (and its institute/course context) back via onPick so the
// caller can open the edit form.
export default function CascadeEditModal({
  level = "course",
  title = "Course",
  instituteOptions = [],
  onClose,
  onPick,
}) {
  const [instituteId, setInstituteId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    setCourseId("");
    setSubjects([]);
    setSubjectId("");
    if (!instituteId) {
      setCourses([]);
      return;
    }
    api.getCourses(Number(instituteId)).then(setCourses).catch(() => setCourses([]));
  }, [instituteId]);

  useEffect(() => {
    setSubjectId("");
    if (level !== "subject" || !courseId) {
      setSubjects([]);
      return;
    }
    api.getSubjects(Number(courseId)).then(setSubjects).catch(() => setSubjects([]));
  }, [courseId, level]);

  const selectedCourse = courses.find((c) => String(c.id) === String(courseId)) || null;
  const selectedSubject = subjects.find((s) => String(s.id) === String(subjectId)) || null;
  const canEdit = level === "course" ? !!selectedCourse : !!selectedSubject;

  function handleEdit() {
    const ctx = { instituteId, courseId };
    if (level === "course" && selectedCourse) onPick(selectedCourse, ctx);
    if (level === "subject" && selectedSubject) onPick(selectedSubject, ctx);
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal" role="dialog" aria-modal="true" aria-label={`Edit ${title}`}>
        <div className="modal-heading">
          <div>
            <p className="eyebrow">edit</p>
            <h3>Select {title}</h3>
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
          {level === "subject" && (
            <label>
              <span>Subject</span>
              <select
                aria-label="Subject"
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                disabled={!courseId}
              >
                <option value="" disabled>
                  {courseId
                    ? subjects.length
                      ? "Select subject"
                      : "No subjects for this course"
                    : "Select course first"}
                </option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.subject}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        <div className="modal-actions">
          <button className="secondary-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-btn" disabled={!canEdit} onClick={handleEdit}>
            <CircleCheck size={18} />
            Edit Selected
          </button>
        </div>
      </section>
    </div>
  );
}
