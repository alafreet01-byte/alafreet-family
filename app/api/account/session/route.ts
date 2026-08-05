import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "غير مصرح." }, { status: 401 });

  const admin = createAdminClient();
  const { data: member } = await admin.from("family_members").select("id, name_ar").eq("auth_user_id", user.id).maybeSingle();
  if (!member) return NextResponse.json({ error: "الحساب غير مربوط." }, { status: 404 });

  await admin.from("core_events").insert({
    event_type: "account.login", title: "تسجيل دخول", details: `دخل ${member.name_ar} إلى النظام`,
    actor_id: member.id, target_id: member.id, metadata: { loggedInAt: new Date().toISOString() },
  });
  return NextResponse.json({ ok: true });
}
