import { useEffect, useRef, useState } from "react";

// DBIM PRV-01..05 / DPDP Act 2023: cookie & storage consent.
// Essential storage (login session) is always on. "Preferences" covers the
// remembered language (Bhashini) and accessibility settings (UX4G widget).
// No analytics or advertising cookies are used on this website.

const CONSENT_KEY = "ems-consent";
const CONSENT_DAYS = 180; // persistent record has an expiry (PRV-03)

function readConsent() {
  try {
    const saved = JSON.parse(localStorage.getItem(CONSENT_KEY) || "null");
    if (!saved || Date.now() > saved.expires) return null;
    return saved;
  } catch {
    return null;
  }
}

function saveConsent(preferences) {
  const record = {
    essential: true,
    preferences,
    savedAt: Date.now(),
    expires: Date.now() + CONSENT_DAYS * 24 * 60 * 60 * 1000,
  };
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(record));
  } catch {
    /* storage blocked – banner will show again next visit */
  }
  return record;
}

// When preferences are refused, remove remembered language / widget settings
function clearPreferenceStorage() {
  try {
    Object.keys(localStorage).forEach((key) => {
      if (key !== CONSENT_KEY && /(lang|bhashini|ux4g|accessib)/i.test(key)) {
        localStorage.removeItem(key);
      }
    });
  } catch {
    /* ignore */
  }
}

export function openCookieSettings() {
  window.dispatchEvent(new Event("open-cookie-settings"));
}

export default function CookieConsent() {
  const [consent, setConsent] = useState(() => readConsent());
  const [showBanner, setShowBanner] = useState(() => !readConsent());
  const [showSettings, setShowSettings] = useState(false);
  const [prefChoice, setPrefChoice] = useState(false); // never pre-checked (PRV-04)
  const dialogRef = useRef(null);

  // Footer "Cookie settings" link opens the panel (PRV-05)
  useEffect(() => {
    const open = () => {
      setPrefChoice(Boolean(readConsent()?.preferences));
      setShowSettings(true);
    };
    window.addEventListener("open-cookie-settings", open);
    return () => window.removeEventListener("open-cookie-settings", open);
  }, []);

  // Apply a refusal on every load
  useEffect(() => {
    if (consent && !consent.preferences) clearPreferenceStorage();
  }, [consent]);

  useEffect(() => {
    if (showSettings) dialogRef.current?.querySelector("input, button")?.focus();
  }, [showSettings]);

  function decide(preferences) {
    const record = saveConsent(preferences);
    if (!preferences) clearPreferenceStorage();
    setConsent(record);
    setShowBanner(false);
    setShowSettings(false);
  }

  return (
    <>
      {showBanner && !showSettings ? (
        <section className="cc-banner" role="region" aria-label="Cookie consent">
          <div className="cc-text">
            <strong>Cookies on this website</strong>
            <p>
              We use essential storage to keep you logged in. With your permission, we also remember your language
              and accessibility settings. We do not use advertising or tracking cookies.{" "}
              <a href="/policies/privacy.html">Privacy Policy</a>
            </p>
          </div>
          <div className="cc-actions">
            <button type="button" className="cc-btn cc-primary" onClick={() => decide(true)}>
              Accept all
            </button>
            <button type="button" className="cc-btn" onClick={() => decide(false)}>
              Reject non-essential
            </button>
            <button
              type="button"
              className="cc-btn cc-link"
              onClick={() => {
                setPrefChoice(false);
                setShowSettings(true);
              }}
            >
              Customise
            </button>
          </div>
        </section>
      ) : null}

      {showSettings ? (
        <div className="cc-backdrop" onKeyDown={(e) => e.key === "Escape" && setShowSettings(false)}>
          <div className="cc-dialog" role="dialog" aria-modal="true" aria-labelledby="cc-title" ref={dialogRef}>
            <h2 id="cc-title">Cookie settings</h2>
            <p>Choose which storage this website may use. You can change this at any time from the footer.</p>

            <div className="cc-row">
              <div>
                <strong>Essential</strong>
                <p>Keeps you logged in and remembers this choice. Cleared when you log out or close the browser.</p>
              </div>
              <span className="cc-always">Always on</span>
            </div>

            <label className="cc-row" htmlFor="cc-pref">
              <div>
                <strong>Preferences</strong>
                <p>Remembers your chosen language (Bhashini) and accessibility settings for your next visit.</p>
              </div>
              <input
                id="cc-pref"
                type="checkbox"
                checked={prefChoice}
                onChange={(e) => setPrefChoice(e.target.checked)}
              />
            </label>

            <div className="cc-row">
              <div>
                <strong>Analytics and advertising</strong>
                <p>Not used on this website.</p>
              </div>
              <span className="cc-always">Not used</span>
            </div>

            <div className="cc-actions">
              <button type="button" className="cc-btn cc-primary" onClick={() => decide(prefChoice)}>
                Save choices
              </button>
              <button type="button" className="cc-btn" onClick={() => setShowSettings(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}