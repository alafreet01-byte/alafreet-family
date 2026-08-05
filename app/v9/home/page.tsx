"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { familyCards, quickActions } from "./data";

type CalendarEvent = {
  id: string;
  title: string;
  memberName: string;
  startsAt: string;
  category: string;
};

type PrayerData = {
  timings?: Record<string, string>;
};

const prayerNames: Record<string, string> = {
  Fajr: "الفجر",
  Dhuhr: "الظهر",
  Asr: "العصر",
  Maghrib: "المغرب",
  Isha: "العشاء",
};

const quickActionRoutes = [
  "/v9/calendar?create=reminder",
  "/v9/school?create=assignment",
  "/v9/calendar?create=appointment",
  "/v9/time-capsule?create=memory",
  "/v9/chat",
  "/v9/balance?create=task",
];

function prayerAt(base: Date, value: string, addDay = false) {
  const match = value?.match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const result = new Date(base);
  result.setHours(Number(match[1]), Number(match[2]), 0, 0);
  if (addDay) result.setDate(result.getDate() + 1);
  return result;
}

function getNextPrayer(now: Date, prayer: PrayerData | null) {
  const timings = prayer?.timings;
  if (!timings) return null;
  const order = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
  for (const key of order) {
    const at = prayerAt(now, timings[key]);
    if (at && at.getTime() > now.getTime()) return { key, at };
  }
  const fajr = prayerAt(now, timings.Fajr, true);
  return fajr ? { key: "Fajr", at: fajr } : null;
}

function remainingPrayerText(now: Date, target: Date) {
  const minutes = Math.max(
    0,
    Math.ceil((target.getTime() - now.getTime()) / 60000),
  );
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours > 0 ? `${hours} ساعة و${rest} دقيقة` : `${rest} دقيقة`;
}

function getGreeting(hour: number) {
  if (hour < 12) return "صباح الخير";
  if (hour < 18) return "مساء الخير";
  return "مساء النور";
}

