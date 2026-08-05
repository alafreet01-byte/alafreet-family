"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import VideoCallPanel from "./VideoCallPanel";

type Conversation = {
  id: string;
  name: string;
  icon: string;
  kind: string;
  memberId?: string;
  unread?: number;
};
type Message = {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  createdAt: string;
  mediaUrl: string;
  mediaType: string;
  mediaName: string;
  mine: boolean;
  read?: boolean;
  readByCount?: number;
  replyTo?: { id: string; senderName: string; text: string } | null;
  reactions?: Record<string, string[]>;
};
type Status = {
  id: string;
  senderId: string;
  senderName: string;
  caption: string;
  mediaUrl: string;
  mediaType: string;
  createdAt: string;
  mine?: boolean;
  viewCount?: number;
};

export default function FamilyChatPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState("group:family");
  const [messages, setMessages] = useState<Message[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [viewStatus, setViewStatus] = useState<Status | null>(null);
  const [viewerName, setViewerName] = useState("");
  const [viewerId, setViewerId] = useState("");
  const [text, setText] = useState("");
  const [notice, setNotice] = useState("");
  const [sending, setSending] = useState(false);
  const [attachmentsOpen, setAttachmentsOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [presence, setPresence] = useState<
    { memberId: string; name: string; typing: boolean }[]
  >([]);
  const [mobileChat, setMobileChat] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const photoInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);
  const audioInput = useRef<HTMLInputElement>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const voiceChunks = useRef<Blob[]>([]);
  const typingTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get(
      "conversation",
    );
    if (requested) {
      setSelected(requested);
      setMobileChat(true);
    }
  }, []);

  const load = useCallback(
    async (quiet = false) => {
      try {
        const response = await fetch(
          `/api/family/chat?conversation=${encodeURIComponent(selected)}`,
          { cache: "no-store" },
        );
        const data = await response.json();
        if (!response.ok)
          return !quiet && setNotice(data.error ?? "تعذر تحميل المحادثة.");
        setConversations(data.conversations ?? []);
        setMessages(data.messages ?? []);
        setStatuses(data.statuses ?? []);
        setPresence(data.presence ?? []);
        setViewerName(data.viewer?.name_ar ?? "");
        setViewerId(data.viewer?.id ?? "");
        if (
          (data.conversations ?? []).find(
            (item: Conversation) => item.id === selected,
          )?.unread > 0
        ) {
          void fetch("/api/family/chat", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ conversationId: selected }),
          });
          setConversations((current) =>
            current.map((item) =>
              item.id === selected ? { ...item, unread: 0 } : item,
            ),
          );
        }
      } catch {
        if (!quiet) setNotice("تعذر الاتصال بالمحادثات.");
      }
    },
    [selected],
  );

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(true), 4000);
    return () => window.clearInterval(timer);
  }, [load]);
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, selected]);

  async function send(event: FormEvent) {
    event.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    setNotice("");
    const value = text;
    setText("");
    try {
      const response = await fetch("/api/family/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: selected,
          text: value,
          replyTo: replyingTo
            ? {
                id: replyingTo.id,
                senderName: replyingTo.senderName,
                text: replyingTo.text || replyingTo.mediaName || "مرفق",
              }
            : null,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setText(value);
        setNotice(data.error ?? "تعذر إرسال الرسالة.");
      } else {
        setReplyingTo(null);
        await updatePresence(false);
        await load(true);
      }
    } finally {
      setSending(false);
    }
  }

  const updatePresence = useCallback(
    async (typing: boolean) => {
      await fetch("/api/family/chat", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "presence",
          conversationId: selected,
          typing,
        }),
      });
    },
    [selected],
  );

  function changeText(value: string) {
    setText(value);
    void updatePresence(Boolean(value));
    if (typingTimer.current) window.clearTimeout(typingTimer.current);
    typingTimer.current = window.setTimeout(
      () => void updatePresence(false),
      2500,
    );
  }

  async function toggleRecording() {
    if (recording) {
      recorder.current?.stop();
      setRecording(false);
      return;
    }
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferred = MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "audio/webm";
      const instance = new MediaRecorder(media, { mimeType: preferred });
      voiceChunks.current = [];
      instance.ondataavailable = (event) => {
        if (event.data.size) voiceChunks.current.push(event.data);
      };
      instance.onstop = () => {
        const blob = new Blob(voiceChunks.current, { type: preferred });
        media.getTracks().forEach((track) => track.stop());
        const extension = preferred === "audio/mp4" ? "m4a" : "webm";
        void upload(
          new File([blob], `voice-${Date.now()}.${extension}`, {
            type: preferred,
          }),
        );
      };
      recorder.current = instance;
      instance.start();
      setRecording(true);
      setNotice("جاري تسجيل الرسالة الصوتية… اضغط الميكروفون للإرسال");
    } catch {
      setNotice("اسمح باستخدام الميكروفون لتسجيل رسالة صوتية.");
    }
  }

  async function react(messageId: string, emoji: string) {
    await fetch("/api/family/chat", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "reaction",
        conversationId: selected,
        messageId,
        emoji,
      }),
    });
    await load(true);
  }

  async function upload(file?: File) {
    if (!file || sending) return;
    setSending(true);
    setNotice("جاري رفع الملف…");
    const form = new FormData();
    form.set("file", file);
    form.set("conversationId", selected);
    try {
      const response = await fetch("/api/family/chat/media", {
        method: "POST",
        body: form,
      });
      const data = await response.json();
      setNotice(
        response.ok ? "تم إرسال الملف ✓" : (data.error ?? "تعذر رفع الملف."),
      );
      if (response.ok) await load(true);
    } finally {
      setSending(false);
      setAttachmentsOpen(false);
      if (photoInput.current) photoInput.current.value = "";
      if (cameraInput.current) cameraInput.current.value = "";
      if (videoInput.current) videoInput.current.value = "";
      if (audioInput.current) audioInput.current.value = "";
    }
  }

  async function uploadStatus(file?: File) {
    if (!file || sending) return;
    setSending(true);
    setNotice("جاري نشر الحالة…");
    const form = new FormData();
    form.set("file", file);
    form.set("conversationId", "group:family");
    form.set("mode", "status");
    try {
      const response = await fetch("/api/family/chat/media", {
        method: "POST",
        body: form,
      });
      const data = await response.json();
      setNotice(
        response.ok
          ? "تم نشر الحالة لمدة 24 ساعة ✓"
          : (data.error ?? "تعذر نشر الحالة."),
      );
      if (response.ok) await load(true);
    } finally {
      setSending(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("حذف هذه الرسالة؟")) return;
    const response = await fetch("/api/family/chat", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (response.ok) await load(true);
  }

  async function openStatus(status: Status) {
    setViewStatus(status);
    await fetch("/api/family/chat", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "statusView",
        conversationId: "group:family",
        statusId: status.id,
      }),
    });
  }

  async function removeStatus(id: string) {
    if (!confirm("حذف هذه الحالة؟")) return;
    const response = await fetch("/api/family/chat", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, kind: "status" }),
    });
    if (response.ok) {
      setViewStatus(null);
      await load(true);
    }
  }

  const active = conversations.find((item) => item.id === selected);
  const girlsTheme = ["reem", "aisha", "fatima"].includes(viewerId);
  const boysTheme = ["ahmed", "saud", "mohammed", "khalid"].includes(viewerId);
  const chatBackground = girlsTheme
    ? "bg-[#170d1b]"
    : boysTheme
      ? "bg-[#071520]"
      : "bg-[#07100d]";
  const sideBackground = girlsTheme
    ? "bg-[#241329]"
    : boysTheme
      ? "bg-[#0d2431]"
      : "bg-[#101b17]";
  const accentBackground = girlsTheme
    ? "bg-pink-500"
    : boysTheme
      ? "bg-sky-500"
      : "bg-emerald-500";
  return (
    <main
      dir="rtl"
      className={`min-h-screen p-0 text-white sm:p-5 ${chatBackground}`}
    >
      <div className="mx-auto flex h-[100dvh] max-w-7xl overflow-hidden border-white/10 bg-[#0b1411] sm:h-[calc(100dvh-40px)] sm:rounded-[28px] sm:border">
        <aside
          className={`${mobileChat ? "hidden" : "flex"} w-full flex-col border-l border-white/10 ${sideBackground} md:flex md:w-[360px]`}
        >
          <header className="flex items-center justify-between bg-[#17241f] p-4">
            <div>
              <p className="text-[10px] font-black tracking-[.25em] text-emerald-300/55">
                ALAFREET CHAT
              </p>
              <h1 className="mt-1 text-xl font-black">محادثات العائلة</h1>
              <p className="mt-1 text-xs text-white/40">مرحبًا {viewerName}</p>
            </div>
            <button
              onClick={() => router.push("/v9/home")}
              className="rounded-xl border border-white/10 px-3 py-2 text-xs"
            >
              البيت
            </button>
          </header>
          <div className="border-b border-white/10 p-3">
            <label className="mb-3 flex cursor-pointer items-center gap-3 rounded-xl bg-emerald-300/10 p-3 text-sm font-black text-emerald-100">
              <span className="grid h-9 w-9 place-items-center rounded-full border border-dashed border-emerald-200">
                ＋
              </span>
              إضافة حالة
              <input
                type="file"
                accept="image/*,video/*"
                onChange={(event) => void uploadStatus(event.target.files?.[0])}
                className="hidden"
              />
            </label>
            <div className="rounded-xl bg-[#202c27] px-4 py-3 text-xs text-white/35">
              🔍 القروبات والمحادثات الخاصة
            </div>
          </div>
          <nav className="flex-1 overflow-y-auto">
            {conversations.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setSelected(item.id);
                  setMobileChat(true);
                }}
                className={`flex w-full items-center gap-3 border-b border-white/[.06] p-4 text-right transition ${selected === item.id ? (girlsTheme ? "bg-pink-400/15" : boysTheme ? "bg-sky-400/15" : "bg-emerald-400/10") : "hover:bg-white/[.04]"}`}
              >
                <span className="grid h-12 w-12 place-items-center rounded-full bg-emerald-300/10 text-2xl">
                  {item.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <strong className="block">{item.name}</strong>
                  <small className="mt-1 block text-white/35">
                    اضغط لفتح المحادثة
                  </small>
                </span>
                {Boolean(item.unread) && (
                  <b
                    className={`grid h-7 min-w-7 place-items-center rounded-full px-2 text-xs ${accentBackground}`}
                  >
                    {item.unread! > 99 ? "99+" : item.unread}
                  </b>
                )}
              </button>
            ))}
          </nav>
        </aside>
        <section
          className={`${mobileChat ? "flex" : "hidden"} min-w-0 flex-1 flex-col ${chatBackground} md:flex`}
        >
          <header className="flex items-center gap-3 border-b border-white/10 bg-[#17241f] p-4">
            <button
              onClick={() => setMobileChat(false)}
              className="rounded-xl p-2 text-xl md:hidden"
            >
              →
            </button>
            <span className="grid h-11 w-11 place-items-center rounded-full bg-emerald-300/10 text-xl">
              {active?.icon ?? "💬"}
            </span>
            <div>
              <h2 className="font-black">{active?.name ?? "قروب العائلة"}</h2>
              <p className="text-[11px] text-emerald-200/60">
                {presence.some((item) => item.typing)
                  ? `${presence.find((item) => item.typing)?.name} يكتب الآن…`
                  : active?.kind === "private" &&
                      presence.some((item) => item.memberId === active.memberId)
                    ? "متصل الآن"
                    : "محادثة خاصة ومحمية للعائلة"}
              </p>
            </div>
            {active?.kind === "private" && active.memberId && (
              <VideoCallPanel
                conversationId={active.id}
                targetId={active.memberId}
                targetName={active.name}
              />
            )}
          </header>
          {notice && (
            <button
              onClick={() => setNotice("")}
              className="bg-amber-300/10 px-4 py-2 text-center text-xs text-amber-100"
            >
              {notice}
            </button>
          )}
          <div className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_20%_20%,rgba(52,211,153,.04),transparent_35%)] p-4 sm:p-6">
            {statuses.length > 0 && (
              <div className="mx-auto mb-5 flex max-w-3xl gap-3 overflow-x-auto pb-2">
                {statuses.map((status) => (
                  <button
                    key={status.id}
                    onClick={() => void openStatus(status)}
                    className="shrink-0 text-center"
                  >
                    <span className="grid h-14 w-14 place-items-center rounded-full border-2 border-emerald-400 bg-[#17241f]">
                      {status.mediaType.startsWith("video/") ? "▶" : "📷"}
                    </span>
                    <small className="mt-1 block max-w-16 truncate text-[10px]">
                      {status.senderName}
                    </small>
                  </button>
                ))}
              </div>
            )}
            <div className="mx-auto max-w-3xl space-y-2">
              {messages.length === 0 && (
                <div className="mx-auto mt-12 max-w-sm rounded-2xl bg-[#17241f] p-5 text-center text-sm text-white/40">
                  لا توجد رسائل بعد. ابدأ أول رسالة للعائلة 💚
                </div>
              )}
              {messages.map((message) => (
                <article
                  key={message.id}
                  className={`group w-fit max-w-[86%] rounded-2xl px-3 py-2 shadow-lg ${message.mine ? "mr-auto bg-[#075e54]" : "ml-auto bg-[#202c27]"}`}
                >
                  {message.replyTo && (
                    <div className="mb-2 rounded-lg border-r-4 border-emerald-300 bg-black/20 px-3 py-2 text-xs">
                      <b className="block text-emerald-200">
                        {message.replyTo.senderName}
                      </b>
                      <span className="line-clamp-2 text-white/55">
                        {message.replyTo.text}
                      </span>
                    </div>
                  )}
                  <div className="mb-1 flex items-center justify-between gap-5">
                    <span className="text-[11px] font-black text-emerald-200">
                      {message.senderName}
                    </span>
                    {message.mine && (
                      <button
                        onClick={() => void remove(message.id)}
                        className="text-[10px] text-white/0 transition group-hover:text-red-200"
                      >
                        حذف
                      </button>
                    )}
                  </div>
                  {message.mediaUrl &&
                    message.mediaType.startsWith("image/") && (
                      <img
                        src={message.mediaUrl}
                        alt={message.mediaName}
                        className="mb-2 max-h-80 rounded-xl object-contain"
                      />
                    )}
                  {message.mediaUrl &&
                    message.mediaType.startsWith("video/") && (
                      <video
                        src={message.mediaUrl}
                        controls
                        className="mb-2 max-h-80 rounded-xl"
                      />
                    )}
                  {message.mediaUrl &&
                    message.mediaType.startsWith("audio/") && (
                      <audio
                        src={message.mediaUrl}
                        controls
                        className="mb-2 max-w-full"
                      />
                    )}
                  {message.text && (
                    <p className="whitespace-pre-wrap break-words text-sm leading-6">
                      {message.text}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-1">
                    {Object.entries(message.reactions ?? {})
                      .filter(([, ids]) => ids.length)
                      .map(([emoji, ids]) => (
                        <button
                          type="button"
                          key={emoji}
                          onClick={() => void react(message.id, emoji)}
                          className="rounded-full bg-black/20 px-2 py-1 text-xs"
                        >
                          {emoji} {ids.length}
                        </button>
                      ))}
                    {["👍", "❤️", "😂", "😮", "🙏"].map((emoji) => (
                      <button
                        type="button"
                        key={emoji}
                        onClick={() => void react(message.id, emoji)}
                        className="opacity-0 transition group-hover:opacity-70"
                      >
                        {emoji}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setReplyingTo(message)}
                      className="mr-1 text-[10px] text-white/45 hover:text-white"
                    >
                      رد
                    </button>
                  </div>
                  <div className="mt-1 flex items-center justify-end gap-1 text-[9px] text-white/40">
                    <time>
                      {new Intl.DateTimeFormat("ar-AE", {
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(new Date(message.createdAt))}
                    </time>
                    {message.mine && (
                      <span
                        className={
                          message.read ? "text-sky-300" : "text-white/35"
                        }
                      >
                        {message.read ? "✓✓" : "✓"}
                        {message.readByCount && message.readByCount > 1
                          ? ` ${message.readByCount}`
                          : ""}
                      </span>
                    )}
                  </div>
                </article>
              ))}
              <div ref={bottom} />
            </div>
          </div>
          <form
            onSubmit={send}
            className="relative flex items-end gap-2 border-t border-white/10 bg-[#17241f] p-3"
          >
            {replyingTo && (
              <div className="absolute bottom-full right-0 left-0 flex items-center gap-3 border-t border-white/10 bg-[#202c27] px-4 py-2 text-xs">
                <div className="flex-1 border-r-4 border-emerald-400 pr-3">
                  <b className="block text-emerald-200">
                    الرد على {replyingTo.senderName}
                  </b>
                  <span className="line-clamp-1 text-white/45">
                    {replyingTo.text || replyingTo.mediaName}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  className="text-xl text-white/50"
                >
                  ×
                </button>
              </div>
            )}
            <input
              ref={photoInput}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(event) => void upload(event.target.files?.[0])}
              className="hidden"
            />
            <input
              ref={cameraInput}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(event) => void upload(event.target.files?.[0])}
              className="hidden"
            />
            <input
              ref={videoInput}
              type="file"
              accept="video/mp4,video/quicktime"
              onChange={(event) => void upload(event.target.files?.[0])}
              className="hidden"
            />
            <input
              ref={audioInput}
              type="file"
              accept="audio/*"
              onChange={(event) => void upload(event.target.files?.[0])}
              className="hidden"
            />
            {attachmentsOpen && (
              <div className="absolute bottom-16 right-3 grid gap-2 rounded-2xl border border-white/10 bg-[#202c27] p-2 shadow-2xl">
                <button
                  type="button"
                  onClick={() => cameraInput.current?.click()}
                  className="flex items-center gap-3 rounded-xl bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100 hover:bg-emerald-400/15"
                >
                  <span className="text-xl">📷</span>التقاط صورة الآن
                </button>
                <button
                  type="button"
                  onClick={() => photoInput.current?.click()}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm hover:bg-white/5"
                >
                  <span className="text-xl">🖼️</span>اختيار من الصور
                </button>
                <button
                  type="button"
                  onClick={() => videoInput.current?.click()}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm hover:bg-white/5"
                >
                  <span className="text-xl">🎬</span>إرسال فيديو
                </button>
                <button
                  type="button"
                  onClick={() => audioInput.current?.click()}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm hover:bg-white/5"
                >
                  <span className="text-xl">🎵</span>إرسال ملف صوتي
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={() => setAttachmentsOpen((value) => !value)}
              className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-xl transition ${attachmentsOpen ? "rotate-45 bg-emerald-500" : "bg-white/5"}`}
            >
              ＋
            </button>
            <button
              type="button"
              onClick={() => cameraInput.current?.click()}
              title="فتح الكاميرا مباشرة"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/5 text-xl transition hover:bg-emerald-400/15"
            >
              📷
            </button>
            <textarea
              value={text}
              onChange={(event) => changeText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              placeholder={sending ? "جاري رفع الملف…" : "اكتب رسالة…"}
              disabled={sending}
              rows={1}
              className="max-h-28 min-h-11 flex-1 resize-none rounded-2xl border border-white/5 bg-[#202c27] px-4 py-3 text-sm outline-none focus:border-emerald-300/30 disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => void toggleRecording()}
              title="رسالة صوتية"
              className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-xl ${recording ? "animate-pulse bg-red-500" : "bg-white/5"}`}
            >
              {recording ? "■" : "🎙️"}
            </button>
            <button
              disabled={sending || !text.trim()}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-emerald-500 text-xl text-white disabled:opacity-40"
            >
              ➤
            </button>
          </form>
        </section>
        {viewStatus && (
          <div
            onClick={() => setViewStatus(null)}
            className="fixed inset-0 z-40 grid cursor-pointer place-items-center bg-black/95 p-5"
          >
            <div
              onClick={(event) => event.stopPropagation()}
              className="max-h-[90vh] max-w-2xl text-center"
            >
              <p className="mb-3 font-black">{viewStatus.senderName}</p>
              {viewStatus.mediaType.startsWith("video/") ? (
                <video
                  src={viewStatus.mediaUrl}
                  autoPlay
                  controls
                  className="max-h-[78vh] rounded-2xl"
                />
              ) : (
                <img
                  src={viewStatus.mediaUrl}
                  alt="حالة"
                  className="max-h-[78vh] rounded-2xl object-contain"
                />
              )}
              {viewStatus.caption && (
                <p className="mt-3">{viewStatus.caption}</p>
              )}
              {viewStatus.mine && (
                <div className="mt-4 flex items-center justify-center gap-3">
                  <span className="text-sm text-white/55">
                    شاهدها {viewStatus.viewCount ?? 0}
                  </span>
                  <button
                    onClick={() => void removeStatus(viewStatus.id)}
                    className="rounded-xl bg-red-500/20 px-4 py-2 text-sm text-red-200"
                  >
                    حذف الحالة
                  </button>
                </div>
              )}
              <button
                onClick={() => setViewStatus(null)}
                className="mt-4 rounded-xl bg-white/10 px-5 py-2 text-sm"
              >
                إغلاق
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
