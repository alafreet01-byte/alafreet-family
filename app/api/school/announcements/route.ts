import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type AnnouncementBody = {
  id?: unknown;
  title?: unknown;
  detail?: unknown;
  type?: unknown;
};

async function requireMember() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "غير مصرح بالدخول.", status: 401 as const };

  const admin = createAdminClient();
  const { data: member } = await admin
    .from("family_members")
    .select("id, role")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (!member) return { error: "الحساب غير مربوط بالعائلة.", status: 403 as const };
  return { member, admin };
}

function isManager(role: string) {
  return role === "super_admin" || role === "school_admin";
}

export async function GET() {
  const auth = await requireMember();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { data, error } = await auth.admin
    .from("core_events")
    .select("id, title, details, metadata, created_at")
    .eq("event_type", "school.announcement")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({
    announcements: (data ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      detail: row.details ?? "",
      type: typeof row.metadata?.type === "string" ? row.metadata.type : "إعلان",
      createdAt: row.created_at,
    })),
    canManage: isManager(auth.member.role),
  });
}

export async function POST(request: Request) {
  const auth = await requireMember();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (!isManager(auth.member.role)) {
    return NextResponse.json({ error: "الإضافة متاحة للأب وأمل فقط." }, { status: 403 });
  }

  const body = (await request.json()) as AnnouncementBody;
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const detail = typeof body.detail === "string" ? body.detail.trim() : "";
  const type = typeof body.type === "string" ? body.type.trim() : "إعلان";
  if (!title || !detail) {
    return NextResponse.json({ error: "عنوان الإعلان وتفاصيله مطلوبة." }, { status: 400 });
  }

  const { data, error } = await auth.admin
    .from("core_events")
    .insert({
      event_type: "school.announcement",
      title,
      details: detail,
      actor_id: auth.member.id,
      metadata: { type },
    })
    .select("id, title, details, metadata, created_at")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({
    announcement: {
      id: data.id,
      title: data.title,
      detail: data.details ?? "",
      type: typeof data.metadata?.type === "string" ? data.metadata.type : "إعلان",
      createdAt: data.created_at,
    },
  }, { status: 201 });
}

export async function DELETE(request: Request) {
  const auth = await requireMember();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (!isManager(auth.member.role)) {
    return NextResponse.json({ error: "الحذف متاح للأب وأمل فقط." }, { status: 403 });
  }

  const body = (await request.json()) as AnnouncementBody;
  const id = typeof body.id === "string" ? body.id : "";
  if (!id) return NextResponse.json({ error: "معرّف الإعلان مطلوب." }, { status: 400 });
  const { error } = await auth.admin
    .from("core_events")
    .delete()
    .eq("id", id)
    .eq("event_type", "school.announcement");
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