export default function HomeEnginePage() {
  const router = useRouter();
  const [now, setNow] = useState(new Date());
  const [viewer, setViewer] = useState<{
    id: string;
    name_ar: string;
    role: string;
  } | null>(null);
  const [homeWeather, setHomeWeather] = useState<any>(null);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [prayer, setPrayer] = useState<PrayerData | null>(null);
  const [chatUnread, setChatUnread] = useState(0);

  const personalTheme = useMemo(() => {
    const id = viewer?.id ?? "";
    if (["reem", "aisha", "fatima"].includes(id))
      return {
        kind: "girls",
        accent: "text-pink-200",
        button: "border-pink-200/25 bg-pink-300/10 text-pink-100",
        backdrop:
          "radial-gradient(circle at 88% 8%,rgba(244,114,182,.28),transparent 28%),radial-gradient(circle at 12% 25%,rgba(192,132,252,.22),transparent 32%),linear-gradient(180deg,#160a1d,#080711 58%,#130916)",
        label: "عالمك الجميل",
        title: `أهلًا ${viewer?.name_ar ?? ""} 🌸`,
        subtitle: "دراستك، إبداعك، صديقاتك ومكافآتك في مكان لطيف صُمم لكِ.",
      };
    if (["ahmed", "saud", "mohammed", "khalid"].includes(id))
      return {
        kind: "boys",
        accent: "text-sky-200",
        button: "border-sky-200/25 bg-sky-300/10 text-sky-100",
        backdrop:
          "radial-gradient(circle at 85% 5%,rgba(14,165,233,.25),transparent 28%),radial-gradient(circle at 10% 30%,rgba(34,197,94,.16),transparent 30%),linear-gradient(180deg,#06131e,#030711 58%,#07121a)",
        label: "منطقة الإنجاز",
        title: `حيّاك ${viewer?.name_ar ?? ""} ⚡`,
        subtitle: "مهامك، دراستك، تحدياتك ونقاطك مرتبة أمامك بسرعة ووضوح.",
      };
    if (id === "amal")
      return {
        kind: "mother",
        accent: "text-rose-200",
        button: "border-rose-200/25 bg-rose-300/10 text-rose-100",
        backdrop:
          "radial-gradient(circle at 85% 8%,rgba(251,113,133,.20),transparent 27%),radial-gradient(circle at 12% 25%,rgba(192,132,252,.15),transparent 30%),linear-gradient(180deg,#11090e,#05050b 58%,#0e080c)",
        label: "قلب البيت",
        title: `مرحبًا ${viewer?.name_ar ?? ""} 🌷`,
        subtitle:
          "العائلة، المدرسة، المواعيد والتنبيهات تحت إدارتك بهدوء ووضوح.",
      };
    return {
      kind: "father",
      accent: "text-amber-200",
      button: "border-amber-200/20 bg-amber-300/10 text-amber-100",
      backdrop:
        "radial-gradient(circle at 80% 8%,rgba(222,164,55,.18),transparent 25%),radial-gradient(circle at 15% 20%,rgba(67,91,184,.18),transparent 30%),linear-gradient(180deg,#02030a,#060815 55%,#010106)",
      label: "مركز القيادة",
      title: `مرحبًا ${viewer?.name_ar ?? ""} 🛡️`,
      subtitle: "ملخص العائلة والإدارة والقرارات المهمة في شاشة واحدة.",
    };
  }, [viewer]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60000);
    const supabase = createClient();

    void (async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) return;
      const { data: member } = await supabase
        .from("family_members")
        .select("id, name_ar, role")
        .eq("auth_user_id", authData.user.id)
        .maybeSingle();
      if (member) setViewer(member);
    })();
    void fetch("/api/weather/home", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setHomeWeather(data?.observation ?? null))
      .catch(() => null);
    void fetch("/api/family/calendar", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setCalendarEvents(data?.events ?? []))
      .catch(() => setCalendarEvents([]));
    void fetch("/api/noor", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setPrayer(data?.prayer ?? null))
      .catch(() => setPrayer(null));
    const loadUnread = () =>
      void fetch("/api/family/chat?summary=1", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => setChatUnread(Number(data?.totalUnread ?? 0)))
        .catch(() => null);
    loadUnread();
    const unreadTimer = window.setInterval(loadUnread, 15000);

    return () => {
      window.clearInterval(timer);
      window.clearInterval(unreadTimer);
    };
  }, []);

  const visibleCards = useMemo(() => {
    if (!viewer || viewer.role === "super_admin") return familyCards;

    const allowed =
      viewer.role === "school_admin"
        ? new Set([
            "family-chat",
            "install",
            "amal",
            "khalid",
            "school",
            "balance",
            "noor",
            "rewards",
            "calendar",
            "health",
            "documents",
            "vehicles",
            "finance",
            "shopping",
            "family",
            "story",
          ])
        : viewer.role === "university_user"
          ? new Set([
              "family-chat",
              "install",
              "khalid",
              "noor",
              "rewards",
              "calendar",
              "health",
              "documents",
              "vehicles",
              "shopping",
              "family",
            ])
          : viewer.role === "student" || viewer.role === "child"
            ? new Set([
                "family-chat",
                "install",
                "school",
                "balance",
                "noor",
                "rewards",
                "calendar",
                "health",
                "documents",
                "shopping",
                "family",
              ])
            : new Set([
                "family-chat",
                "install",
                "noor",
                "rewards",
                "calendar",
                "health",
                "documents",
                "shopping",
                "family",
              ]);

    return familyCards.filter(
      (card) => card.id === "notifications" || allowed.has(card.id),
    );
  }, [viewer]);

  const greeting = useMemo(() => getGreeting(now.getHours()), [now]);

  const formattedTime = useMemo(
    () =>
      new Intl.DateTimeFormat("ar-AE", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(now),
    [now],
  );

  const formattedDate = useMemo(
    () =>
      new Intl.DateTimeFormat("ar-AE", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }).format(now),
    [now],
  );

  const nextCalendarEvent = useMemo(
    () =>
      calendarEvents
        .filter((event) => new Date(event.startsAt).getTime() >= now.getTime())
        .sort(
          (a, b) =>
            new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
        )[0] ?? null,
    [calendarEvents, now],
  );

  const miniCalendar = useMemo(() => {
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const numberOfDays = new Date(year, month + 1, 0).getDate();
    const eventDays = new Set(
      calendarEvents
        .map((event) => new Date(event.startsAt))
        .filter(
          (date) => date.getFullYear() === year && date.getMonth() === month,
        )
        .map((date) => date.getDate()),
    );
    return {
      label: new Intl.DateTimeFormat("ar-AE", {
        month: "long",
        year: "numeric",
      }).format(now),
      cells: [
        ...Array.from({ length: firstWeekday }, () => null),
        ...Array.from({ length: numberOfDays }, (_, index) => index + 1),
      ],
      eventDays,
    };
  }, [calendarEvents, now]);

  const nextPrayer = useMemo(() => getNextPrayer(now, prayer), [now, prayer]);

  return (
    <main
      dir="rtl"
      data-audience={personalTheme.kind}
      className="min-h-screen overflow-x-hidden bg-[#02030a] text-white"
    >
      <div
        className="fixed inset-0 -z-10"
        style={{ background: personalTheme.backdrop }}
      />

      <header className="border-b border-white/10 bg-black/25 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <div>
            <p
              className={`text-[9px] font-semibold uppercase tracking-[0.34em] ${personalTheme.accent}`}
            >
              {personalTheme.label} • ALAFREET
            </p>
            <div className="mt-2 flex items-center gap-3">
              <h1 className="text-2xl font-black sm:text-3xl">
                {greeting} يا {viewer?.name_ar ?? "فرد العائلة"}
              </h1>
              <button
                type="button"
                onClick={() => router.push("/v9/chat")}
                aria-label={
                  chatUnread > 0
                    ? `${chatUnread} رسائل جديدة`
                    : "فتح محادثات العائلة"
                }
                className={`relative grid h-11 w-11 shrink-0 place-items-center rounded-full border text-xl transition ${chatUnread > 0 ? "animate-pulse border-emerald-300/40 bg-emerald-400/15 text-emerald-200" : "border-white/10 bg-white/5 text-white/35 hover:text-white"}`}
              >
                🔔
                {chatUnread > 0 && (
                  <span className="absolute -left-2 -top-2 grid h-6 min-w-6 place-items-center rounded-full bg-red-500 px-1 text-[11px] font-black text-white shadow-lg shadow-red-500/30">
                    {chatUnread > 99 ? "99+" : chatUnread}
                  </span>
                )}
              </button>
            </div>
            <p className="mt-2 text-sm text-white/35">
              {formattedDate} • {formattedTime}
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/v9/family")}
            className={`rounded-2xl border px-4 py-3 text-sm font-black transition hover:brightness-125 ${personalTheme.button}`}
          >
            دخول عالم العائلة
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {viewer && viewer.role !== "super_admin" && (
          <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-5 overflow-hidden rounded-[32px] border p-6 ${personalTheme.button}`}
          >
            <p className="text-xs font-black tracking-[.22em] opacity-60">
              {personalTheme.label}
            </p>
            <h2 className="mt-2 text-3xl font-black">{personalTheme.title}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-white/60">
              {personalTheme.subtitle}
            </p>
            <div className="pointer-events-none absolute opacity-20">
              {personalTheme.kind === "girls"
                ? "🌸 ✨ 🦋 💗"
                : personalTheme.kind === "boys"
                  ? "⚡ 🎮 🚀 🏆"
                  : "🌷 ✨ 🏡"}
            </div>
          </motion.section>
        )}
        <section className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
          <motion.article
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-[32px] border border-amber-200/15 bg-white/[0.035] p-6 backdrop-blur-2xl"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-amber-200/55">
                  FAMILY PULSE
                </p>
                <h2 className="mt-2 text-3xl font-black">ملخص العائلة اليوم</h2>
                <p className="mt-3 max-w-xl text-sm leading-7 text-white/40">
                  أهم ما يحتاج انتباهك خلال اليوم في شاشة واحدة.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-left">
                <p className="text-[10px] text-white/30">الطقس</p>
                <p className="mt-1 text-2xl font-black text-amber-200">
                  {homeWeather?.metric?.temp ?? "--"}°
                </p>
                <p className="mt-1 text-xs text-white/35">
                  محطة البيت • IALAIN19
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => router.push("/v9/calendar")}
                className="group rounded-[24px] border border-violet-200/15 bg-violet-300/[0.055] p-5 text-right transition hover:border-violet-200/30"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-300/10 text-2xl">
                    📅
                  </span>
                  <span className="rounded-full bg-violet-300/10 px-3 py-1 text-[10px] font-bold text-violet-100">
                    التقويم
                  </span>
                </div>
                <p className="mt-4 text-xs font-bold text-violet-200/55">
                  الموعد القادم
                </p>
                <div className="mt-3 rounded-2xl border border-white/8 bg-black/20 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <strong className="text-sm text-violet-100">
                      {miniCalendar.label}
                    </strong>
                    <span className="text-[9px] text-white/35">
                      ● يوم فيه موعد
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[9px] text-white/35">
                    {["ح", "ن", "ث", "ر", "خ", "ج", "س"].map((day) => (
                      <span key={day}>{day}</span>
                    ))}
                  </div>
                  <div className="mt-2 grid grid-cols-7 gap-1 text-center text-[10px]">
                    {miniCalendar.cells.map((day, index) => (
                      <span
                        key={`${day ?? "empty"}-${index}`}
                        className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full border ${
                          day === null
                            ? "border-transparent"
                            : miniCalendar.eventDays.has(day)
                              ? "border-violet-300 bg-violet-300/20 font-black text-violet-50 shadow-[0_0_12px_rgba(196,181,253,.28)]"
                              : day === now.getDate()
                                ? "border-amber-300/50 bg-amber-300/10 text-amber-100"
                                : "border-transparent text-white/55"
                        }`}
                      >
                        {day}
                      </span>
                    ))}
                  </div>
                </div>
                {nextCalendarEvent ? (
                  <>
                    <h3 className="mt-2 text-xl font-black">
                      {nextCalendarEvent.title}
                    </h3>
                    <p className="mt-2 text-xs leading-6 text-white/45">
                      {nextCalendarEvent.memberName} •{" "}
                      {new Intl.DateTimeFormat("ar-AE", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(new Date(nextCalendarEvent.startsAt))}
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="mt-2 text-xl font-black">
                      لا يوجد موعد قادم
                    </h3>
                    <p className="mt-2 text-xs text-white/40">
                      اضغط لإضافة موعد أو تذكير للعائلة.
                    </p>
                  </>
                )}
                <span className="mt-4 block text-[11px] font-bold text-violet-100/55 group-hover:text-violet-100">
                  فتح التقويم ←
                </span>
              </button>

              <button
                type="button"
                onClick={() => router.push("/v9/noor")}
                className="group rounded-[24px] border border-emerald-200/15 bg-emerald-300/[0.055] p-5 text-right transition hover:border-emerald-200/30"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-300/10 text-2xl">
                    🕌
                  </span>
                  <span className="rounded-full bg-emerald-300/10 px-3 py-1 text-[10px] font-bold text-emerald-100">
                    مدينة العين
                  </span>
                </div>
                <p className="mt-4 text-xs font-bold text-emerald-200/55">
                  الصلاة التالية
                </p>
                {nextPrayer ? (
                  <>
                    <div className="mt-2 flex items-end justify-between gap-3">
                      <h3 className="text-2xl font-black">
                        {prayerNames[nextPrayer.key]}
                      </h3>
                      <strong className="text-sm text-emerald-200">
                        باقي {remainingPrayerText(now, nextPrayer.at)}
                      </strong>
                    </div>
                    <p className="mt-3 rounded-2xl bg-black/20 p-3 text-xs leading-6 text-emerald-50/65">
                      اللهم أعنّي على ذكرك وشكرك وحسن عبادتك.
                    </p>
                  </>
                ) : (
                  <p className="mt-3 text-sm text-white/40">
                    جاري تحميل مواقيت الصلاة...
                  </p>
                )}
                <span className="mt-4 block text-[11px] font-bold text-emerald-100/55 group-hover:text-emerald-100">
                  فتح القرآن والأذكار ←
                </span>
              </button>
            </div>
          </motion.article>

          <motion.article
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="rounded-[32px] border border-white/10 bg-white/[0.035] p-6 backdrop-blur-2xl"
          >
            <p className="text-xs font-bold text-blue-200/55">WEATHER ALERT</p>
            <h2 className="mt-2 text-2xl font-black">تنبيه الطقس</h2>
            <div className="mt-5 rounded-2xl border border-blue-200/10 bg-blue-300/[0.055] p-4">
              <p className="text-sm font-bold text-blue-100">
                لا يوجد تنبيه مطر حاليًا
              </p>
              <p className="mt-2 text-xs leading-6 text-white/35">
                سنعرض هنا المنطقة المتوقعة للمطر ووقت بدايته وانتهائه.
              </p>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2 text-center">
              {[
                ["الحرارة", `${homeWeather?.metric?.temp ?? "--"}°`],
                ["المحسوسة", `${homeWeather?.metric?.heatIndex ?? "--"}°`],
                ["الرطوبة", `${homeWeather?.humidity ?? "--"}%`],
              ].map(([city, temp]) => (
                <div key={city} className="rounded-2xl bg-black/20 p-3">
                  <strong className="block text-sm">{temp}</strong>
                  <span className="mt-1 block text-[10px] text-white/30">
                    {city}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-sky-200/15 bg-[#07111d]">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
                <div>
                  <p className="text-[10px] font-bold text-sky-200/55">
                    NCM UAE RADAR
                  </p>
                  <strong className="text-sm">رادار الأمطار الرسمي</strong>
                </div>
                <a
                  href="https://www.ncm.gov.ae/maps-radars/uae-radars-network?lang=ar"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl bg-sky-300/10 px-3 py-2 text-[11px] font-bold text-sky-100"
                >
                  فتح كاملًا ↗
                </a>
              </div>
              <a
                href="https://www.ncm.gov.ae/maps-radars/uae-radars-network?lang=ar"
                target="_blank"
                rel="noreferrer"
                aria-label="فتح خريطة رادار الإمارات"
                className="group relative flex h-44 items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_70%_50%,rgba(34,197,94,.32),transparent_13%),radial-gradient(circle_at_45%_35%,rgba(56,189,248,.28),transparent_19%),linear-gradient(145deg,#071522,#0b2633)]"
              >
                <span className="absolute left-[18%] top-[24%] h-20 w-20 rounded-full border border-sky-200/15" />
                <span className="absolute left-[13%] top-[17%] h-28 w-28 rounded-full border border-sky-200/10" />
                <div className="text-center transition group-hover:scale-105">
                  <span className="block text-5xl">🇦🇪</span>
                  <strong className="mt-2 block text-sm text-sky-50">
                    خريطة رادار الإمارات
                  </strong>
                  <span className="mt-1 block text-[10px] text-sky-100/45">
                    اضغط لمشاهدة الحركة المباشرة
                  </span>
                </div>
              </a>
              <p className="px-4 py-2 text-[10px] text-white/30">
                المصدر: المركز الوطني للأرصاد الإماراتي
              </p>
            </div>
          </motion.article>
        </section>

        <section className="mt-6 rounded-[30px] border border-cyan-200/15 bg-cyan-300/[.035] p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-cyan-200/55">
                IALAIN19 • HOME RADAR
              </p>
              <h2 className="mt-2 text-2xl font-black">رادار البيت</h2>
            </div>
            <span
              className={`rounded-full px-3 py-2 text-xs font-bold ${homeWeather ? "bg-emerald-300/10 text-emerald-200" : "bg-white/5 text-white/35"}`}
            >
              {homeWeather ? "متصل ومباشر" : "بانتظار القراءة"}
            </span>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {[
              ["الحرارة", homeWeather?.metric?.temp, "°C"],
              ["الرطوبة", homeWeather?.humidity, "%"],
              ["المحسوسة", homeWeather?.metric?.heatIndex, "°C"],
              ["الرياح", homeWeather?.metric?.windSpeed, "كم/س"],
              ["الهبات", homeWeather?.metric?.windGust, "كم/س"],
              ["الضغط", homeWeather?.metric?.pressure, "hPa"],
              ["المطر", homeWeather?.metric?.precipRate, "مم/س"],
            ].map(([label, value, unit]) => (
              <div
                key={String(label)}
                className="rounded-2xl border border-white/8 bg-black/25 p-4 text-center"
              >
                <span className="block text-[10px] text-white/35">{label}</span>
                <strong className="mt-2 block text-2xl text-cyan-100">
                  {value ?? "--"}
                </strong>
                <span className="mt-1 block text-[10px] text-white/30">
                  {unit}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-amber-200/55">
                DIGITAL HOME
              </p>
              <h2 className="mt-2 text-2xl font-black">البيت الرقمي</h2>
            </div>
            <span className="text-xs text-white/30">
              كل فرد يدخل إلى عالمه الخاص
            </span>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visibleCards.map((card, index) => (
              <motion.button
                key={card.id}
                type="button"
                onClick={() => router.push(card.route)}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04 * index }}
                whileHover={{ y: -5 }}
                className="group rounded-[28px] border border-white/10 bg-white/[0.035] p-5 text-right transition hover:border-white/20"
              >
                <div className="flex items-start justify-between gap-4">
                  <span
                    className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl"
                    style={{
                      color: card.accent,
                      background: `${card.accent}16`,
                      border: `1px solid ${card.accent}30`,
                    }}
                  >
                    {card.icon}
                  </span>

                  {(card.badge ||
                    (card.id === "family-chat" && chatUnread > 0)) && (
                    <span
                      className="rounded-full px-2 py-1 text-[9px] font-bold"
                      style={{
                        color: card.accent,
                        background: `${card.accent}12`,
                      }}
                    >
                      {card.id === "family-chat" && chatUnread > 0
                        ? `${chatUnread > 99 ? "99+" : chatUnread} جديدة`
                        : card.badge}
                    </span>
                  )}
                </div>

                <h3 className="mt-5 text-lg font-black">{card.name}</h3>
                <p className="mt-2 text-sm leading-7 text-white/35">
                  {card.subtitle}
                </p>
                <div className="mt-5 text-xs font-bold text-white/30 transition group-hover:text-white/55">
                  فتح القسم ←
                </div>
              </motion.button>
            ))}
          </div>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          <article className="rounded-[30px] border border-white/10 bg-white/[0.035] p-6">
            <p className="text-xs font-bold text-pink-200/55">OUR STORY</p>
            <h2 className="mt-2 text-2xl font-black">رسالة اليوم لأمل</h2>
            <blockquote className="mt-5 rounded-2xl border border-pink-200/10 bg-pink-300/[0.045] p-5 text-lg leading-8 text-pink-50">
              مهما كانت مشاغل الحياة، يبقى البيت أجمل مكان لأنكِ فيه.
            </blockquote>
            <button
              type="button"
              onClick={() => router.push("/v9/our-story")}
              className="mt-4 rounded-2xl border border-pink-200/15 bg-pink-300/10 px-4 py-3 text-sm font-black text-pink-100"
            >
              دخول الغرفة الخاصة
            </button>
          </article>

          <article className="rounded-[30px] border border-white/10 bg-white/[0.035] p-6">
            <p className="text-xs font-bold text-emerald-200/55">
              QUICK ACTIONS
            </p>
            <h2 className="mt-2 text-2xl font-black">إضافة سريعة</h2>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {quickActions.map((action, index) => (
                <button
                  key={action.title}
                  type="button"
                  onClick={() =>
                    router.push(quickActionRoutes[index] ?? "/v9/home")
                  }
                  className="rounded-2xl border border-white/8 bg-black/20 p-4 text-center transition hover:border-amber-200/20 hover:bg-amber-300/[0.045]"
                >
                  <span className="block text-xl text-amber-200">
                    {action.icon}
                  </span>
                  <span className="mt-2 block text-xs font-bold">
                    {action.title}
                  </span>
                </button>
              ))}
            </div>
          </article>
        </section>

        <section className="mt-6 rounded-[30px] border border-white/10 bg-white/[0.035] p-6">
          <p className="text-xs font-bold text-violet-200/55">FAMILY STORY</p>
          <h2 className="mt-2 text-2xl font-black">ملخص اليوم الحقيقي</h2>
          <p className="mt-4 max-w-4xl text-sm leading-8 text-white/40">
            يوجد{" "}
            {
              calendarEvents.filter(
                (event) =>
                  new Date(event.startsAt).toDateString() ===
                  now.toDateString(),
              ).length
            }{" "}
            موعد اليوم، و
            {
              calendarEvents.filter(
                (event) => new Date(event.startsAt).getTime() > now.getTime(),
              ).length
            }{" "}
            موعد قادم محفوظ في تقويم العائلة.
            {nextCalendarEvent
              ? ` أقربها: ${nextCalendarEvent.title} لـ ${nextCalendarEvent.memberName}.`
              : " لا يوجد موعد قريب حاليًا."}
          </p>
        </section>
      </div>
    </main>
  );
}
