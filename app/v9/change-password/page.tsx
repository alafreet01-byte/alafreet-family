"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

export default function ChangePasswordPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (password.length < 8) return setMessage("كلمة المرور يجب أن تكون 8 أحرف على الأقل.");
    if (password !== confirm) return setMessage("كلمتا المرور غير متطابقتين.");
    setBusy(true); setMessage("");
    const { error } = await supabase.auth.updateUser({ password, data: { must_change_password: false } });
    if (error) { setMessage("تعذر تغيير كلمة المرور. حاول مرة أخرى."); setBusy(false); return; }
    router.replace("/v9/home"); router.refresh();
  }

  return <main dir="rtl" className="flex min-h-screen items-center justify-center bg-[#02030a] p-5 text-white"><form onSubmit={save} className="w-full max-w-md rounded-[32px] border border-amber-200/15 bg-amber-300/[.05] p-7"><p className="text-xs font-black tracking-[.25em] text-amber-200/55">FIRST LOGIN</p><h1 className="mt-3 text-3xl font-black">اختر كلمة مرور جديدة</h1><p className="mt-2 text-sm leading-7 text-white/45">هذه الخطوة مطلوبة مرة واحدة فقط لحماية حسابك.</p><label className="mt-6 block text-sm text-white/60">كلمة المرور الجديدة<input dir="ltr" type="password" required value={password} onChange={e=>setPassword(e.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-left outline-none focus:border-amber-300/50"/></label><label className="mt-4 block text-sm text-white/60">تأكيد كلمة المرور<input dir="ltr" type="password" required value={confirm} onChange={e=>setConfirm(e.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-left outline-none focus:border-amber-300/50"/></label>{message&&<p className="mt-4 rounded-2xl bg-rose-300/10 p-3 text-sm text-rose-100">{message}</p>}<button disabled={busy} className="mt-6 w-full rounded-2xl bg-amber-300 py-4 font-black text-black disabled:opacity-50">{busy?"جاري الحفظ…":"حفظ والدخول"}</button></form></main>;
}
