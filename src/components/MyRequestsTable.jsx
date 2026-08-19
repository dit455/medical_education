import { FileText, Pencil, Trash2 } from "lucide-react";
import StatusBadge from "./StatusBadge.jsx";
import IconButton from "./IconButton.jsx";
import { passOrFail } from "../utils.js";

// Used on Internal Marks Management (Creator's own submissions). Approved
// rows are locked (view only) since the marks are already real records;
// Pending/Rejected rows can still be viewed, corrected, or withdrawn.
export default function MyRequestsTable({ changes, students = [], onView, onEdit, onDelete }) {
  function studentById(id) {
    return students.find((s) => String(s.id) === String(id));
  }

  return (
    <section className="data-table-card" style={{ width: "100%" }}>
      <div className="data-table-heading">
        <div>
          <h3>My Requests</h3>
        </div>
      </div>
      <div className="table-wrap data-table-scroll">
        <table>
          <thead>
            <tr>
              <th>Reg No</th>
              <th>Student Name</th>
              <th>Scored Marks</th>
              <th>Total Marks</th>
              <th>Result</th>
              <th>Status</th>
              <th>Uploaded on</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {changes.length === 0 ? (
              <tr>
                <td colSpan={8} className="empty-state">
                  <div className="table-empty">
                    <span>Nothing submitted yet</span>
                  </div>
                </td>
              </tr>
            ) : (
              changes.map((change) => {
                const student = studentById(change.payload.studentId);
                const isFinal = change.status === "Approved";
                const result = change.payload.result || passOrFail(change.payload.scoredMarks, change.payload.passMarks);
                return (
                  <tr key={change.id}>
                    <td data-label="Reg No">{student?.registerNo || "-"}</td>
                    <td data-label="Student Name">{student?.name || `Student #${change.payload.studentId}`}</td>
                    <td data-label="Scored Marks">{change.payload.scoredMarks}</td>
                    <td data-label="Total Marks">{change.payload.totalMarks}</td>
                    <td data-label="Result">
                      {result ? (
                        <span style={{ fontWeight: 700, color: result === "Pass" ? "#1e7e34" : "#b00020" }}>{result}</span>
                      ) : "-"}
                    </td>
                    <td data-label="Status">
                      <StatusBadge status={change.status} />
                    </td>
                    <td data-label="Uploaded on">{change.requestedDate?.slice(0, 10)}</td>
                    <td data-label="Actions">
                      <div className="action-group">
                        <IconButton label="View" icon={FileText} onClick={() => onView?.(change)} />
                        {!isFinal && (
                          <>
                            <IconButton
                              label="Edit"
                              icon={Pencil}
                              title="Correct and resubmit"
                              onClick={() => onEdit?.(change)}
                            />
                            <IconButton
                              label="Delete"
                              icon={Trash2}
                              tone="danger"
                              title="Withdraw this request"
                              onClick={() => onDelete?.(change)}
                            />
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}