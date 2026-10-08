import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";


export default function FloatingTools() {
  const [showTop, setShowTop] = useState(false);
  

  // Show arrow after scrolling 300px
  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 300);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  

  return (
    <>
      {showTop && (
        <button type="button" className="back-to-top" aria-label="Back to top"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <ArrowUp size={24} aria-hidden="true" />
        </button>
      )}
    </>
  );
}