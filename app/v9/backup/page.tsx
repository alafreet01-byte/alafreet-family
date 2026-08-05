"use client";
import { useRouter } from "next/navigation";

export default function BackupCenterPage() {
  const router = useRouter();
  return <main dir="rtl" className="min-h-screen bg-[#03040a] px-4 py-8 text-white sm:px-6"><div className="mx-auto max-w-4xl">
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6"><div><p className="text-xs font-black tracking-[.3em] text-cyan-200/55">FAMILY BACKUP</p><h1 className="mt-2 text-4xl font-black">خزنة النسخ الاحتياطي 🛡️</h1><p className="mt-2 text-sm text-white/40">نسخة آمنة لبيانات ALAFREET الأساسية — متاحة للأب فقط</p></div><button onClick={()=>router.push("/v9/home")} className="rounded-2xl border border-white/10 px-5 py-3">البيت الرقمي</button></header>
    <section className="mt-8 rounded-[32px] border border-cyan-200/15 bg-cyan-300/[.04] p-6"><div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-300/10 text-3xl">⬇</div><h2 className="mt-5 text-2xl font-black">تحميل نسخة جديدة</h2><p className="mt-3 text-sm leading-7 text-white/45">يشمل الملف أفراد العائلة والمواعيد والتنبيهات والصحة والوثائق والمركبات والمكافآت والمشتريات المسجلة في النظام. لا يحتوي على كلمات المرور أو المفاتيح السرية.</p><a href="/api/admin/backup" className="mt-6 inline-flex rounded-2xl bg-cyan-300 px-6 py-4 font-black text-black">تحميل النسخة الاحتياطية الآن</a></section>
    <section className="mt-5 grid gap-4 sm:grid-cols-3">{[["🔒","بدون كلمات مرور"],["👨‍👩‍👧‍👦","بيانات العائلة"],["📅","المواعيد والسجلات"]].map(([icon,text])=><div key={text} className="rounded-2xl border border-white/10 bg-white/[.03] p-5 text-center"><span className="text-2xl">{icon}</span><strong className="mt-3 block text-sm">{text}</strong></div>)}</section>
  </div></main>;
}
