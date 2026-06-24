import { useState } from "react";
import { ArrowLeft, RefreshCw, LockKeyhole } from "lucide-react";
import SiteHeader from "../components/SiteHeader.jsx";
import SiteFooter from "../components/SiteFooter.jsx";
import { randomCaptcha } from "../utils.js";
import * as api from "../api.js";

export default function LoginPage({ onLogin, onBackHome }) {
  const [loginType, setLoginType] = useState("super-admin");
  const [form, setForm] = useState({ username: "", password: "", captcha: "" });
  const [captcha, setCaptcha] = useState(randomCaptcha());
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError("");
  }

  function refreshCaptcha(clearError = true) {
    setCaptcha(randomCaptcha());
    setForm((prev) => ({ ...prev, captcha: "" }));
    if (clearError) setError("");
  }

  // Both tabs authenticate against the real `users` DB table - Super Admin
  // is just a seeded row there (see backend/routes/auth.py ensure_super_admin),
  // not a hardcoded frontend credential. The tab only picks the placeholder
  // hint; the account's actual role from the DB decides what happens next.
  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.username.trim() || !form.password.trim()) {
      setError("Enter username and password.");
      return;
    }
    if (form.captcha.trim().toUpperCase() !== captcha) {
      refreshCaptcha(false);
      setError("Captcha does not match.");
      return;
    }

    setSubmitting(true);
    try {
      const user = await api.login(form.username.trim(), form.password);
      onLogin(user);
    } catch (err) {
      setError(err.message || "Invalid username or password.");
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
              {onBackHome && (
                <button className="login-back-btn" type="button" onClick={onBackHome}>
                  <ArrowLeft size={15} />
                  Back to home
                </button>
              )}
              <h2>EMS Login</h2>
              <span>Secure role-based access</span>
            </div>
            <div className="login-tabs" role="tablist" aria-label="Login role">
              <button
                type="button"
                className={loginType === "super-admin" ? "active" : ""}
                onClick={() => setLoginType("super-admin")}
              >
                Super Admin
              </button>
              <button
                type="button"
                className={loginType === "department" ? "active" : ""}
                onClick={() => setLoginType("department")}
              >
                Department
              </button>
              {/* Institution login: backend + portal UI are ready (InstitutionPortal.jsx,
                  ApprovalsPage.jsx, /api/institution-users, /api/pending-changes) - uncomment
                  this tab when you're ready to let institutions log in.
              <button
                type="button"
                className={loginType === "institution" ? "active" : ""}
                onClick={() => setLoginType("institution")}
              >
                Institution
              </button>
              */}
            </div>
            <form className="login-form" onSubmit={handleSubmit}>
              <label>
                <span>Username</span>
                <input
                  value={form.username}
                  onChange={(e) => setField("username", e.target.value)}
                  placeholder="Username"
                  autoComplete="username"
                />
              </label>
              <label>
                <span>Password</span>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setField("password", e.target.value)}
                  placeholder="Password"
                  autoComplete="current-password"
                />
              </label>
              <div className="captcha-block">
                <span>Captcha Verification</span>
                <div className="captcha-row">
                  <div className="captcha-code" aria-label="Captcha code">
                    {captcha}
                  </div>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => refreshCaptcha()}
                    aria-label="Refresh captcha"
                    title="Refresh captcha"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
              </div>
              <label>
                <span>Enter Captcha</span>
                <input
                  value={form.captcha}
                  onChange={(e) => setField("captcha", e.target.value)}
                  placeholder="Enter captcha"
                  autoComplete="off"
                />
              </label>
              {error && <div className="login-error">{error}</div>}
              <button className="primary-btn login-submit" type="submit" disabled={submitting}>
                <LockKeyhole size={18} />
                {submitting ? "Logging in..." : "Login"}
              </button>
            </form>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
