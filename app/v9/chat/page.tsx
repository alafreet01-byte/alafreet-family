"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { familyMembers } from "@/app/data/members";
import VideoCallPanel from "@/app/chat/VideoCallPanel";

type Message = {
  id: string;
  room_id: string;
  sender_id: string;
  sender_name: string;
  body: string;
  media_url: string | null;
  media_type: "image" | "video" | "audio" | null;
  reactions: Record<string, string[]>;
  is_pinned: boolean;
  created_at: string;
};
type Chat = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  members?: string[];
  type: "group" | "status";
};
const chats: Chat[] = [
  {
    id: "family",
    title: "العائلة",
    subtitle: "جميع أفراد العائلة",
    icon: "👨‍👩‍👧‍👦",
    type: "group",
  },
  {
    id: "girls",
    title: "البنات",
    subtitle: "الأب والأم والبنات",
    icon: "👩‍👧‍👧",
    members: ["khalifa", "mother", "reem", "aisha", "fatima"],
    type: "group",
  },
  {
    id: "boys",
    title: "الأولاد",
    subtitle: "الأب والأولاد",
    icon: "👨‍👦‍👦",
    members: ["khalifa", "khalid", "ahmed", "saud", "mohammed"],
    type: "group",
  },
  {
    id: "status",
    title: "الحالات",
    subtitle: "صور وفيديو لمدة 24 ساعة",
    icon: "◉",
    type: "status",
  },
];
const BUCKET = "chat-media";

function formatMessageTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "الآن";
  return new Intl.DateTimeFormat("ar-AE", { hour: "numeric", minute: "2-digit" }).format(date);
}

