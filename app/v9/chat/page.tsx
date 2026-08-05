"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import VideoCallPanel from "./VideoCallPanel";

type Conversation = { id: string; name: string; icon: string; kind: string; memberId?: string };
type Message = { id: string; text: string; senderId: string; senderName: string; createdAt: string; mediaUrl: string; mediaType: string; mediaName: string; mine: boolean };
type Status = { id: string; senderId: string; senderName: string; caption: string; mediaUrl: string; mediaType: string; createdAt: string };

export default function FamilyChatPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState("group:family");
  const [messages, setMessages] = useState<Message[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [viewStatus, setViewStatus] = useState<Status | null>(null);
  const [viewerName, setViewerName] = useState("");
  const [text, setText] = useState("");
  const [notice, setNotice] = useState("");
  const [sending, setSending] = useState(false);
  const [mobileChat, setMobileChat] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("conversation");
    if (requested) { setSelected(requested); setMobileChat(true); }
  }, []);

  const load = useCallback(async (quiet = false) => {
    try {
      const response = await fetch(`/api/family/chat?conversation=${encodeURIComponent(selected)}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) return !quiet && setNotice(data.error ?? "تعذر تحميل المحادثة.");
      setConversations(data.conversations ?? []);
      setMessages(data.messages ?? []);
      setStatuses(data.statuses ?? []);
      setViewerName(data.viewer?.name_ar ?? "");
    } catch { if (!quiet) setNotice("تعذر الاتصال بالمحادثات."); }
  }, [selected]);

  useEffect(() => { void load(); const timer = window.setInterval(() => void load(true), 4000); return () => window.clearInterval(timer); }, [load]);
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length, selected]);

  async function send(event: FormEvent) {
    event.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true); setNotice("");
    const value = text; setText("");
    try {
      const response = await fetch("/api/family/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conversationId: selected, text: value }) });
      const data = await response.json();
      if (!response.ok) { setText(value); setNotice(data.error ?? "تعذر إرسال الرسالة."); }
      else await load(true);
    } finally { setSending(false); }
  }

  async function upload(file?: File) {
    if (!file || sending) return;
    setSending(true); setNotice("جاري رفع الملف…");
    const form = new FormData(); form.set("file", file); form.set("conversationId", selected);
    try {
      const response = await fetch("/api/family/chat/media", { method: "POST", body: form });
      const data = await response.json();
      setNotice(response.ok ? "تم إرسال الملف ✓" : data.error ?? "تعذر رفع الملف.");
      if (response.ok) await load(true);
    } finally { setSending(false); if (fileInput.current) fileInput.current.value = ""; }
  }

  async function uploadStatus(file?: File) {
    if (!file || sending) return;
    setSending(true); setNotice("جاري نشر الحالة…");
    const form = new FormData(); form.set("file", file); form.set("conversationId", "group:family"); form.set("mode", "status");
    try { const response = await fetch("/api/family/chat/media", { method: "POST", body: form }); const data = await response.json(); setNotice(response.ok ? "تم نشر الحالة لمدة 24 ساعة ✓" : data.error ?? "تعذر نشر الحالة."); if (response.ok) await load(true); }
    finally { setSending(false); }
  }

  async function remove(id: string) {
    if (!confirm("حذف هذه الرسالة؟")) return;
    const response = await fetch("/api/family/chat", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    if (response.ok) await load(true);
  }

  const active = conversations.find((item) => item.id === selected);
  return <main dir="rtl" className="min-h-screen bg-[#07100d] p-0 text-white sm:p-5"><div className="mx-auto flex h-[100dvh] max-w-7xl overflow-hidden border-white/10 bg-[#0b1411] sm:h-[calc(100dvh-40px)] sm:rounded-[28px] sm:border">
    <aside className={`${mobileChat ? "hidden" : "flex"} w-full flex-col border-l border-white/10 bg-[#101b17] md:flex md:w-[360px]`}>
      <header className="flex items-center justify-between bg-[#17241f] p-4"><div><p className="text-[10px] font-black tracking-[.25em] text-emerald-300/55">ALAFREET CHAT</p><h1 className="mt-1 text-xl font-black">محادثات العائلة</h1><p className="mt-1 text-xs text-white/40">مرحبًا {viewerName}</p></div><button onClick={() => router.push("/v9/home")} className="rounded-xl border border-white/10 px-3 py-2 text-xs">البيت</button></header>
      <div className="border-b border-white/10 p-3"><label className="mb-3 flex cursor-pointer items-center gap-3 rounded-xl bg-emerald-300/10 p-3 text-sm font-black text-emerald-100"><span className="grid h-9 w-9 place-items-center rounded-full border border-dashed border-emerald-200">＋</span>إضافة حالة<input type="file" accept="image/*,video/*" onChange={(event) => void uploadStatus(event.target.files?.[0])} className="hidden" /></label><div className="rounded-xl bg-[#202c27] px-4 py-3 text-xs text-white/35">🔍 القروبات والمحادثات الخاصة</div></div>
      <nav className="flex-1 overflow-y-auto">{conversations.map((item) => <button key={item.id} onClick={() => { setSelected(item.id); setMobileChat(true); }} className={`flex w-full items-center gap-3 border-b border-white/[.06] p-4 text-right transition ${selected === item.id ? "bg-emerald-400/10" : "hover:bg-white/[.04]"}`}><span className="grid h-12 w-12 place-items-center rounded-full bg-emerald-300/10 text-2xl">{item.icon}</span><span><strong className="block">{item.name}</strong><small className="mt-1 block text-white/35">اضغط لفتح المحادثة</small></span></button>)}</nav>
    </aside>
    <section className={`${mobileChat ? "flex" : "hidden"} min-w-0 flex-1 flex-col bg-[#07100d] md:flex`}>
      <header className="flex items-center gap-3 border-b border-white/10 bg-[#17241f] p-4"><button onClick={() => setMobileChat(false)} className="rounded-xl p-2 text-xl md:hidden">→</button><span className="grid h-11 w-11 place-items-center rounded-full bg-emerald-300/10 text-xl">{active?.icon ?? "💬"}</span><div><h2 className="font-black">{active?.name ?? "قروب العائلة"}</h2><p className="text-[11px] text-emerald-200/45">محادثة خاصة ومحمية للعائلة</p></div>{active?.kind === "private" && active.memberId && <VideoCallPanel conversationId={active.id} targetId={active.memberId} targetName={active.name} />}</header>
      {notice && <button onClick={() => setNotice("")} className="bg-amber-300/10 px-4 py-2 text-center text-xs text-amber-100">{notice}</button>}
      <div className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_20%_20%,rgba(52,211,153,.04),transparent_35%)] p-4 sm:p-6">{statuses.length > 0 && <div className="mx-auto mb-5 flex max-w-3xl gap-3 overflow-x-auto pb-2">{statuses.map((status) => <button key={status.id} onClick={() => setViewStatus(status)} className="shrink-0 text-center"><span className="grid h-14 w-14 place-items-center rounded-full border-2 border-emerald-400 bg-[#17241f]">{status.mediaType.startsWith("video/") ? "▶" : "📷"}</span><small className="mt-1 block max-w-16 truncate text-[10px]">{status.senderName}</small></button>)}</div>}<div className="mx-auto max-w-3xl space-y-2">{messages.length === 0 && <div className="mx-auto mt-12 max-w-sm rounded-2xl bg-[#17241f] p-5 text-center text-sm text-white/40">لا توجد رسائل بعد. ابدأ أول رسالة للعائلة 💚</div>}{messages.map((message) => <article key={message.id} className={`group w-fit max-w-[86%] rounded-2xl px-3 py-2 shadow-lg ${message.mine ? "mr-auto bg-[#075e54]" : "ml-auto bg-[#202c27]"}`}><div className="mb-1 flex items-center justify-between gap-5"><span className="text-[11px] font-black text-emerald-200">{message.senderName}</span>{message.mine && <button onClick={() => void remove(message.id)} className="text-[10px] text-white/0 transition group-hover:text-red-200">حذف</button>}</div>{message.mediaUrl && message.mediaType.startsWith("image/") && <img src={message.mediaUrl} alt={message.mediaName} className="mb-2 max-h-80 rounded-xl object-contain" />}{message.mediaUrl && message.mediaType.startsWith("video/") && <video src={message.mediaUrl} controls className="mb-2 max-h-80 rounded-xl" />}{message.mediaUrl && message.mediaType.startsWith("audio/") && <audio src={message.mediaUrl} controls className="mb-2 max-w-full" />}{message.text && <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.text}</p>}<time className="mt-1 block text-left text-[9px] text-white/40">{new Intl.DateTimeFormat("ar-AE", { hour: "2-digit", minute: "2-digit" }).format(new Date(message.createdAt))}</time></article>)}<div ref={bottom} /></div></div>
      <form onSubmit={send} className="flex items-end gap-2 border-t border-white/10 bg-[#17241f] p-3"><input ref={fileInput} type="file" accept="image/*,video/*,audio/*" onChange={(event) => void upload(event.target.files?.[0])} className="hidden" /><button type="button" onClick={() => fileInput.current?.click()} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/5 text-xl">＋</button><textarea value={text} onChange={(event) => setText(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} placeholder="اكتب رسالة…" rows={1} className="max-h-28 min-h-11 flex-1 resize-none rounded-2xl border border-white/5 bg-[#202c27] px-4 py-3 text-sm outline-none focus:border-emerald-300/30" /><button disabled={sending || !text.trim()} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-emerald-500 text-xl text-white disabled:opacity-40">➤</button></form>
    </section>
    {viewStatus && <div onClick={() => setViewStatus(null)} className="fixed inset-0 z-40 grid cursor-pointer place-items-center bg-black/95 p-5"><div className="max-h-[90vh] max-w-2xl text-center"><p className="mb-3 font-black">{viewStatus.senderName}</p>{viewStatus.mediaType.startsWith("video/") ? <video src={viewStatus.mediaUrl} autoPlay controls className="max-h-[78vh] rounded-2xl" /> : <img src={viewStatus.mediaUrl} alt="حالة" className="max-h-[78vh] rounded-2xl object-contain" />}{viewStatus.caption && <p className="mt-3">{viewStatus.caption}</p>}</div></div>}
  </div></main>;
}
