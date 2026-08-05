"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Member = {
  id: string; name_ar: string; username: string | null; role: string;
  grade: string | null; school_system: string | null; auth_user_id: string | null;
};

const roles = [
  ["super_admin", "الأب — مدير كامل"],
  ["school_admin", "الأم — إدارة المدرسة"],
  ["university_user", "طالب جامعي"],
  ["student", "طالب مدرسة"],
  ["child", "طفل"],
];

const emptyCreate = { name: "", username: "", password: "", role: "student", grade: "", schoolSystem: "" };

export default function FamilyAdminPage() {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [edit, setEdit] = useState({ name: "", username: "", role: "", grade: "", schoolSystem: "", password: "" });
  const [create, setCreate] = useState(emptyCreate);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const choose = useCallback((member: Member) => {
    setSelectedId(member.id);
    setEdit({
      name: member.name_ar ?? "", username: member.username ?? "", role: member.role,
      grade: member.grade ?? "", schoolSystem: member.school_system ?? "", password: "",
    });
    setMessage("");
  }, []);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/users", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "تعذر تحميل الحسابات.");
      const list: Member[] = data.members ?? [];
      setMembers(list);
      if (list.length && !selectedId) choose(list.find((m) => m.id === "amal") ?? list[0]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "تعذر تحميل الحسابات.");
    } finally { setLoading(false); }
  }, [choose, selectedId]);

  useEffect(() => { void loadMembers(); }, [loadMembers]);

  async function request(body: Record<string, string>, success: string) {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "لم يتم حفظ التغيير.");
      setMessage(`✅ ${success}`);
      await loadMembers();
    } catch (error) { setMessage(error instanceof Error ? error.message : "لم يتم حفظ التغيير."); }
    finally { setBusy(false); }
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    await request({ memberId: selectedId, action: "update_profile", ...edit }, "تم حفظ بيانات الحساب بنجاح.");
  }

  async function resetPassword() {
    if (edit.password.length < 8) { setMessage("كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل."); return; }
    await request({ memberId: selectedId, action: "reset_password", password: edit.password }, "تم تغيير كلمة المرور.");
    setEdit((value) => ({ ...value, password: "" }));
  }

  async function createMember(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(create) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "فشل إنشاء الحساب.");
      setMessage(`✅ تم إنشاء حساب @${data.username} بنجاح.`); setCreate(emptyCreate); setShowCreate(false); await loadMembers();
    } catch (error) { setMessage(error instanceof Error ? error.message : "فشل إنشاء الحساب."); }
    finally { setBusy(false); }
  }

  const inputClass = "w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-cyan-300/60";

  return (
    <main dir="rtl" className="min-h-screen bg-[#02040a] px-4 py-7 text-white">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div><p className="text-[10px] font-black tracking-[.3em] text-cyan-200/50">FAMILY ADMIN</p><h1 className="mt-2 text-3xl font-black">إدارة العائلة بسهولة</h1><p className="mt-2 text-sm text-white/45">اختر الشخص، عدّل البيانات، ثم احفظ.</p></div>
          <div className="flex gap-2"><button onClick={() => setShowCreate(!showCreate)} className="rounded-2xl bg-cyan-300 px-4 py-3 font-black text-slate-950">+ حساب جديد</button><button onClick={() => router.push("/v9/father")} className="rounded-2xl border border-white/10 px-4 py-3">مركز الأب</button></div>
        </header>

        {message && <div className="mt-5 rounded-2xl border border-cyan-200/15 bg-cyan-300/10 p-4 text-sm text-cyan-50">{message}</div>}

        {showCreate && <form onSubmit={createMember} className="mt-6 rounded-[28px] border border-cyan-300/15 bg-cyan-300/[.04] p-6"><h2 className="text-xl font-black">إنشاء حساب جديد</h2><div className="mt-4 grid gap-3 md:grid-cols-3"><input className={inputClass} placeholder="الاسم" required value={create.name} onChange={(e)=>setCreate({...create,name:e.target.value})}/><input className={inputClass} dir="ltr" placeholder="اسم المستخدم" required value={create.username} onChange={(e)=>setCreate({...create,username:e.target.value.toLowerCase()})}/><input className={inputClass} dir="ltr" type="password" placeholder="كلمة مرور مؤقتة" required value={create.password} onChange={(e)=>setCreate({...create,password:e.target.value})}/><select className={inputClass} value={create.role} onChange={(e)=>setCreate({...create,role:e.target.value})}>{roles.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select><input className={inputClass} placeholder="الصف أو التخصص" value={create.grade} onChange={(e)=>setCreate({...create,grade:e.target.value})}/><input className={inputClass} placeholder="النظام الدراسي" value={create.schoolSystem} onChange={(e)=>setCreate({...create,schoolSystem:e.target.value})}/></div><button disabled={busy} className="mt-4 rounded-2xl bg-cyan-300 px-6 py-3 font-black text-slate-950 disabled:opacity-50">إنشاء الحساب</button></form>}

        <section className="mt-6 grid gap-5 lg:grid-cols-[320px_1fr]">
          <aside className="rounded-[28px] border border-white/10 bg-white/[.035] p-5"><h2 className="text-xl font-black">أفراد العائلة</h2>{loading ? <p className="mt-4 text-white/40">جاري التحميل...</p> : <div className="mt-4 space-y-2">{members.map((member)=><button key={member.id} onClick={()=>choose(member)} className={`flex w-full items-center justify-between rounded-2xl border p-4 text-right ${selectedId===member.id?"border-cyan-300/50 bg-cyan-300/10":"border-white/5 bg-black/20"}`}><span><strong>{member.name_ar}</strong><small className="mt-1 block text-white/40">@{member.username ?? "غير محدد"}</small></span><span className="text-xs text-cyan-100">تعديل ←</span></button>)}</div>}</aside>

          {selectedId && <form onSubmit={saveProfile} className="rounded-[28px] border border-white/10 bg-white/[.035] p-6"><p className="text-xs text-cyan-200/50">تعديل الحساب</p><h2 className="mt-2 text-2xl font-black">{edit.name}</h2><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm text-white/60">الاسم<input className={`${inputClass} mt-2 text-white`} value={edit.name} onChange={(e)=>setEdit({...edit,name:e.target.value})}/></label><label className="text-sm text-white/60">اسم المستخدم<input className={`${inputClass} mt-2 text-left text-white`} dir="ltr" value={edit.username} onChange={(e)=>setEdit({...edit,username:e.target.value.toLowerCase()})}/></label><label className="text-sm text-white/60">الصلاحية<select className={`${inputClass} mt-2 text-white`} value={edit.role} onChange={(e)=>setEdit({...edit,role:e.target.value})}>{roles.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label><label className="text-sm text-white/60">الصف أو التخصص<input className={`${inputClass} mt-2 text-white`} value={edit.grade} onChange={(e)=>setEdit({...edit,grade:e.target.value})}/></label><label className="text-sm text-white/60 sm:col-span-2">النظام الدراسي<input className={`${inputClass} mt-2 text-white`} value={edit.schoolSystem} onChange={(e)=>setEdit({...edit,schoolSystem:e.target.value})}/></label></div><button disabled={busy} className="mt-5 w-full rounded-2xl bg-cyan-300 py-4 font-black text-slate-950 disabled:opacity-50">حفظ التغييرات</button><div className="mt-6 border-t border-white/10 pt-5"><h3 className="font-black">تغيير كلمة المرور</h3><div className="mt-3 flex flex-col gap-3 sm:flex-row"><input className={`${inputClass} text-left`} dir="ltr" type="password" placeholder="كلمة المرور الجديدة — 8 أحرف على الأقل" value={edit.password} onChange={(e)=>setEdit({...edit,password:e.target.value})}/><button type="button" disabled={busy} onClick={resetPassword} className="shrink-0 rounded-2xl bg-amber-300/15 px-5 py-3 font-black text-amber-100 disabled:opacity-50">تغيير كلمة المرور</button></div></div></form>}
        </section>
      </div>
    </main>
  );
}
