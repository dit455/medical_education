import { createRoot } from "react-dom/client";
import "./styles.css";
// Size overrides for the third-party UX4G accessibility widget (embedded in
// index.html). Imported here rather than in a page component because the
// widget is global to the app.
import "./styles/ux4g-widget.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(<App />);
