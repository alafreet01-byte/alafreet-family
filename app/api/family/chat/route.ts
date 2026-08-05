import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const GIRLS = new Set(["khalifa", "amal", "reem", "aisha", "fatima"]);
const BOYS = new Set(["khalifa", "ahmed", "khalid", "saud", "mohammed"]);

async function authenticate() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "غير مصرح بالدخول.", status: 401 as const };
  const admin = createAdminClient();
  const { data: member } = await admin
    .from("family_members")
    .select("id,name_ar,role")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (!member)
    return { error: "الحساب غير مربوط بالعائلة.", status: 403 as const };
  return { admin, member };
}

function participants(conversationId: string) {
  if (conversationId === "group:family") return null;
  if (conversationId === "group:girls") return GIRLS;
  if (conversationId === "group:boys") return BOYS;
  if (conversationId.startsWith("private:"))
    return new Set(conversationId.slice(8).split("--"));
  return new Set<string>();
}

function mayAccess(memberId: string, conversationId: string) {
  const allowed = participants(conversationId);
  return allowed === null || allowed.has(memberId);
}

function privateId(a: string, b: string) {
  return `private:${[a, b].sort().join("--")}`;
}

export async function GET(request: Request) {
  const auth = await authenticate();
  if ("error" in auth)
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  const url = new URL(request.url);
  if (url.searchParams.get("summary") === "1") {
    const [{ data: rows, error }, { data: reads }] = await Promise.all([
      auth.admin
        .from("core_events")
        .select("id,details,actor_id,metadata,created_at")
        .eq("event_type", "family.chat_message")
        .order("created_at", { ascending: false })
        .limit(250),
      auth.admin
        .from("core_events")
        .select("metadata,created_at")
        .eq("event_type", "family.chat_read")
        .eq("actor_id", auth.member.id)
        .order("created_at", { ascending: false }),
    ]);
    if (error)
      return NextResponse.json({ error: error.message }, { status: 400 });
    const lastRead = new Map<string, number>();
    for (const read of reads ?? []) {
      const conversation = String(read.metadata?.conversationId ?? "");
      if (!lastRead.has(conversation))
        lastRead.set(
          conversation,
          new Date(read.metadata?.readAt ?? read.created_at).getTime(),
        );
    }
    const visible = (rows ?? []).filter(
      (row) =>
        row.actor_id !== auth.member.id &&
        mayAccess(auth.member.id, String(row.metadata?.conversationId ?? "")),
    );
    const recent = visible.map((row) => ({
      id: row.id,
      text:
        row.details ||
        (row.metadata?.mediaType?.startsWith("image/")
          ? "أرسل صورة"
          : row.metadata?.mediaType?.startsWith("video/")
            ? "أرسل فيديو"
            : "أرسل ملفًا"),
      senderName: row.metadata?.senderName ?? "فرد من العائلة",
      conversationId: row.metadata?.conversationId ?? "group:family",
      createdAt: row.created_at,
    }));
    const unreadByConversation: Record<string, number> = {};
    for (const row of visible) {
      const conversation = String(row.metadata?.conversationId ?? "");
      if (
        new Date(row.created_at).getTime() > (lastRead.get(conversation) ?? 0)
      )
        unreadByConversation[conversation] =
          (unreadByConversation[conversation] ?? 0) + 1;
    }
    return NextResponse.json({
      messages: recent,
      unreadByConversation,
      totalUnread: Object.values(unreadByConversation).reduce(
        (sum, count) => sum + count,
        0,
      ),
    });
  }
  const selected = url.searchParams.get("conversation") || "group:family";
  if (!mayAccess(auth.member.id, selected))
    return NextResponse.json(
      { error: "لا تملك صلاحية فتح هذه المحادثة." },
      { status: 403 },
    );

  const [
    { data: members },
    { data: rows, error },
    { data: statusRows },
    { data: allRows },
    { data: readRows },
    { data: participantReads },
    { data: presenceRows },
  ] = await Promise.all([
    auth.admin
      .from("family_members")
      .select("id,name_ar,role,color")
      .not("auth_user_id", "is", null)
      .order("name_ar"),
    auth.admin
      .from("core_events")
      .select("id,title,details,actor_id,metadata,created_at")
      .eq("event_type", "family.chat_message")
      .eq("metadata->>conversationId", selected)
      .order("created_at", { ascending: true })
      .limit(250),
    auth.admin
      .from("core_events")
      .select("id,details,actor_id,metadata,created_at")
      .eq("event_type", "family.chat_status")
      .gte("metadata->>expiresAt", new Date().toISOString())
      .order("created_at", { ascending: false }),
    auth.admin
      .from("core_events")
      .select("actor_id,metadata,created_at")
      .eq("event_type", "family.chat_message")
      .order("created_at", { ascending: false })
      .limit(500),
    auth.admin
      .from("core_events")
      .select("metadata,created_at")
      .eq("event_type", "family.chat_read")
      .eq("actor_id", auth.member.id)
      .order("created_at", { ascending: false }),
    auth.admin
      .from("core_events")
      .select("actor_id,metadata,created_at")
      .eq("event_type", "family.chat_read")
      .eq("metadata->>conversationId", selected)
      .order("created_at", { ascending: false }),
    auth.admin
      .from("core_events")
      .select("actor_id,metadata,created_at")
      .eq("event_type", "family.chat_presence")
      .order("created_at", { ascending: false })
      .limit(30),
  ]);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });

  const readMap = new Map<string, number>();
  for (const read of readRows ?? []) {
    const id = String(read.metadata?.conversationId ?? "");
    if (!readMap.has(id))
      readMap.set(
        id,
        new Date(read.metadata?.readAt ?? read.created_at).getTime(),
      );
  }
  const unreadCounts: Record<string, number> = {};
  for (const row of allRows ?? []) {
    const id = String(row.metadata?.conversationId ?? "");
    if (
      row.actor_id !== auth.member.id &&
      mayAccess(auth.member.id, id) &&
      new Date(row.created_at).getTime() > (readMap.get(id) ?? 0)
    )
      unreadCounts[id] = (unreadCounts[id] ?? 0) + 1;
  }
  const conversations = [
    { id: "group:family", name: "قروب العائلة", icon: "👨‍👩‍👧‍👦", kind: "group" },
    ...(GIRLS.has(auth.member.id)
      ? [{ id: "group:girls", name: "قروب البنات", icon: "👩‍👧‍👧", kind: "group" }]
      : []),
    ...(BOYS.has(auth.member.id)
      ? [{ id: "group:boys", name: "قروب الأولاد", icon: "👨‍👦‍👦", kind: "group" }]
      : []),
    ...(members ?? [])
      .filter((member) => member.id !== auth.member.id)
      .map((member) => ({
        id: privateId(auth.member.id, member.id),
        name: member.name_ar,
        icon: "👤",
        kind: "private",
        memberId: member.id,
      })),
  ].map((item) => ({ ...item, unread: unreadCounts[item.id] ?? 0 }));

  const messages = await Promise.all(
    (rows ?? []).map(async (row) => {
      let mediaUrl = "";
      if (row.metadata?.mediaPath) {
        const { data } = await auth.admin.storage
          .from("family-chat-v2")
          .createSignedUrl(row.metadata.mediaPath, 3600);
        mediaUrl = data?.signedUrl ?? "";
      }
      const messageTime = new Date(row.created_at).getTime();
      const readBy = [
        ...new Set(
          (participantReads ?? [])
            .filter(
              (read) =>
                read.actor_id !== row.actor_id &&
                new Date(read.metadata?.readAt ?? read.created_at).getTime() >=
                  messageTime,
            )
            .map((read) => read.actor_id),
        ),
      ];
      return {
        id: row.id,
        text: row.details ?? "",
        senderId: row.actor_id,
        senderName: row.metadata?.senderName ?? "فرد من العائلة",
        createdAt: row.created_at,
        mediaUrl,
        mediaType: row.metadata?.mediaType ?? "",
        mediaName: row.metadata?.mediaName ?? "",
        mine: row.actor_id === auth.member.id,
        read: readBy.length > 0,
        readByCount: readBy.length,
        replyTo: row.metadata?.replyTo ?? null,
        reactions: row.metadata?.reactions ?? {},
      };
    }),
  );
  const statuses = await Promise.all(
    (statusRows ?? []).map(async (row) => {
      const { data } = await auth.admin.storage
        .from("family-chat-v2")
        .createSignedUrl(row.metadata?.mediaPath ?? "", 3600);
      return {
        id: row.id,
        senderId: row.actor_id,
        senderName: row.metadata?.senderName ?? "فرد من العائلة",
        caption: row.details ?? "",
        mediaUrl: data?.signedUrl ?? "",
        mediaType: row.metadata?.mediaType ?? "",
        createdAt: row.created_at,
        mine: row.actor_id === auth.member.id,
        viewCount: Array.isArray(row.metadata?.viewers)
          ? row.metadata.viewers.length
          : 0,
      };
    }),
  );
  const now = Date.now();
  const presence = (presenceRows ?? [])
    .filter(
      (row, index, list) =>
        list.findIndex((item) => item.actor_id === row.actor_id) === index &&
        row.actor_id !== auth.member.id &&
        now - new Date(row.metadata?.lastSeen ?? row.created_at).getTime() <
          45_000,
    )
    .map((row) => ({
      memberId: row.actor_id,
      name: row.metadata?.memberName ?? "فرد من العائلة",
      typing:
        row.metadata?.conversationId === selected &&
        Boolean(row.metadata?.typing) &&
        now - new Date(row.metadata?.lastSeen ?? row.created_at).getTime() <
          8_000,
    }));
  return NextResponse.json({
    viewer: auth.member,
    members: members ?? [],
    conversations,
    selected,
    messages,
    statuses,
    presence,
  });
}

