import { NextResponse } from "next/server";

import { createClient } from "../../../lib/supabase/server";
import { createAdminClient } from "../../../lib/supabase/admin";

async function signOut(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const admin = createAdminClient();
    const { data: member } = await admin.from("family_members").select("id, name_ar").eq("auth_user_id", user.id).maybeSingle();
    if (member) {
      const { data: lastLogin } = await admin.from("core_events").select("created_at").eq("event_type", "account.login").eq("actor_id", member.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
      const minutes = lastLogin ? Math.max(1, Math.round((Date.now() - new Date(lastLogin.created_at).getTime()) / 60000)) : null;
      await admin.from("core_events").insert({ event_type: "account.logout", title: "تسجيل خروج", details: minutes ? `مدة الجلسة: ${minutes} دقيقة` : `خرج ${member.name_ar} من النظام`, actor_id: member.id, target_id: member.id, metadata: { durationMinutes: minutes } });
    }
  }
  await supabase.auth.signOut();

  return NextResponse.redirect(new URL("/login", request.url), {
    status: 303,
  });
}

export async function POST(request: Request) {
  return signOut(request);
}

export async function GET(request: Request) {
  return signOut(request);
}
