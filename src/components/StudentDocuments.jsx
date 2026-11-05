import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import * as api from "../api.js";

const UPLOAD_BASE = `http://${window.location.hostname}:5001/api/uploads/`;
const isPdf = (path) => String(path || "").toLowerCase().endsWith(".pdf");

// Rows for the student's photo, 12th TC and 12th marksheet, each with a
// Preview button that opens the saved file in a popup (image or PDF).
export default function StudentDocuments({ student }) {
  const [docs, setDocs] = useState({});
  const [preview, setPreview] = useState(null); // { label, url, pdf }

  useEffect(() => {
    api
      .getStudentDocuments(student.id)
      .then((list) => {
        const map = {};
        list.forEach((d) => {
          map[d.docType] = d.path;
        });
        setDocs(map);
      })
      .catch(() => setDocs({}));
  }, [student.id]);

  const items = [
    ["tc12", "12th Transfer Certificate (TC)", docs.tc12],
    ["marksheet12", "12th Marksheet", docs.marksheet12],
  ];

  return (
    <>
      {items.map(([key, label, path]) => (
        <div className="view-row" key={key}>
          <span className="view-label">{label}</span>
          <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 12 }}>
            {path ? (
              <button
                type="button"
                className="secondary-btn"
                style={{ padding: "4px 14px" }}
                onClick={() => setPreview({ label, url: UPLOAD_BASE + path, pdf: isPdf(path) })}
              >
                Preview
              </button>
            ) : (
              <span style={{ color: "#b00020", fontWeight: 600 }}>Not uploaded</span>
            )}
          </div>
        </div>
      ))}

      {preview &&
        createPortal(
          <div className="modal-backdrop" role="presentation" style={{ zIndex: 4000 }}>
            <section
              className="modal"
              role="dialog"
              aria-modal="true"
              aria-label="Document preview"
              style={{ maxWidth: 900, width: "92vw" }}
            >
              <div className="modal-heading">
                <div>
                  <p className="eyebrow">Preview</p>
                  <h3>{preview.label}</h3>
                </div>
                <button className="icon-btn" onClick={() => setPreview(null)} aria-label="Close">
                  <X size={24} />
                </button>
              </div>
              <div
                style={{
                  display: "grid",
                  placeItems: "center",
                  background: "var(--soft-gray)",
                  borderRadius: 12,
                  padding: 8,
                }}
              >
                {preview.pdf ? (
                  <iframe
                    title={preview.label}
                    src={preview.url}
                    style={{ width: "100%", height: "70vh", border: "none", borderRadius: 8, background: "#fff" }}
                  />
                ) : (
                  <img
                    src={preview.url}
                    alt={preview.label}
                    style={{ maxWidth: "100%", maxHeight: "70vh", objectFit: "contain", borderRadius: 8 }}
                  />
                )}
              </div>
              <div className="modal-actions">
                <button className="primary-btn" onClick={() => setPreview(null)}>
                  Close
                </button>
              </div>
            </section>
          </div>,
          document.body,
        )}
    </>
  );
}