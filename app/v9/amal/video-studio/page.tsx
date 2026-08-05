"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Scene = {
  id: string;
  title: string;
  text: string;
  duration: number;
  color: string;
};

const starterScenes: Scene[] = [
  { id: "intro", title: "المقدمة", text: "اكتبي الجملة التي تجذب المشاهد", duration: 3, color: "#67e8f9" },
  { id: "story", title: "المحتوى", text: "رتّبي الفكرة أو القصة هنا", duration: 8, color: "#f9a8d4" },
  { id: "ending", title: "النهاية", text: "أضيفي الدعوة أو الرسالة الأخيرة", duration: 3, color: "#fde68a" },
];

export default function AmalVideoStudioPage() {
  const router = useRouter();
  const [projectName, setProjectName] = useState("فيديو جديد");
  const [platform, setPlatform] = useState("Instagram Reels");
  const [format, setFormat] = useState("9:16");
  const [scenes, setScenes] = useState<Scene[]>(starterScenes);
  const [selectedId, setSelectedId] = useState("intro");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const saved = window.localStorage.getItem("amal-video-studio-project");
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      setProjectName(parsed.projectName ?? "فيديو جديد");
      setPlatform(parsed.platform ?? "Instagram Reels");
      setFormat(parsed.format ?? "9:16");
      setScenes(Array.isArray(parsed.scenes) && parsed.scenes.length ? parsed.scenes : starterScenes);
      setSelectedId(parsed.scenes?.[0]?.id ?? "intro");
    } catch {
      window.localStorage.removeItem("amal-video-studio-project");
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      "amal-video-studio-project",
      JSON.stringify({ projectName, platform, format, scenes }),
    );
  }, [projectName, platform, format, scenes]);

  const selected = scenes.find((scene) => scene.id === selectedId) ?? scenes[0];
  const totalDuration = useMemo(
    () => scenes.reduce((total, scene) => total + Number(scene.duration || 0), 0),
    [scenes],
  );

  function updateSelected(changes: Partial<Scene>) {
    setScenes((current) =>
      current.map((scene) => (scene.id === selectedId ? { ...scene, ...changes } : scene)),
    );
  }

  function addScene() {
    const id = crypto.randomUUID();
    setScenes((current) => [
      ...current,
      { id, title: `مشهد ${current.length + 1}`, text: "اكتبي نص المشهد", duration: 4, color: "#c4b5fd" },
    ]);
    setSelectedId(id);
  }

  function moveScene(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= scenes.length) return;
    setScenes((current) => {
      const copy = [...current];
      [copy[index], copy[nextIndex]] = [copy[nextIndex], copy[index]];
      return copy;
    });
  }

  function removeScene(id: string) {
    if (scenes.length === 1) return;
    const remaining = scenes.filter((scene) => scene.id !== id);
    setScenes(remaining);
    if (selectedId === id) setSelectedId(remaining[0].id);
  }

  async function copyPlan() {
    const plan = [
      `مشروع: ${projectName}`,
      `المنصة: ${platform}`,
      `المقاس: ${format}`,
      `المدة: ${totalDuration} ثانية`,
      "",
      ...scenes.map((scene, index) => `${index + 1}. ${scene.title} (${scene.duration} ث)\n${scene.text}`),
    ].join("\n");
    await navigator.clipboard.writeText(plan);
    setMessage("تم نسخ خطة الفيديو.");
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#02040a] px-4 py-6 text-white sm:px-7">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_78%_10%,rgba(34,211,238,0.15),transparent_25%),radial-gradient(circle_at_16%_70%,rgba(244,114,182,0.15),transparent_28%),linear-gradient(180deg,#02040a,#07030c)]" />
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-black tracking-[0.32em] text-cyan-200/55">AMAL VIDEO STUDIO</p>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl">استوديو أمل للفيديو</h1>
            <p className="mt-2 text-sm text-white/40">رتّبي الفكرة والمشاهد والنص قبل التصوير أو المونتاج.</p>
          </div>
          <button onClick={() => router.push("/v9/amal")} className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-black">مركز أمل</button>
        </header>

        <section className="mt-7 grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
          <article className="rounded-[30px] border border-cyan-100/10 bg-white/[0.035] p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-2 text-xs text-white/45">اسم المشروع<input value={projectName} onChange={(e) => setProjectName(e.target.value)} className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-white outline-none" /></label>
              <label className="grid gap-2 text-xs text-white/45">المنصة<select value={platform} onChange={(e) => setPlatform(e.target.value)} className="rounded-2xl border border-white/10 bg-[#080c14] px-4 py-3 text-white outline-none"><option>Instagram Reels</option><option>TikTok</option><option>YouTube Shorts</option><option>YouTube</option><option>فيديو عائلي</option></select></label>
              <label className="grid gap-2 text-xs text-white/45 sm:col-span-2">المقاس<select value={format} onChange={(e) => setFormat(e.target.value)} className="rounded-2xl border border-white/10 bg-[#080c14] px-4 py-3 text-white outline-none"><option value="9:16">عمودي 9:16</option><option value="16:9">أفقي 16:9</option><option value="1:1">مربع 1:1</option></select></label>
            </div>

            <div className="mx-auto mt-6 flex min-h-[420px] max-w-[250px] items-center justify-center overflow-hidden rounded-[32px] border border-white/15 bg-gradient-to-br from-slate-950 via-[#10172a] to-[#260d22] p-6 text-center shadow-2xl" style={{ aspectRatio: format.replace(":", "/") }}>
              <div>
                <span className="mx-auto block h-2 w-16 rounded-full" style={{ background: selected?.color }} />
                <p className="mt-5 text-xs font-black tracking-widest text-white/35">{selected?.title}</p>
                <p className="mt-4 text-2xl font-black leading-10">{selected?.text}</p>
                <p className="mt-6 text-xs text-white/30">{platform} • {selected?.duration} ث</p>
              </div>
            </div>
          </article>

          <div className="space-y-5">
            <article className="rounded-[30px] border border-pink-100/10 bg-white/[0.035] p-5">
              <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black text-pink-200/55">TIMELINE</p><h2 className="mt-2 text-2xl font-black">المشاهد</h2></div><button onClick={addScene} className="rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950">+ مشهد</button></div>
              <div className="mt-5 space-y-3">
                {scenes.map((scene, index) => (
                  <div key={scene.id} className={`rounded-2xl border p-4 ${selectedId === scene.id ? "border-cyan-200/35 bg-cyan-300/[0.07]" : "border-white/8 bg-black/20"}`}>
                    <button onClick={() => setSelectedId(scene.id)} className="w-full text-right"><strong>{index + 1}. {scene.title}</strong><p className="mt-2 truncate text-xs text-white/35">{scene.text}</p></button>
                    <div className="mt-3 flex gap-2"><button onClick={() => moveScene(index, -1)} className="rounded-xl bg-white/5 px-3 py-2 text-xs">↑</button><button onClick={() => moveScene(index, 1)} className="rounded-xl bg-white/5 px-3 py-2 text-xs">↓</button><button onClick={() => removeScene(scene.id)} className="rounded-xl bg-rose-300/10 px-3 py-2 text-xs text-rose-100">حذف</button></div>
                  </div>
                ))}
              </div>
            </article>

            {selected && <article className="rounded-[30px] border border-white/10 bg-white/[0.035] p-5"><h2 className="text-xl font-black">تعديل المشهد</h2><div className="mt-4 grid gap-3"><input value={selected.title} onChange={(e) => updateSelected({ title: e.target.value })} placeholder="عنوان المشهد" className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 outline-none" /><textarea value={selected.text} onChange={(e) => updateSelected({ text: e.target.value })} rows={4} placeholder="النص" className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 outline-none" /><div className="grid grid-cols-2 gap-3"><label className="grid gap-2 text-xs text-white/40">المدة بالثواني<input type="number" min={1} max={120} value={selected.duration} onChange={(e) => updateSelected({ duration: Number(e.target.value) })} className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-white" /></label><label className="grid gap-2 text-xs text-white/40">اللون<input type="color" value={selected.color} onChange={(e) => updateSelected({ color: e.target.value })} className="h-12 w-full rounded-2xl border border-white/10 bg-black/25 p-2" /></label></div></div></article>}

            <article className="flex flex-wrap items-center justify-between gap-3 rounded-[26px] border border-amber-100/10 bg-amber-300/[0.04] p-5"><div><strong>{scenes.length} مشاهد • {totalDuration} ثانية</strong><p className="mt-1 text-xs text-white/35">يُحفظ المشروع تلقائيًا على هذا الجهاز.</p></div><button onClick={() => void copyPlan()} className="rounded-2xl bg-amber-300 px-5 py-3 text-sm font-black text-slate-950">نسخ خطة الفيديو</button>{message && <p className="w-full text-sm text-emerald-200">{message}</p>}</article>
          </div>
        </section>
      </div>
    </main>
  );
}
