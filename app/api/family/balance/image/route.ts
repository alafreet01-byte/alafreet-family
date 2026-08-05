import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const BUCKET = "family-balance-private";
const MAX_SIZE = 5 * 1024 * 1024;

async function requireMember() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "غير مصرح بالدخول.", status: 401 as const };
  const admin = createAdminClient();
  const { data: member } = await admin.from("family_members").select("id, role").eq("auth_user_id", user.id).maybeSingle();
  if (!member) return { error: "الحساب غير مربوط بالعائلة.", status: 403 as const };
  return { member, admin };
}

function isParent(role: string) {
  return role === "super_admin" || role === "school_admin";
}

export async function GET(request: Request) {
  const auth = await requireMember();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const url = new URL(request.url);
  const taskId = url.searchParams.get("taskId") ?? "";
  const path = url.searchParams.get("path") ?? "";
  const { data: task } = await auth.admin.from("core_events").select("id, metadata").eq("id", taskId).eq("event_type", "family.reflection_task").maybeSingle();
  if (!task) return NextResponse.json({ error: "المهمة غير موجودة." }, { status: 404 });
  if (!isParent(auth.member.role) && task.metadata?.childId !== auth.member.id) return NextResponse.json({ error: "غير مصرح بعرض الصورة." }, { status: 403 });
  const proofPaths = Array.isArray(task.metadata?.proofPaths) ? task.metadata.proofPaths : [];
  if (!proofPaths.includes(path)) return NextResponse.json({ error: "الصورة غير موجودة." }, { status: 404 });
  const { data, error } = await auth.admin.storage.from(BUCKET).createSignedUrl(path, 60 * 5);
  if (error || !data?.signedUrl) return NextResponse.json({ error: error?.message ?? "تعذر عرض الصورة." }, { status: 400 });
  return NextResponse.redirect(data.signedUrl);
}

export async function POST(request: Request) {
  const auth = await requireMember();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const form = await request.formData();
  const taskId = form.get("taskId");
  const file = form.get("image");
  if (typeof taskId !== "string" || !(file instanceof File)) return NextResponse.json({ error: "اختر صورة صحيحة." }, { status: 400 });
  if (!file.type.startsWith("image/") || file.size > MAX_SIZE) return NextResponse.json({ error: "الصورة يجب أن تكون أقل من 5 ميجابايت." }, { status: 400 });

  const { data: task } = await auth.admin.from("core_events").select("id, metadata").eq("id", taskId).eq("event_type", "family.reflection_task").maybeSingle();
  if (!task) return NextResponse.json({ error: "المهمة غير موجودة." }, { status: 404 });
  if (!isParent(auth.member.role) && task.metadata?.childId !== auth.member.id) return NextResponse.json({ error: "لا يمكنك رفع صور لهذه المهمة." }, { status: 403 });

  const currentPaths = Array.isArray(task.metadata?.proofPaths) ? task.metadata.proofPaths.filter((path: unknown) => typeof path === "string") : [];
  if (currentPaths.length >= 5) return NextResponse.json({ error: "الحد الأعلى 5 صور لكل مهمة." }, { status: 400 });

  const { data: buckets } = await auth.admin.storage.listBuckets();
  if (!buckets?.some((bucket) => bucket.id === BUCKET)) {
    const { error: bucketError } = await auth.admin.storage.createBucket(BUCKET, { public: false, fileSizeLimit: MAX_SIZE, allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"] });
    if (bucketError && !bucketError.message.toLowerCase().includes("already")) return NextResponse.json({ error: bucketError.message }, { status: 400 });
  }

  const extension = file.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "jpg";
  const path = `${taskId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error: uploadError } = await auth.admin.storage.from(BUCKET).upload(path, bytes, { contentType: file.type, upsert: false });
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 400 });

  const proofPaths = [...currentPaths, path];
  const { error: updateError } = await auth.admin.from("core_events").update({ metadata: { ...task.metadata, proofPaths } }).eq("id", taskId);
  if (updateError) {
    await auth.admin.storage.from(BUCKET).remove([path]);
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }
  const { data: signed } = await auth.admin.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
  return NextResponse.json({ path, url: signed?.signedUrl ?? "" });
}

export async function DELETE(request: Request) {
  const auth = await requireMember();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (!isParent(auth.member.role)) return NextResponse.json({ error: "حذف الصور للوالدين فقط." }, { status: 403 });

  const body = (await request.json()) as { taskId?: unknown; path?: unknown };
  if (typeof body.taskId !== "string" || typeof body.path !== "string") return NextResponse.json({ error: "بيانات الصورة غير صحيحة." }, { status: 400 });
  const { data: task } = await auth.admin.from("core_events").select("id, metadata").eq("id", body.taskId).eq("event_type", "family.reflection_task").maybeSingle();
  if (!task) return NextResponse.json({ error: "المهمة غير موجودة." }, { status: 404 });
  const proofPaths = (Array.isArray(task.metadata?.proofPaths) ? task.metadata.proofPaths : []).filter((path: unknown) => path !== body.path);
  const { error } = await auth.admin.from("core_events").update({ metadata: { ...task.metadata, proofPaths } }).eq("id", body.taskId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await auth.admin.storage.from(BUCKET).remove([body.path]);
  return NextResponse.json({ ok: true });
}
