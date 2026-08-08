"use client";

import { useEffect } from "react";
import { requestOfflineSync } from "@/lib/sync";

// AGENTS.md Rule 5 — iOS / WebKit fallback.
// iOS Safari does not support the Service Worker Background Sync API, so
// offline data could otherwise sit in IndexedDB until the network flaps.
// This component triggers a (jittered) sync whenever the app is opened,
// returns to the foreground, or reports an online connection.
export default function SyncManager() {
  useEffect(() => {
    requestOfflineSync();

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") requestOfflineSync();
    };

    const onFocus = () => requestOfflineSync();
    const onOnline = () => requestOfflineSync();

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onOnline);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  return null;
}
