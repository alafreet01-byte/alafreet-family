import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type Body = {
  id?: unknown;
  childId?: unknown;
  text?: unknown;
  category?: unknown;
  target?: unknown;
  completed?: unknown;
};

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

function isParent(role: string) {
  return role === "super_admin" || role === "school_admin";
}

export async function GET() {
  const auth = await requireMember();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { data: children } = await auth.admin
    .from("family_members")
    .select("id, name_ar, role")
    .in("role", ["student", "child"])
    .order("name_ar");

  let query = auth.admin
    .from("core_events")
    .select("id, title, details, metadata, created_at")
    .eq("event_type", "family.reflection_task")
    .order("created_at", { ascending: false });
  if (!isParent(auth.member.role)) query = query.eq("metadata->>childId", auth.member.id);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({
    viewer: auth.member,
    canManage: isParent(auth.member.role),
    children: children ?? [],
    tasks: (data ?? []).map((row) => ({
      id: row.id,
      text: row.title,
      note: row.details ?? "",
      category: row.metadata?.category ?? "عبارة",
      childId: row.metadata?.childId ?? "",
      childName: row.metadata?.childName ?? "",
      target: Number(row.metadata?.target ?? 50),
      completed: Number(row.metadata?.completed ?? 0),
      status: row.metadata?.status ?? "active",
      proofPaths: Array.isArray(row.metadata?.proofPaths) ? row.metadata.proofPaths : [],
      createdAt: row.created_at,
    })),
  });
}

export async function POST(request: Request) {
  const auth = await requireMember();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (!isParent(auth.member.role)) return NextResponse.json({ error: "الإضافة للوالدين فقط." }, { status: 403 });

  const body = (await request.json()) as Body;
  const childId = typeof body.childId === "string" ? body.childId : "";
  const text = typeof body.text === "string" ? body.text.trim() : "";
  const category = typeof body.category === "string" ? body.category : "عبارة";
  const target = Number(body.target);
  if (!childId || !text || !Number.isInteger(target) || target < 1 || target > 1000) {
    return NextResponse.json({ error: "اختر الطفل والنص وعددًا من 1 إلى 1000." }, { status: 400 });
  }

  const { data: child } = await auth.admin
    .from("family_members")
    .select("id, name_ar, role")
    .eq("id", childId)
    .in("role", ["student", "child"])
    .maybeSingle();
  if (!child) return NextResponse.json({ error: "حساب الطفل غير موجود." }, { status: 404 });

  const metadata = {
    childId: child.id,
    childName: child.name_ar,
    category,
    target,
    completed: 0,
    status: "active",
  };
  const { data, error } = await auth.admin
    .from("core_events")
    .insert({
      event_type: "family.reflection_task",
      title: text,
      details: "مهمة كتابة وتأمل أضافها أحد الوالدين.",
      actor_id: auth.member.id,
      metadata,
    })
    .select("id, title, details, metadata, created_at")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ task: { id: data.id, text: data.title, note: data.details, ...metadata, createdAt: data.created_at } }, { status: 201 });
}

export async function PATCH(request: Request) {
  const auth = await requireMember();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const body = (await request.json()) as Body;
  const id = typeof body.id === "string" ? body.id : "";
  const completed = Number(body.completed);
  if (!id || !Number.isInteger(completed) || completed < 0) {
    return NextResponse.json({ error: "بيانات الإنجاز غير صحيحة." }, { status: 400 });
  }

  const { data: task } = await auth.admin
    .from("core_events")
    .select("id, metadata")
    .eq("id", id)
    .eq("event_type", "family.reflection_task")
    .maybeSingle();
  if (!task) return NextResponse.json({ error: "المهمة غير موجودة." }, { status: 404 });
  if (!isParent(auth.member.role) && task.metadata?.childId !== auth.member.id) {
    return NextResponse.json({ error: "هذه المهمة ليست مخصصة لك." }, { status: 403 });
  }
  const target = Number(task.metadata?.target ?? 50);
  const safeCompleted = Math.min(completed, target);
  const metadata = { ...task.metadata, completed: safeCompleted, status: safeCompleted >= target ? "completed" : "active" };
  const { error } = await auth.admin.from("core_events").update({ metadata }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ completed: safeCompleted, status: metadata.status });
}

export async function DELETE(request: Request) {
  const auth = await requireMember();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (!isParent(auth.member.role)) return NextResponse.json({ error: "الحذف للوالدين فقط." }, { status: 403 });
  const body = (await request.json()) as Body;
  const id = typeof body.id === "string" ? body.id : "";
  if (!id) return NextResponse.json({ error: "معرّف المهمة مطلوب." }, { status: 400 });
  const { error } = await auth.admin.from("core_events").delete().eq("id", id).eq("event_type", "family.reflection_task");
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
