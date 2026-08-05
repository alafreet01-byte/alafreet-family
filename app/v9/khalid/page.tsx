"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { courses, engineeringTools, tasks } from "./data";

type CourseFilter = "all" | "programming" | "digital-logic" | "calculus" | "physics";

function statusLabel(status: "new" | "progress" | "done" | "late") {
  if (status === "new") return "جديد";
  if (status === "progress") return "قيد التنفيذ";
  if (status === "done") return "مكتمل";
  return "متأخر";
}

export default function KhalidEngineeringLabPage() {
  const router = useRouter();
  const [activeCourse, setActiveCourse] = useState<CourseFilter>("all");
  const [aiPrompt, setAiPrompt] = useState("");

  const visibleTasks = useMemo(() => {
    if (activeCourse === "all") return tasks;
    return tasks.filter((task) => task.courseId === activeCourse);
  }, [activeCourse]);

  const averageProgress = useMemo(() => {
    const total = courses.reduce((sum, course) => sum + course.progress, 0);
    return Math.round(total / courses.length);
  }, []);

  return (
    <main
      dir="rtl"
      className="min-h-screen overflow-x-hidden bg-[#02050a] text-white"
    >
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_84%_8%,rgba(81,158,255,0.2),transparent_24%),radial-gradient(circle_at_16%_26%,rgba(239,181,62,0.13),transparent_30%),linear-gradient(180deg,#02050a_0%,#07111d_55%,#010204_100%)]" />

      <header className="border-b border-white/10 bg-black/25 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.34em] text-blue-200/45">
              UAEU COMPUTER ENGINEERING
            </p>

            <h1 className="mt-2 text-3xl font-black">
              Engineering Lab
            </h1>

            <p className="mt-2 text-sm text-white/35">
              مركز خالد الجامعي لهندسة الحاسوب
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
              onClick={() => router.push("/v9/family/khalid")}
              className="rounded-2xl border border-blue-200/20 bg-blue-300/10 px-4 py-3 text-sm font-black text-blue-100"
            >
              ملف خالد
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["التقدم العام", `${averageProgress}%`, "هذا الفصل"],
            ["المواد", String(courses.length), "مواد مسجلة"],
            ["المهام المفتوحة", String(tasks.filter((task) => task.status !== "done").length), "واجبة المتابعة"],
            ["أقرب تسليم", "غدًا", "Programming Assignment"],
          ].map(([label, value, detail], index) => (
            <motion.article
              key={label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="rounded-[26px] border border-white/10 bg-white/[0.035] p-5 backdrop-blur-xl"
            >
              <p className="text-xs text-white/35">{label}</p>
              <div className="mt-3 text-3xl font-black text-blue-200">
                {value}
              </div>
              <p className="mt-2 text-xs text-white/30">{detail}</p>
            </motion.article>
          ))}
        </section>

        <section className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-[32px] border border-blue-200/12 bg-white/[0.035] p-6 backdrop-blur-2xl">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black text-blue-200/55">
                  COURSE CONTROL
                </p>

                <h2 className="mt-2 text-2xl font-black">
                  المواد الجامعية
                </h2>
              </div>

              <button
                type="button"
                className="rounded-2xl border border-blue-200/15 bg-blue-300/10 px-4 py-3 text-sm font-black text-blue-100"
              >
                + إضافة مادة
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {courses.map((course) => (
                <button
                  key={course.id}
                  type="button"
                  onClick={() => setActiveCourse(course.id as CourseFilter)}
                  className="rounded-2xl border border-white/8 bg-black/20 p-4 text-right transition hover:border-blue-200/20"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className="rounded-full px-2 py-1 text-[9px] font-black"
                      style={{
                        color: course.color,
                        background: `${course.color}12`,
                      }}
                    >
                      {course.code}
                    </span>

                    <span className="text-xs text-white/30">
                      {course.progress}%
                    </span>
                  </div>

                  <h3 className="mt-4 font-black">{course.title}</h3>

                  <p className="mt-2 text-xs text-white/35">
                    التالي: {course.next}
                  </p>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/30">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${course.progress}%`,
                        background: course.color,
                      }}
                    />
                  </div>
                </button>
              ))}
            </div>
          </article>

          <article className="rounded-[32px] border border-violet-200/10 bg-violet-300/[0.035] p-6 backdrop-blur-2xl">
            <p className="text-xs font-black text-violet-200/55">
              AI TUTOR
            </p>

            <h2 className="mt-2 text-2xl font-black">
              مساعد خالد الجامعي
            </h2>

            <p className="mt-3 text-sm leading-8 text-white/40">
              اشرح له المسألة، ساعده في المراجعة أو رتّب له خطة الدراسة.
            </p>

            <textarea
              value={aiPrompt}
              onChange={(event) => setAiPrompt(event.target.value)}
              rows={7}
              placeholder="مثال: اشرح لي Binary Addition خطوة بخطوة..."
              className="mt-5 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 leading-8 outline-none"
            />

            <div className="mt-4 flex flex-wrap gap-2">
              {[
                "اشرح هذا السؤال",
                "اختبرني",
                "لخص المحاضرة",
                "رتب خطة مذاكرة",
              ].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setAiPrompt(item)}
                  className="rounded-full border border-white/8 bg-white/[0.035] px-3 py-2 text-xs text-white/45"
                >
                  {item}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="mt-4 w-full rounded-2xl border border-violet-200/20 bg-violet-300/10 px-5 py-4 font-black text-violet-100"
            >
              إرسال إلى AI Tutor
            </button>
          </article>
        </section>

        <section className="mt-6 rounded-[32px] border border-white/10 bg-white/[0.035] p-6 backdrop-blur-2xl">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black text-amber-200/55">
                ASSIGNMENTS & PROJECTS
              </p>

              <h2 className="mt-2 text-2xl font-black">
                الواجبات والمشاريع
              </h2>
            </div>

            <div className="flex flex-wrap gap-2">
              {[["all", "الكل"], ...courses.map((course) => [course.id, course.code])].map(
                ([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveCourse(id as CourseFilter)}
                    className={`rounded-full px-3 py-2 text-xs font-black transition ${
                      activeCourse === id
                        ? "bg-blue-300/15 text-blue-100"
                        : "bg-white/[0.035] text-white/35"
                    }`}
                  >
                    {label}
                  </button>
                ),
              )}
            </div>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {visibleTasks.map((task) => {
              const course = courses.find((item) => item.id === task.courseId);

              return (
                <motion.article
                  key={task.id}
                  layout
                  className="rounded-2xl border border-white/8 bg-black/20 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <strong>{task.title}</strong>

                        <span className="rounded-full bg-white/[0.05] px-2 py-1 text-[9px] text-white/40">
                          {task.type}
                        </span>
                      </div>

                      <p className="mt-2 text-xs text-white/35">
                        {course?.code} • {course?.title}
                      </p>
                    </div>

                    <span className="rounded-full bg-blue-300/10 px-2 py-1 text-[9px] font-black text-blue-100">
                      {statusLabel(task.status)}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[10px] text-white/30">
                    <span>{task.due}</span>
                    <button
                      type="button"
                      className="rounded-xl border border-white/8 bg-white/[0.035] px-3 py-2 text-white/50"
                    >
                      فتح المهمة
                    </button>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </section>

        <section className="mt-6">
          <p className="text-xs font-black text-blue-200/55">
            ENGINEERING TOOLS
          </p>

          <h2 className="mt-2 text-2xl font-black">
            أدوات خالد
          </h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {engineeringTools.map((tool, index) => (
              <motion.button
                key={tool.title}
                type="button"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                whileHover={{ y: -5 }}
                className="rounded-[26px] border border-white/10 bg-white/[0.035] p-5 text-right"
              >
                <span
                  className="flex h-14 w-14 items-center justify-center rounded-2xl text-xl"
                  style={{
                    color: tool.accent,
                    background: `${tool.accent}14`,
                    border: `1px solid ${tool.accent}30`,
                  }}
                >
                  {tool.icon}
                </span>

                <h3 className="mt-5 text-lg font-black">{tool.title}</h3>

                <p className="mt-2 text-sm leading-7 text-white/35">
                  {tool.subtitle}
                </p>
              </motion.button>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
