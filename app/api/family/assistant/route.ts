import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const PARENT_ROLES = new Set(["super_admin", "school_admin"]);
const CHILD_ROLES = new Set(["student", "child"]);

async function authenticate() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "يجب تسجيل الدخول أولًا.", status: 401 as const };
  const admin = createAdminClient();
  const { data: member } = await admin
    .from("family_members")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (!member) return { error: "الحساب غير مربوط بالعائلة.", status: 403 as const };
  return { admin, member, user };
}

async function resolveOwner(auth: Awaited<ReturnType<typeof authenticate>>, requestedId: string) {
  if ("error" in auth) return null;
  if (!requestedId || requestedId === auth.member.id) return auth.member;
  if (!PARENT_ROLES.has(auth.member.role)) return null;
  const { data: child } = await auth.admin
    .from("family_members")
    .select("*")
    .eq("id", requestedId)
    .maybeSingle();
  return child && CHILD_ROLES.has(child.role) ? child : null;
}

export async function GET(request: Request) {
  const auth = await authenticate();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const requestedId = new URL(request.url).searchParams.get("memberId") ?? auth.member.id;
  const owner = await resolveOwner(auth, requestedId);
  if (!owner) return NextResponse.json({ error: "لا تملك صلاحية مشاهدة هذه المحادثة." }, { status: 403 });

  const childrenPromise = PARENT_ROLES.has(auth.member.role)
    ? auth.admin.from("family_members").select("id,name_ar,role").in("role", ["student", "child"]).order("name_ar")
    : Promise.resolve({ data: [] as Array<{ id: string; name_ar: string; role: string }> });
  const [{ data: rows, error }, { data: children }] = await Promise.all([
    auth.admin
      .from("core_events")
      .select("id,details,metadata,created_at")
      .eq("event_type", "ai.tutor_message")
      .eq("metadata->>ownerId", owner.id)
      .order("created_at", { ascending: true })
      .limit(100),
    childrenPromise,
  ]);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({
    viewer: { id: auth.member.id, name: auth.member.name_ar, role: auth.member.role },
    owner: { id: owner.id, name: owner.name_ar, role: owner.role },
    canMonitor: PARENT_ROLES.has(auth.member.role),
    children: children ?? [],
    messages: (rows ?? []).map((row) => ({
      id: row.id,
      role: row.metadata?.messageRole === "assistant" ? "assistant" : "user",
      text: row.details ?? "",
      imageName: row.metadata?.imageName ?? "",
      safetyFlag: row.metadata?.safetyFlag ?? "",
      createdAt: row.created_at,
    })),
  });
}

export async function POST(request: Request) {
  const auth = await authenticate();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "مفتاح المساعد الذكي غير مفعّل." }, { status: 503 });

  const body = await request.json();
  const question = String(body.question ?? "").trim().slice(0, 6000);
  const imageData = typeof body.imageData === "string" && body.imageData.startsWith("data:image/")
    ? body.imageData
    : "";
  const imageName = String(body.imageName ?? "").slice(0, 160);
  if (!question && !imageData) return NextResponse.json({ error: "اكتب السؤال أو أرفق صورة الواجب." }, { status: 400 });
  if (imageData.length > 7_000_000) return NextResponse.json({ error: "الصورة كبيرة جدًا. اختر صورة أصغر." }, { status: 413 });

  const { data: recent } = await auth.admin
    .from("core_events")
    .select("details,metadata")
    .eq("event_type", "ai.tutor_message")
    .eq("metadata->>ownerId", auth.member.id)
    .order("created_at", { ascending: false })
    .limit(12);
  const history = [...(recent ?? [])].reverse().map((row) => ({
    role: row.metadata?.messageRole === "assistant" ? "model" : "user",
    parts: [{ text: String(row.details ?? "") }],
  }));
  const currentParts: Array<Record<string, unknown>> = [];
  if (question) currentParts.push({ text: question });
  if (imageData) {
    const match = imageData.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (match) currentParts.push({ inlineData: { mimeType: match[1], data: match[2] } });
  }

  const grade = auth.member.grade ?? auth.member.class_name ?? auth.member.school_grade ?? "غير محدد";
  const instructions = `أنت المعلّم العائلي الآمن في ALAFREET FAMILY. الطالب: ${auth.member.name_ar}، الصف: ${grade}.
أجب بالعربية الواضحة ما لم يطلب الطالب لغة أخرى. ساعد في جميع المواد، واشرح الحل خطوة بخطوة بما يناسب العمر.
ابدأ بفهم المطلوب، ثم الفكرة، ثم خطوات الحل، ثم الإجابة النهائية، ثم سؤال قصير للتأكد من الفهم.
إذا كان السؤال اختبارًا مباشرًا أو طلب غش، علّم الطالب الطريقة ولا تساعد على الغش. لا تطلب أي بيانات شخصية.
للمحتوى المتعلق بإيذاء النفس أو العنف أو الاستغلال: قدّم استجابة داعمة وآمنة واطلب التواصل فورًا مع أحد الوالدين أو شخص بالغ موثوق.
لا تكشف محادثات أي فرد آخر، ولا تدّعِ أنك شاهدت بيانات غير موجودة.`;

  const safetyFlag = /انتحار|أقتل نفسي|إيذاء نفسي|اعتداء|ابتزاز|مخدرات/i.test(question) ? "يحتاج متابعة الوالدين" : "";
  await auth.admin.from("core_events").insert({
    event_type: "ai.tutor_message",
    title: "سؤال للمساعد الدراسي",
    details: question || "صورة واجب",
    actor_id: auth.member.id,
    metadata: { ownerId: auth.member.id, ownerName: auth.member.name_ar, messageRole: "user", imageName, safetyFlag },
  });

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: instructions }] },
      contents: [...history, { role: "user", parts: currentParts }],
      generationConfig: { temperature: 0.35, maxOutputTokens: 4096 },
    }),
  });
  const result = await response.json();
  if (!response.ok) {
    const providerMessage = String(result?.error?.message ?? "");
    const error = /quota|rate|resource_exhausted/i.test(providerMessage)
      ? "تم استهلاك الحد المجاني مؤقتًا. حاول مرة أخرى لاحقًا."
      : /api key|permission|unauthenticated/i.test(providerMessage)
        ? "مفتاح Gemini غير صالح أو غير مفعّل."
        : "تعذر الحصول على الإجابة الآن. حاول مرة أخرى.";
    return NextResponse.json({ error }, { status: response.status });
  }
  const answer = String(
    result.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text ?? "")
      .join("") || "لم أتمكن من كتابة الإجابة.",
  );
  const { data: saved, error } = await auth.admin.from("core_events").insert({
    event_type: "ai.tutor_message",
    title: "إجابة المساعد الدراسي",
    details: answer,
    actor_id: auth.member.id,
    metadata: { ownerId: auth.member.id, ownerName: auth.member.name_ar, messageRole: "assistant", model: "gemini-3.6-flash", safetyFlag },
  }).select("id,created_at").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ message: { id: saved.id, role: "assistant", text: answer, safetyFlag, createdAt: saved.created_at } });
}
