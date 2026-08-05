import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function requireMember() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "غير مصرح بالدخول.", status: 401 as const };
  const admin = createAdminClient();
  const { data: member } = await admin.from("family_members").select("id, name_ar, role").eq("auth_user_id", user.id).maybeSingle();
  if (!member) return { error: "الحساب غير مربوط بالعائلة.", status: 403 as const };
  return { member, admin };
}

const isParent = (role: string) => role === "super_admin" || role === "school_admin";

export async function GET() {
  const auth = await requireMember();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const [{ data: children }, { data: events, error }] = await Promise.all([
    auth.admin.from("family_members").select("id, name_ar, role").in("role", ["student", "child"]).order("name_ar"),
    auth.admin.from("core_events").select("id, event_type, title, details, metadata, created_at").in("event_type", ["family.reward_points", "family.reward_catalog", "family.reward_request"]).order("created_at", { ascending: false }),
  ]);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const all = events ?? [];
  const balances: Record<string, number> = {};
  for (const event of all.filter((item) => item.event_type === "family.reward_points")) {
    const childId = String(event.metadata?.childId ?? "");
    balances[childId] = (balances[childId] ?? 0) + Number(event.metadata?.points ?? 0);
  }
  const canManage = isParent(auth.member.role);
  const visibleChild = canManage ? null : auth.member.id;
  return NextResponse.json({
    viewer: auth.member,
    canManage,
    children: children ?? [],
    balances,
    catalog: all.filter((e) => e.event_type === "family.reward_catalog").map((e) => ({ id: e.id, title: e.title, cost: Number(e.metadata?.cost ?? 0), priceAed: Number(e.metadata?.priceAed ?? 0), imageUrl: String(e.metadata?.imageUrl ?? ""), active: e.metadata?.active !== false })),
    history: all.filter((e) => e.event_type === "family.reward_points" && (!visibleChild || e.metadata?.childId === visibleChild)).slice(0, 30).map((e) => ({ id: e.id, title: e.title, childId: e.metadata?.childId, childName: e.metadata?.childName, points: Number(e.metadata?.points ?? 0), createdAt: e.created_at })),
    requests: all.filter((e) => e.event_type === "family.reward_request" && (!visibleChild || e.metadata?.childId === visibleChild)).map((e) => ({ id: e.id, title: e.title, childId: e.metadata?.childId, childName: e.metadata?.childName, cost: Number(e.metadata?.cost ?? 0), status: e.metadata?.status ?? "pending", createdAt: e.created_at })),
  });
}