export async function POST(request: Request) {
  const auth = await authenticate();
  if ("error" in auth)
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  const body = await request.json();
  const conversationId = String(body.conversationId ?? "group:family");
  const text = String(body.text ?? "")
    .trim()
    .slice(0, 4000);
  if (!mayAccess(auth.member.id, conversationId))
    return NextResponse.json(
      { error: "لا تملك صلاحية الإرسال هنا." },
      { status: 403 },
    );
  if (!text)
    return NextResponse.json({ error: "اكتب رسالة أولًا." }, { status: 400 });
  const replyTo =
    body.replyTo && typeof body.replyTo === "object"
      ? {
          id: String(body.replyTo.id ?? ""),
          senderName: String(body.replyTo.senderName ?? "").slice(0, 80),
          text: String(body.replyTo.text ?? "").slice(0, 180),
        }
      : null;
  const { data, error } = await auth.admin
    .from("core_events")
    .insert({
      event_type: "family.chat_message",
      title: "رسالة عائلية",
      details: text,
      actor_id: auth.member.id,
      metadata: {
        conversationId,
        senderName: auth.member.name_ar,
        messageType: "text",
        replyTo,
      },
    })
    .select("id")
    .single();
  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, id: data.id });
}

export async function PATCH(request: Request) {
  const auth = await authenticate();
  if ("error" in auth)
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  const body = await request.json();
  const conversationId = String(body.conversationId ?? "");
  if (!mayAccess(auth.member.id, conversationId))
    return NextResponse.json(
      { error: "لا تملك صلاحية فتح هذه المحادثة." },
      { status: 403 },
    );
  if (body.action === "presence") {
    const { data: existing } = await auth.admin
      .from("core_events")
      .select("id")
      .eq("event_type", "family.chat_presence")
      .eq("actor_id", auth.member.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const metadata = {
      conversationId,
      memberName: auth.member.name_ar,
      typing: Boolean(body.typing),
      lastSeen: new Date().toISOString(),
    };
    const result = existing
      ? await auth.admin
          .from("core_events")
          .update({ metadata })
          .eq("id", existing.id)
      : await auth.admin.from("core_events").insert({
          event_type: "family.chat_presence",
          title: "حالة الاتصال",
          actor_id: auth.member.id,
          metadata,
        });
    if (result.error)
      return NextResponse.json(
        { error: result.error.message },
        { status: 400 },
      );
    return NextResponse.json({ ok: true });
  }
  if (body.action === "reaction") {
    const emoji = ["👍", "❤️", "😂", "😮", "🙏"].includes(String(body.emoji))
      ? String(body.emoji)
      : "👍";
    const { data: message } = await auth.admin
      .from("core_events")
      .select("id,metadata")
      .eq("id", String(body.messageId ?? ""))
      .eq("event_type", "family.chat_message")
      .maybeSingle();
    if (!message || message.metadata?.conversationId !== conversationId)
      return NextResponse.json(
        { error: "الرسالة غير موجودة." },
        { status: 404 },
      );
    const reactions = { ...(message.metadata?.reactions ?? {}) } as Record<
      string,
      string[]
    >;
    for (const key of Object.keys(reactions))
      reactions[key] = reactions[key].filter((id) => id !== auth.member.id);
    reactions[emoji] = [...(reactions[emoji] ?? []), auth.member.id];
    const { error } = await auth.admin
      .from("core_events")
      .update({ metadata: { ...message.metadata, reactions } })
      .eq("id", message.id);
    if (error)
      return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }
  if (body.action === "statusView") {
    const { data: status } = await auth.admin
      .from("core_events")
      .select("id,actor_id,metadata")
      .eq("id", String(body.statusId ?? ""))
      .eq("event_type", "family.chat_status")
      .maybeSingle();
    if (!status)
      return NextResponse.json(
        { error: "الحالة غير موجودة." },
        { status: 404 },
      );
    const viewers = Array.isArray(status.metadata?.viewers)
      ? status.metadata.viewers
      : [];
    if (
      status.actor_id !== auth.member.id &&
      !viewers.some((item: { id?: string }) => item.id === auth.member.id)
    )
      viewers.push({
        id: auth.member.id,
        name: auth.member.name_ar,
        viewedAt: new Date().toISOString(),
      });
    const { error } = await auth.admin
      .from("core_events")
      .update({ metadata: { ...status.metadata, viewers } })
      .eq("id", status.id);
    if (error)
      return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }
  const { data: existing } = await auth.admin
    .from("core_events")
    .select("id")
    .eq("event_type", "family.chat_read")
    .eq("actor_id", auth.member.id)
    .eq("metadata->>conversationId", conversationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const metadata = { conversationId, readAt: new Date().toISOString() };
  const result = existing
    ? await auth.admin
        .from("core_events")
        .update({ metadata })
        .eq("id", existing.id)
    : await auth.admin.from("core_events").insert({
        event_type: "family.chat_read",
        title: "قراءة المحادثة",
        actor_id: auth.member.id,
        metadata,
      });
  if (result.error)
    return NextResponse.json({ error: result.error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const auth = await authenticate();
  if ("error" in auth)
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id, kind } = await request.json();
  const eventType =
    kind === "status" ? "family.chat_status" : "family.chat_message";
  const { data: message } = await auth.admin
    .from("core_events")
    .select("id,actor_id,metadata")
    .eq("id", String(id ?? ""))
    .eq("event_type", eventType)
    .maybeSingle();
  if (!message || message.actor_id !== auth.member.id)
    return NextResponse.json(
      { error: "يمكنك حذف رسائلك فقط." },
      { status: 403 },
    );
  if (message.metadata?.mediaPath)
    await auth.admin.storage
      .from("family-chat-v2")
      .remove([message.metadata.mediaPath]);
  const { error } = await auth.admin
    .from("core_events")
    .delete()
    .eq("id", message.id);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
