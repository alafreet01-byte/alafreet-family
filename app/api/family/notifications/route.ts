import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const GIRLS = new Set(["khalifa", "amal", "reem", "aisha", "fatima"]);
const BOYS = new Set(["khalifa", "ahmed", "khalid", "saud", "mohammed"]);
function canReadChat(memberId: string, conversationId: string) {
  if (conversationId === "group:family") return true;
  if (conversationId === "group:girls") return GIRLS.has(memberId);
  if (conversationId === "group:boys") return BOYS.has(memberId);
  return conversationId.startsWith("private:") && conversationId.slice(8).split("--").includes(memberId);
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "غير مصرح بالدخول." }, { status: 401 });
  const admin = createAdminClient();
  const { data: member } = await admin.from("family_members").select("id,role").eq("auth_user_id", user.id).maybeSingle();
  if (!member) return NextResponse.json({ error: "الحساب غير مربوط بالعائلة." }, { status: 403 });
  const parent = member.role === "super_admin" || member.role === "school_admin";
  const types = ["family.calendar_event", "health.appointment", "health.medication", "family.document", "vehicle.service", "school.assignment"];
  const [{ data, error }, { data: chatRows }, { data: readRows }] = await Promise.all([
    admin.from("core_events").select("id,event_type,title,metadata,created_at").in("event_type", types).order("created_at", { ascending: false }),
    admin.from("core_events").select("id,details,actor_id,metadata,created_at").eq("event_type", "family.chat_message").order("created_at", { ascending: false }).limit(500),
    admin.from("core_events").select("metadata,created_at").eq("event_type", "family.chat_read").eq("actor_id", member.id).order("created_at", { ascending: false }),
  ]);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const now = Date.now();
  const max = now + 120 * 86400000;
  const scheduledAlerts = (data ?? []).flatMap((event) => {
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
  });
  const readMap = new Map<string, number>();
  for (const read of readRows ?? []) { const id = String(read.metadata?.conversationId ?? ""); if (!readMap.has(id)) readMap.set(id, new Date(read.metadata?.readAt ?? read.created_at).getTime()); }
  const chatGroups = new Map<string, typeof chatRows>();
  for (const row of chatRows ?? []) {
    const conversationId = String(row.metadata?.conversationId ?? "");
    if (row.actor_id === member.id || !canReadChat(member.id, conversationId) || new Date(row.created_at).getTime() <= (readMap.get(conversationId) ?? 0)) continue;
    const group = chatGroups.get(conversationId) ?? []; group.push(row); chatGroups.set(conversationId, group);
  }
  const chatAlerts = [...chatGroups.entries()].map(([conversationId, rows]) => ({ id: `chat-${conversationId}`, title: `${rows!.length} ${rows!.length === 1 ? "رسالة جديدة" : "رسائل جديدة"}`, label: "محادثات العائلة", dueAt: rows![0].created_at, route: `/v9/chat?conversation=${encodeURIComponent(conversationId)}`, memberName: rows![0].metadata?.senderName ?? "فرد من العائلة" }));
  const alerts = [...chatAlerts, ...scheduledAlerts].sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
  return NextResponse.json({ alerts, chatUnread: chatAlerts.reduce((sum, alert) => sum + Number(alert.title.split(" ")[0] || 0), 0) });
}
