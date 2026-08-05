import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function requireMember() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "غير مصرح بالدخول.", status: 401 as const };

  const admin = createAdminClient();
  const { data: member } = await admin
    .from("family_members")
    .select("id, name_ar, role")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (!member) return { error: "الحساب غير مربوط بالعائلة.", status: 403 as const };
  return { member, admin };
}

const isParent = (role: string) => role === "super_admin" || role === "school_admin";

export async function GET() {
  const auth = await requireMember();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const [{ data: members }, { data: events, error }] = await Promise.all([
    auth.admin.from("family_members").select("id, name_ar, role").order("name_ar"),
    auth.admin
      .from("core_events")
      .select("id, title, details, actor_id, metadata, created_at")
      .eq("event_type", "family.time_capsule")
      .order("metadata->>unlockAt", { ascending: true }),
  ]);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const now = Date.now();
  const canManage = isParent(auth.member.role);
  const capsules = (events ?? [])
    .filter((event) =>
      canManage ||
      event.actor_id === auth.member.id ||
      event.metadata?.recipientId === "all" ||
      event.metadata?.recipientId === auth.member.id,
    )
    .map((event) => {
      const unlocked = new Date(event.metadata?.unlockAt ?? 0).getTime() <= now;
      const mayRead = unlocked || event.actor_id === auth.member.id || canManage;
      return {
        id: event.id,
        title: event.title,
        message: mayRead ? event.details ?? "" : "",
        senderId: event.actor_id,
        senderName: event.metadata?.senderName ?? "فرد من العائلة",
        recipientId: event.metadata?.recipientId ?? "all",
        recipientName: event.metadata?.recipientName ?? "العائلة",
        capsuleType: event.metadata?.capsuleType ?? "message",
        occasion: event.metadata?.occasion ?? "رسالة للمستقبل",
        unlockAt: event.metadata?.unlockAt,
        unlocked,
        canDelete: canManage || event.actor_id === auth.member.id,
        createdAt: event.created_at,
      };
    });

  return NextResponse.json({ viewer: auth.member, members: members ?? [], capsules });
}

export async function POST(request: Request) {
  const auth = await requireMember();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json();
  const title = String(body.title ?? "").trim();
  const message = String(body.message ?? "").trim();
  const recipientId = String(body.recipientId ?? "all");
  const unlockAt = String(body.unlockAt ?? "");
  const capsuleType = ["message", "photo", "video", "audio"].includes(String(body.capsuleType))
    ? String(body.capsuleType)
    : "message";

  if (!title || !message || !unlockAt || Number.isNaN(new Date(unlockAt).getTime())) {
    return NextResponse.json({ error: "العنوان والرسالة وتاريخ الفتح مطلوبة." }, { status: 400 });
  }

  let recipientName = "العائلة كاملة";
  if (recipientId !== "all") {
    const { data: recipient } = await auth.admin
      .from("family_members")
      .select("id, name_ar")
      .eq("id", recipientId)
      .maybeSingle();
    if (!recipient) return NextResponse.json({ error: "المستلم غير موجود." }, { status: 404 });
    recipientName = recipient.name_ar;
  }

  const { error } = await auth.admin.from("core_events").insert({
    event_type: "family.time_capsule",
    title,
    details: message,
    actor_id: auth.member.id,
    metadata: {
      senderName: auth.member.name_ar,
      recipientId,
      recipientName,
      unlockAt: new Date(unlockAt).toISOString(),
      capsuleType,
      occasion: String(body.occasion ?? "رسالة للمستقبل").trim(),
    },
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const auth = await requireMember();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id } = await request.json();
  const { data: event } = await auth.admin
    .from("core_events")
    .select("id, actor_id")
    .eq("id", String(id ?? ""))
    .eq("event_type", "family.time_capsule")
    .maybeSingle();
  if (!event) return NextResponse.json({ error: "الكبسولة غير موجودة." }, { status: 404 });
  if (!isParent(auth.member.role) && event.actor_id !== auth.member.id) {
    return NextResponse.json({ error: "لا تملك صلاحية الحذف." }, { status: 403 });
  }
  const { error } = await auth.admin.from("core_events").delete().eq("id", event.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
