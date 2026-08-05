"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Child = { id: string; name_ar: string; role: string };
type Task = { id: string; text: string; category: string; childId: string; childName: string; target: number; completed: number; status: string; proofPaths: string[] };

const presets = [
  { category: "ذكر", text: "أستغفر الله وأتوب إليه" },
  { category: "قرآن", text: "سورة الإخلاص" },
  { category: "قرآن", text: "سورة الفلق" },
  { category: "قرآن", text: "سورة الناس" },
];

export default function BalancePage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>( {} );
  const [uploadingId, setUploadingId] = useState("");
  const [form, setForm] = useState({ childId: "", category: "ذكر", text: "أستغفر الله وأتوب إليه", target: 50 });

  const load = useCallback(async () => {
    const response = await fetch("/api/family/balance", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) { setMessage(data.error ?? "تعذر تحميل المهام."); setLoading(false); return; }
    setTasks(data.tasks ?? []);
    setChildren(data.children ?? []);
    setCanManage(Boolean(data.canManage));
    setForm((current) => ({ ...current, childId: current.childId || data.children?.[0]?.id || "" }));
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function createTask(event: React.FormEvent) {
    event.preventDefault(); setMessage("");
    const response = await fetch("/api/family/balance", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await response.json();
    if (!response.ok) { setMessage(data.error ?? "تعذر إنشاء المهمة."); return; }
    setTasks((current) => [data.task, ...current]);
    setMessage("تم إرسال مهمة الكتابة للطفل.");
  }

  async function saveProgress(task: Task) {
    const lines = (drafts[task.id] ?? "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const exact = lines.filter((line) => line === task.text).length;
    if (exact === 0) { setMessage(`اكتب «${task.text}» في كل سطر حتى يُحسب.`); return; }
    const completed = Math.min(task.completed + exact, task.target);
    const response = await fetch("/api/family/balance", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: task.id, completed }) });
    const data = await response.json();
    if (!response.ok) { setMessage(data.error ?? "تعذر حفظ الإنجاز."); return; }
    setTasks((current) => current.map((item) => item.id === task.id ? { ...item, completed: data.completed, status: data.status } : item));
    setDrafts((current) => ({ ...current, [task.id]: "" }));
    setMessage(data.status === "completed" ? "أحسنت، اكتملت المهمة وتم إصلاح الموقف." : `تم حفظ ${exact} كتابة صحيحة.`);
  }

  async function deleteTask(id: string) {
    const response = await fetch("/api/family/balance", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    const data = await response.json();
    if (!response.ok) { setMessage(data.error ?? "تعذر حذف المهمة."); return; }
    setTasks((current) => current.filter((item) => item.id !== id));
    setMessage("تم حذف المهمة.");
  }

  async function uploadProof(task: Task, file?: File) {
    if (!file) return;
    setMessage("");
    setUploadingId(task.id);
    const body = new FormData();
    body.append("taskId", task.id);
    body.append("image", file);
    const response = await fetch("/api/family/balance/image", { method: "POST", body });
    const data = await response.json();
    setUploadingId("");
    if (!response.ok) { setMessage(data.error ?? "تعذر رفع الصورة."); return; }
    setTasks((current) => current.map((item) => item.id === task.id ? { ...item, proofPaths: [...(item.proofPaths ?? []), data.path] } : item));
    setMessage("تم حفظ صورة الإنجاز بنجاح.");
  }

  async function deleteProof(taskId: string, path: string) {
    const response = await fetch("/api/family/balance/image", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ taskId, path }) });
    const data = await response.json();
    if (!response.ok) { setMessage(data.error ?? "تعذر حذف الصورة."); return; }
    setTasks((current) => current.map((item) => item.id === taskId ? { ...item, proofPaths: (item.proofPaths ?? []).filter((itemPath) => itemPath !== path) } : item));
    setMessage("تم حذف الصورة.");
  }

  const activeCount = useMemo(() => tasks.filter((task) => task.status !== "completed").length, [tasks]);

  if (loading) return <main dir="rtl" className="flex min-h-screen items-center justify-center bg-[#03040a] text-white">جاري تجهيز ميزان العائلة…</main>;

  return (
    <main dir="rtl" className="min-h-screen bg-[#03040a] px-6 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-7">
          <div><p className="text-xs font-black tracking-[0.3em] text-amber-300/60">ALAFREET FAMILY BALANCE</p><h1 className="mt-2 text-4xl font-black">ميزان العائلة ⚖️</h1><p className="mt-2 text-sm text-white/45">مهمات كتابة وتأمل هادئة، وفرصة لإصلاح الموقف.</p></div>
          <button onClick={() => router.push("/v9/home")} className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold">البيت الرقمي</button>
        </header>

        {message && <p className="mt-5 rounded-2xl border border-amber-300/15 bg-amber-300/[0.06] p-4 text-sm text-amber-100">{message}</p>}

        <section className="mt-7 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          {canManage && <form onSubmit={createTask} className="h-fit rounded-[30px] border border-amber-300/15 bg-amber-300/[0.04] p-6">
            <h2 className="text-2xl font-black">إضافة مهمة كتابة</h2>
            <label className="mt-5 block text-xs text-white/50">الطفل</label>
            <select value={form.childId} onChange={(e) => setForm({ ...form, childId: e.target.value })} className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0b0d15] p-4"><option value="">اختر الطفل</option>{children.map((child) => <option key={child.id} value={child.id}>{child.name_ar}</option>)}</select>
            <label className="mt-4 block text-xs text-white/50">نص جاهز</label>
            <select value={`${form.category}|${form.text}`} onChange={(e) => { const [category, text] = e.target.value.split("|"); setForm({ ...form, category, text }); }} className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0b0d15] p-4">{presets.map((item) => <option key={item.text} value={`${item.category}|${item.text}`}>{item.text}</option>)}<option value="عبارة|">عبارة يكتبها الوالدان</option></select>
            <label className="mt-4 block text-xs text-white/50">العبارة أو اسم السورة</label>
            <input value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0b0d15] p-4" required />
            <label className="mt-4 block text-xs text-white/50">عدد مرات الكتابة</label>
            <div className="mt-2 grid grid-cols-4 gap-2">{[50, 100, 150, 200].map((count) => <button type="button" key={count} onClick={() => setForm({ ...form, target: count })} className={`rounded-xl p-3 ${form.target === count ? "bg-amber-300 text-black" : "bg-white/5"}`}>{count}</button>)}</div>
            <input type="number" min={1} max={1000} value={form.target} onChange={(e) => setForm({ ...form, target: Number(e.target.value) })} className="mt-3 w-full rounded-2xl border border-white/10 bg-[#0b0d15] p-4" />
            <button className="mt-5 w-full rounded-2xl bg-amber-300 p-4 font-black text-black">إرسال المهمة</button>
            <p className="mt-4 text-xs leading-6 text-white/35">تنبيه تربوي: القرآن والذكر للتأمل والإصلاح، وليس للإهانة أو التخويف.</p>
          </form>}

          <div className="space-y-4"><div className="flex items-center justify-between"><h2 className="text-2xl font-black">المهمات الحالية</h2><span className="rounded-full bg-white/5 px-3 py-2 text-xs">{activeCount} نشطة</span></div>
            {tasks.length === 0 && <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-8 text-center text-white/40">لا توجد مهمات حاليًا.</div>}
            {tasks.map((task) => <article key={task.id} className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
              <div className="flex flex-wrap items-start justify-between gap-3"><div><span className="rounded-full bg-emerald-300/10 px-3 py-1 text-[10px] text-emerald-200">{task.category}</span><h3 className="mt-3 text-xl font-black">{task.text}</h3><p className="mt-2 text-xs text-white/40">للطفل: {task.childName}</p></div><strong className="text-2xl text-amber-200">{task.completed} / {task.target}</strong></div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-black"><div className="h-full bg-gradient-to-l from-amber-300 to-emerald-300" style={{ width: `${Math.min(100, (task.completed / task.target) * 100)}%` }} /></div>
              {task.status !== "completed" ? <><textarea value={drafts[task.id] ?? ""} onChange={(e) => setDrafts({ ...drafts, [task.id]: e.target.value })} placeholder={`اكتب «${task.text}» في كل سطر`} rows={5} className="mt-4 w-full rounded-2xl border border-white/10 bg-black/30 p-4 text-sm leading-7" /><button type="button" onClick={() => void saveProgress(task)} className="mt-3 rounded-xl bg-emerald-300 px-4 py-3 text-sm font-black text-black">حفظ الكتابة الصحيحة</button></> : <p className="mt-4 rounded-2xl bg-emerald-300/10 p-4 text-emerald-200">✓ اكتملت المهمة وتم إصلاح الموقف</p>}
              <div className="mt-5 rounded-2xl border border-white/8 bg-black/20 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3"><div><h4 className="font-black">صور إثبات الإنجاز</h4><p className="mt-1 text-xs text-white/35">صوّر صفحات الدفتر وارفع حتى 5 صور.</p></div><label className="cursor-pointer rounded-xl bg-sky-300/15 px-4 py-3 text-xs font-black text-sky-100">{uploadingId === task.id ? "جاري الرفع…" : "📷 إضافة صورة"}<input type="file" accept="image/*" capture="environment" disabled={uploadingId === task.id || (task.proofPaths?.length ?? 0) >= 5} onChange={(event) => { void uploadProof(task, event.target.files?.[0]); event.currentTarget.value = ""; }} className="hidden" /></label></div>
                {(task.proofPaths?.length ?? 0) > 0 && <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">{task.proofPaths.map((path, index) => <div key={path} className="relative overflow-hidden rounded-2xl border border-white/10 bg-black"><img src={`/api/family/balance/image?taskId=${encodeURIComponent(task.id)}&path=${encodeURIComponent(path)}`} alt={`صورة الإنجاز ${index + 1}`} className="aspect-[4/3] w-full object-cover" />{canManage && <button type="button" onClick={() => void deleteProof(task.id, path)} className="absolute left-2 top-2 rounded-lg bg-black/75 px-2 py-1 text-[10px] text-rose-200">حذف</button>}</div>)}</div>}
              </div>
              {canManage && <button type="button" onClick={() => void deleteTask(task.id)} className="mt-3 mr-3 rounded-xl bg-rose-300/10 px-4 py-3 text-xs text-rose-100">حذف المهمة</button>}
            </article>)}
          </div>
        </section>
      </div>
    </main>
  );
}
