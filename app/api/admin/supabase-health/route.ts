import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type Check = { ok: boolean; detail?: string };

export async function GET() {
  const checkedAt = new Date().toISOString();

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { ok: false, checkedAt, error: "تعذر التحقق من جلسة الدخول عبر Supabase Auth." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }

    const admin = createAdminClient();
    const { data: member, error: memberError } = await admin
      .from("family_members")
      .select("role")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (memberError) {
      return NextResponse.json(
        { ok: false, checkedAt, error: "تعذر الوصول إلى قاعدة بيانات Supabase." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    if (member?.role !== "super_admin") {
      return NextResponse.json({ error: "هذه العملية خاصة بالأب فقط." }, { status: 403 });
    }

    const [members, events, users, buckets] = await Promise.all([
      admin.from("family_members").select("id", { count: "exact", head: true }),
      admin.from("core_events").select("id", { count: "exact", head: true }),
      admin.auth.admin.listUsers({ page: 1, perPage: 1 }),
      admin.storage.listBuckets(),
    ]);

    const checks: Record<string, Check> = {
      database: {
        ok: !members.error && !events.error,
        detail: members.error?.message ?? events.error?.message,
      },
      auth: { ok: !users.error, detail: users.error?.message },
      storage: { ok: !buckets.error, detail: buckets.error?.message },
    };
    const ok = Object.values(checks).every((check) => check.ok);

    return NextResponse.json(
      {
        ok,
        checkedAt,
        checks,
        counts: ok ? { familyMembers: members.count ?? 0, coreEvents: events.count ?? 0 } : undefined,
        buckets: buckets.data?.map((bucket) => bucket.id) ?? [],
      },
      { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("SUPABASE HEALTH CHECK FAILED", error);
    return NextResponse.json(
      { ok: false, checkedAt, error: "فشل فحص Supabase. راجع حالة المشروع ومتغيرات البيئة." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
