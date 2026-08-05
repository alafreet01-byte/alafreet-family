import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type Body = {
  username?: string;
  password?: string;
  contactEmail?: string;
};

function normalizeUsername(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { error: "غير مصرح بالدخول." },
      { status: 401 },
    );
  }

  const body = (await request.json()) as Body;
  const admin = createAdminClient();

  const contactEmail = body.contactEmail?.trim().toLowerCase();
  if (contactEmail && !/^\S+@\S+\.\S+$/.test(contactEmail)) {
    return NextResponse.json(
      { error: "البريد الإلكتروني الشخصي غير صالح." },
      { status: 400 },
    );
  }

  const { data: member, error: memberError } = await admin
    .from("family_members")
    .select("id, username")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (memberError || !member) {
    return NextResponse.json(
      { error: "لم يتم العثور على ملف المستخدم." },
      { status: 404 },
    );
  }

  if (body.password) {
    if (body.password.length < 8) {
      return NextResponse.json(
        { error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل." },
        { status: 400 },
      );
    }

    const { error } = await supabase.auth.updateUser({
      password: body.password,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const { error: metadataError } =
      await admin.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          must_change_password: false,
          ...(contactEmail ? { contact_email: contactEmail } : {}),
        },
      });

    if (metadataError) {
      return NextResponse.json(
        { error: "تم تغيير كلمة المرور، لكن تعذر إكمال تفعيل الحساب." },
        { status: 500 },
      );
    }
  }

  if (body.username) {
    const username = normalizeUsername(body.username);

    if (!/^[a-z0-9._-]{3,30}$/.test(username)) {
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
      await admin.auth.admin.updateUserById(user.id, {
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

  if (contactEmail) {
    const { error: emailMetadataError } =
      await admin.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          ...(body.password ? { must_change_password: false } : {}),
          contact_email: contactEmail,
        },
      });

    if (emailMetadataError) {
      return NextResponse.json(
        { error: "تعذر حفظ البريد الإلكتروني الشخصي." },
        { status: 400 },
      );
    }
  }

  await admin.from("core_events").insert({
    event_type: "account.self_updated",
    title: "تحديث بيانات الدخول",
    details: body.username
      ? `تم تغيير اسم المستخدم إلى ${normalizeUsername(body.username)}`
      : body.password
        ? "تم تغيير كلمة المرور"
        : "تم حفظ البريد الإلكتروني الشخصي",
    actor_id: member.id,
    target_id: member.id,
    metadata: { contact_email_updated: Boolean(contactEmail) },
  });

  return NextResponse.json({ ok: true });
}
