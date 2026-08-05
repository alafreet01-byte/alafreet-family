"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Mode = "father" | "amal" | "khalid" | "intelligence";
type Alert = { id: string; title: string; label: string; dueAt: string; route: string; memberName: string };

const settings: Record<Mode, { eyebrow: string; title: string; subtitle: string; accent: string; actions: Array<[string, string, string]> }> = {
  father: { eyebrow: "FATHER COMMAND CENTER", title: "مركز الأب", subtitle: "إدارة العائلة والقرارات والبيانات الحقيقية", accent: "amber", actions: [["إدارة الحسابات","/v9/admin","👥"],["التقويم","/v9/calendar","📅"],["التنبيهات","/v9/notifications","🔔"],["الميزانية","/v9/finance","💳"],["الصحة","/v9/health","❤️"],["النسخة الاحتياطية","/v9/backup","🗄️"]] },
  amal: { eyebrow: "AMAL LIFE CENTER", title: "مركز أمل", subtitle: "المدرسة والصحة وتنظيم شؤون الأسرة", accent: "pink", actions: [["المدرسة","/v9/school","🎓"],["صحة العائلة","/v9/health","❤️"],["التقويم","/v9/calendar","📅"],["التنبيهات","/v9/notifications","🔔"],["استوديو الفيديو","/v9/amal/video-studio","🎬"],["توازن العائلة","/v9/balance","⚖️"]] },
  khalid: { eyebrow: "KHALID ENGINEERING LAB", title: "مركز خالد", subtitle: "الدراسة الجامعية والمواعيد والمهام", accent: "sky", actions: [["المهام الدراسية","/v9/school","📚"],["التقويم","/v9/calendar","📅"],["التنبيهات","/v9/notifications","🔔"],["الملف الشخصي","/v9/family/khalid","👤"],["نور العائلة","/v9/noor","☾"],["الوثائق","/v9/documents","🔐"]] },
  intelligence: { eyebrow: "FAMILY INTELLIGENCE", title: "ذكاء العائلة", subtitle: "ملخص حي من بيانات العائلة المحفوظة", accent: "violet", actions: [["مركز التنبيهات","/v9/notifications","🔔"],["التقويم","/v9/calendar","📅"],["الصحة","/v9/health","❤️"],["المدرسة","/v9/school","🎓"],["الميزانية","/v9/finance","💳"],["الوثائق","/v9/documents","🔐"]] },
};

export default function LiveRoleDashboard({ mode }: { mode: Mode }) {
  const router = useRouter();
  const config = settings[mode];
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [calendarCount, setCalendarCount] = useState(0);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    void Promise.all([
      fetch("/api/family/notifications", { cache: "no-store" }).then((r) => r.ok ? r.json() : { alerts: [] }),
      fetch("/api/family/calendar", { cache: "no-store" }).then((r) => r.ok ? r.json() : { events: [] }),
    ]).then(([notificationData, calendarData]) => {
      setAlerts(notificationData.alerts ?? []);
      setCalendarCount((calendarData.events ?? []).filter((event: { startsAt: string }) => new Date(event.startsAt).getTime() >= Date.now()).length);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);
  const today = useMemo(() => alerts.filter((alert) => new Date(alert.dueAt).getTime() <= Date.now() + 86400000), [alerts]);
  return <main dir="rtl" className="min-h-screen bg-[#02030a] px-4 py-7 text-white sm:px-6"><div className="mx-auto max-w-7xl">
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6"><div><p className="text-xs font-black tracking-[.3em] text-amber-200/55">{config.eyebrow}</p><h1 className="mt-2 text-4xl font-black">{config.title}</h1><p className="mt-2 text-sm text-white/40">{config.subtitle}</p></div><button onClick={() => router.push("/v9/home")} className="rounded-2xl border border-white/10 px-5 py-3">البيت الرقمي</button></header>
    <section className="mt-6 grid gap-4 sm:grid-cols-3"><article className="rounded-[26px] border border-amber-200/10 bg-amber-300/[.04] p-5"><p className="text-xs text-white/40">تنبيهات اليوم</p><strong className="mt-2 block text-4xl text-amber-200">{loading ? "—" : today.length}</strong></article><article className="rounded-[26px] border border-violet-200/10 bg-violet-300/[.04] p-5"><p className="text-xs text-white/40">المواعيد القادمة</p><strong className="mt-2 block text-4xl text-violet-200">{loading ? "—" : calendarCount}</strong></article><article className="rounded-[26px] border border-emerald-200/10 bg-emerald-300/[.04] p-5"><p className="text-xs text-white/40">حالة الربط</p><strong className="mt-3 block text-xl text-emerald-200">متصل بالبيانات ✓</strong></article></section>
    <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{config.actions.map(([label, route, icon]) => <button key={route} onClick={() => router.push(route)} className="rounded-[26px] border border-white/10 bg-white/[.035] p-5 text-right transition hover:-translate-y-1 hover:border-white/20"><span className="text-3xl">{icon}</span><h2 className="mt-4 text-xl font-black">{label}</h2><p className="mt-2 text-xs text-white/35">فتح البيانات والأدوات الحقيقية ←</p></button>)}</section>
    <section className="mt-6 rounded-[30px] border border-white/10 bg-white/[.035] p-6"><div className="flex items-center justify-between"><h2 className="text-2xl font-black">الأهم الآن</h2><button onClick={() => router.push("/v9/notifications")} className="text-xs text-amber-200">عرض الكل ←</button></div><div className="mt-4 space-y-3">{loading ? <p className="text-white/35">جاري قراءة بيانات العائلة...</p> : alerts.length === 0 ? <p className="rounded-2xl bg-black/20 p-5 text-white/35">لا توجد تنبيهات قادمة.</p> : alerts.slice(0, 6).map((alert) => <button key={alert.id} onClick={() => router.push(alert.route)} className="flex w-full items-center justify-between gap-4 rounded-2xl bg-black/20 p-4 text-right"><div><span className="text-[10px] text-amber-200">{alert.label}</span><strong className="mt-1 block">{alert.title}</strong><small className="mt-1 block text-white/35">{alert.memberName}</small></div><span className="text-xs text-white/40">{new Intl.DateTimeFormat("ar-AE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(alert.dueAt))}</span></button>)}</div></section>
  </div></main>;
}
