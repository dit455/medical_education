import { Suspense } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import "./styles/ux4g-widget.css";
import "./styles/cookie-consent.css";
import App from "./App.jsx";
import CookieConsent from "./components/CookieConsent.jsx";

createRoot(document.getElementById("root")).render(
  <>
    <Suspense fallback={null}>
      <App />
    </Suspense>
    <CookieConsent />
  </>,
);