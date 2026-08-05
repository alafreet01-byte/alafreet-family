"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Surah = { number: number; name: string; englishName: string; numberOfAyahs: number; revelationType: string; ayahs?: { numberInSurah: number; text: string }[] };
type Timings = Record<string, string>;

const morning = ["أصبحنا وأصبح الملك لله، والحمد لله", "رضيت بالله ربًا، وبالإسلام دينًا، وبمحمد ﷺ نبيًا", "سبحان الله وبحمده"];
const evening = ["أمسينا وأمسى الملك لله، والحمد لله", "أعوذ بكلمات الله التامات من شر ما خلق", "حسبي الله لا إله إلا هو عليه توكلت وهو رب العرش العظيم"];
const sleep = ["باسمك اللهم أموت وأحيا", "سبحان الله 33، والحمد لله 33، والله أكبر 34", "اللهم قني عذابك يوم تبعث عبادك"];

export default function NoorPage() {
  const router = useRouter();
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [selected, setSelected] = useState<Surah | null>(null);
  const [timings, setTimings] = useState<Timings>({});
  const [temperature, setTemperature] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [counts, setCounts] = useState<Record<string, number>>({});

  const load = useCallback(async (surah?: number) => {
    setLoading(true); setMessage("");
    const response = await fetch(`/api/noor${surah ? `?surah=${surah}` : ""}`, { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) { setMessage(data.error ?? "تعذر تحميل الصفحة."); setLoading(false); return; }
    if (surah) setSelected(data.quran); else setSurahs(data.quran ?? []);
    setTimings(data.prayer?.timings ?? {});
    setTemperature(data.weather?.current?.temperature_2m ?? null);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const now = new Date();
  const isFriday = now.getDay() === 5;
  const hour = now.getHours();
  const currentAdhkar = hour < 12 ? morning : hour < 19 ? evening : sleep;
  const adhkarTitle = hour < 12 ? "أذكار الصباح" : hour < 19 ? "أذكار المساء" : "أذكار النوم";
  const showKahf = useMemo(() => isFriday && hour < 14, [isFriday, hour]);

  return <main dir="rtl" className="min-h-screen bg-[#02050a] px-4 py-7 text-white sm:px-6">
    <div className="mx-auto max-w-7xl">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-emerald-200/10 pb-6">
        <div><p className="text-xs font-black tracking-[.3em] text-emerald-200/50">ALAFREET NOOR</p><h1 className="mt-2 text-4xl font-black">نور العائلة ☾</h1><p className="mt-2 text-sm text-white/45">القرآن الكريم والأذكار ومواقيت الصلاة</p></div>
        <div className="flex gap-3"><div className="rounded-2xl bg-white/5 px-4 py-3 text-sm"><span className="text-white/40">جبل حفيت</span> <strong className="mr-2 text-amber-200">{temperature === null ? "—" : `${Math.round(temperature)}°`}</strong></div><button onClick={() => router.push("/v9/home")} className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-bold">البيت الرقمي</button></div>
      </header>

      {message && <p className="mt-5 rounded-2xl bg-rose-300/10 p-4 text-rose-100">{message}</p>}
      {showKahf && <button onClick={() => void load(18)} className="mt-6 w-full rounded-[28px] border border-amber-200/20 bg-gradient-to-l from-amber-300/15 to-emerald-300/10 p-6 text-right"><p className="text-xs font-bold text-amber-200">تذكير الجمعة</p><h2 className="mt-2 text-2xl font-black">حان وقت قراءة سورة الكهف</h2><p className="mt-2 text-sm text-white/50">من فجر الجمعة حتى صلاة الجمعة • اضغط للقراءة</p></button>}

      <section className="mt-6 grid gap-5 lg:grid-cols-[1.25fr_.75fr]">
        <article className="rounded-[30px] border border-white/10 bg-white/[.035] p-5">
          <div className="flex items-center justify-between"><div><p className="text-xs text-emerald-200/55">القرآن الكريم</p><h2 className="mt-1 text-2xl font-black">{selected ? selected.name : "السور"}</h2></div>{selected && <button onClick={() => setSelected(null)} className="rounded-xl bg-white/5 px-4 py-2 text-sm">كل السور</button>}</div>
          {loading ? <p className="py-16 text-center text-white/35">جاري التحميل…</p> : selected ? <div className="mt-5 max-h-[680px] space-y-4 overflow-y-auto pl-2">{selected.ayahs?.map((ayah) => <p key={ayah.numberInSurah} className="rounded-2xl border border-white/8 bg-black/20 p-5 text-xl leading-[2.25]">{ayah.text} <span className="text-sm text-amber-200">﴿{ayah.numberInSurah}﴾</span></p>)}</div> : <div className="mt-5 grid max-h-[680px] gap-3 overflow-y-auto sm:grid-cols-2">{surahs.map((surah) => <button key={surah.number} onClick={() => void load(surah.number)} className="rounded-2xl border border-white/8 bg-black/20 p-4 text-right hover:border-emerald-200/25"><span className="ml-3 text-emerald-200">{surah.number}</span><strong>{surah.name}</strong><small className="mr-3 text-white/35">{surah.numberOfAyahs} آية</small></button>)}</div>}
        </article>

        <div className="space-y-5">
          <article className="rounded-[30px] border border-emerald-200/10 bg-emerald-300/[.04] p-5"><p className="text-xs text-emerald-200/55">حسب الوقت الآن</p><h2 className="mt-2 text-2xl font-black">{adhkarTitle}</h2><div className="mt-4 space-y-3">{currentAdhkar.map((text) => <button key={text} onClick={() => setCounts((c) => ({ ...c, [text]: (c[text] ?? 0) + 1 }))} className="w-full rounded-2xl border border-white/8 bg-black/20 p-4 text-right"><p className="leading-7">{text}</p><span className="mt-2 block text-xs text-emerald-200">العداد: {counts[text] ?? 0}</span></button>)}</div></article>
          <article className="rounded-[30px] border border-white/10 bg-white/[.035] p-5"><p className="text-xs text-sky-200/55">مدينة العين</p><h2 className="mt-2 text-2xl font-black">مواقيت الصلاة</h2><div className="mt-4 grid grid-cols-2 gap-3">{[["الفجر","Fajr"],["الشروق","Sunrise"],["الظهر","Dhuhr"],["العصر","Asr"],["المغرب","Maghrib"],["العشاء","Isha"]].map(([label,key]) => <div key={key} className="rounded-2xl bg-black/20 p-4"><span className="text-sm text-white/45">{label}</span><strong className="float-left text-amber-200">{timings[key] ?? "—"}</strong></div>)}</div><p className="mt-4 text-[11px] leading-5 text-white/30">يرجى مطابقة المواقيت مع تقويم الهيئة الرسمي، فقد تختلف دقائق حسب المسجد.</p></article>
          <article className="rounded-[30px] border border-violet-200/10 bg-violet-300/[.035] p-5"><p className="text-xs text-violet-200/55">المواسم الإسلامية</p><h2 className="mt-2 text-xl font-black">رمضان • العشر • العيدان</h2><p className="mt-3 text-sm leading-7 text-white/40">ستظهر الأذكار والتكبيرات والتنبيهات المناسبة تلقائيًا في وقتها.</p></article>
        </div>
      </section>
    </div>
  </main>;
}
