import { AlertTriangle, ExternalLink } from "lucide-react";

// Confirmation modal shown before navigating to an external site.
export default function ExternalLinkWarning({ href, onCancel, onContinue }) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label="You are leaving this website"
        style={{ maxWidth: 460, textAlign: "center", padding: "32px 28px" }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "var(--heritage-yellow-200)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 18px",
          }}
        >
          <AlertTriangle size={28} color="var(--heritage-yellow)" />
        </div>

        <h3 style={{ margin: "0 0 10px", fontSize: "1.15rem", color: "var(--ink)" }}>You are leaving this website</h3>

        <p style={{ color: "var(--muted)", fontSize: "0.9rem", margin: "0 0 6px", lineHeight: 1.5 }}>
          This link goes to an external website not maintained by this Department.
        </p>
        <p style={{ color: "var(--muted)", fontSize: "0.9rem", margin: "0 0 18px", lineHeight: 1.5 }}>
          We are not responsible for its content, accuracy, or privacy practices. Proceed at your own risk.
        </p>

        <p
          style={{
            fontWeight: 700,
            fontSize: "0.95rem",
            wordBreak: "break-all",
            margin: "0 0 24px",
            color: "var(--ink)",
          }}
        >
          {href}
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button type="button" className="secondary-btn" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="primary-btn" onClick={onContinue}>
            Continue
            <ExternalLink size={15} />
          </button>
        </div>
      </section>
    </div>
  );
}