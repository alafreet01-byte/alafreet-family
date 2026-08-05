import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function requireMember() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "غير مصرح بالدخول.", status: 401 as const };
  const admin = createAdminClient();
  const { data: member } = await admin.from("family_members").select("id, name_ar, role").eq("auth_user_id", user.id).maybeSingle();
  if (!member) return { error: "الحساب غير مربوط بالعائلة.", status: 403 as const };
  return { member, admin };
}
const isParent = (role: string) => role === "super_admin" || role === "school_admin";

export async function GET() {
  const auth = await requireMember();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const [{ data: members }, { data: events, error }] = await Promise.all([
    auth.admin.from("family_members").select("id, name_ar, role").order("name_ar"),
    auth.admin.from("core_events").select("id, title, details, actor_id, metadata, created_at").eq("event_type", "family.calendar_event").order("metadata->>startsAt", { ascending: true }),
  ]);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const canManage = isParent(auth.member.role);
  return NextResponse.json({
    viewer: auth.member, canManage, members: members ?? [],
    events: (events ?? []).filter((event) => canManage || event.metadata?.memberId === "all" || event.metadata?.memberId === auth.member.id).map((event) => ({ id: event.id, title: event.title, note: event.details ?? "", memberId: event.metadata?.memberId ?? "all", memberName: event.metadata?.memberName ?? "العائلة", category: event.metadata?.category ?? "عائلة", startsAt: event.metadata?.startsAt, reminder: Number(event.metadata?.reminder ?? 30), actorId: event.actor_id })),
  });
}

export async function POST(request: Request) {
  const auth = await requireMember();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const body = await request.json();
  const title = String(body.title ?? "").trim(); const note = String(body.note ?? "").trim(); const category = String(body.category ?? "عائلة"); const startsAt = String(body.startsAt ?? ""); const reminder = Number(body.reminder ?? 30);
  let memberId = String(body.memberId ?? auth.member.id);
  if (!isParent(auth.member.role)) memberId = auth.member.id;
  if (!title || !startsAt || Number.isNaN(new Date(startsAt).getTime())) return NextResponse.json({ error: "أدخل اسم الموعد وتاريخه ووقته." }, { status: 400 });
  let memberName = "العائلة";
  if (memberId !== "all") {
    const { data: member } = await auth.admin.from("family_members").select("id, name_ar").eq("id", memberId).maybeSingle();
    if (!member) return NextResponse.json({ error: "فرد العائلة غير موجود." }, { status: 404 });
    memberName = member.name_ar;
  }
  const { error } = await auth.admin.from("core_events").insert({ event_type: "family.calendar_event", title, details: note, actor_id: auth.member.id, metadata: { memberId, memberName, category, startsAt, reminder } });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const auth = await requireMember();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id } = await request.json();
  const { data: event } = await auth.admin.from("core_events").select("id, actor_id, metadata").eq("id", String(id ?? "")).eq("event_type", "family.calendar_event").maybeSingle();
  if (!event) return NextResponse.json({ error: "الموعد غير موجود." }, { status: 404 });
  if (!isParent(auth.member.role) && event.actor_id !== auth.member.id && event.metadata?.memberId !== auth.member.id) return NextResponse.json({ error: "لا تملك صلاحية حذف هذا الموعد." }, { status: 403 });
  const { error } = await auth.admin.from("core_events").delete().eq("id", event.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
