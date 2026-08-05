"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Alert = { id: string; title: string; label: string; dueAt: string; route: string; memberName: string };

export default function NotificationsPage() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [permission, setPermission] = useState("default");
  const [message, setMessage] = useState("");
  const load = useCallback(async () => {
    const response = await fetch("/api/family/notifications", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) return setMessage(data.error ?? "تعذر تحميل التنبيهات.");
    setAlerts(data.alerts ?? []);
  }, []);
  useEffect(() => { if ("Notification" in window) setPermission(Notification.permission); void load(); }, [load]);
  async function enable() {
    if (!("Notification" in window)) return setMessage("هذا المتصفح لا يدعم الإشعارات.");
    const result = await Notification.requestPermission();
    setPermission(result);
    setMessage(result === "granted" ? "تم تفعيل إشعارات الجهاز بنجاح." : "لم يتم السماح بالإشعارات.");
  }
  const remaining = (value: string) => {
    const hours = Math.ceil((new Date(value).getTime() - Date.now()) / 3600000);
    if (hours < 0) return "حان الموعد";
    if (hours < 24) return `متبقي ${hours} ساعة`;
    return `متبقي ${Math.ceil(hours / 24)} يوم`;
  };
  return <main dir="rtl" className="min-h-screen bg-[#02030a] px-4 py-7 text-white sm:px-6"><div className="mx-auto max-w-5xl">
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6"><div><p className="text-xs font-black tracking-[.3em] text-amber-200/55">FAMILY NOTIFICATIONS</p><h1 className="mt-2 text-4xl font-black">مركز التنبيهات 🔔</h1><p className="mt-2 text-sm text-white/40">المواعيد والصحة والوثائق والمدرسة في مكان واحد.</p></div><button onClick={() => router.push("/v9/home")} className="rounded-2xl border border-white/10 px-5 py-3">البيت الرقمي</button></header>
    <section className="mt-6 rounded-[28px] border border-amber-200/15 bg-amber-300/[.04] p-6"><div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-xl font-black">إشعارات الجهاز</h2><p className="mt-2 text-sm text-white/40">بعد التفعيل سيظهر التنبيه على الهاتف أو الكمبيوتر عند اقتراب الموعد.</p></div><button onClick={() => void enable()} disabled={permission === "granted"} className="rounded-2xl bg-amber-300 px-6 py-3 font-black text-black disabled:bg-emerald-300">{permission === "granted" ? "مفعّلة ✓" : "تفعيل الإشعارات"}</button></div>{message && <p className="mt-4 text-sm text-amber-100">{message}</p>}</section>
    <section className="mt-6"><div className="flex items-center justify-between"><h2 className="text-2xl font-black">التنبيهات القادمة</h2><span className="rounded-full bg-white/5 px-3 py-2 text-xs">{alerts.length}</span></div><div className="mt-4 space-y-3">{alerts.length === 0 ? <div className="rounded-[26px] border border-white/10 bg-white/[.03] p-8 text-center text-white/35">لا توجد تنبيهات قادمة.</div> : alerts.map((alert) => <button key={alert.id} onClick={() => router.push(alert.route)} className="flex w-full items-center justify-between gap-4 rounded-[24px] border border-white/10 bg-white/[.035] p-5 text-right"><div><span className="rounded-full bg-amber-300/10 px-3 py-1 text-[10px] text-amber-100">{alert.label}</span><h3 className="mt-3 text-lg font-black">{alert.title}</h3><p className="mt-2 text-xs text-white/40">{alert.memberName} • {new Intl.DateTimeFormat("ar-AE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(alert.dueAt))}</p></div><strong className="shrink-0 text-sm text-amber-200">{remaining(alert.dueAt)}</strong></button>)}</div></section>
  </div></main>;
}
