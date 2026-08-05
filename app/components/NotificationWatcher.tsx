"use client";
import { useEffect } from "react";

export default function NotificationWatcher() {
  useEffect(() => {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    async function check() {
      try {
        const response = await fetch("/api/family/notifications", { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json();
        const registration = await navigator.serviceWorker?.ready;
        for (const alert of (data.alerts ?? []).slice(0, 5)) {
          const hours = (new Date(alert.dueAt).getTime() - Date.now()) / 3600000;
          if (hours < 0 || hours > 24) continue;
          const key = `alafreet-notified-${alert.id}-${alert.dueAt}`;
          if (localStorage.getItem(key)) continue;
          await registration?.showNotification(alert.title, { body: `${alert.label} • ${alert.memberName}`, icon: "/icons/icon-192.png", badge: "/icons/icon-192.png", data: { route: alert.route }, tag: key });
          localStorage.setItem(key, new Date().toISOString());
        }
      } catch { /* الإشعارات لا تعطل الموقع */ }
    }
    void check();
    const timer = window.setInterval(() => void check(), 5 * 60000);
    return () => window.clearInterval(timer);
  }, []);
  return null;
}
