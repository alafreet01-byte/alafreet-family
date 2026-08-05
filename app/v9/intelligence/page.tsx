"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  intelligenceItems,
  nightReport,
  priorities,
} from "./data";

type Filter = "all" | "school" | "university" | "health" | "family";

const filters: Array<{ id: Filter; label: string }> = [
  { id: "all", label: "الكل" },
  { id: "school", label: "المدرسة" },
  { id: "university", label: "الجامعة" },
  { id: "health", label: "الصحة" },
  { id: "family", label: "العائلة" },
];

function urgencyLabel(level: "high" | "medium" | "low") {
  if (level === "high") return "عاجل";
  if (level === "medium") return "مهم";
  return "عادي";
}

export default function FamilyIntelligencePage() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<Filter>("all");

  const visibleItems = useMemo(() => {
    if (activeFilter === "all") return intelligenceItems;

    return intelligenceItems.filter(
      (item) => item.category === activeFilter,
    );
  }, [activeFilter]);

  return (
    <main
      dir="rtl"
      className="min-h-screen overflow-x-hidden bg-[#02030a] text-white"
    >
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_82%_8%,rgba(151,92,255,0.18),transparent_24%),radial-gradient(circle_at_18%_26%,rgba(51,88,188,0.16),transparent_30%),linear-gradient(180deg,#02030a_0%,#070915_55%,#010105_100%)]" />

      <header className="border-b border-white/10 bg-black/25 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.34em] text-violet-200/45">
              FAMILY INTELLIGENCE ENGINE
            </p>

            <h1 className="mt-2 text-3xl font-black">
              الذكاء العائلي
            </h1>

            <p className="mt-2 text-sm text-white/35">
              ملخص اليوم، الأولويات، الرادار والتقرير الليلي
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => router.push("/v9/home")}
              className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm font-bold text-white/70"
            >
              البيت الرقمي
            </button>

            <button
              type="button"
              onClick={() => router.push("/v9/father")}
              className="rounded-2xl border border-violet-200/20 bg-violet-300/10 px-4 py-3 text-sm font-black text-violet-100"
            >
              مركز قيادة الأب
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <motion.article
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[32px] border border-violet-200/12 bg-white/[0.035] p-6 backdrop-blur-2xl"
          >
            <p className="text-xs font-black text-violet-200/55">
              MORNING BRIEF
            </p>

            <h2 className="mt-2 text-3xl font-black">
              صباح الخير يا خليفة
            </h2>

            <p className="mt-3 max-w-3xl text-sm leading-8 text-white/40">
              عندك اليوم ثلاث أولويات رئيسية. النظام سيجمع لاحقًا المدرسة،
              الجامعة، الصحة، الطقس، المواعيد والتذكيرات تلقائيًا.
            </p>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {priorities.map((priority, index) => (
                <motion.div
                  key={priority.title}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 * index }}
                  className="rounded-2xl border border-white/8 bg-black/20 p-4"
                >
                  <span className="rounded-full bg-violet-300/10 px-2 py-1 text-[9px] font-black text-violet-100">
                    {priority.level}
                  </span>

                  <h3 className="mt-4 text-sm font-black">
                    {priority.title}
                  </h3>

                  <p className="mt-2 text-xs leading-6 text-white/35">
                    {priority.detail}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.article>

          <motion.article
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="rounded-[32px] border border-blue-200/10 bg-blue-300/[0.035] p-6 backdrop-blur-2xl"
          >
            <p className="text-xs font-black text-blue-200/55">
              FAMILY RADAR
            </p>

            <h2 className="mt-2 text-2xl font-black">
              رادار العائلة
            </h2>

            <div className="mt-6 grid place-items-center">
              <div className="relative aspect-square w-full max-w-[280px] rounded-full border border-blue-200/10 bg-[radial-gradient(circle,rgba(103,134,255,0.14)_0%,rgba(103,134,255,0.05)_35%,transparent_70%)]">
                <div className="absolute inset-[18%] rounded-full border border-blue-200/10" />
                <div className="absolute inset-[36%] rounded-full border border-blue-200/10" />
                <div className="absolute left-1/2 top-1/2 h-px w-[46%] origin-left -translate-y-1/2 bg-blue-200/25" />
                <span className="absolute left-[22%] top-[30%] h-3 w-3 rounded-full bg-rose-300 shadow-[0_0_20px_rgba(253,164,175,0.7)]" />
                <span className="absolute right-[24%] top-[22%] h-3 w-3 rounded-full bg-amber-300 shadow-[0_0_20px_rgba(252,211,77,0.7)]" />
                <span className="absolute bottom-[25%] right-[30%] h-3 w-3 rounded-full bg-emerald-300 shadow-[0_0_20px_rgba(110,231,183,0.7)]" />
                <span className="absolute bottom-[18%] left-[30%] h-3 w-3 rounded-full bg-blue-300 shadow-[0_0_20px_rgba(147,197,253,0.7)]" />
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2 text-center text-[10px] text-white/40">
              <span className="rounded-xl bg-black/20 p-2">أحمر: عاجل</span>
              <span className="rounded-xl bg-black/20 p-2">أصفر: متابعة</span>
              <span className="rounded-xl bg-black/20 p-2">أخضر: مكتمل</span>
              <span className="rounded-xl bg-black/20 p-2">أزرق: موعد</span>
            </div>
          </motion.article>
        </section>

        <section className="mt-6 rounded-[32px] border border-white/10 bg-white/[0.035] p-6 backdrop-blur-2xl">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black text-violet-200/55">
                LIVE FAMILY STATUS
              </p>

              <h2 className="mt-2 text-2xl font-black">
                حالة أفراد العائلة
              </h2>
            </div>

            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setActiveFilter(filter.id)}
                  className={`rounded-full px-3 py-2 text-xs font-black transition ${
                    activeFilter === filter.id
                      ? "bg-violet-300/15 text-violet-100"
                      : "bg-white/[0.035] text-white/35"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {visibleItems.map((item, index) => (
              <motion.article
                key={item.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="rounded-2xl border border-white/8 bg-black/20 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-300/10 text-xl text-violet-100">
                    {item.icon}
                  </span>

                  <span className="rounded-full bg-white/[0.05] px-2 py-1 text-[9px] text-white/40">
                    {urgencyLabel(item.urgency)}
                  </span>
                </div>

                <h3 className="mt-4 font-black">{item.person}</h3>
                <p className="mt-2 text-sm font-bold text-white/65">
                  {item.title}
                </p>
                <p className="mt-2 text-xs leading-6 text-white/35">
                  {item.detail}
                </p>
              </motion.article>
            ))}
          </div>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          <article className="rounded-[32px] border border-emerald-200/10 bg-emerald-300/[0.035] p-6 backdrop-blur-2xl">
            <p className="text-xs font-black text-emerald-200/55">
              NIGHT REPORT
            </p>

            <h2 className="mt-2 text-2xl font-black">
              تقرير نهاية اليوم
            </h2>

            <div className="mt-5 space-y-3">
              {nightReport.map((item) => (
                <button
                  key={item}
                  type="button"
                  className="flex w-full items-center justify-between rounded-2xl border border-white/8 bg-black/20 p-4 text-right text-sm"
                >
                  <span>{item}</span>
                  <span className="text-emerald-200">✓</span>
                </button>
              ))}
            </div>
          </article>

          <article className="rounded-[32px] border border-amber-200/10 bg-amber-300/[0.035] p-6 backdrop-blur-2xl">
            <p className="text-xs font-black text-amber-200/55">
              FAMILY AI MEMORY
            </p>

            <h2 className="mt-2 text-2xl font-black">
              ذاكرة العائلة الذكية
            </h2>

            <p className="mt-4 text-sm leading-8 text-white/40">
              لاحقًا سيحفظ هذا القسم الاهتمامات، العادات، المواعيد المتكررة،
              الإنجازات والذكريات المسموح بحفظها لكل شخص.
            </p>

            <div className="mt-5 rounded-2xl border border-amber-200/10 bg-black/20 p-4">
              <p className="text-sm font-bold text-amber-100">
                مثال
              </p>

              <p className="mt-2 text-xs leading-6 text-white/35">
                خالد يهتم بهندسة الحاسوب، وأمل تستخدم المساعد يوميًا للأدوية
                والأفكار، وأحمد وريم وعائشة يتابعون Toddle.
              </p>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
