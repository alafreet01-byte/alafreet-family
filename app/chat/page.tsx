"use client";

import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import MemberAvatar from "../components/MemberAvatar";
import { familyMembers } from "../data/members";
import type { FamilyMember } from "../types";
import { createClient } from "../../lib/supabase/client";
import VideoCallPanel from "./VideoCallPanel";

type MediaType = "image" | "video" | "audio";

type MessageRow = {
  id: string;
  room_id: string;
  sender_id: string;
  sender_name: string;
  body: string;
  media_url: string | null;
  media_type: MediaType | null;
  reply_to: string | null;
  reactions: Record<string, string[]>;
  is_pinned: boolean;
  created_at: string;
  edited_at: string | null;
};

type UploadPreview = {
  file: File;
  url: string;
  type: MediaType;
};

type Room = {
  id: string;
  name: string;
  icon: string;
  description: string;
  allowedMembers?: string[];
};

const rooms: Room[] = [
  {
    id: "family",
    name: "قروب العائلة",
    icon: "👨‍👩‍👧‍👦",
    description: "كل أفراد العائلة",
  },
  {
    id: "girls",
    name: "قروب البنات",
    icon: "👩‍👧‍👧",
    description: "الأب والأم والبنات",
    allowedMembers: ["khalifa", "mother", "reem", "aisha", "fatima"],
  },
  {
    id: "boys",
    name: "قروب الأولاد",
    icon: "👨‍👦‍👦",
    description: "الأب والأولاد",
    allowedMembers: ["khalifa", "khalid", "ahmed", "saud", "mohammed"],
  },
  {
    id: "status",
    name: "الحالات",
    icon: "◉",
    description: "صور وفيديوهات العائلة",
  },
];

const BUCKET = "chat-media";
const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;
const MAX_AUDIO_SIZE = 15 * 1024 * 1024;

