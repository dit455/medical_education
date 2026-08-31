import { useState, useEffect } from "react";
import { X } from "lucide-react";
import * as api from "../api.js";
import StatusBadge from "./StatusBadge.jsx";

// Read-only list of students for a given institution, shown on the board
// (department) side. Reuses the same endpoint as the institution's
// Student Management page: api.getInstitutionStudents(institutionId).
export default function ViewStudentsModal({ institutionId, institutionName, onClose }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!institutionId) return;
    setLoading(true);
    api
      .getInstitutionStudents(institutionId)
      .then((rows) => setStudents(rows || []))
      .catch(() => setStudents([]))
      .finally(() => setLoading(false));
  }, [institutionId]);

  return (
    <div className="modal-backdrop" role="presentation">
      <section
        className="modal wide"
        role="dialog"
        aria-modal="true"
        aria-label="Students"
      >
        <div className="modal-heading">
          <div>
            <p className="eyebrow">view</p>
            <h3>Students{institutionName ? ` — ${institutionName}` : ""}</h3>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="table-wrap data-table-scroll">
          <table>
            <thead>
              <tr>
                <th>Reg No</th>
                <th>Student Name</th>
                <th>Father</th>
                <th>Mobile</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="empty-state">
                    <div className="table-empty"><span>Loading…</span></div>
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty-state">
                    <div className="table-empty"><span>No students registered yet</span></div>
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id}>
                    <td data-label="Reg No">{student.registerNo}</td>
                    <td data-label="Student Name">{student.name}</td>
                    <td data-label="Father">{student.fatherName}</td>
                    <td data-label="Mobile">{student.mobile}</td>
                    <td data-label="Status"><StatusBadge status={student.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="modal-actions">
          <button className="secondary-btn" onClick={onClose}>Close</button>
        </div>
      </section>
    </div>
  );
}