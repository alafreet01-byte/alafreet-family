"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Member = { id:string; name_ar:string; username:string|null; role:string; grade:string|null; school_system:string|null; auth_user_id:string|null; auth_created_at:string|null; last_sign_in_at:string|null; auth_updated_at:string|null };
type Activity = { id:string; event_type:string; title:string; details:string|null; actor_id:string|null; target_id:string|null; created_at:string };
type EditForm = { name:string; username:string; role:string; grade:string; schoolSystem:string; password:string };

const roles = [["super_admin","الأب — مدير كامل"],["school_admin","الأم — إدارة المدرسة"],["university_user","طالب جامعي"],["student","طالب مدرسة"],["child","طفل"]];
const emptyCreate = { name:"", username:"", password:"", role:"student", grade:"", schoolSystem:"" };
const inputClass = "mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-cyan-300/60";

export default function FamilyAdminPage() {
  const router = useRouter();
  const [view,setView] = useState<"manage"|"create">("manage");
  const [members,setMembers] = useState<Member[]>([]);
  const [activities,setActivities] = useState<Activity[]>([]);
  const [selectedId,setSelectedId] = useState("");
  const [edit,setEdit] = useState<EditForm>({name:"",username:"",role:"",grade:"",schoolSystem:"",password:""});
  const [create,setCreate] = useState(emptyCreate);
  const [loading,setLoading] = useState(true);
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState("");

  const choose = useCallback((member:Member) => {
    setSelectedId(member.id);
    setEdit({name:member.name_ar,username:member.username??"",role:member.role,grade:member.grade??"",schoolSystem:member.school_system??"",password:""});
    setMessage("");
  },[]);

  const load = useCallback(async() => {
    setLoading(true);
    try {
      const response=await fetch("/api/admin/users",{cache:"no-store"}); const data=await response.json();
      if(!response.ok) throw new Error(data.error??"تعذر تحميل الحسابات.");
      const list:Member[]=data.members??[]; setMembers(list); setActivities(data.activity??[]);
      if(list.length && !selectedId) choose(list.find((m)=>m.id==="amal")??list[0]);
    } catch(error){setMessage(error instanceof Error?error.message:"تعذر تحميل الحسابات.");}
    finally{setLoading(false);}
  },[choose,selectedId]);
  useEffect(()=>{void load();},[load]);

  async function patch(body:Record<string,string>,success:string){setBusy(true);setMessage("");try{const response=await fetch("/api/admin/users",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});const data=await response.json();if(!response.ok)throw new Error(data.error??"لم يتم الحفظ.");setMessage(`✅ ${success}`);await load();}catch(error){setMessage(error instanceof Error?error.message:"لم يتم الحفظ.");}finally{setBusy(false);}}
  async function save(event:FormEvent){event.preventDefault();await patch({memberId:selectedId,action:"update_profile",...edit},"تم حفظ بيانات الحساب.");}
  async function resetPassword(){if(edit.password.length<8){setMessage("كلمة المرور يجب أن تكون 8 أحرف على الأقل.");return;}await patch({memberId:selectedId,action:"reset_password",password:edit.password},"تم تغيير كلمة المرور.");setEdit((v)=>({...v,password:""}));}
  async function createMember(event:FormEvent){event.preventDefault();setBusy(true);setMessage("");try{const response=await fetch("/api/admin/users",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(create)});const data=await response.json();if(!response.ok)throw new Error(data.error??"فشل إنشاء الحساب.");setMessage(`✅ تم إنشاء حساب @${data.username}.`);setCreate(emptyCreate);setView("manage");await load();}catch(error){setMessage(error instanceof Error?error.message:"فشل إنشاء الحساب.");}finally{setBusy(false);}}

  const selected=members.find((m)=>m.id===selectedId);
  const history=activities.filter((a)=>a.actor_id===selectedId||a.target_id===selectedId).slice(0,20);
  const formatDate=(value:string|null)=>value?new Intl.DateTimeFormat("ar-AE",{dateStyle:"medium",timeStyle:"short"}).format(new Date(value)):"لا يوجد حتى الآن";
  const age=selected?.auth_created_at?Math.max(0,Math.floor((Date.now()-new Date(selected.auth_created_at).getTime())/86400000)):null;

  return <main dir="rtl" className="min-h-screen bg-[#02040a] px-4 py-7 text-white"><div className="mx-auto max-w-6xl">
    <header className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-[10px] font-black tracking-[.3em] text-cyan-200/50">FAMILY ADMIN</p><h1 className="mt-2 text-3xl font-black">كنترول حسابات العائلة</h1><p className="mt-2 text-sm text-white/45">الإدارة والتعديل منفصلان تمامًا عن إنشاء الحسابات.</p></div><button onClick={()=>router.push("/v9/father")} className="rounded-2xl border border-white/10 px-4 py-3">مركز الأب</button></header>
    <nav className="mt-6 grid grid-cols-2 gap-2 rounded-[22px] border border-white/10 bg-white/[.03] p-2"><button onClick={()=>setView("manage")} className={`rounded-2xl px-4 py-3 font-black ${view==="manage"?"bg-cyan-300 text-slate-950":"text-white/55"}`}>إدارة حساب موجود</button><button onClick={()=>setView("create")} className={`rounded-2xl px-4 py-3 font-black ${view==="create"?"bg-cyan-300 text-slate-950":"text-white/55"}`}>إنشاء حساب جديد</button></nav>
    {message&&<div className="mt-5 rounded-2xl border border-cyan-200/15 bg-cyan-300/10 p-4 text-sm">{message}</div>}

    {view==="create"&&<form onSubmit={createMember} className="mt-6 rounded-[28px] border border-cyan-300/15 bg-white/[.035] p-6"><h2 className="text-2xl font-black">إنشاء حساب جديد</h2><p className="mt-1 text-sm text-white/40">هذا القسم يبدأ فارغًا دائمًا.</p><div className="mt-5 grid gap-4 md:grid-cols-2"><Field label="الاسم"><input className={inputClass} required value={create.name} onChange={(e)=>setCreate({...create,name:e.target.value})}/></Field><Field label="اسم المستخدم"><input className={`${inputClass} text-left`} dir="ltr" required value={create.username} onChange={(e)=>setCreate({...create,username:e.target.value.toLowerCase()})}/></Field><Field label="كلمة المرور المؤقتة"><input className={`${inputClass} text-left`} dir="ltr" type="password" required value={create.password} onChange={(e)=>setCreate({...create,password:e.target.value})}/></Field><Field label="نوع الحساب"><select className={inputClass} value={create.role} onChange={(e)=>setCreate({...create,role:e.target.value})}>{roles.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></Field><Field label="الصف أو التخصص"><input className={inputClass} value={create.grade} onChange={(e)=>setCreate({...create,grade:e.target.value})}/></Field><Field label="النظام الدراسي"><input className={inputClass} value={create.schoolSystem} onChange={(e)=>setCreate({...create,schoolSystem:e.target.value})}/></Field></div><button disabled={busy} className="mt-5 w-full rounded-2xl bg-cyan-300 py-4 font-black text-slate-950 disabled:opacity-50">إنشاء الحساب</button></form>}

    {view==="manage"&&<section className="mt-6 grid gap-5 lg:grid-cols-[300px_1fr]"><aside className="rounded-[28px] border border-white/10 bg-white/[.035] p-5"><h2 className="text-xl font-black">اختر الحساب</h2>{loading?<p className="mt-4 text-white/40">جاري التحميل...</p>:<div className="mt-4 space-y-2">{members.map((m)=><button key={m.id} onClick={()=>choose(m)} className={`flex w-full items-center justify-between rounded-2xl border p-4 text-right ${selectedId===m.id?"border-cyan-300/50 bg-cyan-300/10":"border-white/5 bg-black/20"}`}><span><strong>{m.name_ar}</strong><small className="mt-1 block text-white/40">@{m.username??"غير محدد"}</small></span><span className="text-xs text-cyan-100">فتح ←</span></button>)}</div>}</aside>
      {selected&&<div className="space-y-5"><form onSubmit={save} className="rounded-[28px] border border-white/10 bg-white/[.035] p-6"><p className="text-xs text-cyan-200/50">بيانات الحساب الحالية — جاهزة للتعديل</p><h2 className="mt-2 text-2xl font-black">{edit.name}</h2><div className="mt-5 grid gap-4 sm:grid-cols-2"><Field label="الاسم"><input className={inputClass} value={edit.name} onChange={(e)=>setEdit({...edit,name:e.target.value})}/></Field><Field label="اسم المستخدم"><input className={`${inputClass} text-left`} dir="ltr" value={edit.username} onChange={(e)=>setEdit({...edit,username:e.target.value.toLowerCase()})}/></Field><Field label="الصلاحية"><select className={inputClass} value={edit.role} onChange={(e)=>setEdit({...edit,role:e.target.value})}>{roles.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></Field><Field label="الصف أو التخصص"><input className={inputClass} value={edit.grade} onChange={(e)=>setEdit({...edit,grade:e.target.value})}/></Field><div className="sm:col-span-2"><Field label="النظام الدراسي"><input className={inputClass} value={edit.schoolSystem} onChange={(e)=>setEdit({...edit,schoolSystem:e.target.value})}/></Field></div></div><button disabled={busy} className="mt-5 w-full rounded-2xl bg-cyan-300 py-4 font-black text-slate-950 disabled:opacity-50">حفظ التغييرات</button><div className="mt-6 border-t border-white/10 pt-5"><h3 className="font-black">تغيير كلمة المرور</h3><div className="mt-3 flex flex-col gap-3 sm:flex-row"><input className={`${inputClass} mt-0 text-left`} dir="ltr" type="password" placeholder="كلمة المرور الجديدة" value={edit.password} onChange={(e)=>setEdit({...edit,password:e.target.value})}/><button type="button" onClick={resetPassword} disabled={busy} className="shrink-0 rounded-2xl bg-amber-300/15 px-5 py-3 font-black text-amber-100">تغيير كلمة المرور</button></div></div></form>
        <section className="rounded-[28px] border border-white/10 bg-white/[.035] p-6"><h3 className="text-xl font-black">معلومات الحساب</h3><div className="mt-4 grid gap-3 sm:grid-cols-3"><Stat label="آخر دخول" value={formatDate(selected.last_sign_in_at)}/><Stat label="تاريخ الإنشاء" value={formatDate(selected.auth_created_at)}/><Stat label="مدة الحساب" value={age===null?"غير متوفر":`${age} يوم`}/></div></section>
        <section className="rounded-[28px] border border-white/10 bg-white/[.035] p-6"><h3 className="text-xl font-black">سجل الحساب</h3><p className="mt-1 text-xs text-white/40">ما قام به الحساب وما تم تعديله عليه.</p><div className="mt-4 space-y-2">{history.length?history.map((item)=><div key={item.id} className="rounded-2xl border border-white/5 bg-black/25 p-4"><div className="flex flex-wrap justify-between gap-2"><strong className="text-sm">{item.title}</strong><time className="text-xs text-white/35">{formatDate(item.created_at)}</time></div>{item.details&&<p className="mt-2 text-xs text-white/50">{item.details}</p>}</div>):<p className="rounded-2xl bg-black/20 p-4 text-sm text-white/40">لا يوجد نشاط مسجل لهذا الحساب حتى الآن.</p>}</div></section>
      </div>}
    </section>}
  </div></main>;
}

function Field({label,children}:{label:string;children:React.ReactNode}){return <label className="text-sm text-white/60">{label}{children}</label>}
function Stat({label,value}:{label:string;value:string}){return <div className="rounded-2xl bg-black/25 p-4"><small className="text-white/40">{label}</small><strong className="mt-2 block text-sm">{value}</strong></div>}
