"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
const items = [
  ["/dashboard","🏠","الرئيسية"],["/maintenance","💬","المحادثة"],["/calendar","📅","التقويم"],
  ["/memories","📸","الذكريات"],["/tasks","🎯","المهام"],["/rewards","🏆","المكافآت"],
  ["/family","👨‍👩‍👧‍👦","العائلة"],["/assistant","🤖","المساعد الذكي"],["/showcase","🌌","وضع العرض"]
] as const;
export default function Sidebar(){
  const pathname=usePathname();
  return <aside className="h-fit w-full rounded-3xl border border-white/10 bg-[#0b1020]/80 p-4 backdrop-blur-xl lg:w-72">
    <h2 className="mb-6 text-center text-xl font-black text-cyan-300">ALAFREET FAMILY</h2>
    <nav className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">{items.map(([href,icon,title])=>{
      const active=pathname===href;
      return <Link key={href} href={href} className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition ${active?"bg-cyan-500/20 text-cyan-300":"hover:bg-white/5"}`}><span className="text-2xl">{icon}</span><span className="font-bold">{title}</span></Link>
    })}</nav>
  </aside>;
}
