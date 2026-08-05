"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { homeKids, lifeSections, todayItems } from "./data";

export default function AmalLifeCenterPage() {
  const router = useRouter();
  const [assistantText, setAssistantText] = useState("");

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "صباح الخير يا أمل";
    if (hour < 18) return "مساء الخير يا أمل";
    return "مساء النور يا أمل";
  }, []);

  return (
    <main
      dir="rtl"
      className="min-h-screen overflow-x-hidden bg-[#07050a] text-white"
    >
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_82%_8%,rgba(244,169,216,0.2),transparent_24%),radial-gradient(circle_at_14%_28%,rgba(109,86,190,0.16),transparent_30%),linear-gradient(180deg,#07050a_0%,#100a14_55%,#030204_100%)]" />

      <header className="border-b border-white/10 bg-black/20 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.34em] text-pink-200/45">
              AMAL LIFE CENTER
            </p>

            <h1 className="mt-2 text-3xl font-black">
              {greeting}
            </h1>

            <p className="mt-2 text-sm text-white/35">
              صحتك، المدرسة، الأطفال، الأفكار والمساعد الذكي
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
              onClick={() => router.push("/v9/our-story")}
              className="rounded-2xl border border-pink-200/20 bg-pink-300/10 px-4 py-3 text-sm font-black text-pink-100"
            >
              Our Story ♥
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <motion.article
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[32px] border border-pink-200/12 bg-white/[0.035] p-6 backdrop-blur-2xl"
          >
            <p className="text-xs font-black text-pink-200/55">
              AI COMPANION
            </p>

            <h2 className="mt-2 text-3xl font-black">
              ما الذي تريدين ترتيبه اليوم؟
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-8 text-white/40">
              الأدوية، المدرسة، وصفة، فكرة، سؤال عن الأطفال أو حتى شيء يشغل بالك.
            </p>

            <div className="mt-6 rounded-[24px] border border-white/10 bg-black/20 p-4">
              <textarea
                value={assistantText}
                onChange={(event) => setAssistantText(event.target.value)}
                rows={6}
                placeholder="اكتبي أي شيء هنا..."
                className="w-full resize-none border-0 bg-transparent text-base leading-8 outline-none placeholder:text-white/20"
              />

              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  "دوائي اليوم",
                  "رتب لي يومي",
                  "أفكار للأطفال",
                  "اقترح وجبة",
                  "راجع Toddle",
                  "أضيف لقائمة التسوق",
                ].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setAssistantText(item)}
                    className="rounded-full border border-white/8 bg-white/[0.035] px-3 py-2 text-xs text-white/45"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              className="mt-4 w-full rounded-2xl border border-pink-200/20 bg-gradient-to-l from-[#8a3f68] via-[#e6a8cf] to-[#6f2f53] px-5 py-4 font-black text-[#220b18]"
            >
              إرسال إلى مساعد أمل
            </button>
          </motion.article>

          <motion.article
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="rounded-[32px] border border-white/10 bg-white/[0.035] p-6 backdrop-blur-2xl"
          >
            <p className="text-xs font-black text-rose-200/55">
              TODAY
            </p>

            <h2 className="mt-2 text-2xl font-black">
              أهم ما لديك اليوم
            </h2>

            <div className="mt-5 space-y-3">
              {todayItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-white/8 bg-black/20 p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-pink-300/10 text-xl text-pink-100">
                      {item.icon}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <strong>{item.title}</strong>

                        {item.status && (
                          <span className="rounded-full bg-white/[0.05] px-2 py-1 text-[9px] text-white/35">
                            {item.status}
                          </span>
                        )}
                      </div>

                      <p className="mt-2 text-xs leading-6 text-white/35">
                        {item.detail}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.article>
        </section>

        <section className="mt-6">
          <div>
            <p className="text-xs font-black text-pink-200/55">
              AMAL DIGITAL HOME
            </p>

            <h2 className="mt-2 text-2xl font-black">
              عالم أمل
            </h2>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {lifeSections.map((section, index) => (
              <motion.button
                key={section.id}
                type="button"
                onClick={() => {
                  if ("route" in section && section.route) {
                    router.push(section.route);
                  }
                }}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                whileHover={{ y: -5 }}
                className="rounded-[26px] border border-white/10 bg-white/[0.035] p-5 text-right backdrop-blur-xl"
              >
                <span
                  className="flex h-13 w-13 items-center justify-center rounded-2xl text-2xl"
                  style={{
                    color: section.accent,
                    background: `${section.accent}15`,
                    border: `1px solid ${section.accent}30`,
                  }}
                >
                  {section.icon}
                </span>

                <h3 className="mt-5 text-lg font-black">
                  {section.title}
                </h3>

                <p className="mt-2 text-sm leading-7 text-white/35">
                  {section.subtitle}
                </p>
              </motion.button>
            ))}
          </div>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr]">
          <article className="rounded-[32px] border border-amber-200/10 bg-amber-300/[0.035] p-6 backdrop-blur-2xl">
            <p className="text-xs font-black text-amber-200/55">
              AMAL HOME SCHOOL
            </p>

            <h2 className="mt-2 text-2xl font-black">
              مدرسة أمل
            </h2>

            <p className="mt-3 text-sm leading-8 text-white/40">
              سعود وفاطمة ومحمد في قسم منزلي بسيط يناسب أعمارهم.
            </p>

            <div className="mt-5 space-y-3">
              {homeKids.map((child) => (
                <div
                  key={child.name}
                  className="rounded-2xl border border-white/8 bg-black/20 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <strong>{child.name}</strong>
                    <span className="rounded-full bg-amber-300/10 px-2 py-1 text-[9px] text-amber-100">
                      {child.ageGroup}
                    </span>
                  </div>

                  <p className="mt-2 text-xs leading-6 text-white/35">
                    {child.activity}
                  </p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[32px] border border-rose-200/10 bg-rose-300/[0.035] p-6 backdrop-blur-2xl">
            <p className="text-xs font-black text-rose-200/55">
              DAILY JOURNAL
            </p>

            <h2 className="mt-2 text-2xl font-black">
              كيف كان يومك؟
            </h2>

            <p className="mt-3 text-sm leading-8 text-white/40">
              اكتبي سطرًا واحدًا فقط، وسيحفظ ضمن قصة العائلة اليومية.
            </p>

            <textarea
              rows={7}
              placeholder="أجمل شيء حدث اليوم..."
              className="mt-5 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 outline-none"
            />

            <button
              type="button"
              className="mt-4 w-full rounded-2xl border border-rose-200/15 bg-rose-300/10 px-4 py-3 text-sm font-black text-rose-100"
            >
              حفظ في يومياتي
            </button>
          </article>
        </section>
      </div>
    </main>
  );
}
