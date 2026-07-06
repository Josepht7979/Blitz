"use client";
import { useEffect, useState } from "react";

// Registers the service worker and surfaces an "Install app" button on browsers
// that support it (Chrome / Edge / Android). iOS Safari doesn't fire the prompt —
// there users install via Share → Add to Home Screen.
export default function PwaClient() {
  const [deferred, setDeferred] = useState<any>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    const onPrompt = (e: any) => { e.preventDefault(); setDeferred(e); setShow(true); };
    const onInstalled = () => { setShow(false); setDeferred(null); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!show) return null;
  return (
    <button
      onClick={async () => {
        if (!deferred) return;
        deferred.prompt();
        try { await deferred.userChoice; } catch {}
        setShow(false); setDeferred(null);
      }}
      aria-label="Install Scripture Blitz"
      style={{
        position: "fixed", left: "50%", bottom: 18, transform: "translateX(-50%)",
        zIndex: 9999, border: 0, cursor: "pointer",
        padding: "11px 18px", borderRadius: 999, fontWeight: 700, fontSize: 14,
        color: "#3a1c04", fontFamily: "Inter, system-ui, sans-serif",
        background: "linear-gradient(135deg,#ffd166,#ff8c42)",
        boxShadow: "0 6px 20px rgba(255,140,66,.45)",
      }}
    >
      ⬇ Install app
    </button>
  );
}
