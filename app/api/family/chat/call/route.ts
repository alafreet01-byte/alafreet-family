import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function auth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data: member } = await admin.from("family_members").select("id,name_ar").eq("auth_user_id", user.id).maybeSingle();
  return member ? { admin, member } : null;
}

export async function GET(request: Request) {
  const a = await auth();
  if (!a) return NextResponse.json({ error: "غير مصرح بالدخول." }, { status: 401 });
  const url = new URL(request.url);
  const conversationId = url.searchParams.get("conversation") ?? "";
  const since = url.searchParams.get("since") ?? new Date(Date.now() - 60_000).toISOString();
  const members = conversationId.startsWith("private:") ? conversationId.slice(8).split("--") : [];
  if (!members.includes(a.member.id)) return NextResponse.json({ error: "المكالمة الخاصة غير متاحة." }, { status: 403 });
  const { data, error } = await a.admin.from("core_events").select("id,actor_id,metadata,created_at").eq("event_type", "family.video_signal").eq("metadata->>conversationId", conversationId).gte("created_at", since).order("created_at");
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ viewer: a.member, signals: (data ?? []).filter((row) => row.metadata?.targetId === a.member.id).map((row) => ({ id: row.id, senderId: row.actor_id, senderName: row.metadata?.senderName, type: row.metadata?.signalType, payload: row.metadata?.payload, createdAt: row.created_at })) });
}

export async function POST(request: Request) {
  const a = await auth();
  if (!a) return NextResponse.json({ error: "غير مصرح بالدخول." }, { status: 401 });
  const body = await request.json();
  const conversationId = String(body.conversationId ?? "");
  const targetId = String(body.targetId ?? "");
  const members = conversationId.startsWith("private:") ? conversationId.slice(8).split("--") : [];
  if (members.length !== 2 || !members.includes(a.member.id) || !members.includes(targetId)) return NextResponse.json({ error: "بيانات المكالمة غير صحيحة." }, { status: 403 });
  const signalType = String(body.type ?? "");
  if (!["offer", "answer", "candidate", "hangup", "decline"].includes(signalType)) return NextResponse.json({ error: "إشارة غير مدعومة." }, { status: 400 });
  const { error } = await a.admin.from("core_events").insert({ event_type: "family.video_signal", title: "إشارة مكالمة فيديو", actor_id: a.member.id, metadata: { conversationId, targetId, senderName: a.member.name_ar, signalType, payload: body.payload ?? null } });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