export default function FamilyChatV9() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [me, setMe] = useState({ id: "", key: "", name: "" });
  const [active, setActive] = useState("group:family");
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [signed, setSigned] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"chats" | "status" | "calls">("chats");
  const [call, setCall] = useState(false);
  const [notify, setNotify] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const known = useRef(new Set<string>());
  const member = familyMembers.find((m) => m.id === me.key);
  const allowedGroups = chats.filter(
    (c) => !c.members || c.members.includes(me.key),
  );
  const directMembers = familyMembers.filter((m) => m.id !== me.key);
  const activeInfo = useMemo(() => {
    if (active.startsWith("group:")) {
      const c = chats.find((x) => x.id === active.slice(6));
      return {
        title: c?.title ?? "العائلة",
        icon: c?.icon ?? "💬",
        subtitle: c?.subtitle ?? "",
      };
    }
    const key =
      active.split(":").find((x) => x !== "direct" && x !== me.key) ?? "";
    const m = familyMembers.find((x) => x.id === key);
    return {
      title: m?.privateName ?? m?.name ?? key,
      icon: m?.icon ?? "👤",
      subtitle: "محادثة خاصة ومشفرة",
    };
  }, [active, me.key]);
  const shown = messages.filter(
    (m) =>
      (active !== "group:status" ||
        Date.now() - new Date(m.created_at).getTime() < 86400000) &&
      (!search ||
        `${m.sender_name} ${m.body}`
          .toLowerCase()
          .includes(search.toLowerCase())),
  );

  useEffect(() => {
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }
      const emailKey = user.email?.split("@")[0] ?? "khalifa";
      const key = emailKey === "amal" ? "mother" : emailKey;
      const profile = familyMembers.find((m) => m.id === key);
      setMe({
        id: user.id,
        key,
        name: profile?.privateName ?? profile?.name ?? emailKey,
      });
      setNotify(
        typeof Notification !== "undefined" &&
          Notification.permission === "granted",
      );
    })();
  }, [router, supabase]);
  useEffect(() => {
    if (!me.id) return;
    let stopped = false;
    async function load(initial = false) {
      const { data, error: e } = await supabase
        .from("messages")
        .select("*")
        .eq("room_id", active)
        .order("created_at");
      if (stopped) return;
      if (e) {
        setError("تعذر تحميل المحادثة.");
        setLoading(false);
        return;
      }
      const rows = ((data ?? []) as Message[]).map((row) => ({
        ...row,
        body: row.body ?? "",
        sender_name: row.sender_name ?? "فرد من العائلة",
        reactions: row.reactions && typeof row.reactions === "object" ? row.reactions : {},
        created_at: row.created_at ?? new Date().toISOString(),
      }));
      if (!initial) {
        const incoming = rows.filter(
          (r) => !known.current.has(r.id) && r.sender_id !== me.id,
        );
        if (
          incoming.length &&
          typeof Notification !== "undefined" &&
          Notification.permission === "granted"
        ) {
          const last = incoming[incoming.length - 1];
          new Notification(last.sender_name, {
            body: last.body || "أرسل مرفقًا",
            icon: "/icons/icon-192.png",
          });
        }
      }
      known.current = new Set(rows.map((r) => r.id));
      setMessages(rows);
      setLoading(false);
      const paths = rows.map((r) => r.media_url).filter(Boolean) as string[];
      const urls: Record<string, string> = {};
      await Promise.all(
        [...new Set(paths)].map(async (p) => {
          const { data } = await supabase.storage
            .from(BUCKET)
            .createSignedUrl(p, 3600);
          if (data?.signedUrl) urls[p] = data.signedUrl;
        }),
      );
      if (!stopped) setSigned(urls);
    }
    setLoading(true);
    void load(true);
    const channel = supabase
      .channel(`v9-chat:${active}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${active}`,
        },
        () => void load(),
      )
      .subscribe();
    return () => {
      stopped = true;
      void supabase.removeChannel(channel);
    };
  }, [active, me.id, supabase]);
  useEffect(
    () => endRef.current?.scrollIntoView({ behavior: "smooth" }),
    [messages],
  );

  function openGroup(id: string) {
    setTab(id === "status" ? "status" : "chats");
    setActive(`group:${id}`);
  }
  function openDirect(key: string) {
    setTab("chats");
    setActive(`direct:${[me.key, key].sort().join(":")}`);
  }
  async function send(event: FormEvent) {
    event.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    const { error: e } = await supabase
      .from("messages")
      .insert({
        room_id: active,
        sender_id: me.id,
        sender_name: me.name,
        body: text.trim(),
        reactions: {},
        is_pinned: false,
      });
    if (e) setError("تعذر إرسال الرسالة.");
    else setText("");
    setSending(false);
  }
  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const type = file.type.startsWith("image/")
      ? "image"
      : file.type.startsWith("video/")
        ? "video"
        : file.type.startsWith("audio/")
          ? "audio"
          : null;
    if (!type) return setError("اختر صورة أو فيديو أو تسجيلًا صوتيًا.");
    setSending(true);
    const path = `${me.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
    const { error: up } = await supabase.storage
      .from(BUCKET)
      .upload(path, file);
    if (up) {
      setError("تعذر رفع الملف.");
      setSending(false);
      return;
    }
    const { error: e } = await supabase
      .from("messages")
      .insert({
        room_id: active,
        sender_id: me.id,
        sender_name: me.name,
        body: "",
        media_url: path,
        media_type: type,
        reactions: {},
        is_pinned: false,
      });
    if (e) setError("تعذر إرسال المرفق.");
    setSending(false);
  }
  async function remove(id: string) {
    if (!confirm("حذف الرسالة؟")) return;
    await supabase
      .from("messages")
      .delete()
      .eq("id", id)
      .eq("sender_id", me.id);
  }
  async function react(message: Message, emoji: string) {
    const next = { ...(message.reactions ?? {}) };
    const users = new Set(next[emoji] ?? []);
    users.has(me.id) ? users.delete(me.id) : users.add(me.id);
    next[emoji] = [...users];
    await supabase
      .from("messages")
      .update({ reactions: next })
      .eq("id", message.id);
  }
  async function enableNotify() {
    if (typeof Notification === "undefined")
      return setError("الجهاز لا يدعم الإشعارات.");
    const p = await Notification.requestPermission();
    setNotify(p === "granted");
    if (p !== "granted") setError("اسمح بالإشعارات من إعدادات المتصفح.");
  }

  return (
    <main
      dir="rtl"
      className="h-screen overflow-hidden bg-[#0b141a] text-white"
    >
      <div className="grid h-full lg:grid-cols-[76px_340px_minmax(0,1fr)]">
        <nav className="hidden flex-col items-center gap-3 border-l border-white/5 bg-[#111b21] py-4 lg:flex">
          <button
            onClick={() => router.push("/v9/home")}
            title="البيت"
            className="grid h-12 w-12 place-items-center rounded-2xl bg-[#00a884] text-xl text-black"
          >
            ⌂
          </button>
          <button
            onClick={() => setTab("chats")}
            className={`grid h-12 w-12 place-items-center rounded-2xl text-xl ${tab === "chats" ? "bg-white/10" : ""}`}
          >
            💬
          </button>
          <button
            onClick={() => {
              setTab("status");
              openGroup("status");
            }}
            className={`grid h-12 w-12 place-items-center rounded-2xl text-xl ${tab === "status" ? "bg-white/10" : ""}`}
          >
            ◉
          </button>
          <button
            onClick={() => setTab("calls")}
            className={`grid h-12 w-12 place-items-center rounded-2xl text-xl ${tab === "calls" ? "bg-white/10" : ""}`}
          >
            ☎
          </button>
          <div className="mt-auto grid h-11 w-11 place-items-center rounded-full bg-[#00a884] font-black text-black">
            {me.name.slice(0, 1)}
          </div>
        </nav>
        <aside className="flex h-full flex-col border-l border-white/5 bg-[#111b21]">
          <header className="flex items-center justify-between bg-[#202c33] p-4">
            <div>
              <h1 className="text-xl font-black">
                {tab === "status"
                  ? "الحالات"
                  : tab === "calls"
                    ? "المكالمات"
                    : "المحادثات"}
              </h1>
              <p className="mt-1 text-xs text-white/45">{me.name} • متصل</p>
            </div>
            <button
              onClick={() => router.push("/v9/home")}
              className="rounded-xl bg-white/5 px-3 py-2 text-xs lg:hidden"
            >
              البيت
            </button>
          </header>
          <div className="p-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث أو بدء محادثة جديدة"
              className="w-full rounded-xl bg-[#202c33] px-4 py-3 text-sm outline-none placeholder:text-white/35"
            />
          </div>
          <div className="flex-1 overflow-y-auto px-2 pb-3">
            {tab === "calls" ? (
              <div className="p-3">
                <button
                  onClick={() => setCall(true)}
                  className="w-full rounded-2xl bg-[#00a884] p-4 font-black text-black"
                >
                  بدء مكالمة فيديو
                </button>
                <p className="mt-4 text-center text-sm text-white/35">
                  اختر محادثة أولًا ثم ابدأ المكالمة.
                </p>
              </div>
            ) : (
              <>
                {allowedGroups
                  .filter((c) =>
                    tab === "status" ? c.id === "status" : c.id !== "status",
                  )
                  .map((c) => (
                    <button
                      key={c.id}
                      onClick={() => openGroup(c.id)}
                      className={`flex w-full items-center gap-3 rounded-2xl p-3 text-right ${active === `group:${c.id}` ? "bg-[#2a3942]" : "hover:bg-white/5"}`}
                    >
                      <span className="grid h-12 w-12 place-items-center rounded-full bg-[#202c33] text-2xl">
                        {c.icon}
                      </span>
                      <span className="min-w-0 flex-1 border-b border-white/5 pb-3">
                        <strong className="block">{c.title}</strong>
                        <small className="text-white/40">{c.subtitle}</small>
                      </span>
                    </button>
                  ))}
                {tab === "chats" && (
                  <>
                    <p className="px-3 py-3 text-xs font-black text-[#00a884]">
                      المحادثات الخاصة
                    </p>
                    {directMembers.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => openDirect(m.id)}
                        className={`flex w-full items-center gap-3 rounded-2xl p-3 text-right ${active.includes(m.id) ? "bg-[#2a3942]" : "hover:bg-white/5"}`}
                      >
                        <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-full bg-[#202c33] text-xl">
                          {m.image ? (
                            <img
                              src={m.image}
                              alt={m.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            m.icon
                          )}
                        </span>
                        <span className="min-w-0 flex-1 border-b border-white/5 pb-3">
                          <strong>{m.privateName ?? m.name}</strong>
                          <small className="block truncate text-white/40">
                            محادثة خاصة
                          </small>
                        </span>
                      </button>
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        </aside>
        <section className="flex min-w-0 flex-col bg-[radial-gradient(circle_at_10%_20%,rgba(0,168,132,.05),transparent_24%),#0b141a]">
          <header className="flex items-center gap-3 border-b border-white/5 bg-[#202c33] p-3">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-[#111b21] text-2xl">
              {activeInfo.icon}
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="font-black">{activeInfo.title}</h2>
              <p className="truncate text-xs text-white/45">
                {activeInfo.subtitle}
              </p>
            </div>
            <button
              onClick={() => setCall(true)}
              className="rounded-xl p-3 text-xl hover:bg-white/5"
            >
              📹
            </button>
            <button
              onClick={enableNotify}
              title="الإشعارات"
              className={`rounded-xl p-3 text-xl ${notify ? "text-[#00a884]" : ""}`}
            >
              🔔
            </button>
          </header>
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {loading ? (
              <p className="text-center text-white/35">جاري تحميل الرسائل…</p>
            ) : shown.length === 0 ? (
              <div className="grid h-full place-items-center">
                <p className="rounded-2xl bg-[#182229] px-5 py-3 text-sm text-white/45">
                  ابدأ أول رسالة في هذه المحادثة
                </p>
              </div>
            ) : (
              shown.map((m) => {
                const mine = m.sender_id === me.id;
                return (
                  <div
                    key={m.id}
                    className={`mb-2 flex ${mine ? "justify-start" : "justify-end"}`}
                  >
                    <article
                      className={`max-w-[86%] rounded-2xl px-3 py-2 shadow ${mine ? "bg-[#005c4b]" : "bg-[#202c33]"}`}
                    >
                      <div className="flex items-center gap-2">
                        <strong className="text-xs text-[#53bdeb]">
                          {m.sender_name}
                        </strong>
                        {m.is_pinned && <span>📌</span>}
                      </div>
                      {m.media_type === "image" && m.media_url && (
                        <img
                          src={signed[m.media_url]}
                          alt="صورة"
                          className="mt-2 max-h-80 rounded-xl object-contain"
                        />
                      )}
                      {m.media_type === "video" && m.media_url && (
                        <video
                          src={signed[m.media_url]}
                          controls
                          className="mt-2 max-h-80 rounded-xl"
                        />
                      )}
                      {m.media_type === "audio" && m.media_url && (
                        <audio
                          src={signed[m.media_url]}
                          controls
                          className="mt-2 max-w-full"
                        />
                      )}
                      {m.body && (
                        <p className="mt-1 whitespace-pre-wrap leading-7">
                          {m.body}
                        </p>
                      )}
                      <div className="mt-1 flex items-center gap-2 text-[10px] text-white/45">
                        <time>
                          {formatMessageTime(m.created_at)}
                        </time>
                        {["❤️", "👍"].map((e) => (
                          <button key={e} onClick={() => react(m, e)}>
                            {e}
                            {m.reactions?.[e]?.length || ""}
                          </button>
                        ))}
                        {mine && (
                          <button
                            onClick={() => remove(m.id)}
                            className="text-rose-200"
                          >
                            حذف
                          </button>
                        )}
                      </div>
                    </article>
                  </div>
                );
              })
            )}
            <div ref={endRef} />
          </div>
          {error && (
            <p className="mx-4 mb-2 rounded-xl bg-rose-500/15 p-3 text-sm text-rose-100">
              {error}
            </p>
          )}
          <form
            onSubmit={send}
            className="flex items-end gap-2 border-t border-white/5 bg-[#202c33] p-3"
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*,audio/*"
              onChange={upload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="rounded-full p-3 text-xl hover:bg-white/5"
            >
              📎
            </button>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={1}
              placeholder={
                active === "group:status" ? "أضف وصفًا للحالة…" : "اكتب رسالة"
              }
              className="max-h-32 min-h-12 flex-1 resize-none rounded-2xl bg-[#2a3942] px-4 py-3 outline-none placeholder:text-white/35"
            />
            <button
              disabled={sending || !text.trim()}
              className="grid h-12 w-12 place-items-center rounded-full bg-[#00a884] font-black text-black disabled:opacity-40"
            >
              ➤
            </button>
          </form>
        </section>
      </div>
      {call && (
        <VideoCallPanel
          supabase={supabase}
          roomId={active}
          name={me.name}
          onClose={() => setCall(false)}
        />
      )}
    </main>
  );
}
