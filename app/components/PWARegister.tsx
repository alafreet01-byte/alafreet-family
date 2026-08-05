"use client";

import { useEffect } from "react";

export default function PWARegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const refreshWorker = async () => {
      try {
        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(
            keys
              .filter((key) => key.startsWith("alafreet-") && key !== "alafreet-static-v10-5")
              .map((key) => caches.delete(key)),
          );
        }

        const registration = await navigator.serviceWorker.register("/sw.js?v=10-5", {
          updateViaCache: "none",
        });
        await registration.update();
      } catch {
        // The website must continue working even when PWA setup is unavailable.
      }
    };

    void refreshWorker();
  }, []);

  return null;
}
