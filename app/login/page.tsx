"use client";

import { FormEvent, Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { createClient } from "../../lib/supabase/browser";

type AccountConfig = {
  email: string;
  route: string;
};

const ACCOUNTS: Record<string, AccountConfig> = {
  khalifa: {
    email: "khalifa@alafreet.ae",
    route: "/v9/father",
  },
  amal: {
    email: "amal@alafreet.ae",
    route: "/v9/amal",
  },
  khalid: {
    email: "khalid@alafreet.ae",
    route: "/v9/khalid",
  },
  ahmed: {
    email: "ahmed@alafreet.ae",
    route: "/v9/school",
  },
  reem: {
    email: "reem@alafreet.ae",
    route: "/v9/school",
  },
  aisha: {
    email: "aisha@alafreet.ae",
    route: "/v9/school",
  },
};

function normalizeUsername(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

function readableError(message: string) {
  const text = message.toLowerCase();

  if (text.includes("invalid login credentials")) {
    return "اسم المستخدم أو كلمة المرور غير صحيحة.";
  }

  if (text.includes("email not confirmed")) {
    return "الحساب غير مؤكد في Supabase. فعّل Auto Confirm User.";
  }

  if (text.includes("failed to fetch")) {
    return "تعذر الاتصال بـ Supabase. تأكد من ملف .env.local والإنترنت.";
  }

  if (text.includes("user not found")) {
    return "الحساب غير موجود في Supabase.";
  }

  return message || "حدث خطأ غير معروف أثناء تسجيل الدخول.";
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);

  const [username, setUsername] = useState(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem("alafreet-remember-username") ?? "";
  });

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setErrorText("");

    const cleanUsername = normalizeUsername(username);
    if (!/^[a-z0-9._-]{3,30}$/.test(cleanUsername)) {
      setErrorText("اسم المستخدم غير صالح.");
      setLoading(false);
      return;
    }

    const account = ACCOUNTS[cleanUsername];
    const email = account?.email ?? `${cleanUsername}@alafreet.ae`;

    try {
      // إزالة أي جلسة قديمة أو Refresh Token تالف قبل تسجيل الدخول.
      await supabase.auth.signOut({ scope: "local" });

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (!data.user || !data.session) {
        throw new Error("تم قبول البيانات لكن لم يتم إنشاء جلسة دخول.");
      }

      if (rememberMe) {
        window.localStorage.setItem(
          "alafreet-remember-username",
          cleanUsername,
        );
      } else {
        window.localStorage.removeItem(
          "alafreet-remember-username",
        );
      }

      const { data: member } = await supabase
        .from("family_members")
        .select("id, role")
        .eq("auth_user_id", data.user.id)
        .maybeSingle();

      const roleRoute =
        member?.role === "super_admin"
          ? "/v9/father"
          : member?.id === "amal" || member?.role === "school_admin"
            ? "/v9/amal"
            : member?.role === "university_user"
              ? "/v9/khalid"
              : member?.role === "student" || member?.role === "child"
                ? "/v9/school"
                : "/v9/home";

      const requestedRoute = searchParams.get("next");
      const safeNext =
        requestedRoute?.startsWith("/") &&
        !requestedRoute.startsWith("//")
          ? requestedRoute
          : account?.route ?? roleRoute;

      router.replace(safeNext);
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء تسجيل الدخول.";

      console.error("ALAFREET LOGIN ERROR:", error);
      setErrorText(readableError(message));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      dir="rtl"
      className="relative min-h-screen overflow-hidden bg-[#02030a] text-white"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_38%,rgba(255,177,35,0.30),transparent_24%),radial-gradient(circle_at_18%_18%,rgba(73,70,155,0.18),transparent_32%),linear-gradient(135deg,#03030b_0%,#140b05_50%,#020208_100%)]" />

      <div className="absolute inset-0 opacity-70">
        {Array.from({ length: 100 }).map((_, index) => (
          <span
            key={index}
            className="absolute rounded-full bg-amber-100"
            style={{
              left: `${(index * 47) % 100}%`,
              top: `${(index * 83) % 100}%`,
              width: index % 9 === 0 ? 3 : 1,
              height: index % 9 === 0 ? 3 : 1,
              opacity: index % 5 === 0 ? 0.9 : 0.4,
              boxShadow:
                index % 9 === 0
                  ? "0 0 12px rgba(255,210,100,0.9)"
                  : "none",
            }}
          />
        ))}
      </div>

      <div className="relative z-10 grid min-h-screen lg:grid-cols-[0.8fr_1.2fr]">
        <section className="flex items-center justify-center px-5 py-10 sm:px-10">
          <div className="w-full max-w-md">
            <p className="text-[10px] font-black uppercase tracking-[0.34em] text-amber-200/55">
              PRIVATE ACCESS
            </p>

            <h1 className="mt-4 text-4xl font-black tracking-[0.08em] text-amber-100 sm:text-5xl">
              ALAFREET.AE
            </h1>

            <div className="mt-5 h-px w-28 bg-gradient-to-r from-transparent via-amber-300/70 to-transparent" />

            <form
              onSubmit={handleLogin}
              className="mt-8 rounded-[30px] border border-amber-200/15 bg-black/45 p-6 shadow-2xl backdrop-blur-2xl sm:p-7"
            >
              <label className="block">
                <span className="mb-2 block text-xs text-white/55">
                  اسم المستخدم
                </span>

                <input
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  required
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  dir="ltr"
                  placeholder="khalifa"
                  className="w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-4 text-left outline-none transition placeholder:text-white/20 focus:border-amber-300/50"
                />
              </label>

              <label className="mt-5 block">
                <span className="mb-2 block text-xs text-white/55">
                  كلمة المرور
                </span>

                <div className="flex overflow-hidden rounded-2xl border border-white/10 bg-black/35 transition focus-within:border-amber-300/50">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    autoComplete="current-password"
                    dir="ltr"
                    placeholder="••••••••"
                    className="min-w-0 flex-1 bg-transparent px-4 py-4 text-left outline-none placeholder:text-white/20"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="border-r border-white/10 px-4 text-xs font-bold text-white/45 transition hover:text-white"
                  >
                    {showPassword ? "إخفاء" : "إظهار"}
                  </button>
                </div>
              </label>

              <label className="mt-5 flex cursor-pointer items-center gap-3 text-sm text-white/45">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  className="h-4 w-4 accent-amber-400"
                />
                تذكر اسم المستخدم على هذا الجهاز
              </label>

              {errorText && (
                <div className="mt-5 rounded-2xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm leading-7 text-rose-100">
                  {errorText}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-6 w-full rounded-2xl border border-amber-200/30 bg-gradient-to-l from-[#8d5908] via-[#e8b33e] to-[#936009] px-5 py-4 font-black text-[#1c1102] shadow-[0_15px_40px_rgba(214,145,24,0.18)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "جاري التحقق..." : "دخول ←"}
              </button>

              <div className="mt-5 flex items-center justify-center gap-2 text-[10px] tracking-wide text-white/30">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                بوابة عائلية خاصة ومشفرة
              </div>
            </form>
          </div>
        </section>

        <section className="relative hidden items-center justify-center overflow-hidden lg:flex">
          <div className="relative flex h-[620px] w-[620px] items-center justify-center">
            <div className="absolute h-[500px] w-[500px] animate-[spin_28s_linear_infinite] rounded-full border-[4px] border-amber-400 shadow-[0_0_45px_rgba(255,180,30,0.65),inset_0_0_40px_rgba(255,180,30,0.2)]" />

            <div className="absolute h-[235px] w-[500px] rotate-[-18deg] animate-[spin_18s_linear_infinite] rounded-[50%] border-[6px] border-amber-100 shadow-[0_0_25px_rgba(255,230,150,0.9)]" />

            <div className="relative h-[220px] w-[220px] rounded-full bg-[radial-gradient(circle_at_36%_30%,#fff8bf_0%,#ffc42f_12%,#ffad12_58%,#d97706_100%)] shadow-[0_0_80px_rgba(255,170,20,0.75)]">
              <span className="absolute left-[30%] top-[27%] h-4 w-4 rounded-full bg-white/90 shadow-[0_0_18px_white]" />
              <span className="absolute right-[26%] top-[43%] h-3 w-3 rounded-full bg-yellow-100 shadow-[0_0_14px_white]" />
            </div>

            <div className="absolute h-[360px] w-[360px] rounded-full bg-amber-400/10 blur-3xl" />
          </div>
        </section>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#02030a] text-amber-100">
          جاري تجهيز بوابة الدخول…
        </main>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
