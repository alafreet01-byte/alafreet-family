import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const GIRLS = new Set(["khalifa", "amal", "reem", "aisha", "fatima"]);
const BOYS = new Set(["khalifa", "ahmed", "khalid", "saud", "mohammed"]);

async function authenticate() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "غير مصرح بالدخول.", status: 401 as const };
  const admin = createAdminClient();
  const { data: member } = await admin.from("family_members").select("id,name_ar,role").eq("auth_user_id", user.id).maybeSingle();
  if (!member) return { error: "الحساب غير مربوط بالعائلة.", status: 403 as const };
  return { admin, member };
}

function participants(conversationId: string) {
  if (conversationId === "group:family") return null;
  if (conversationId === "group:girls") return GIRLS;
  if (conversationId === "group:boys") return BOYS;
  if (conversationId.startsWith("private:")) return new Set(conversationId.slice(8).split("--"));
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
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const url = new URL(request.url);
  if (url.searchParams.get("summary") === "1") {
    const { data: rows, error } = await auth.admin.from("core_events").select("id,details,actor_id,metadata,created_at").eq("event_type", "family.chat_message").order("created_at", { ascending: false }).limit(80);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    const recent = (rows ?? []).filter((row) => row.actor_id !== auth.member.id && mayAccess(auth.member.id, String(row.metadata?.conversationId ?? ""))).map((row) => ({
      id: row.id,
      text: row.details || (row.metadata?.mediaType?.startsWith("image/") ? "أرسل صورة" : row.metadata?.mediaType?.startsWith("video/") ? "أرسل فيديو" : "أرسل ملفًا"),
      senderName: row.metadata?.senderName ?? "فرد من العائلة",
      conversationId: row.metadata?.conversationId ?? "group:family",
      createdAt: row.created_at,
    }));
    return NextResponse.json({ messages: recent });
  }
  const selected = url.searchParams.get("conversation") || "group:family";
  if (!mayAccess(auth.member.id, selected)) return NextResponse.json({ error: "لا تملك صلاحية فتح هذه المحادثة." }, { status: 403 });

  const [{ data: members }, { data: rows, error }] = await Promise.all([
    auth.admin.from("family_members").select("id,name_ar,role,color").not("auth_user_id", "is", null).order("name_ar"),
    auth.admin.from("core_events").select("id,title,details,actor_id,metadata,created_at").eq("event_type", "family.chat_message").eq("metadata->>conversationId", selected).order("created_at", { ascending: true }).limit(250),
  ]);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const conversations = [
    { id: "group:family", name: "قروب العائلة", icon: "👨‍👩‍👧‍👦", kind: "group" },
    ...(GIRLS.has(auth.member.id) ? [{ id: "group:girls", name: "قروب البنات", icon: "👩‍👧‍👧", kind: "group" }] : []),
    ...(BOYS.has(auth.member.id) ? [{ id: "group:boys", name: "قروب الأولاد", icon: "👨‍👦‍👦", kind: "group" }] : []),
    ...(members ?? []).filter((member) => member.id !== auth.member.id).map((member) => ({ id: privateId(auth.member.id, member.id), name: member.name_ar, icon: "👤", kind: "private", memberId: member.id })),
  ];

  const messages = await Promise.all((rows ?? []).map(async (row) => {
    let mediaUrl = "";
    if (row.metadata?.mediaPath) {
      const { data } = await auth.admin.storage.from("family-chat-v2").createSignedUrl(row.metadata.mediaPath, 3600);
      mediaUrl = data?.signedUrl ?? "";
    }
    return { id: row.id, text: row.details ?? "", senderId: row.actor_id, senderName: row.metadata?.senderName ?? "فرد من العائلة", createdAt: row.created_at, mediaUrl, mediaType: row.metadata?.mediaType ?? "", mediaName: row.metadata?.mediaName ?? "", mine: row.actor_id === auth.member.id };
  }));
  return NextResponse.json({ viewer: auth.member, members: members ?? [], conversations, selected, messages });
}

export async function POST(request: Request) {
  const auth = await authenticate();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const body = await request.json();
  const conversationId = String(body.conversationId ?? "group:family");
  const text = String(body.text ?? "").trim().slice(0, 4000);
  if (!mayAccess(auth.member.id, conversationId)) return NextResponse.json({ error: "لا تملك صلاحية الإرسال هنا." }, { status: 403 });
  if (!text) return NextResponse.json({ error: "اكتب رسالة أولًا." }, { status: 400 });
  const { data, error } = await auth.admin.from("core_events").insert({ event_type: "family.chat_message", title: "رسالة عائلية", details: text, actor_id: auth.member.id, metadata: { conversationId, senderName: auth.member.name_ar, messageType: "text" } }).select("id").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, id: data.id });
}

export async function DELETE(request: Request) {
  const auth = await authenticate();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id } = await request.json();
  const { data: message } = await auth.admin.from("core_events").select("id,actor_id,metadata").eq("id", String(id ?? "")).eq("event_type", "family.chat_message").maybeSingle();
  if (!message || message.actor_id !== auth.member.id) return NextResponse.json({ error: "يمكنك حذف رسائلك فقط." }, { status: 403 });
  if (message.metadata?.mediaPath) await auth.admin.storage.from("family-chat-v2").remove([message.metadata.mediaPath]);
  const { error } = await auth.admin.from("core_events").delete().eq("id", message.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
