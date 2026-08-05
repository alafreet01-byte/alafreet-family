"use client";
import Link from "next/link";
import { familyMembers } from "../data/members";
const cards=[
  ["المحادثة","قيد إعادة البناء","💬","/maintenance"],
  ["التقويم","أعياد الميلاد وذكرى الزواج","📅","/calendar"],
  ["الذكريات","صور وملاحظات لكل فرد","📸","/memories"],
  ["المهام","توزيع ومتابعة المهام","🎯","/tasks"],
  ["المكافآت","نقاط ومكافآت العائلة","🏆","/rewards"],
  ["العائلة","ملفات أفراد العائلة","👨‍👩‍👧‍👦","/family"]
] as const;
export default function Dashboard(){
  return <div className="space-y-6">
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[['أفراد العائلة',familyMembers.length,'👨‍👩‍👧‍👦'],['الملفات المقفلة',3,'🔒'],['المحادثات',4,'💬'],['المناسبات',10,'📅']].map(([t,v,i])=><div key={String(t)} className="rounded-3xl border border-white/10 bg-[#0b1020]/70 p-6"><div className="text-3xl">{i}</div><p className="mt-4 text-slate-400">{t}</p><h2 className="mt-2 text-4xl font-black">{v}</h2></div>)}
    </div>
    <div className="rounded-3xl border border-cyan-400/20 bg-cyan-500/10 p-6"><h2 className="text-2xl font-black">مرحبًا بك يا خليفة 👋</h2><p className="mt-3 leading-8 text-slate-300">هذه النسخة تجمع أساسيات التطبيق في مشروع واحد منظم. البيانات الحالية محلية على الجهاز، وتجهيز قاعدة البيانات سيكون المرحلة التالية.</p></div>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{cards.map(([t,d,i,h])=><Link key={h} href={h} className="rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:-translate-y-1 hover:border-cyan-400/30"><div className="text-4xl">{i}</div><h3 className="mt-4 text-xl font-black">{t}</h3><p className="mt-2 text-slate-400">{d}</p></Link>)}</div>
  </div>;
}
