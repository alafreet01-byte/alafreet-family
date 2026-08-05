"use client";

import { useRouter } from "next/navigation";

const milestones = [
  { year: "1979", title: "بداية خليفة", detail: "من هنا بدأت الحكاية التي ستصبح عالمًا عائليًا كاملًا." },
  { year: "1989", title: "ميلاد أمل", detail: "روح البيت وقلب تفاصيله اليومية." },
  { year: "العائلة", title: "كبرت الحكاية", detail: "خالد، أحمد، ريم، عائشة، سعود، فاطمة ومحمد؛ لكل واحد عالمه الخاص." },
  { year: "اليوم", title: "ALAFREET Family OS", detail: "ذاكرة رقمية تحفظ الأيام الجميلة وتساعد العائلة في يومها ومستقبلها." },
];

export default function OurStoryPage() {
  const router = useRouter();

  return (
    <main dir="rtl" className="min-h-screen overflow-hidden bg-[#030208] px-4 py-8 text-white sm:px-8">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_75%_12%,rgba(244,114,182,0.18),transparent_26%),radial-gradient(circle_at_18%_60%,rgba(251,191,36,0.13),transparent_28%),linear-gradient(180deg,#07030a,#020208)]" />
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-black tracking-[0.35em] text-pink-200/55">OUR STORY</p>
            <h1 className="mt-3 text-4xl font-black text-pink-50 sm:text-5xl">قصتنا</h1>
            <p className="mt-3 max-w-2xl leading-8 text-white/45">مساحة خاصة تحفظ قصة عائلة خليفة، من البدايات الصغيرة إلى الذكريات التي نصنعها كل يوم.</p>
          </div>
          <button onClick={() => router.push("/v9/home")} className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-black hover:bg-white/10">البيت الرقمي</button>
        </header>

        <section className="mt-10 grid gap-4 sm:grid-cols-2">
          {milestones.map((item) => (
            <article key={`${item.year}-${item.title}`} className="rounded-[28px] border border-pink-100/10 bg-white/[0.035] p-6 backdrop-blur-xl">
              <span className="inline-flex rounded-full bg-pink-300/10 px-3 py-1 text-xs font-black text-pink-100">{item.year}</span>
              <h2 className="mt-4 text-2xl font-black">{item.title}</h2>
              <p className="mt-3 leading-7 text-white/45">{item.detail}</p>
            </article>
          ))}
        </section>

        <section className="mt-6 rounded-[32px] border border-amber-100/10 bg-gradient-to-l from-pink-300/[0.07] to-amber-300/[0.05] p-7 text-center">
          <p className="text-sm font-bold text-pink-100/55">رسالة العائلة</p>
          <blockquote className="mx-auto mt-4 max-w-3xl text-2xl font-black leading-10 text-amber-50">مهما تغيّرت الأيام، يبقى البيت هو المكان الذي تبدأ منه أجمل القصص.</blockquote>
        </section>
      </div>
    </main>
  );
}
