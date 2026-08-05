"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Member = { id: string; name_ar: string; role: string };
type Capsule = {
  id: string;
  title: string;
  message: string;
  senderName: string;
  recipientName: string;
  capsuleType: string;
  mediaUrl: string;
  mediaName: string;
  occasion: string;
  unlockAt: string;
  unlocked: boolean;
  canDelete: boolean;
};

const types = [
  ["message", "✉️", "رسالة"],
  ["photo", "📷", "صورة ورسالة"],
  ["video", "🎬", "فيديو ورسالة"],
  ["audio", "🎙️", "صوت ورسالة"],
];

export default function TimeCapsulePage() {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    title: "",
    recipientId: "all",
    unlockAt: "",
    message: "",
    occasion: "رسالة للمستقبل",
    capsuleType: "message",
  });

  const load = useCallback(async () => {
    const response = await fetch("/api/family/time-capsules", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) {
      setNotice(data.error ?? "تعذر تحميل كبسولات الزمن.");
      setLoading(false);
      return;
    }
    setMembers(data.members ?? []);
    setCapsules(data.capsules ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    const response = await fetch("/api/family/time-capsules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) return setNotice(data.error ?? "تعذر حفظ الكبسولة.");
    if (file && data.id) {
      const upload = new FormData();
      upload.append("capsuleId", data.id);
      upload.append("file", file);
      const mediaResponse = await fetch("/api/family/time-capsules/media", { method: "POST", body: upload });
      const mediaData = await mediaResponse.json();
      if (!mediaResponse.ok) { setNotice(`حُفظت الرسالة، لكن تعذر رفع الملف: ${mediaData.error ?? "خطأ غير معروف"}`); await load(); return; }
    }
    setForm({ ...form, title: "", message: "", unlockAt: "" });
    setFile(null);
    setNotice("تم حفظ الكبسولة وإغلاقها بنجاح.");
    await load();
  }

  async function remove(id: string) {
    if (!window.confirm("هل تريد حذف هذه الكبسولة؟")) return;
    const response = await fetch("/api/family/time-capsules", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await response.json();
    if (!response.ok) return setNotice(data.error ?? "تعذر الحذف.");
    setNotice("تم حذف الكبسولة.");
    await load();
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#02030a] px-4 py-7 text-white sm:px-6">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <p className="text-xs font-black tracking-[.3em] text-amber-200/55">FAMILY TIME MACHINE</p>
            <h1 className="mt-2 text-4xl font-black">كبسولة الزمن ⏳</h1>
            <p className="mt-2 text-sm text-white/40">رسائل عائلية حقيقية لا تُفتح قبل الموعد الذي تختاره.</p>
          </div>
          <button onClick={() => router.push("/v9/home")} className="rounded-2xl border border-white/10 px-5 py-3">البيت الرقمي</button>
        </header>

        {notice && <p className="mt-5 rounded-2xl border border-amber-200/10 bg-amber-300/10 p-4 text-amber-100">{notice}</p>}

        <section className="mt-6 grid gap-5 lg:grid-cols-[.85fr_1.15fr]">
          <form onSubmit={save} className="h-fit rounded-[30px] border border-amber-200/15 bg-white/[.035] p-6">
            <h2 className="text-2xl font-black">إنشاء كبسولة جديدة</h2>
            <div className="mt-5 grid grid-cols-2 gap-2">
              {types.map(([id, icon, label]) => (
                <button key={id} type="button" onClick={() => setForm({ ...form, capsuleType: id })} className={`rounded-2xl border p-3 ${form.capsuleType === id ? "border-amber-300/40 bg-amber-300/10 text-amber-100" : "border-white/8 bg-black/20 text-white/45"}`}>
                  <span className="text-xl">{icon}</span><span className="mr-2 text-xs font-bold">{label}</span>
                </button>
              ))}
            </div>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="عنوان الكبسولة" className="mt-4 w-full rounded-2xl bg-[#10131c] p-4" />
            <select value={form.recipientId} onChange={(e) => setForm({ ...form, recipientId: e.target.value })} className="mt-3 w-full rounded-2xl bg-[#10131c] p-4">
              <option value="all">العائلة كاملة</option>
              {members.map((member) => <option key={member.id} value={member.id}>{member.name_ar}</option>)}
            </select>
            <input value={form.occasion} onChange={(e) => setForm({ ...form, occasion: e.target.value })} placeholder="المناسبة" className="mt-3 w-full rounded-2xl bg-[#10131c] p-4" />
            <label className="mt-4 block text-xs text-white/45">تاريخ ووقت الفتح</label>
            <input required type="datetime-local" value={form.unlockAt} onChange={(e) => setForm({ ...form, unlockAt: e.target.value })} className="mt-2 w-full rounded-2xl bg-[#10131c] p-4" />
            <textarea required rows={6} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="اكتب رسالتك للمستقبل..." className="mt-3 w-full rounded-2xl bg-[#10131c] p-4" />
            {form.capsuleType !== "message" && <label className="mt-3 block rounded-2xl border border-dashed border-amber-200/20 bg-black/20 p-4 text-sm text-white/55">اختر ملف {form.capsuleType === "photo" ? "صورة" : form.capsuleType === "video" ? "فيديو" : "صوت"}<input type="file" required accept={form.capsuleType === "photo" ? "image/*" : form.capsuleType === "video" ? "video/mp4,video/webm" : "audio/*"} onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="mt-3 block w-full text-xs" /></label>}
            <button disabled={busy} className="mt-4 w-full rounded-2xl bg-gradient-to-l from-amber-600 via-amber-300 to-amber-600 p-4 font-black text-black disabled:opacity-50">{busy ? "جاري الحفظ..." : "حفظ وإغلاق الكبسولة"}</button>
          </form>

          <div className="rounded-[30px] border border-white/10 bg-white/[.035] p-6">
            <div className="flex items-center justify-between"><h2 className="text-2xl font-black">الخزنة الزمنية</h2><span className="rounded-full bg-white/5 px-3 py-2 text-xs">{capsules.length} كبسولة</span></div>
            <div className="mt-5 space-y-3">
              {loading ? <p className="text-white/35">جاري التحميل...</p> : capsules.length === 0 ? <div className="rounded-2xl border border-white/8 bg-black/20 p-8 text-center text-white/35">لا توجد كبسولات محفوظة بعد.</div> : capsules.map((capsule) => (
                <article key={capsule.id} className={`rounded-[24px] border p-5 ${capsule.unlocked ? "border-emerald-200/15 bg-emerald-300/[.04]" : "border-violet-200/12 bg-violet-300/[.035]"}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div><p className="text-xs text-white/35">{capsule.senderName} ← {capsule.recipientName}</p><h3 className="mt-2 text-xl font-black">{capsule.unlocked ? "🔓" : "🔒"} {capsule.title}</h3></div>
                    <span className="rounded-full bg-white/5 px-3 py-1 text-[10px]">{capsule.occasion}</span>
                  </div>
                  <p className="mt-3 text-xs text-amber-100/65">موعد الفتح: {new Intl.DateTimeFormat("ar-AE", { dateStyle: "long", timeStyle: "short" }).format(new Date(capsule.unlockAt))}</p>
                  {capsule.unlocked ? <p className="mt-4 rounded-2xl bg-black/20 p-4 leading-8 text-white/75">{capsule.message}</p> : <p className="mt-4 text-sm text-white/35">الرسالة محفوظة بأمان ولن تظهر للمستلم قبل الموعد.</p>}
                  {capsule.unlocked && capsule.mediaUrl && capsule.capsuleType === "photo" && <img src={capsule.mediaUrl} alt={capsule.mediaName || capsule.title} className="mt-4 max-h-80 w-full rounded-2xl object-contain" />}
                  {capsule.unlocked && capsule.mediaUrl && capsule.capsuleType === "video" && <video src={capsule.mediaUrl} controls className="mt-4 max-h-96 w-full rounded-2xl" />}
                  {capsule.unlocked && capsule.mediaUrl && capsule.capsuleType === "audio" && <audio src={capsule.mediaUrl} controls className="mt-4 w-full" />}
                  {capsule.canDelete && <button onClick={() => void remove(capsule.id)} className="mt-4 text-xs text-rose-200">حذف الكبسولة</button>}
                </article>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
