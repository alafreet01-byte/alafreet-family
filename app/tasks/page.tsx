"use client";
import { useState } from "react";
import AppShell from "../components/AppShell";
import { familyMembers } from "../data/members";
import { useLocalStorage } from "../hooks/useLocalStorage";
type Task={id:string;title:string;memberId:string;done:boolean;createdAt:string};
export default function Page(){
 const [items,setItems]=useLocalStorage<Task[]>('alafreet-tasks-v10',[]); const [title,setTitle]=useState(''); const [memberId,setMemberId]=useState('ahmed');
 const add=()=>{if(!title.trim())return;setItems([{id:crypto.randomUUID(),title:title.trim(),memberId,done:false,createdAt:new Date().toISOString()},...items]);setTitle('')};
 return <AppShell title="المهام" subtitle="توزيع ومتابعة مهام العائلة"><div className="max-w-4xl space-y-5"><div className="grid gap-3 rounded-3xl border border-white/10 bg-white/5 p-5 sm:grid-cols-[1fr_180px_auto]"><input value={title} onChange={e=>setTitle(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')add()}} placeholder="مهمة جديدة" className="rounded-2xl border border-white/10 bg-black/30 p-4 outline-none"/><select value={memberId} onChange={e=>setMemberId(e.target.value)} className="rounded-2xl border border-white/10 bg-slate-900 p-4 outline-none">{familyMembers.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select><button onClick={add} className="rounded-2xl bg-cyan-600 px-6 font-black">إضافة</button></div>{items.length===0&&<p className="rounded-3xl border border-dashed border-white/10 p-10 text-center text-slate-400">لا توجد مهام بعد.</p>}{items.map(t=>{const member=familyMembers.find(m=>m.id===t.memberId);return <div key={t.id} className="flex items-center justify-between gap-4 rounded-3xl border border-white/10 bg-white/5 p-5"><button onClick={()=>setItems(items.map(x=>x.id===t.id?{...x,done:!x.done}:x))} className={`flex-1 text-right font-black ${t.done?'line-through text-slate-500':''}`}>{t.done?'✅':'⬜'} {t.title}<span className="mr-3 text-sm font-normal text-cyan-300">{member?.name}</span></button><button onClick={()=>setItems(items.filter(x=>x.id!==t.id))} className="text-sm text-red-300">حذف</button></div>})}</div></AppShell>
}
