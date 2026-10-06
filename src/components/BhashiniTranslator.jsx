import { useEffect } from "react";

// DBIM LNG-02: keep <html lang> in sync with the Bhashini language
const LANG_CODES = [
  "en", "hi", "ta", "te", "ml", "kn", "mr", "gu", "bn", "pa", "or", "as", "ur",
  "brx", "doi", "kok", "ks", "mai", "mni", "ne", "sa", "sat", "sd",
];

function detectLang() {
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!/lang/i.test(key)) continue;
      let value = localStorage.getItem(key) || "";
      try {
        const parsed = JSON.parse(value);
        if (typeof parsed === "string") value = parsed;
        else if (parsed && typeof parsed === "object") {
          value = parsed.code || parsed.lang || parsed.language || parsed.value || "";
        }
      } catch {
        /* plain string value */
      }
      value = String(value).toLowerCase().trim();
      if (LANG_CODES.includes(value)) return value;
    }
  } catch {
    /* storage not available */
  }
  return "en";
}

export default function BhashiniTranslator() {
  // Load the official Bhashini script once
  useEffect(() => {
    if (document.getElementById("bhashini-plugin-script")) return;
    const script = document.createElement("script");
    script.id = "bhashini-plugin-script";
    script.src = "https://translation-plugin.bhashini.co.in/v3/website_translation_utility.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  // Update <html lang> whenever the page is translated
  useEffect(() => {
    let timer;
    const sync = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const lang = detectLang();
        if (document.documentElement.lang !== lang) {
          document.documentElement.lang = lang;
        }
      }, 300);
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, []);

  // Keep your existing container div from the Bhashini snippet here
  return <div className="bhashini-plugin-container" aria-label="Select language" />;
}