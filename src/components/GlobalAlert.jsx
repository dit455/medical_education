import { useEffect, useState } from "react";
import AlertDialog from "./AlertDialog.jsx";

// Replaces the browser's alert() ("10.65.51.49:5173 says") everywhere in the
// app with the centered popup. Mount it once (see main.jsx). Any code that
// calls alert("...") keeps working unchanged; if several alerts fire together
// they are shown one after another.
export default function GlobalAlert() {
  const [queue, setQueue] = useState([]);

  useEffect(() => {
    const original = window.alert;
    window.alert = (message) => {
      setQueue((q) => [...q, String(message ?? "")]);
    };
    return () => {
      window.alert = original;
    };
  }, []);

  if (queue.length === 0) return null;

  return (
    <AlertDialog
      title="Notice"
      message={queue[0]}
      onClose={() => setQueue((q) => q.slice(1))}
    />
  );
}