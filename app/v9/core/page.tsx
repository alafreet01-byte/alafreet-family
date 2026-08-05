"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  addReminder,
  getRolePermissions,
  resetCoreDemo,
  toggleReminder,
  useFamilyCore,
} from "@/lib/supabase/alafreet-core";

export default function CoreEngineConsolePage() {
  const router = useRouter();
  const core = useFamilyCore();

  const [title, setTitle] = useState("");
  const [ownerId, setOwnerId] = useState("khalifa");
  const [createdBy, setCreatedBy] = useState("amal");

  const openReminders = useMemo(
    () =>
      core.reminders.filter(
        (reminder) => reminder.status === "open",
      ),
    [core.reminders],
  );

  function createReminder() {
    if (!title.trim()) return;

    addReminder({
      title: title.trim(),
      detail: "أُضيف من Core Engine Console",
      dueAt: new Date(
        Date.now() + 24 * 60 * 60 * 1000,
      ).toISOString(),
      ownerId,
      createdBy,
      scope: "shared",
    });

    setTitle("");
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen overflow-x-hidden bg-[#02030a] text-white"
    >
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_82%_8%,rgba(63,214,167,0.17),transparent_24%),radial-gradient(circle_at_14%_30%,rgba(80,97,210,0.16),transparent_30%),linear-gradient(180deg,#02030a_0%,#07100f_55%,#010105_100%)]" />

      <header className="border-b border-white/10 bg-black/25 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.34em] text-emerald-200/45">
              ALAFREET CORE ENGINE
            </p>

            <h1 className="mt-2 text-3xl font-black">
              قلب النظام
            </h1>

            <p className="mt-2 text-sm text-white/35">
              الصلاحيات، الأحداث، التذكيرات وربط الأقسام
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
              onClick={resetCoreDemo}
              className="rounded-2xl border border-emerald-200/20 bg-emerald-300/10 px-4 py-3 text-sm font-black text-emerald-100"
            >
              إعادة بيانات التجربة
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["المستخدمون", core.users.length],
            ["التذكيرات المفتوحة", openReminders.length],
            ["الأحداث", core.events.length],
            ["الأقسام المرتبطة", 8],
          ].map(([label, value], index) => (
            <motion.article
              key={String(label)}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="rounded-[26px] border border-white/10 bg-white/[0.035] p-5"
            >
              <p className="text-xs text-white/35">{label}</p>
              <div className="mt-3 text-3xl font-black text-emerald-200">
                {value}
              </div>
            </motion.article>
          ))}
        </section>

        <section className="mt-6 grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
          <article className="rounded-[32px] border border-emerald-200/10 bg-white/[0.035] p-6 backdrop-blur-2xl">
            <p className="text-xs font-black text-emerald-200/55">
              LIVE CORE TEST
            </p>

            <h2 className="mt-2 text-2xl font-black">
              إضافة تذكير تجريبي
            </h2>

            <p className="mt-3 text-sm leading-8 text-white/40">
              هذه أول وظيفة مشتركة حقيقية في المحرك: التذكير
              يظهر فورًا في الحالة والأحداث.
            </p>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-2 block text-xs text-white/45">
                  عنوان التذكير
                </span>
                <input
                  value={title}
                  onChange={(event) =>
                    setTitle(event.target.value)
                  }
                  placeholder="مثال: متابعة موعد المدرسة"
                  className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 outline-none focus:border-emerald-200/30"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs text-white/45">
                  المسؤول
                </span>
                <select
                  value={ownerId}
                  onChange={(event) =>
                    setOwnerId(event.target.value)
                  }
                  className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 outline-none"
                >
                  {core.users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs text-white/45">
                  أضافه
                </span>
                <select
                  value={createdBy}
                  onChange={(event) =>
                    setCreatedBy(event.target.value)
                  }
                  className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 outline-none"
                >
                  {core.users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                onClick={createReminder}
                className="w-full rounded-2xl border border-emerald-200/20 bg-emerald-300/10 px-5 py-4 font-black text-emerald-100"
              >
                إضافة التذكير إلى Core
              </button>
            </div>
          </article>

          <article className="rounded-[32px] border border-white/10 bg-white/[0.035] p-6 backdrop-blur-2xl">
            <p className="text-xs font-black text-blue-200/55">
              SHARED REMINDERS
            </p>

            <h2 className="mt-2 text-2xl font-black">
              التذكيرات المشتركة
            </h2>

            <div className="mt-5 space-y-3">
              {core.reminders.map((reminder) => {
                const owner = core.users.find(
                  (user) => user.id === reminder.ownerId,
                );

                const creator = core.users.find(
                  (user) => user.id === reminder.createdBy,
                );

                return (
                  <button
                    key={reminder.id}
                    type="button"
                    onClick={() =>
                      toggleReminder(reminder.id)
                    }
                    className="w-full rounded-2xl border border-white/8 bg-black/20 p-4 text-right"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <strong
                          className={
                            reminder.status === "done"
                              ? "text-white/30 line-through"
                              : ""
                          }
                        >
                          {reminder.title}
                        </strong>

                        <p className="mt-2 text-xs text-white/35">
                          المسؤول: {owner?.name} • أضافه:{" "}
                          {creator?.name}
                        </p>
                      </div>

                      <span className="rounded-full bg-white/[0.05] px-2 py-1 text-[9px] text-white/40">
                        {reminder.status === "done"
                          ? "مكتمل"
                          : "مفتوح"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </article>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          <article className="rounded-[32px] border border-violet-200/10 bg-violet-300/[0.035] p-6">
            <p className="text-xs font-black text-violet-200/55">
              PERMISSIONS
            </p>

            <h2 className="mt-2 text-2xl font-black">
              الصلاحيات
            </h2>

            <div className="mt-5 space-y-3">
              {core.users.map((user) => (
                <div
                  key={user.id}
                  className="rounded-2xl border border-white/8 bg-black/20 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <strong>{user.name}</strong>
                    <span
                      className="rounded-full px-2 py-1 text-[9px]"
                      style={{
                        color: user.color,
                        background: `${user.color}12`,
                      }}
                    >
                      {user.role}
                    </span>
                  </div>

                  <p className="mt-2 text-xs leading-6 text-white/35">
                    {getRolePermissions(user.role).join(" • ") ||
                      "صلاحيات محدودة"}
                  </p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[32px] border border-amber-200/10 bg-amber-300/[0.035] p-6">
            <p className="text-xs font-black text-amber-200/55">
              EVENT STREAM
            </p>

            <h2 className="mt-2 text-2xl font-black">
              سجل الأحداث
            </h2>

            <div className="mt-5 space-y-3">
              {core.events.slice(0, 8).map((event) => (
                <div
                  key={event.id}
                  className="rounded-2xl border border-white/8 bg-black/20 p-4"
                >
                  <strong className="text-sm">
                    {event.title}
                  </strong>

                  <p className="mt-2 text-xs leading-6 text-white/35">
                    {event.detail}
                  </p>

                  <p className="mt-2 text-[10px] text-white/25">
                    {event.type}
                  </p>
                </div>
              ))}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
