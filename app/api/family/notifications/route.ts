import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "غير مصرح بالدخول." }, { status: 401 });
  const admin = createAdminClient();
  const { data: member } = await admin.from("family_members").select("id,role").eq("auth_user_id", user.id).maybeSingle();
  if (!member) return NextResponse.json({ error: "الحساب غير مربوط بالعائلة." }, { status: 403 });
  const parent = member.role === "super_admin" || member.role === "school_admin";
  const types = ["family.calendar_event", "health.appointment", "health.medication", "family.document", "vehicle.service", "school.assignment"];
  const { data, error } = await admin.from("core_events").select("id,event_type,title,metadata,created_at").in("event_type", types).order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const now = Date.now();
  const max = now + 120 * 86400000;
  const alerts = (data ?? []).flatMap((event) => {
    const m = event.metadata ?? {};
    if (!parent && m.memberId && m.memberId !== "all" && m.memberId !== member.id) return [];
    let due = "";
    let label = "تذكير";
    let route = "/v9/calendar";
    if (event.event_type === "family.calendar_event") { due = m.startsAt; label = m.category ?? "موعد"; }
    if (event.event_type === "health.appointment") { due = m.startsAt; label = "موعد صحي"; route = "/v9/health"; }
    if (event.event_type === "health.medication") { due = m.refillAt; label = "إعادة صرف دواء"; route = "/v9/health"; }
    if (event.event_type === "family.document") { due = m.expiryAt; label = "انتهاء وثيقة"; route = "/v9/documents"; }
    if (event.event_type === "vehicle.service") { due = m.dueDate; label = "صيانة سيارة"; route = "/v9/vehicles"; }
    if (event.event_type === "school.assignment") { due = m.dueAt; label = "واجب مدرسي"; route = "/v9/school"; }
    const time = new Date(due).getTime();
    if (!due || Number.isNaN(time) || time < now - 86400000 || time > max) return [];
    return [{ id: event.id, title: event.title, label, dueAt: new Date(time).toISOString(), route, memberName: m.memberName ?? "العائلة" }];
  }).sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
  return NextResponse.json({ alerts });
}
