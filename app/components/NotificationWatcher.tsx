"use client";

import { useEffect } from "react";

const ENABLED_EVENT = "alafreet-notifications-enabled";

export default function NotificationWatcher() {
  useEffect(() => {
    let timer: number | undefined;

    async function check() {
      if (!("Notification" in window) || Notification.permission !== "granted") return;
      try {
        const response = await fetch("/api/family/notifications", { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json();
        const registration = await navigator.serviceWorker?.ready;
        if (!registration) return;

        for (const alert of (data.alerts ?? []).slice(0, 8)) {
          const hours = (new Date(alert.dueAt).getTime() - Date.now()) / 3600000;
          if (hours < 0 || hours > 24) continue;
          const key = `alafreet-notified-${alert.id}-${alert.dueAt}`;
          if (localStorage.getItem(key)) continue;
          await registration.showNotification(alert.title, {
            body: `${alert.label} • ${alert.memberName}`,
            icon: "/icons/icon-192.png",
            badge: "/icons/icon-192.png",
            data: { route: alert.route },
            tag: key,
          });
          localStorage.setItem(key, new Date().toISOString());
        }
      } catch {
        // فشل الإشعار لا يعطل بقية الموقع.
      }
    }

    function start() {
      if (timer) window.clearInterval(timer);
      void check();
      timer = window.setInterval(() => void check(), 5 * 60_000);
    }

    start();
    window.addEventListener(ENABLED_EVENT, start);
    document.addEventListener("visibilitychange", start);
    return () => {
      if (timer) window.clearInterval(timer);
      window.removeEventListener(ENABLED_EVENT, start);
      document.removeEventListener("visibilitychange", start);
    };
  }, []);

  return null;
}
