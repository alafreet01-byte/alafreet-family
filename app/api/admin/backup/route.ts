import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "غير مصرح بالدخول." }, { status: 401 });
  const admin = createAdminClient();
  const { data: owner } = await admin.from("family_members").select("id, role").eq("auth_user_id", user.id).maybeSingle();
  if (!owner || owner.role !== "super_admin") return NextResponse.json({ error: "النسخ الاحتياطي متاح للأب فقط." }, { status: 403 });

  const [{ data: members, error: membersError }, { data: events, error: eventsError }] = await Promise.all([
    admin.from("family_members").select("id, name_ar, role, username").order("name_ar"),
    admin.from("core_events").select("id, event_type, title, details, actor_id, metadata, created_at").order("created_at"),
  ]);
  if (membersError || eventsError) return NextResponse.json({ error: membersError?.message ?? eventsError?.message }, { status: 400 });

  const generatedAt = new Date().toISOString();
  const payload = { format: "ALAFREET_BACKUP_V1", generatedAt, station: "IALAIN19", members: members ?? [], events: events ?? [] };
  const date = generatedAt.slice(0, 10);
  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="ALAFREET_BACKUP_${date}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