export default function ChatPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [currentUserId, setCurrentUserId] = useState("");
  const [currentMemberKey, setCurrentMemberKey] = useState("khalifa");
  const [currentDisplayName, setCurrentDisplayName] = useState("خليفة");

  const [conversationType, setConversationType] = useState<
    "room" | "direct"
  >("room");
  const [conversationId, setConversationId] = useState("family");

  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  const [messageText, setMessageText] = useState("");
  const [upload, setUpload] = useState<UploadPreview | null>(null);
  const [replyTo, setReplyTo] = useState<MessageRow | null>(null);
  const [editingMessage, setEditingMessage] = useState<MessageRow | null>(
    null,
  );

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState("");

  const [recording, setRecording] = useState(false);
  const [videoCallOpen, setVideoCallOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const knownMessageIdsRef = useRef<Set<string>>(new Set());
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  const selectedRoom = useMemo(
    () =>
      conversationType === "room"
        ? rooms.find((room) => room.id === conversationId) ?? null
        : null,
    [conversationId, conversationType],
  );

  const selectedMember = useMemo(
    () =>
      conversationType === "direct"
        ? familyMembers.find((member) => member.id === conversationId) ??
          null
        : null,
    [conversationId, conversationType],
  );

  const activeRoomId = useMemo(() => {
    if (conversationType === "room") {
      return `room:${conversationId}`;
    }

    return `direct:${[currentMemberKey, conversationId].sort().join(":")}`;
  }, [conversationId, conversationType, currentMemberKey]);

  const filteredMessages = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    const visible = conversationType === "room" && conversationId === "status"
      ? messages.filter((message) => Date.now() - new Date(message.created_at).getTime() < 24 * 60 * 60 * 1000)
      : messages;

    if (!query) return visible;

    return visible.filter((message) =>
      [message.body, message.sender_name].some((value) =>
        value.toLowerCase().includes(query),
      ),
    );
  }, [conversationId, conversationType, messages, searchText]);

  useEffect(() => {
    setNotificationsEnabled(typeof Notification !== "undefined" && Notification.permission === "granted");
  }, []);

  useEffect(() => {
    async function initialise() {
      setLoading(true);
      setError("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      setCurrentUserId(user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("member_key, display_name")
        .eq("id", user.id)
        .maybeSingle();

      const { data: linkedMember } = await supabase
        .from("family_members")
        .select("id, name_ar")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      const emailMemberKey = user.email?.split("@")[0] === "amal" ? "mother" : user.email?.split("@")[0];
      const memberKey = linkedMember?.id === "amal"
        ? "mother"
        : linkedMember?.id || (emailMemberKey && familyMembers.some((member) => member.id === emailMemberKey) ? emailMemberKey : null) || profile?.member_key || "khalifa";
      const memberProfile = familyMembers.find((member) => member.id === memberKey);
      const displayName =
        linkedMember?.name_ar || memberProfile?.privateName || memberProfile?.name || profile?.display_name || user.email?.split("@")[0] || "خليفة";

      setCurrentMemberKey(memberKey);
      setCurrentDisplayName(displayName);

      if (profile?.member_key !== memberKey || profile?.display_name !== displayName) {
        await supabase
          .from("profiles")
          .update({
            member_key: memberKey,
            display_name: displayName,
          })
          .eq("id", user.id);
      }

      setLoading(false);
    }

    initialise();
  }, [router, supabase]);

  useEffect(() => {
    if (!currentUserId || !activeRoomId) return;

    let cancelled = false;

    async function loadMessages() {
      setLoading(true);
      setError("");

      const { data, error: loadError } = await supabase
        .from("messages")
        .select("*")
        .eq("room_id", activeRoomId)
        .order("created_at", { ascending: true });

      if (cancelled) return;

      if (loadError) {
        setError("تعذر تحميل الرسائل");
        setLoading(false);
        return;
      }

      const rows = (data ?? []) as MessageRow[];
      setMessages(rows);
      knownMessageIdsRef.current = new Set(rows.map((row) => row.id));
      await loadSignedUrls(rows);
      setLoading(false);
    }

    loadMessages();

    const channel = supabase
      .channel(`messages:${activeRoomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${activeRoomId}`,
        },
        async () => {
          const { data } = await supabase
            .from("messages")
            .select("*")
            .eq("room_id", activeRoomId)
            .order("created_at", { ascending: true });

          const rows = (data ?? []) as MessageRow[];
          const incoming = rows.filter((row) => !knownMessageIdsRef.current.has(row.id) && row.sender_id !== currentUserId);
          knownMessageIdsRef.current = new Set(rows.map((row) => row.id));
          setMessages(rows);
          await loadSignedUrls(rows);
          if (incoming.length && typeof Notification !== "undefined" && Notification.permission === "granted") {
            const latest = incoming[incoming.length - 1];
            new Notification(`رسالة جديدة من ${latest.sender_name}`, { body: latest.body || "أرسل مرفقًا", icon: "/icons/icon-192.png", tag: activeRoomId });
          }
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [activeRoomId, currentUserId, supabase]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, upload]);

  useEffect(() => {
    return () => {
      if (upload?.url) URL.revokeObjectURL(upload.url);

      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }

      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [upload]);

  async function loadSignedUrls(rows: MessageRow[]) {
    const paths = Array.from(
      new Set(
        rows
          .map((message) => message.media_url)
          .filter((value): value is string => Boolean(value)),
      ),
    );

    const nextUrls: Record<string, string> = {};

    await Promise.all(
      paths.map(async (path) => {
        const { data } = await supabase.storage
          .from(BUCKET)
          .createSignedUrl(path, 60 * 60);

        if (data?.signedUrl) {
          nextUrls[path] = data.signedUrl;
        }
      }),
    );

    setSignedUrls(nextUrls);
  }

  function openRoom(roomId: string) {
    resetComposer();
    setConversationType("room");
    setConversationId(roomId);
  }

  function openDirect(memberId: string) {
    resetComposer();
    setConversationType("direct");
    setConversationId(memberId);
  }

  function resetComposer() {
    setMessageText("");
    setReplyTo(null);
    setEditingMessage(null);
    setSearchText("");
    setSearchOpen(false);
    clearUpload();
  }

  function setPreview(file: File, type: MediaType) {
    clearUpload();

    setUpload({
      file,
      type,
      url: URL.createObjectURL(file),
    });
  }

  function clearUpload() {
    setUpload((current) => {
      if (current?.url) URL.revokeObjectURL(current.url);
      return null;
    });
  }

  function handleImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("اختر صورة فقط");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError("حجم الصورة أكبر من 8 MB");
      return;
    }

    setError("");
    setPreview(file, "image");
  }

  function handleVideo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("video/")) {
      setError("اختر فيديو فقط");
      return;
    }

    if (file.size > MAX_VIDEO_SIZE) {
      setError("حجم الفيديو أكبر من 50 MB");
      return;
    }

    setError("");
    setPreview(file, "video");
  }

  async function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("المتصفح لا يدعم التسجيل الصوتي");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const recorder = new MediaRecorder(stream);

      mediaStreamRef.current = stream;
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const mimeType = recorder.mimeType || "audio/webm";
        const blob = new Blob(audioChunksRef.current, {
          type: mimeType,
        });

        if (blob.size > MAX_AUDIO_SIZE) {
          setError("التسجيل الصوتي كبير جدًا");
        } else {
          const extension = mimeType.includes("mp4") ? "m4a" : "webm";
          const file = new File(
            [blob],
            `voice-${Date.now()}.${extension}`,
            { type: mimeType },
          );

          setPreview(file, "audio");
        }

        stream.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        mediaRecorderRef.current = null;
        audioChunksRef.current = [];
      };

      recorder.start();
      setRecording(true);
      setRecordingSeconds(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((current) => current + 1);
      }, 1000);
    } catch {
      setError("اسمح للموقع باستخدام الميكروفون");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  }

  async function uploadMedia() {
    if (!upload) return null;

    const safeName = upload.file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${currentUserId}/${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, upload.file, {
        cacheControl: "3600",
        upsert: false,
        contentType: upload.file.type,
      });

    if (uploadError) throw uploadError;

    return path;
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (sending) return;

    const body = messageText.trim();

    if (editingMessage) {
      if (!body) return;

      setSending(true);

      const { error: editError } = await supabase
        .from("messages")
        .update({
          body,
          edited_at: new Date().toISOString(),
        })
        .eq("id", editingMessage.id)
        .eq("sender_id", currentUserId);

      setSending(false);

      if (editError) {
        setError("تعذر تعديل الرسالة");
        return;
      }

      setEditingMessage(null);
      setMessageText("");
      return;
    }

    if (!body && !upload) return;

    setSending(true);
    setError("");

    try {
      const mediaPath = await uploadMedia();

      const { error: insertError } = await supabase
        .from("messages")
        .insert({
          room_id: activeRoomId,
          sender_id: currentUserId,
          sender_name: currentDisplayName,
          body,
          media_url: mediaPath,
          media_type: upload?.type ?? null,
          reply_to: replyTo?.id ?? null,
          reactions: {},
          is_pinned: false,
        });

      if (insertError) throw insertError;

      setMessageText("");
      setReplyTo(null);
      clearUpload();
    } catch {
      setError("تعذر إرسال الرسالة أو المرفق");
    } finally {
      setSending(false);
    }
  }

  async function deleteMessage(message: MessageRow) {
    if (message.sender_id !== currentUserId) return;

    const confirmed = window.confirm("هل تريد حذف الرسالة؟");
    if (!confirmed) return;

    if (message.media_url) {
      await supabase.storage.from(BUCKET).remove([message.media_url]);
    }

    const { error: deleteError } = await supabase
      .from("messages")
      .delete()
      .eq("id", message.id)
      .eq("sender_id", currentUserId);

    if (deleteError) {
      setError("تعذر حذف الرسالة");
    }
  }

  async function togglePin(message: MessageRow) {
    if (message.sender_id !== currentUserId) {
      setError("صاحب الرسالة فقط يقدر يثبتها");
      return;
    }

    await supabase
      .from("messages")
      .update({ is_pinned: !message.is_pinned })
      .eq("id", message.id)
      .eq("sender_id", currentUserId);
  }

  async function toggleReaction(message: MessageRow, emoji: string) {
    const currentReactions = message.reactions ?? {};
    const users = currentReactions[emoji] ?? [];
    const reacted = users.includes(currentUserId);

    const nextUsers = reacted
      ? users.filter((id) => id !== currentUserId)
      : [...users, currentUserId];

    const nextReactions = {
      ...currentReactions,
      [emoji]: nextUsers,
    };

    if (nextUsers.length === 0) {
      delete nextReactions[emoji];
    }

    const { error: reactionError } = await supabase
      .from("messages")
      .update({ reactions: nextReactions })
      .eq("id", message.id);

    if (reactionError) {
      setError("تعذر حفظ التفاعل");
    }
  }

  function beginEdit(message: MessageRow) {
    if (message.sender_id !== currentUserId) return;

    setEditingMessage(message);
    setReplyTo(null);
    clearUpload();
    setMessageText(message.body);
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  async function enableNotifications() {
    if (typeof Notification === "undefined") return setError("هذا الجهاز لا يدعم الإشعارات.");
    const permission = await Notification.requestPermission();
    setNotificationsEnabled(permission === "granted");
    if (permission !== "granted") setError("فعّل الإشعارات للموقع من إعدادات المتصفح.");
  }

  const conversationName =
    conversationType === "room"
      ? selectedRoom?.name ?? ""
      : selectedMember?.id === "mother"
        ? selectedMember.privateName ?? selectedMember.name
        : selectedMember?.name ?? "";

  return (
    <main dir="rtl" className="min-h-screen bg-[#0b141a] px-3 py-4 text-white sm:px-5">
      <div className="mx-auto max-w-7xl">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-4 rounded-[24px] border border-white/5 bg-[#202c33] p-5 shadow-xl">
        <div><p className="text-xs font-black tracking-[.25em] text-emerald-200/55">ALAFREET FAMILY CHAT</p><h1 className="mt-2 text-3xl font-black">الواتساب العائلي</h1><p className="mt-1 text-sm text-white/40">محادثات العائلة الخاصة والآمنة</p></div>
        <button type="button" onClick={() => router.push("/v9/home")} className="rounded-2xl border border-white/10 px-5 py-3 font-black">البيت الرقمي</button>
      </header>
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={logout}
          className="rounded-2xl border border-red-400/20 bg-red-500/10 px-5 py-3 font-bold text-red-200"
        >
          تسجيل الخروج
        </button>
      </div>

      <div className="grid gap-3 xl:grid-cols-[330px_minmax(0,1fr)]">
        <aside className="rounded-[24px] border border-white/5 bg-[#111b21] p-4 shadow-xl">
          <h2 className="px-2 text-lg font-black">القروبات</h2>

          <div className="mt-4 space-y-2">
            {rooms.filter((room) => !room.allowedMembers || room.allowedMembers.includes(currentMemberKey)).map((room) => (
              <button
                key={room.id}
                type="button"
                onClick={() => openRoom(room.id)}
                className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-right transition ${
                  conversationType === "room" &&
                  conversationId === room.id
                    ? "border-cyan-400/40 bg-cyan-500/15"
                    : "border-transparent bg-white/5 hover:bg-white/10"
                }`}
              >
                <span className="text-3xl">{room.icon}</span>
                <span>
                  <span className="block font-black">{room.name}</span>
                  <span className="text-xs text-slate-400">
                    {room.description}
                  </span>
                </span>
              </button>
            ))}
          </div>

          <div className="my-5 border-t border-white/10" />

          <h2 className="px-2 text-lg font-black">
            المحادثات الفردية
          </h2>

          <div className="mt-4 space-y-2">
            <div className="flex w-full items-center gap-3 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-3 text-right">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-300 text-lg font-black text-black">{currentDisplayName.slice(0, 1)}</div>
              <div><p className="font-black">{currentDisplayName}</p><p className="text-xs text-emerald-200">أنت الآن • متصل</p></div>
            </div>
            {familyMembers
              .filter((member) => member.id !== currentMemberKey)
              .map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => openDirect(member.id)}
                  className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-right transition ${
                    conversationType === "direct" &&
                    conversationId === member.id
                      ? "border-cyan-400/40 bg-cyan-500/15"
                      : "border-transparent bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <div className="scale-75">
                    <MemberAvatar member={member} />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate font-black">
                      {member.id === "mother"
                        ? member.privateName ?? member.name
                        : member.name}
                    </p>
                    <p className="truncate text-xs text-slate-400">
                      {member.role}
                    </p>
                  </div>
                </button>
              ))}
          </div>
        </aside>

        <section className="flex min-h-[720px] flex-col overflow-hidden rounded-[24px] border border-white/5 bg-[#0b141a] shadow-xl">
          <header className="border-b border-white/5 bg-[#202c33] p-4">
            <div className="flex items-center gap-4">
              {selectedRoom ? (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/10 text-4xl">
                  {selectedRoom.icon}
                </div>
              ) : selectedMember ? (
                <div className="scale-75">
                  <MemberAvatar member={selectedMember} />
                </div>
              ) : null}

              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-black">
                  {conversationName}
                </h2>
                <p className="text-sm text-emerald-300">
                  متصل بقاعدة البيانات
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSearchOpen((current) => !current);
                  setSearchText("");
                }}
                className="rounded-2xl bg-white/10 px-4 py-3 font-black"
              >
                🔎 بحث
              </button>
              <button type="button" onClick={() => setVideoCallOpen(true)} className="rounded-2xl bg-emerald-400/15 px-4 py-3 font-black text-emerald-200">📹 مكالمة فيديو</button>
              <button type="button" onClick={enableNotifications} className={`rounded-2xl px-4 py-3 font-black ${notificationsEnabled?"bg-emerald-400 text-black":"bg-white/10 text-white"}`}>{notificationsEnabled?"🔔 الإشعارات مفعلة":"🔕 تفعيل الإشعارات"}</button>
            </div>

            {searchOpen && (
              <input
                autoFocus
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="ابحث داخل المحادثة..."
                className="mt-4 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-cyan-400"
              />
            )}
          </header>

          <div className="flex-1 space-y-4 overflow-y-auto bg-[radial-gradient(circle_at_20%_10%,rgba(0,168,132,.05),transparent_24%),linear-gradient(rgba(11,20,26,.94),rgba(11,20,26,.94))] p-4 sm:p-6">
            {messages.some((message) => message.is_pinned) && (
              <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4">
                <p className="font-black text-amber-200">
                  📌 الرسائل المثبتة
                </p>

                <div className="mt-2 space-y-1">
                  {messages
                    .filter((message) => message.is_pinned)
                    .slice(-3)
                    .map((message) => (
                      <p
                        key={message.id}
                        className="truncate text-sm text-amber-100/80"
                      >
                        {message.body || "مرفق"}
                      </p>
                    ))}
                </div>
              </div>
            )}

            {loading ? (
              <EmptyState text="جاري تحميل الرسائل..." />
            ) : filteredMessages.length === 0 ? (
              <EmptyState text="لا توجد رسائل بعد." />
            ) : (
              filteredMessages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  currentUserId={currentUserId}
                  mediaUrl={
                    message.media_url
                      ? signedUrls[message.media_url]
                      : undefined
                  }
                  onReply={() => setReplyTo(message)}
                  onEdit={() => beginEdit(message)}
                  onDelete={() => deleteMessage(message)}
                  onPin={() => togglePin(message)}
                  onReact={(emoji) => toggleReaction(message, emoji)}
                />
              ))
            )}

            <div ref={endRef} />
          </div>

          <div className="border-t border-white/5 bg-[#202c33] p-4">
            {editingMessage && (
              <NoticeBox
                title="تعديل الرسالة"
                text={editingMessage.body}
                onClose={() => {
                  setEditingMessage(null);
                  setMessageText("");
                }}
                accent="amber"
              />
            )}

            {replyTo && (
              <NoticeBox
                title={`رد على ${replyTo.sender_name}`}
                text={replyTo.body || "مرفق"}
                onClose={() => setReplyTo(null)}
                accent="cyan"
              />
            )}

            {upload && (
              <UploadPreviewCard upload={upload} onRemove={clearUpload} />
            )}

            {error && (
              <p className="mb-3 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 font-bold text-red-300">
                {error}
              </p>
            )}

            <form onSubmit={sendMessage} className="space-y-3">
              <textarea
                rows={2}
                value={messageText}
                onChange={(event) => {
                  setMessageText(event.target.value);
                  setError("");
                }}
                placeholder={`اكتب رسالة إلى ${conversationName}...`}
                className="w-full resize-none rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-cyan-400"
              />

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={Boolean(editingMessage)}
                  onClick={() => imageInputRef.current?.click()}
                  className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 font-black text-cyan-200 disabled:opacity-40"
                >
                  📷 صورة
                </button>

                <button
                  type="button"
                  disabled={Boolean(editingMessage)}
                  onClick={() => videoInputRef.current?.click()}
                  className="rounded-2xl border border-purple-400/20 bg-purple-500/10 px-4 py-3 font-black text-purple-200 disabled:opacity-40"
                >
                  🎥 فيديو
                </button>

                {!recording ? (
                  <button
                    type="button"
                    disabled={Boolean(editingMessage)}
                    onClick={startRecording}
                    className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 font-black text-emerald-200 disabled:opacity-40"
                  >
                    🎙️ تسجيل صوتي
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="animate-pulse rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 font-black text-red-200"
                  >
                    ⏹️ إيقاف {formatDuration(recordingSeconds)}
                  </button>
                )}

                <button
                  type="submit"
                  disabled={
                    sending ||
                    (!messageText.trim() && !upload && !editingMessage)
                  }
                  className="mr-auto rounded-2xl bg-gradient-to-l from-cyan-500 to-blue-700 px-7 py-3 font-black disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {editingMessage
                    ? "حفظ التعديل"
                    : sending
                      ? "جاري الإرسال..."
                      : "إرسال"}
                </button>
              </div>

              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImage}
                className="hidden"
              />

              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                capture="environment"
                onChange={handleVideo}
                className="hidden"
              />
            </form>
          </div>
        </section>
      </div>
      {videoCallOpen && <VideoCallPanel supabase={supabase} roomId={activeRoomId} name={currentDisplayName} onClose={() => setVideoCallOpen(false)} />}
      </div>
    </main>
  );
}

function MessageBubble({
  message,
  currentUserId,
  mediaUrl,
  onReply,
  onEdit,
  onDelete,
  onPin,
  onReact,
}: {
  message: MessageRow;
  currentUserId: string;
  mediaUrl?: string;
  onReply: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onPin: () => void;
  onReact: (emoji: string) => void;
}) {
  const mine = message.sender_id === currentUserId;

  return (
    <div className={`flex ${mine ? "justify-start" : "justify-end"}`}>
      <article
        className={`max-w-[88%] rounded-3xl border p-4 sm:max-w-[72%] ${
          mine
            ? "border-cyan-400/20 bg-cyan-500/10"
            : "border-white/10 bg-white/5"
        }`}
      >
        <div className="mb-2 flex items-center gap-2">
          <p className="text-sm font-black text-cyan-300">
            {message.sender_name}
          </p>

          {message.is_pinned && (
            <span className="text-xs text-amber-300">📌 مثبتة</span>
          )}
        </div>

        {message.media_type === "image" && mediaUrl && (
          <button
            type="button"
            onClick={() => window.open(mediaUrl, "_blank")}
            className="mb-3 block w-full"
          >
            <img
              src={mediaUrl}
              alt="صورة مرفقة"
              className="max-h-[420px] w-full rounded-2xl object-contain"
            />
          </button>
        )}

        {message.media_type === "video" && mediaUrl && (
          <video
            src={mediaUrl}
            controls
            playsInline
            className="mb-3 max-h-[420px] w-full rounded-2xl bg-black"
          />
        )}

        {message.media_type === "audio" && mediaUrl && (
          <audio src={mediaUrl} controls className="mb-3 w-full" />
        )}

        {message.media_url && !mediaUrl && (
          <p className="mb-3 text-sm text-slate-400">
            جاري تحميل المرفق...
          </p>
        )}

        {message.body && (
          <p className="whitespace-pre-wrap break-words leading-7">
            {message.body}
          </p>
        )}

        {Object.keys(message.reactions ?? {}).length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(message.reactions).map(
              ([emoji, users]) =>
                users.length > 0 && (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => onReact(emoji)}
                    className={`rounded-full border px-3 py-1 text-sm ${
                      users.includes(currentUserId)
                        ? "border-cyan-400/40 bg-cyan-500/15"
                        : "border-white/10 bg-white/5"
                    }`}
                  >
                    {emoji} {users.length}
                  </button>
                ),
            )}
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <time className="text-xs text-slate-500">
            {formatDate(message.created_at)}
            {message.edited_at ? " · تم التعديل" : ""}
          </time>

          <div className="flex flex-wrap items-center gap-2">
            {["❤️", "👍", "😂"].map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => onReact(emoji)}
                className="rounded-lg bg-white/5 px-2 py-1 text-sm"
              >
                {emoji}
              </button>
            ))}

            <button
              type="button"
              onClick={onReply}
              className="text-xs font-bold text-cyan-300"
            >
              رد
            </button>

            {mine && (
              <>
                <button
                  type="button"
                  onClick={onPin}
                  className="text-xs font-bold text-amber-300"
                >
                  {message.is_pinned ? "إلغاء التثبيت" : "تثبيت"}
                </button>

                {message.body && (
                  <button
                    type="button"
                    onClick={onEdit}
                    className="text-xs font-bold text-blue-300"
                  >
                    تعديل
                  </button>
                )}

                <button
                  type="button"
                  onClick={onDelete}
                  className="text-xs font-bold text-red-300"
                >
                  حذف
                </button>
              </>
            )}
          </div>
        </div>
      </article>
    </div>
  );
}

function UploadPreviewCard({
  upload,
  onRemove,
}: {
  upload: UploadPreview;
  onRemove: () => void;
}) {
  return (
    <div className="mb-3 rounded-2xl border border-white/10 bg-white/5 p-3">
      {upload.type === "image" ? (
        <img
          src={upload.url}
          alt="معاينة الصورة"
          className="max-h-72 w-full rounded-xl object-contain"
        />
      ) : upload.type === "video" ? (
        <video
          src={upload.url}
          controls
          playsInline
          className="max-h-72 w-full rounded-xl bg-black"
        />
      ) : (
        <audio src={upload.url} controls className="w-full" />
      )}

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="truncate text-sm text-slate-400">
          {upload.file.name}
        </p>

        <button
          type="button"
          onClick={onRemove}
          className="rounded-xl bg-red-500/15 px-4 py-2 text-sm font-bold text-red-200"
        >
          إزالة المرفق
        </button>
      </div>
    </div>
  );
}

function NoticeBox({
  title,
  text,
  onClose,
  accent,
}: {
  title: string;
  text: string;
  onClose: () => void;
  accent: "cyan" | "amber";
}) {
  const classes =
    accent === "cyan"
      ? "border-cyan-400/20 bg-cyan-500/10 text-cyan-300"
      : "border-amber-400/20 bg-amber-500/10 text-amber-300";

  return (
    <div
      className={`mb-3 flex items-center justify-between gap-3 rounded-2xl border p-3 ${classes}`}
    >
      <div className="min-w-0">
        <p className="text-xs font-bold">{title}</p>
        <p className="truncate text-sm text-slate-300">{text}</p>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="rounded-xl bg-white/10 px-3 py-2 text-sm"
      >
        ✕
      </button>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex min-h-[360px] items-center justify-center">
      <p className="rounded-2xl border border-dashed border-white/10 px-6 py-5 text-center text-slate-500">
        {text}
      </p>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ar-AE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
