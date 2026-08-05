import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type CreateUserBody = {
  name: string;
  username: string;
  password: string;
  role: string;
  grade?: string;
  schoolSystem?: string;
  color?: string;
};

type UpdateUserBody = {
  memberId: string;
  action: "reset_password" | "change_username" | "change_role" | "disable";
  password?: string;
  username?: string;
  role?: string;
};

function normalizeUsername(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

function isValidUsername(value: string) {
  return /^[a-z0-9._-]{3,30}$/.test(value);
}

async function requireSuperAdmin() {
  let supabase;
  try {
    supabase = await createClient();
  } catch (error) {
    console.error("ADMIN SSR CLIENT ERROR", error);
    return { error: "تعذر التحقق من جلسة الدخول.", status: 500 as const };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "غير مصرح بالدخول.", status: 401 as const };
  }

  const { data: member, error: memberError } = await supabase
    .from("family_members")
    .select("id, role")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (memberError || member?.role !== "super_admin") {
    return { error: "هذه العملية خاصة بالأب فقط.", status: 403 as const };
  }

  return { user, member, supabase };
}

export async function GET() {
  const auth = await requireSuperAdmin();

  if ("error" in auth) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.status },
    );
  }

  const { data, error } = await auth.supabase
    .from("family_members")
    .select(
      "id, name_ar, name_en, username, role, grade, school_system, color, auth_user_id, created_at",
    )
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ members: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireSuperAdmin();

  if ("error" in auth) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.status },
    );
  }

  const body = (await request.json()) as CreateUserBody;
  const username = normalizeUsername(body.username ?? "");
  const name = body.name?.trim();
  const password = body.password ?? "";

  if (!name || !isValidUsername(username)) {
    return NextResponse.json(
      { error: "الاسم أو اسم المستخدم غير صحيح." },
      { status: 400 },
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const internalEmail = `${username}@alafreet.ae`;

  const { data: existing } = await auth.supabase
    .from("family_members")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "اسم المستخدم مستخدم بالفعل." },
      { status: 409 },
    );
  }

  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email: internalEmail,
      password,
      email_confirm: true,
      user_metadata: {
        name_ar: name,
        username,
        role: body.role,
      },
    });

  if (createError || !created.user) {
    return NextResponse.json(
      { error: createError?.message ?? "تعذر إنشاء المستخدم." },
      { status: 400 },
    );
  }

  const memberId = crypto.randomUUID();

  const { error: insertError } = await admin
    .from("family_members")
    .insert({
      id: memberId,
      name_ar: name,
      name_en: username,
      username,
      role: body.role,
      grade: body.grade || null,
      school_system: body.schoolSystem || null,
      color: body.color || "#8ecbff",
      auth_user_id: created.user.id,
    });

  if (insertError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json(
      { error: insertError.message },
      { status: 400 },
    );
  }

  await admin.from("core_events").insert({
    event_type: "account.created",
    title: "تم إنشاء حساب عائلي",
    details: `${name} (@${username})`,
    actor_id: auth.member.id,
    target_id: memberId,
    metadata: { role: body.role },
  });

  return NextResponse.json({
    ok: true,
    memberId,
    authUserId: created.user.id,
    username,
    temporaryPassword: password,
  });
}

export async function PATCH(request: Request) {
  const auth = await requireSuperAdmin();

  if ("error" in auth) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.status },
    );
  }

  const body = (await request.json()) as UpdateUserBody;
  const admin = createAdminClient();

  const { data: member, error: memberError } = await admin
    .from("family_members")
    .select("id, name_ar, username, role, auth_user_id")
    .eq("id", body.memberId)
    .maybeSingle();

  if (memberError || !member?.auth_user_id) {
    return NextResponse.json(
      { error: "الحساب غير مربوط بـ Supabase Auth." },
      { status: 404 },
    );
  }

  if (body.action === "reset_password") {
    if (!body.password || body.password.length < 8) {
      return NextResponse.json(
        { error: "كلمة المرور الجديدة قصيرة." },
        { status: 400 },
      );
    }

    const { error } = await admin.auth.admin.updateUserById(
      member.auth_user_id,
      { password: body.password },
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  if (body.action === "change_username") {
    const username = normalizeUsername(body.username ?? "");

    if (!isValidUsername(username)) {
      return NextResponse.json(
        { error: "اسم المستخدم غير صالح." },
        { status: 400 },
      );
    }

    const { data: duplicate } = await admin
      .from("family_members")
      .select("id")
      .eq("username", username)
      .neq("id", member.id)
      .maybeSingle();

    if (duplicate) {
      return NextResponse.json(
        { error: "اسم المستخدم مستخدم بالفعل." },
        { status: 409 },
      );
    }

    const { error: authError } =
      await admin.auth.admin.updateUserById(member.auth_user_id, {
        email: `${username}@alafreet.ae`,
        email_confirm: true,
        user_metadata: { username },
      });

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 },
      );
    }

    const { error: dbError } = await admin
      .from("family_members")
      .update({ username, name_en: username })
      .eq("id", member.id);

    if (dbError) {
      return NextResponse.json(
        { error: dbError.message },
        { status: 400 },
      );
    }
  }

  if (body.action === "change_role") {
    if (!body.role) {
      return NextResponse.json(
        { error: "الدور مطلوب." },
        { status: 400 },
      );
    }

    const { error } = await admin
      .from("family_members")
      .update({ role: body.role })
      .eq("id", member.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await admin.auth.admin.updateUserById(member.auth_user_id, {
      user_metadata: { role: body.role },
    });
  }

  if (body.action === "disable") {
    const { error } = await admin.auth.admin.updateUserById(
      member.auth_user_id,
      { ban_duration: "876000h" },
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  await admin.from("core_events").insert({
    event_type: `account.${body.action}`,
    title: "تعديل حساب عائلي",
    details: `${member.name_ar} — ${body.action}`,
    actor_id: auth.member.id,
    target_id: member.id,
    metadata: {},
  });

  return NextResponse.json({ ok: true });
}
