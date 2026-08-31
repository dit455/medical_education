import { useState } from "react";
import { LockKeyhole, Eye, EyeOff } from "lucide-react";
import SiteHeader from "../components/SiteHeader.jsx";
import * as api from "../api.js";

// Shown once, right after an Institution logs in for the first time with
// the auto-generated temporary password. Must succeed before the portal
// is reachable. Mirrors LoginPage.jsx's markup/classes for a consistent look.
export default function ChangePasswordPage({ username, onChanged, onBack }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("All fields are required.");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }
    if (newPassword === currentPassword) {
      setError("New password must be different from the temporary password.");
      return;
    }

    setSubmitting(true);
    try {
      await api.changePassword({ username, currentPassword, newPassword });
      onChanged();
    } catch (err) {
      setError(err.message || "Could not change password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page-with-header portal-page">
      <SiteHeader showSearch={false} />
      <main className="login-page">
        <div className="login-layout">
          <section className="login-card">
            <div className="login-card-heading">
              <h2>Set a New Password</h2>
              <span>Required before you can continue - this happens only once.</span>
            </div>
            <form className="login-form" onSubmit={handleSubmit}>
                            <label>
                <span>Temporary Password</span>
                <div className="password-field">
                  <input
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Temporary password"
                    autoComplete="current-password"
                  />
                  <button type="button" className="password-toggle" onClick={() => setShowCurrent((s) => !s)} aria-label={showCurrent ? "Hide password" : "Show password"}>
                    {showCurrent ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                </div>
              </label>
              <label>
                <span>New Password</span>
                <div className="password-field">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password"
                    autoComplete="new-password"
                  />
                  <button type="button" className="password-toggle" onClick={() => setShowNew((s) => !s)} aria-label={showNew ? "Hide password" : "Show password"}>
                    {showNew ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                </div>
              </label>
              <label>
                <span>Confirm New Password</span>
                <div className="password-field">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                  />
                  <button type="button" className="password-toggle" onClick={() => setShowConfirm((s) => !s)} aria-label={showConfirm ? "Hide password" : "Show password"}>
                    {showConfirm ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                </div>
              </label>
              {error && <div className="login-error">{error}</div>}
                <button className="primary-btn login-submit" type="submit" disabled={submitting}>
                <LockKeyhole size={18} />
                {submitting ? "Updating..." : "Update Password"}
              </button>
              {onBack && (
                <button type="button" className="secondary-btn" style={{ width: "100%", marginTop: 8 }} onClick={onBack}>
                  Back
                </button>
              )}
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}