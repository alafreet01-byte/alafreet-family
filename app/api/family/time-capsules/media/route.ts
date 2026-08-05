import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const BUCKET = "family-time-capsules";
const MAX_SIZE = 30 * 1024 * 1024;
const allowed = new Set(["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm", "audio/mpeg", "audio/mp4", "audio/webm", "audio/wav"]);

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "غير مصرح بالدخول." }, { status: 401 });
  const admin = createAdminClient();
  const { data: member } = await admin.from("family_members").select("id").eq("auth_user_id", user.id).maybeSingle();
  if (!member) return NextResponse.json({ error: "الحساب غير مربوط بالعائلة." }, { status: 403 });
  const form = await request.formData();
  const capsuleId = String(form.get("capsuleId") ?? "");
  const file = form.get("file");
  if (!(file instanceof File) || !allowed.has(file.type) || file.size > MAX_SIZE) return NextResponse.json({ error: "الملف غير مدعوم أو أكبر من 30 ميجابايت." }, { status: 400 });
  const { data: capsule } = await admin.from("core_events").select("id,actor_id,metadata").eq("id", capsuleId).eq("event_type", "family.time_capsule").maybeSingle();
  if (!capsule || capsule.actor_id !== member.id) return NextResponse.json({ error: "لا تملك صلاحية رفع الملف." }, { status: 403 });
  const { data: buckets } = await admin.storage.listBuckets();
  if (!buckets?.some((bucket) => bucket.id === BUCKET)) {
    const { error } = await admin.storage.createBucket(BUCKET, { public: false, fileSizeLimit: MAX_SIZE, allowedMimeTypes: Array.from(allowed) });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }
  const extension = file.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "") || "bin";
  const path = `${member.id}/${capsuleId}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await admin.storage.from(BUCKET).upload(path, await file.arrayBuffer(), { contentType: file.type });
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 400 });
  const { error: updateError } = await admin.from("core_events").update({ metadata: { ...capsule.metadata, mediaPath: path, mediaName: file.name, mediaType: file.type } }).eq("id", capsuleId);
  if (updateError) { await admin.storage.from(BUCKET).remove([path]); return NextResponse.json({ error: updateError.message }, { status: 400 }); }
  return NextResponse.json({ ok: true });
}
