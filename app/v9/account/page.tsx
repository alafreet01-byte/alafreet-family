"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AccountSettingsPage() {
  const router = useRouter();
  const [contactEmail, setContactEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(event: FormEvent) {
    event.preventDefault();
    setMessage("");

    if (!contactEmail && !username && !password) {
      setMessage("اكتب بريدك الشخصي أو كلمة مرور جديدة.");
      return;
    }

    if (password && password !== confirmPassword) {
      setMessage("تأكيد كلمة المرور غير مطابق.");
      return;
    }

    setBusy(true);

    const response = await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contactEmail: contactEmail || undefined,
        username: username || undefined,
        password: password || undefined,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      setMessage(
        "تم تحديث بيانات الدخول. استخدم اسم المستخدم الجديد في الدخول القادم.",
      );
      setUsername("");
      setContactEmail("");
      setPassword("");
      setConfirmPassword("");
      if (password) {
        window.setTimeout(() => {
          router.replace("/v9/home");
          router.refresh();
        }, 900);
      }
    } else {
      setMessage(data.error ?? "تعذر حفظ التغييرات.");
    }

    setBusy(false);
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#02040a] px-4 py-8 text-white"
    >
      <div className="mx-auto max-w-xl">
        <header>
          <p className="text-[10px] font-black tracking-[0.3em] text-amber-200/50">
            ACCOUNT SETTINGS
          </p>
          <h1 className="mt-2 text-3xl font-black">
            بيانات الدخول
          </h1>
          <p className="mt-2 text-sm leading-7 text-white/40">
            أدخل بريدك الشخصي، ثم اختر كلمة مرور جديدة خاصة بك.
          </p>
        </header>

        <form
          onSubmit={save}
          className="mt-7 rounded-[30px] border border-white/10 bg-white/[0.035] p-6"
        >
          <label className="block">
            <span className="mb-2 block text-xs text-white/50">
              بريدك الإلكتروني الشخصي
            </span>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              dir="ltr"
              autoComplete="email"
              placeholder="name@example.com"
              className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-left outline-none"
            />
            <span className="mt-2 block text-[11px] leading-6 text-white/30">
              سيُستخدم للتواصل والاسترداد، بينما يبقى الدخول باسم المستخدم.
            </span>
          </label>

          <label className="mt-5 block">
            <span className="mb-2 block text-xs text-white/50">
              اسم المستخدم الجديد
            </span>
            <input
              value={username}
              onChange={(e) =>
                setUsername(e.target.value.toLowerCase())
              }
              dir="ltr"
              placeholder="اتركه فارغًا إذا لا تريد تغييره"
              className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-left outline-none"
            />
          </label>

          <label className="mt-5 block">
            <span className="mb-2 block text-xs text-white/50">
              كلمة المرور الجديدة
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              dir="ltr"
              className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-left outline-none"
            />
          </label>

          <label className="mt-5 block">
            <span className="mb-2 block text-xs text-white/50">
              تأكيد كلمة المرور
            </span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              dir="ltr"
              className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-left outline-none"
            />
          </label>

          {message && (
            <div className="mt-5 rounded-2xl border border-amber-200/15 bg-amber-300/10 p-4 text-sm text-amber-50">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-6 w-full rounded-2xl bg-amber-300 px-4 py-4 font-black text-slate-950 disabled:opacity-50"
          >
            حفظ التغييرات
          </button>

          <button
            type="button"
            onClick={() => router.back()}
            className="mt-3 w-full rounded-2xl border border-white/10 px-4 py-3"
          >
            رجوع
          </button>
        </form>
      </div>
    </main>
  );
}
