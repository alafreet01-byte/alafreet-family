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

    async function checkChat() {
      if (!("Notification" in window) || Notification.permission !== "granted") return;
      try {
        const response = await fetch("/api/family/chat?summary=1", { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json();
        const registration = await navigator.serviceWorker?.ready;
        if (!registration) return;
        const now = Date.now();
        for (const message of (data.messages ?? [])) {
          const age = now - new Date(message.createdAt).getTime();
          if (age < 0 || age > 2 * 60_000) continue;
          const key = `alafreet-chat-notified-${message.id}`;
          if (localStorage.getItem(key)) continue;
          await registration.showNotification(`رسالة من ${message.senderName}`, {
            body: String(message.text ?? "رسالة جديدة").slice(0, 120),
            icon: "/icons/icon-192.png",
            badge: "/icons/icon-192.png",
            data: { route: `/v9/chat?conversation=${encodeURIComponent(message.conversationId)}` },
            tag: key,
          });
          localStorage.setItem(key, new Date().toISOString());
        }
      } catch {
        // المحادثات لا تعطل بقية الموقع عند انقطاع الشبكة.
      }
    }

    function start() {
      if (timer) window.clearInterval(timer);
      void check();
      void checkChat();
      timer = window.setInterval(() => { void check(); void checkChat(); }, 15_000);
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
