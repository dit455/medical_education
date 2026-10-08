import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { getCaptcha } from "../api.js";

// Server-drawn image captcha. The answer is never in the page as text, so it
// cannot be selected, copied or read from the DOM. Pass React state setters
// (stable) as onChange / onToken. Bump `reloadKey` to force a new image.
export default function ImageCaptcha({ id, value, onChange, onToken, reloadKey = 0, error, errorId }) {
  const [image, setImage] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    onChange("");
    try {
      const c = await getCaptcha();
      setImage(c.image);
      onToken(c.token);
    } catch {
      setImage("");
      onToken("");
    } finally {
      setLoading(false);
    }
  }, [onChange, onToken]);

  useEffect(() => { load(); }, [load, reloadKey]);

  return (
    <div className={`pub-field${error ? " has-error" : ""}`}>
      <label htmlFor={id}>
        Enter the characters shown in the image<span aria-hidden="true"> *</span>
      </label>
      <div className="captcha-img-row">
        {image ? (
          <img
            src={image}
            alt="Captcha image. If you cannot read it, select Refresh for a new one."
            width="170"
            height="56"
            className="captcha-img"
            draggable="false"
            onContextMenu={(e) => e.preventDefault()}
          />
        ) : (
          <span className="captcha-img captcha-img--empty">
            {loading ? "Loading…" : "Could not load captcha"}
          </span>
        )}
        <button type="button" className="captcha-refresh" onClick={load} aria-label="Refresh captcha" title="Refresh captcha">
          <RefreshCw size={20} aria-hidden="true" />
        </button>
      </div>
      <input
        id={id}
        name="captcha"
        value={value}
        onChange={(e) => onChange(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5))}
        autoComplete="off"
        spellCheck={false}
        maxLength={5}
        required
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
      />
      {error ? <span className="pub-field-error" id={errorId}>{error}</span> : null}
    </div>
  );
}