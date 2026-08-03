"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim() || !password) {
      setError("اكتب الإيميل والباسورد");
      return;
    }

    setLoading(true);
    setError("");

    const { error: loginError } =
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

    if (loginError) {
      setError("الإيميل أو الباسورد غير صحيح");
      setLoading(false);
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <main
      dir="rtl"
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#030712] px-4 text-white"
    >
      <div className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-cyan-500/15 blur-[130px]" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-purple-500/15 blur-[130px]" />

      <section className="relative z-10 w-full max-w-md rounded-[36px] border border-white/10 bg-[#091124]/90 p-7 shadow-2xl backdrop-blur-xl sm:p-9">
        <div className="text-center">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-500/10 text-5xl shadow-[0_0_45px_rgba(34,211,238,.25)]">
            👨‍👩‍👧‍👦
          </div>

          <p className="mt-6 font-black tracking-[0.18em] text-cyan-300">
            ALAFREET FAMILY
          </p>

          <h1 className="mt-2 text-3xl font-black">
            تسجيل الدخول
          </h1>

          <p className="mt-3 text-sm leading-7 text-slate-400">
            ادخل بحسابك للوصول إلى عالم العائلة.
          </p>
        </div>

        <form onSubmit={handleLogin} className="mt-8">
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-300">
              الإيميل
            </span>

            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setError("");
              }}
              placeholder="name@example.com"
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-left outline-none transition focus:border-cyan-400"
              dir="ltr"
            />
          </label>

          <label className="mt-5 block">
            <span className="mb-2 block text-sm font-bold text-slate-300">
              الباسورد
            </span>

            <div className="flex items-center rounded-2xl border border-white/10 bg-black/30 focus-within:border-cyan-400">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError("");
                }}
                className="min-w-0 flex-1 bg-transparent px-4 py-4 text-left outline-none"
                dir="ltr"
              />

              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="px-4 py-4 text-sm font-bold text-slate-400"
              >
                {showPassword ? "إخفاء" : "إظهار"}
              </button>
            </div>
          </label>

          {error && (
            <p className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-center font-bold text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-2xl bg-gradient-to-l from-cyan-500 to-blue-700 py-4 text-lg font-black transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "جاري تسجيل الدخول..." : "دخول"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs leading-6 text-slate-600">
          الحسابات تُنشأ من إدارة العائلة فقط.
        </p>
      </section>
    </main>
  );
}