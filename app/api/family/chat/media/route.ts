import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const BUCKET = "family-chat-v2";
const MAX_SIZE = 20 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/quicktime", "audio/mpeg", "audio/mp4", "audio/webm"]);
const GIRLS = new Set(["khalifa", "amal", "reem", "aisha", "fatima"]);
const BOYS = new Set(["khalifa", "ahmed", "khalid", "saud", "mohammed"]);

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "غير مصرح بالدخول." }, { status: 401 });
  const admin = createAdminClient();
  const { data: member } = await admin.from("family_members").select("id,name_ar").eq("auth_user_id", user.id).maybeSingle();
  if (!member) return NextResponse.json({ error: "الحساب غير مربوط بالعائلة." }, { status: 403 });
  const form = await request.formData();
  const file = form.get("file");
  const conversationId = String(form.get("conversationId") ?? "group:family");
  const privateMembers = conversationId.startsWith("private:") ? conversationId.slice(8).split("--") : [];
  if (privateMembers.length && !privateMembers.includes(member.id)) return NextResponse.json({ error: "لا تملك صلاحية الإرسال هنا." }, { status: 403 });
  if (conversationId === "group:girls" && !GIRLS.has(member.id)) return NextResponse.json({ error: "هذه المجموعة لأعضائها فقط." }, { status: 403 });
  if (conversationId === "group:boys" && !BOYS.has(member.id)) return NextResponse.json({ error: "هذه المجموعة لأعضائها فقط." }, { status: 403 });
  if (!(file instanceof File) || !ALLOWED.has(file.type) || file.size > MAX_SIZE) return NextResponse.json({ error: "الملف غير مدعوم أو أكبر من 20 ميجابايت." }, { status: 400 });
  const { data: buckets } = await admin.storage.listBuckets();
  if (!buckets?.some((bucket) => bucket.id === BUCKET)) {
    const { error } = await admin.storage.createBucket(BUCKET, { public: false, fileSizeLimit: MAX_SIZE, allowedMimeTypes: [...ALLOWED] });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }
  const extension = file.name.split(".").pop()?.replace(/[^a-z0-9]/gi, "") || "bin";
  const path = `${member.id}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await admin.storage.from(BUCKET).upload(path, await file.arrayBuffer(), { contentType: file.type });
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 400 });
  const { error } = await admin.from("core_events").insert({ event_type: "family.chat_message", title: "مرفق عائلي", details: String(form.get("caption") ?? "").trim().slice(0, 1000), actor_id: member.id, metadata: { conversationId, senderName: member.name_ar, messageType: "media", mediaPath: path, mediaName: file.name, mediaType: file.type } });
  if (error) { await admin.storage.from(BUCKET).remove([path]); return NextResponse.json({ error: error.message }, { status: 400 }); }
  return NextResponse.json({ ok: true });
}