export async function POST(request: Request) {
  const auth = await requireMember();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const body = await request.json();
  const action = String(body.action ?? "");
  const parent = isParent(auth.member.role);

  if (action === "grant") {
    if (!parent) return NextResponse.json({ error: "منح النقاط للوالدين فقط." }, { status: 403 });
    const points = Number(body.points); const childId = String(body.childId ?? ""); const reason = String(body.reason ?? "").trim();
    if (!childId || !reason || !Number.isInteger(points) || points === 0 || Math.abs(points) > 1000) return NextResponse.json({ error: "أدخل الطفل والسبب وعدد نقاط صحيحًا." }, { status: 400 });
    const { data: child } = await auth.admin.from("family_members").select("id, name_ar").eq("id", childId).in("role", ["student", "child"]).maybeSingle();
    if (!child) return NextResponse.json({ error: "الطفل غير موجود." }, { status: 404 });
    const { error } = await auth.admin.from("core_events").insert({ event_type: "family.reward_points", title: reason, actor_id: auth.member.id, metadata: { childId, childName: child.name_ar, points } });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  } else if (action === "catalog") {
    if (!parent) return NextResponse.json({ error: "إضافة المكافآت للوالدين فقط." }, { status: 403 });
    const title = String(body.title ?? "").trim(); const cost = Number(body.cost);
    if (!title || !Number.isInteger(cost) || cost < 1 || cost > 10000) return NextResponse.json({ error: "أدخل اسم المكافأة وتكلفتها." }, { status: 400 });
    const { error } = await auth.admin.from("core_events").insert({ event_type: "family.reward_catalog", title, actor_id: auth.member.id, metadata: { cost, active: true, priceAed: Number(body.priceAed ?? 0), imageUrl: String(body.imageUrl ?? "") } });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  } else if (action === "import_neighborhood_store") {
    if (!parent) return NextResponse.json({ error: "إضافة منتجات الدكان للوالدين فقط." }, { status: 403 });
    const products = [
      { title: "Kinder Cards Chocolate Biscuit", cost: 400, priceAed: 4, imageUrl: "/rewards-store/kinder-cards.jpg" },
      { title: "آيس كريم فراولة Igloo", cost: 250, priceAed: 2.5, imageUrl: "/rewards-store/icecream-strawberry.jpg" },
      { title: "آيس كريم شوكولاتة Igloo", cost: 250, priceAed: 2.5, imageUrl: "/rewards-store/icecream-chocolate.jpg" },
      { title: "آيس كريم فانيلا", cost: 250, priceAed: 2.5, imageUrl: "/rewards-store/icecream-vanilla.jpg" },
      { title: "Lay’s Chili 14g", cost: 50, priceAed: 0.5, imageUrl: "/rewards-store/lays-chili.jpg" },
      { title: "Lay’s Tomato Ketchup 14g", cost: 50, priceAed: 0.5, imageUrl: "/rewards-store/lays-ketchup.jpg" },
      { title: "Lay’s French Cheese 14g", cost: 50, priceAed: 0.5, imageUrl: "/rewards-store/lays-cheese.jpg" },
      { title: "Kinder Bueno 43g", cost: 400, priceAed: 4, imageUrl: "/rewards-store/sweet.svg" },
      { title: "Kinder Chocolate 4 Bars", cost: 600, priceAed: 6, imageUrl: "/rewards-store/sweet.svg" },
      { title: "Sando Chocolate Wafer", cost: 200, priceAed: 2, imageUrl: "/rewards-store/sweet.svg" },
      { title: "Gummy Big Frank", cost: 150, priceAed: 1.5, imageUrl: "/rewards-store/sweet.svg" },
      { title: "Cookie Monsta Mini", cost: 150, priceAed: 1.5, imageUrl: "/rewards-store/sweet.svg" },
      { title: "Pepsi 250ml", cost: 200, priceAed: 2, imageUrl: "/rewards-store/drink.svg" },
      { title: "7UP 250ml", cost: 200, priceAed: 2, imageUrl: "/rewards-store/drink.svg" },
      { title: "Mountain Dew 250ml", cost: 200, priceAed: 2, imageUrl: "/rewards-store/drink.svg" },
      { title: "Capri-Sun Mix Juice", cost: 200, priceAed: 2, imageUrl: "/rewards-store/juice.svg" },
      { title: "Capri-Sun Mango", cost: 200, priceAed: 2, imageUrl: "/rewards-store/juice.svg" },
    ];
    const { data: existing } = await auth.admin.from("core_events").select("id, title").eq("event_type", "family.reward_catalog");
    const titles = new Set((existing ?? []).map((item) => item.title));
    for (const product of products) {
      const current = (existing ?? []).find((item) => item.title === product.title);
      if (current) {
        const { error } = await auth.admin.from("core_events").update({ metadata: { cost: product.cost, priceAed: product.priceAed, imageUrl: product.imageUrl, active: true, source: "wa.me/c/971543307668" } }).eq("id", current.id);
        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }
    const rows = products.filter((item) => !titles.has(item.title)).map((item) => ({ event_type: "family.reward_catalog", title: item.title, actor_id: auth.member.id, details: "منتج من كتالوج دكان الحارة", metadata: { cost: item.cost, priceAed: item.priceAed, imageUrl: item.imageUrl, active: true, source: "wa.me/c/971543307668" } }));
    if (rows.length) {
      const { error } = await auth.admin.from("core_events").insert(rows);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    }
  } else if (action === "request") {
    const rewardId = String(body.rewardId ?? "");
    const { data: reward } = await auth.admin.from("core_events").select("id, title, metadata").eq("id", rewardId).eq("event_type", "family.reward_catalog").maybeSingle();
    if (!reward) return NextResponse.json({ error: "المكافأة غير موجودة." }, { status: 404 });
    const childId = parent ? String(body.childId ?? "") : auth.member.id;
    const { data: child } = await auth.admin.from("family_members").select("id, name_ar").eq("id", childId).in("role", ["student", "child"]).maybeSingle();
    if (!child) return NextResponse.json({ error: "حساب الطفل غير موجود." }, { status: 404 });
    const { error } = await auth.admin.from("core_events").insert({ event_type: "family.reward_request", title: reward.title, actor_id: auth.member.id, metadata: { rewardId, childId, childName: child.name_ar, cost: Number(reward.metadata?.cost ?? 0), status: "pending" } });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  } else if (action === "approve") {
    if (!parent) return NextResponse.json({ error: "الموافقة للوالدين فقط." }, { status: 403 });
    const id = String(body.id ?? "");
    const { data: rewardRequest } = await auth.admin.from("core_events").select("id, title, metadata").eq("id", id).eq("event_type", "family.reward_request").maybeSingle();
    if (!rewardRequest || rewardRequest.metadata?.status !== "pending") return NextResponse.json({ error: "الطلب غير موجود أو تمت معالجته." }, { status: 404 });
    const cost = Number(rewardRequest.metadata?.cost ?? 0); const childId = String(rewardRequest.metadata?.childId ?? "");
    const { error: pointsError } = await auth.admin.from("core_events").insert({ event_type: "family.reward_points", title: `استبدال: ${rewardRequest.title}`, actor_id: auth.member.id, metadata: { childId, childName: rewardRequest.metadata?.childName, points: -cost } });
    if (pointsError) return NextResponse.json({ error: pointsError.message }, { status: 400 });
    const { error } = await auth.admin.from("core_events").update({ metadata: { ...rewardRequest.metadata, status: "approved" } }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    const { error: shoppingError } = await auth.admin.from("core_events").insert({
      event_type: "family.shopping_item",
      title: rewardRequest.title,
      details: `مكافأة تمت الموافقة عليها للطفل ${rewardRequest.metadata?.childName ?? ""}.`,
      actor_id: auth.member.id,
      metadata: {
        quantity: "1",
        category: "أطفال",
        priority: "مهم",
        status: "needed",
        addedBy: "متجر المكافآت",
        rewardRequestId: id,
        childId,
        childName: rewardRequest.metadata?.childName,
      },
    });
    if (shoppingError) return NextResponse.json({ error: shoppingError.message }, { status: 400 });
  } else return NextResponse.json({ error: "العملية غير معروفة." }, { status: 400 });

  return NextResponse.json({ ok: true });
}
