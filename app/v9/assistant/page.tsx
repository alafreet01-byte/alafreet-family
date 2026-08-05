"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Message = { id: string; role: "user" | "assistant"; text: string; imageName?: string; safetyFlag?: string; createdAt: string };
type Child = { id: string; name_ar: string; role: string };

export default function FamilyAssistantPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [owner, setOwner] = useState({ id: "", name: "" });
  const [viewerId, setViewerId] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [canMonitor, setCanMonitor] = useState(false);
  const [question, setQuestion] = useState("");
  const [image, setImage] = useState<{ data: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function load(memberId = "") {
    setLoading(true); setError("");
    const response = await fetch(`/api/family/assistant${memberId ? `?memberId=${encodeURIComponent(memberId)}` : ""}`, { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) setError(data.error ?? "تعذر فتح المساعد.");
    else {
      setMessages(data.messages ?? []); setChildren(data.children ?? []); setOwner(data.owner ?? { id: "", name: "" });
      setViewerId(data.viewer?.id ?? ""); setCanMonitor(Boolean(data.canMonitor)); setSelectedId(data.owner?.id ?? "");
    }
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  function chooseImage(file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage({ data: String(reader.result), name: file.name });
    reader.readAsDataURL(file);
  }

  async function send() {
    if (sending || (!question.trim() && !image)) return;
    const text = question.trim();
    const optimistic: Message = { id: `temp-${Date.now()}`, role: "user", text: text || "صورة واجب", imageName: image?.name, createdAt: new Date().toISOString() };
    setMessages((items) => [...items, optimistic]); setQuestion(""); setSending(true); setError("");
    const response = await fetch("/api/family/assistant", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: text, imageData: image?.data ?? "", imageName: image?.name ?? "" }),
    });
    const data = await response.json(); setImage(null); setSending(false);
    if (!response.ok) setError(data.error ?? "تعذر إرسال السؤال.");
    else setMessages((items) => [...items, data.message]);
  }

  const monitoring = selectedId && selectedId !== viewerId;
  return <main dir="rtl" className="min-h-screen bg-[radial-gradient(circle_at_85%_0%,rgba(99,102,241,.2),transparent_30%),linear-gradient(180deg,#030513,#070914)] text-white">
    <header className="border-b border-white/10 bg-black/20 px-4 py-5 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
        <div><p className="text-[10px] font-black tracking-[.25em] text-violet-300">ALAFREET AI TUTOR</p><h1 className="mt-1 text-2xl font-black">المساعد الدراسي الذكي 🤖</h1><p className="mt-1 text-xs text-white/45">شرح الواجبات والإجابة عن الأسئلة بما يناسب كل فرد</p></div>
        <button onClick={() => router.push("/v9/home")} className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-bold">البيت الرقمي</button>
      </div>
    </header>
    <div className="mx-auto grid max-w-6xl gap-4 px-4 py-5 lg:grid-cols-[260px_1fr]">
      <aside className="rounded-[28px] border border-white/10 bg-white/[.04] p-4">
        <h2 className="font-black">المحادثات</h2>
        <button onClick={() => void load("")} className={`mt-4 w-full rounded-2xl p-3 text-right ${selectedId === viewerId ? "bg-violet-400/20 text-violet-100" : "bg-white/5"}`}>محادثتي الخاصة</button>
        {canMonitor && <><div className="my-4 border-t border-white/10"/><p className="mb-2 text-xs font-bold text-amber-200">متابعة الأب والأم</p>{children.map((child) => <button key={child.id} onClick={() => void load(child.id)} className={`mb-2 w-full rounded-2xl p-3 text-right ${selectedId === child.id ? "bg-amber-300/15 text-amber-100" : "bg-white/5"}`}>{child.name_ar}<span className="block text-[10px] opacity-45">سجل المساعد الدراسي</span></button>)}</>}
        <p className="mt-5 rounded-2xl bg-emerald-300/10 p-3 text-[11px] leading-6 text-emerald-100/70">🔒 الإخوة لا يستطيعون مشاهدة محادثات بعضهم. متابعة الأطفال متاحة للأب والأم فقط.</p>
      </aside>
      <section className="flex min-h-[70vh] flex-col overflow-hidden rounded-[30px] border border-white/10 bg-black/25">
        <div className="border-b border-white/10 px-5 py-4"><strong>{monitoring ? `متابعة محادثة ${owner.name}` : `أهلًا ${owner.name || "بك"}`}</strong><span className="mr-3 text-xs text-white/35">{monitoring ? "عرض للوالدين فقط" : "اسألني أو صوّر واجبك"}</span></div>
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {loading && <p className="text-center text-white/40">جاري تحميل المحادثة...</p>}
          {!loading && messages.length === 0 && <div className="mx-auto mt-20 max-w-md text-center"><span className="text-5xl">📚</span><h2 className="mt-4 text-2xl font-black">ابدأ بسؤالك الأول</h2><p className="mt-2 text-sm leading-7 text-white/45">اكتب السؤال أو التقط صورة للواجب، وسأشرح الحل خطوة بخطوة.</p></div>}
          {messages.map((message) => <div key={message.id} className={`max-w-[88%] rounded-3xl p-4 leading-8 ${message.role === "user" ? "mr-auto bg-violet-500/20" : "ml-auto border border-emerald-200/10 bg-emerald-300/[.07]"}`}>
            <p className="mb-1 text-[10px] font-black opacity-45">{message.role === "user" ? owner.name : "المعلم الذكي"}</p><p className="whitespace-pre-wrap text-sm">{message.text}</p>{message.imageName && <p className="mt-2 text-xs text-sky-200">📷 {message.imageName}</p>}{message.safetyFlag && <p className="mt-2 rounded-xl bg-amber-300/10 p-2 text-xs text-amber-100">⚠️ {message.safetyFlag}</p>}
          </div>)}
          {sending && <div className="ml-auto rounded-3xl bg-emerald-300/[.07] p-4 text-sm text-emerald-100">يفكر ويجهز الشرح...</div>}
        </div>
        {error && <p className="mx-5 mb-3 rounded-2xl bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
        {!monitoring && <div className="border-t border-white/10 p-4">
          {image && <div className="mb-3 flex items-center justify-between rounded-2xl bg-sky-300/10 p-3 text-xs text-sky-100"><span>📷 {image.name}</span><button onClick={() => setImage(null)}>إزالة</button></div>}
          <div className="flex gap-2"><input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(event) => chooseImage(event.target.files?.[0])}/><button onClick={() => fileRef.current?.click()} className="rounded-2xl border border-sky-200/15 bg-sky-300/10 px-4 text-xl" aria-label="تصوير الواجب">📷</button><textarea value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }} placeholder="اكتب سؤالك هنا..." className="min-h-14 flex-1 resize-none rounded-2xl border border-white/10 bg-white/5 p-4 outline-none focus:border-violet-300/40"/><button onClick={() => void send()} disabled={sending} className="rounded-2xl bg-violet-500 px-5 font-black disabled:opacity-50">إرسال</button></div>
        </div>}
      </section>
    </div>
  </main>;
}
