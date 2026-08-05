"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { capsules, capsuleTypes } from "./data";

type CapsuleType = "message" | "photo" | "video" | "audio";

export default function TimeCapsulePage() {
  const router = useRouter();
  const [selectedType, setSelectedType] =
    useState<CapsuleType>("message");

  const lockedCount = useMemo(
    () => capsules.filter((capsule) => capsule.status === "locked").length,
    [],
  );

  return (
    <main
      dir="rtl"
      className="min-h-screen overflow-x-hidden bg-[#02030a] text-white"
    >
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_80%_8%,rgba(222,164,55,0.17),transparent_24%),radial-gradient(circle_at_15%_28%,rgba(89,73,188,0.18),transparent_30%),linear-gradient(180deg,#02030a_0%,#070915_55%,#010105_100%)]" />

      <header className="border-b border-white/10 bg-black/25 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.34em] text-amber-200/45">
              FAMILY TIME MACHINE
            </p>

            <h1 className="mt-2 text-3xl font-black">
              كبسولة الزمن
            </h1>

            <p className="mt-2 text-sm text-white/35">
              رسائل وصور وفيديوهات تُفتح في الوقت الذي تختاره
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
              className="rounded-2xl border border-amber-200/20 bg-amber-300/10 px-4 py-3 text-sm font-black text-amber-100"
            >
              + كبسولة جديدة
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <section className="grid gap-4 sm:grid-cols-3">
          {[
            ["الكبسولات المقفلة", String(lockedCount), "تفتح لاحقًا"],
            ["أقرب موعد فتح", "23 أغسطس", "عيد الزواج"],
            ["أبعد رسالة", "2044", "محمد في عمر 18"],
          ].map(([label, value, detail], index) => (
            <motion.article
              key={label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              className="rounded-[26px] border border-white/10 bg-white/[0.035] p-5 backdrop-blur-xl"
            >
              <p className="text-xs text-white/35">{label}</p>
              <div className="mt-3 text-3xl font-black text-amber-200">
                {value}
              </div>
              <p className="mt-2 text-xs text-white/30">{detail}</p>
            </motion.article>
          ))}
        </section>

        <section className="mt-6 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <motion.article
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-[32px] border border-amber-200/12 bg-white/[0.035] p-6 backdrop-blur-2xl"
          >
            <p className="text-xs font-black text-amber-200/55">
              CREATE CAPSULE
            </p>

            <h2 className="mt-2 text-2xl font-black">
              إنشاء كبسولة جديدة
            </h2>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {capsuleTypes.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() =>
                    setSelectedType(type.id as CapsuleType)
                  }
                  className={`rounded-2xl border p-4 text-center transition ${
                    selectedType === type.id
                      ? "border-amber-200/30 bg-amber-300/10 text-amber-100"
                      : "border-white/8 bg-black/20 text-white/45"
                  }`}
                >
                  <span className="block text-2xl">{type.icon}</span>
                  <span className="mt-2 block text-sm font-black">
                    {type.label}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-2 block text-xs text-white/45">
                  عنوان الكبسولة
                </span>
                <input
                  placeholder="مثال: رسالة لخالد عند التخرج"
                  className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 outline-none focus:border-amber-200/30"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs text-white/45">
                  المستلم
                </span>
                <select className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 outline-none">
                  <option>أمل</option>
                  <option>خالد</option>
                  <option>أحمد</option>
                  <option>ريم</option>
                  <option>عائشة</option>
                  <option>سعود</option>
                  <option>فاطمة</option>
                  <option>محمد</option>
                  <option>العائلة كاملة</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs text-white/45">
                  تاريخ الفتح
                </span>
                <div className="flex w-full min-w-0 rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
                  <input
                    type="date"
                    className="block w-full min-w-0 border-0 bg-transparent p-0 outline-none"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs text-white/45">
                  الرسالة
                </span>
                <textarea
                  rows={5}
                  placeholder="اكتب كلماتك للمستقبل..."
                  className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 outline-none focus:border-amber-200/30"
                />
              </label>

              <button
                type="button"
                className="w-full rounded-2xl border border-amber-200/20 bg-gradient-to-l from-[#9c6810] via-[#e0ad45] to-[#87570b] px-5 py-4 font-black text-[#160f03]"
              >
                حفظ وإغلاق الكبسولة
              </button>
            </div>
          </motion.article>

          <motion.article
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-[32px] border border-white/10 bg-white/[0.035] p-6 backdrop-blur-2xl"
          >
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black text-violet-200/55">
                  CAPSULE VAULT
                </p>

                <h2 className="mt-2 text-2xl font-black">
                  الخزنة الزمنية
                </h2>
              </div>

              <span className="text-xs text-white/30">
                المحتوى المقفل لا يظهر قبل الموعد
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {capsules.map((capsule, index) => (
                <motion.article
                  key={capsule.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="rounded-2xl border border-white/8 bg-black/20 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <span
                        className="flex h-12 w-12 items-center justify-center rounded-2xl text-xl"
                        style={{
                          color: capsule.color,
                          background: `${capsule.color}14`,
                          border: `1px solid ${capsule.color}2e`,
                        }}
                      >
                        🔒
                      </span>

                      <div className="min-w-0">
                        <h3 className="font-black">{capsule.title}</h3>

                        <p className="mt-2 text-xs leading-6 text-white/35">
                          إلى: {capsule.recipient} • من: {capsule.sender}
                        </p>
                      </div>
                    </div>

                    <span
                      className="rounded-full px-2 py-1 text-[9px] font-black"
                      style={{
                        color: capsule.color,
                        background: `${capsule.color}12`,
                      }}
                    >
                      {capsule.occasion}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[10px] text-white/30">
                    <span>تاريخ الفتح: {capsule.unlockDate}</span>
                    <span>مقفلة</span>
                  </div>
                </motion.article>
              ))}
            </div>
          </motion.article>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          <article className="rounded-[32px] border border-pink-200/10 bg-pink-300/[0.035] p-6 backdrop-blur-2xl">
            <p className="text-xs font-black text-pink-200/55">
              FUTURE LETTERS
            </p>

            <h2 className="mt-2 text-2xl font-black">
              رسائل المستقبل
            </h2>

            <p className="mt-4 text-sm leading-8 text-white/40">
              اكتب رسالة تفتح في التخرج أو الزواج أو عيد ميلاد معين.
            </p>
          </article>

          <article className="rounded-[32px] border border-blue-200/10 bg-blue-300/[0.035] p-6 backdrop-blur-2xl">
            <p className="text-xs font-black text-blue-200/55">
              FAMILY MOVIE
            </p>

            <h2 className="mt-2 text-2xl font-black">
              فيلم السنة
            </h2>

            <p className="mt-4 text-sm leading-8 text-white/40">
              سيجمع النظام لاحقًا الصور والفيديوهات والإنجازات ويحوّلها إلى
              فيلم عائلي سنوي.
            </p>
          </article>
        </section>
      </div>
    </main>
  );
}
