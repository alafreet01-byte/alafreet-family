"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Member = {
  id: string;
  name_ar: string;
  username: string | null;
  role: string;
  grade: string | null;
  school_system: string | null;
  color: string | null;
  auth_user_id: string | null;
};

const roles = [
  ["super_admin", "Super Admin"],
  ["school_admin", "School Admin"],
  ["university_user", "University"],
  ["student", "Student"],
  ["child", "Child"],
];

export default function FamilyAdminPage() {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState<Member | null>(null);
  const [form, setForm] = useState({
    name: "",
    username: "",
    password: "",
    role: "student",
    grade: "",
    schoolSystem: "",
  });

  const loadMembers = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/admin/users", {
      cache: "no-store",
    });
    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error ?? "تعذر تحميل المستخدمين.");
    } else {
      setMembers(data.members ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  async function createMember(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error ?? "فشل إنشاء الحساب.");
    } else {
      setMessage(
        `تم إنشاء الحساب @${data.username} بكلمة المرور المؤقتة ${data.temporaryPassword}`,
      );
      setForm({
        name: "",
        username: "",
        password: "",
        role: "student",
        grade: "",
        schoolSystem: "",
      });
      await loadMembers();
    }

    setBusy(false);
  }

  async function updateMember(
    action: "reset_password" | "change_username" | "change_role" | "disable",
  ) {
    if (!selected) return;

    const body: Record<string, string> = {
      memberId: selected.id,
      action,
    };

    if (action === "reset_password") {
      const password = window.prompt(
        `كلمة المرور الجديدة لـ ${selected.name_ar} (8 أحرف على الأقل)`,
      );
      if (!password) return;
      body.password = password;
    }

    if (action === "change_username") {
      const username = window.prompt(
        `اسم المستخدم الجديد لـ ${selected.name_ar}`,
        selected.username ?? "",
      );
      if (!username) return;
      body.username = username;
    }

    if (action === "change_role") {
      const role = window.prompt(
        "اكتب الدور الجديد: super_admin / school_admin / university_user / student / child",
        selected.role,
      );
      if (!role) return;
      body.role = role;
    }

    setBusy(true);
    const response = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();

    setMessage(
      response.ok ? "تم تنفيذ العملية بنجاح." : data.error ?? "فشلت العملية.",
    );

    if (response.ok) {
      await loadMembers();
      setSelected(null);
    }

    setBusy(false);
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#02040a] px-4 py-7 text-white"
    >
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-black tracking-[0.3em] text-cyan-200/50">
              FAMILY ADMIN
            </p>
            <h1 className="mt-2 text-3xl font-black">
              إدارة حسابات العائلة
            </h1>
            <p className="mt-2 text-sm text-white/40">
              إنشاء الحسابات وتعديل أسماء المستخدمين وكلمات المرور
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/v9/father")}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
          >
            مركز الأب
          </button>
        </header>

        {message && (
          <div className="mt-5 rounded-2xl border border-cyan-200/15 bg-cyan-300/10 p-4 text-sm text-cyan-50">
            {message}
          </div>
        )}

        <section className="mt-6 grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
          <form
            onSubmit={createMember}
            className="rounded-[30px] border border-white/10 bg-white/[0.035] p-6"
          >
            <h2 className="text-2xl font-black">إضافة حساب جديد</h2>

            <div className="mt-5 space-y-4">
              <input
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
                placeholder="الاسم"
                required
                className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 outline-none"
              />

              <input
                value={form.username}
                onChange={(e) =>
                  setForm({
                    ...form,
                    username: e.target.value.toLowerCase(),
                  })
                }
                placeholder="اسم المستخدم"
                required
                dir="ltr"
                className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-left outline-none"
              />

              <input
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
                placeholder="كلمة المرور المؤقتة"
                required
                dir="ltr"
                className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-left outline-none"
              />

              <select
                value={form.role}
                onChange={(e) =>
                  setForm({ ...form, role: e.target.value })
                }
                className="w-full rounded-2xl border border-white/10 bg-[#0a0d15] px-4 py-3"
              >
                {roles.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>

              <input
                value={form.grade}
                onChange={(e) =>
                  setForm({ ...form, grade: e.target.value })
                }
                placeholder="الصف أو التخصص — اختياري"
                className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 outline-none"
              />

              <input
                value={form.schoolSystem}
                onChange={(e) =>
                  setForm({
                    ...form,
                    schoolSystem: e.target.value,
                  })
                }
                placeholder="Toddle / UAEU / Amal Home School"
                className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={busy}
              className="mt-5 w-full rounded-2xl bg-cyan-300 px-4 py-4 font-black text-slate-950 disabled:opacity-50"
            >
              إنشاء الحساب
            </button>
          </form>

          <article className="rounded-[30px] border border-white/10 bg-white/[0.035] p-6">
            <h2 className="text-2xl font-black">الحسابات الحالية</h2>

            {loading ? (
              <p className="mt-5 text-white/40">جاري التحميل...</p>
            ) : (
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {members.map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => setSelected(member)}
                    className="rounded-2xl border border-white/10 bg-black/20 p-4 text-right"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <strong>{member.name_ar}</strong>
                        <p className="mt-2 text-xs text-white/35">
                          @{member.username ?? "غير محدد"}
                        </p>
                      </div>
                      <span className="rounded-full bg-cyan-300/10 px-2 py-1 text-[9px] text-cyan-100">
                        {member.role}
                      </span>
                    </div>
                    <p className="mt-3 text-xs text-white/30">
                      {member.auth_user_id
                        ? "مربوط بنظام الدخول"
                        : "غير مربوط"}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </article>
        </section>

        {selected && (
          <section className="mt-5 rounded-[30px] border border-amber-200/10 bg-amber-300/[0.035] p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs text-amber-200/50">
                  الحساب المحدد
                </p>
                <h2 className="mt-2 text-2xl font-black">
                  {selected.name_ar}
                </h2>
                <p className="mt-2 text-sm text-white/40">
                  @{selected.username} • {selected.role}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-2xl border border-white/10 px-4 py-3"
              >
                إغلاق
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <button
                type="button"
                disabled={busy}
                onClick={() => void updateMember("reset_password")}
                className="rounded-2xl bg-amber-300/10 p-4 font-black text-amber-100"
              >
                إعادة تعيين كلمة المرور
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void updateMember("change_username")}
                className="rounded-2xl bg-blue-300/10 p-4 font-black text-blue-100"
              >
                تغيير اسم المستخدم
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void updateMember("change_role")}
                className="rounded-2xl bg-violet-300/10 p-4 font-black text-violet-100"
              >
                تغيير الدور
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void updateMember("disable")}
                className="rounded-2xl bg-rose-300/10 p-4 font-black text-rose-100"
              >
                تعطيل الحساب
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
