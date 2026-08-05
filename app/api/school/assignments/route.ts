import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type AssignmentBody = {
  id?: unknown;
  studentId?: unknown;
  subject?: unknown;
  title?: unknown;
  details?: unknown;
  dueAt?: unknown;
  status?: unknown;
};

type EventRow = {
  id: string;
  target_id: string | null;
  title: string;
  details: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

const STATUSES = new Set(["new", "progress", "done", "late"]);

function toAssignment(row: EventRow) {
  const metadata = row.metadata ?? {};
  return {
    id: row.id,
    student_id: row.target_id ?? "",
    subject: typeof metadata.subject === "string" ? metadata.subject : "عام",
    title: row.title,
    details: row.details,
    due_at: typeof metadata.due_at === "string" ? metadata.due_at : null,
    status: typeof metadata.status === "string" ? metadata.status : "new",
    source: typeof metadata.source === "string" ? metadata.source : "manual",
    attachment_url: null,
    created_at: row.created_at,
  };
}

async function requireMember() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "غير مصرح بالدخول.", status: 401 as const };

  const admin = createAdminClient();
  const { data: member, error } = await admin
    .from("family_members")
    .select("id, role")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (error || !member) {
    return { error: "الحساب غير مربوط بفرد من العائلة.", status: 403 as const };
  }
  return { member, admin };
}

export async function GET() {
  const auth = await requireMember();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const isManager = auth.member.role === "super_admin" || auth.member.role === "school_admin";
  let query = auth.admin
    .from("core_events")
    .select("id, target_id, title, details, metadata, created_at")
    .eq("event_type", "school.assignment")
    .order("created_at", { ascending: false });
  if (!isManager) query = query.eq("target_id", auth.member.id);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ assignments: (data ?? []).map(toAssignment), viewer: auth.member });
}

export async function POST(request: Request) {
  const auth = await requireMember();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const isManager = auth.member.role === "super_admin" || auth.member.role === "school_admin";
  const canAddForSelf = auth.member.role === "student" || auth.member.role === "child";
  if (!isManager && !canAddForSelf) {
    return NextResponse.json({ error: "لا تملك صلاحية إضافة واجب." }, { status: 403 });
  }

  const body = (await request.json()) as AssignmentBody;
  const studentId = typeof body.studentId === "string" ? body.studentId : "";
  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const details = typeof body.details === "string" ? body.details.trim() : "";
  const dueAt = typeof body.dueAt === "string" && body.dueAt ? body.dueAt : null;
  if (!studentId || !subject || !title) {
    return NextResponse.json({ error: "الطالب والمادة والعنوان مطلوبة." }, { status: 400 });
  }

  if (!isManager && studentId !== auth.member.id) {
    return NextResponse.json(
      { error: "يمكنك إضافة واجب لنفسك فقط." },
      { status: 403 },
    );
  }

  const { data: student } = await auth.admin
    .from("family_members")
    .select("id")
    .eq("id", studentId)
    .in("role", ["student", "child"])
    .maybeSingle();
  if (!student) return NextResponse.json({ error: "الطالب غير موجود." }, { status: 404 });

  const { data, error } = await auth.admin
    .from("core_events")
    .insert({
      event_type: "school.assignment",
      title,
      details: details || null,
      actor_id: auth.member.id,
      target_id: studentId,
      metadata: { subject, due_at: dueAt, status: "new", source: "manual" },
    })
    .select("id, target_id, title, details, metadata, created_at")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ assignment: toAssignment(data) }, { status: 201 });
}

export async function PATCH(request: Request) {
  const auth = await requireMember();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const body = (await request.json()) as AssignmentBody;
  const id = typeof body.id === "string" ? body.id : "";
  const status = typeof body.status === "string" ? body.status : "";
  if (!id || !STATUSES.has(status)) {
    return NextResponse.json({ error: "بيانات التحديث غير صالحة." }, { status: 400 });
  }

  const { data: existing } = await auth.admin
    .from("core_events")
    .select("id, target_id, title, details, metadata, created_at")
    .eq("id", id)
    .eq("event_type", "school.assignment")
    .maybeSingle();
  if (!existing) return NextResponse.json({ error: "المهمة غير موجودة." }, { status: 404 });

  const isManager = auth.member.role === "super_admin" || auth.member.role === "school_admin";
  if (!isManager && existing.target_id !== auth.member.id) {
    return NextResponse.json({ error: "لا يمكنك تعديل مهمة مستخدم آخر." }, { status: 403 });
  }

  const { data, error } = await auth.admin
    .from("core_events")
    .update({ metadata: { ...(existing.metadata ?? {}), status } })
    .eq("id", id)
    .select("id, target_id, title, details, metadata, created_at")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ assignment: toAssignment(data) });
}

export async function DELETE(request: Request) {
  const auth = await requireMember();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (auth.member.role !== "super_admin" && auth.member.role !== "school_admin") {
    return NextResponse.json({ error: "الحذف متاح للأب وأمل فقط." }, { status: 403 });
  }
  const body = (await request.json()) as AssignmentBody;
  const id = typeof body.id === "string" ? body.id : "";
  if (!id) return NextResponse.json({ error: "معرّف المهمة مطلوب." }, { status: 400 });
  const { error } = await auth.admin.from("core_events").delete().eq("id", id).eq("event_type", "school.assignment");
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
