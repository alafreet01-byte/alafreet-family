"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { commandItems, quickStats, tabs } from "./data";

type TabId = "all" | "work" | "family" | "waiting" | "decision";

type FamilyMember = {
  id: string;
  name: string;
  username: string;
  role: string;
  route: string;
  status: "active" | "pending";
  access: string;
};

const initialMembers: FamilyMember[] = [
  {
    id: "khalifa",
    name: "خليفة",
    username: "khalifa",
    role: "Super Admin",
    route: "/v9/father",
    status: "active",
    access: "تحكم كامل",
  },
  {
    id: "amal",
    name: "أمل",
    username: "amal",
    role: "School Admin",
    route: "/v9/amal",
    status: "active",
    access: "البيت والمدرسة",
  },
  {
    id: "khaled",
    name: "خالد",
    username: "khaled",
    role: "University",
    route: "/v9/khalid",
    status: "active",
    access: "الجامعة والملف الشخصي",
  },
  {
    id: "ahmed",
    name: "أحمد",
    username: "ahmed",
    role: "Student",
    route: "/v9/school",
    status: "active",
    access: "المدرسة والواجبات",
  },
  {
    id: "reem",
    name: "ريم",
    username: "reem",
    role: "Student",
    route: "/v9/school",
    status: "pending",
    access: "المدرسة والواجبات",
  },
  {
    id: "aisha",
    name: "عائشة",
    username: "aisha",
    role: "Child",
    route: "/v9/school",
    status: "pending",
    access: "واجهة أطفال",
  },
];

function priorityLabel(priority: "high" | "medium" | "low") {
  if (priority === "high") return "عاجل";
  if (priority === "medium") return "متوسط";
  return "عادي";
}

function statusLabel(status: FamilyMember["status"]) {
  return status === "active" ? "نشط" : "بانتظار التفعيل";
}

export default function FatherCommandCenterPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabId>("all");
  const [showFamilyAdmin, setShowFamilyAdmin] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [members, setMembers] = useState<FamilyMember[]>(initialMembers);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(
    null,
  );
  const [notice, setNotice] = useState("");

  const [newMember, setNewMember] = useState({
    name: "",
    username: "",
    role: "Student",
    access: "الملف الشخصي",
  });

  const filteredItems = useMemo(() => {
    if (activeTab === "all") return commandItems;
    return commandItems.filter((item) => item.category === activeTab);
  }, [activeTab]);

  const activeMembers = members.filter(
    (member) => member.status === "active",
  ).length;

  function addMember() {
    const username = newMember.username.trim().toLowerCase();
    const name = newMember.name.trim();

    if (!name || !username) {
      setNotice("اكتب الاسم واسم المستخدم أولًا.");
      return;
    }

    if (members.some((member) => member.username === username)) {
      setNotice("اسم المستخدم مستخدم بالفعل.");
      return;
    }

    const member: FamilyMember = {
      id: username,
      name,
      username,
      role: newMember.role,
      route: "/v9/home",
      status: "pending",
      access: newMember.access,
    };

    setMembers((current) => [...current, member]);
    setShowAddMember(false);
    setNewMember({
      name: "",
      username: "",
      role: "Student",
      access: "الملف الشخصي",
    });
    setNotice(
      `تمت إضافة ${name} إلى لوحة الإدارة. يحتاج الحساب إلى التفعيل.`,
    );
  }

  function activateMember(memberId: string) {
    setNotice(`سيتم فتح لوحة الحسابات لإدارة ${memberId}.`);
    router.push("/v9/admin");
  }

  function requestPasswordReset(member: FamilyMember) {
    setNotice(`سيتم فتح لوحة الحسابات لتعيين كلمة مرور جديدة لـ ${member.name}.`);
    router.push("/v9/admin");
  }

  function requestUsernameChange(member: FamilyMember) {
    setNotice(`سيتم فتح لوحة الحسابات لتغيير اسم المستخدم الخاص بـ ${member.name}.`);
    router.push("/v9/admin");
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen overflow-x-hidden bg-[#02030a] text-white"
    >
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_82%_8%,rgba(235,181,66,0.2),transparent_24%),radial-gradient(circle_at_15%_35%,rgba(39,76,160,0.16),transparent_30%),linear-gradient(180deg,#02030a_0%,#060813_55%,#010105_100%)]" />

      <header className="border-b border-white/10 bg-black/25 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.34em] text-amber-200/45">
              KHALIFA COMMAND CENTER
            </p>

            <h1 className="mt-2 text-3xl font-black">
              مركز قيادة خليفة
            </h1>

            <p className="mt-2 text-sm text-white/35">
              العمل، العائلة، الحسابات، المتابعة والقرارات
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => router.push("/v9/home")}
              className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm font-bold text-white/70"
            >
              البيت الرقمي
            </button>

            <button
              type="button"
              onClick={() => setShowFamilyAdmin(true)}
              className="rounded-2xl border border-cyan-200/20 bg-cyan-300/10 px-4 py-3 text-sm font-black text-cyan-100"
            >
              👑 إدارة العائلة
            </button>

            <button
              type="button"
              className="rounded-2xl border border-amber-200/20 bg-amber-300/10 px-4 py-3 text-sm font-black text-amber-100"
            >
              + إضافة مهمة
            </button>
          </div>
        </div>
      </header>

      {notice && (
        <div className="mx-auto mt-4 max-w-7xl px-4 sm:px-6">
          <div className="flex items-start justify-between gap-4 rounded-2xl border border-emerald-200/15 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">
            <span>{notice}</span>
            <button type="button" onClick={() => setNotice("")}>
              ×
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {quickStats.map((stat, index) => (
            <motion.article
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="rounded-[26px] border border-white/10 bg-white/[0.035] p-5 backdrop-blur-xl"
            >
              <p className="text-xs text-white/35">{stat.label}</p>
              <div className="mt-3 text-4xl font-black text-amber-200">
                {stat.value}
              </div>
              <p className="mt-2 text-xs text-white/30">
                {stat.detail}
              </p>
            </motion.article>
          ))}
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-[32px] border border-white/10 bg-white/[0.035] p-6 backdrop-blur-2xl">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-amber-200/55">
                  TODAY CONTROL
                </p>
                <h2 className="mt-2 text-2xl font-black">
                  أهم ما يحتاج انتباهك
                </h2>
              </div>

              <div className="flex flex-wrap gap-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as TabId)}
                    className={`rounded-full px-3 py-2 text-xs font-bold transition ${
                      activeTab === tab.id
                        ? "bg-amber-300/15 text-amber-100"
                        : "bg-white/[0.035] text-white/35"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {filteredItems.map((item) => (
                <motion.button
                  key={item.id}
                  type="button"
                  layout
                  className="w-full rounded-2xl border border-white/10 bg-black/20 p-4 text-right transition hover:border-amber-200/20"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <strong className="text-sm">{item.title}</strong>

                        {item.private && (
                          <span className="rounded-full bg-rose-300/10 px-2 py-1 text-[9px] font-bold text-rose-200">
                            خاص بالأب
                          </span>
                        )}
                      </div>

                      <p className="mt-2 text-xs leading-6 text-white/35">
                        {item.detail}
                      </p>
                    </div>

                    <span className="rounded-full bg-white/[0.05] px-2 py-1 text-[9px] text-white/40">
                      {priorityLabel(item.priority)}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[10px] text-white/30">
                    <span>المسؤول: {item.owner}</span>
                    <span>{item.due}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </article>

          <div className="space-y-4">
            <article className="rounded-[32px] border border-cyan-200/10 bg-cyan-300/[0.035] p-6 backdrop-blur-2xl">
              <p className="text-xs font-bold text-cyan-200/55">
                FAMILY ADMIN
              </p>
              <h2 className="mt-2 text-2xl font-black">
                إدارة أفراد العائلة
              </h2>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs text-white/35">إجمالي الحسابات</p>
                  <strong className="mt-2 block text-3xl text-cyan-100">
                    {members.length}
                  </strong>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs text-white/35">الحسابات النشطة</p>
                  <strong className="mt-2 block text-3xl text-emerald-100">
                    {activeMembers}
                  </strong>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowFamilyAdmin(true)}
                className="mt-4 w-full rounded-2xl border border-cyan-200/15 bg-cyan-300/10 px-4 py-3 text-sm font-black text-cyan-100"
              >
                فتح لوحة الإدارة
              </button>
            </article>

            <article className="rounded-[32px] border border-pink-200/10 bg-pink-300/[0.035] p-6 backdrop-blur-2xl">
              <p className="text-xs font-bold text-pink-200/55">
                AMAL BOX
              </p>
              <h2 className="mt-2 text-2xl font-black">
                رسائل وتذكيرات أمل
              </h2>

              <div className="mt-5 rounded-2xl border border-pink-200/10 bg-black/20 p-4">
                <p className="text-sm font-bold text-pink-100">
                  لا تنسى تجديد تأمين السيارة
                </p>
                <p className="mt-2 text-xs leading-6 text-white/35">
                  أضافته أمل • منذ ساعتين
                </p>
              </div>

              <button
                type="button"
                onClick={() => router.push("/v9/amal")}
                className="mt-4 w-full rounded-2xl border border-pink-200/15 bg-pink-300/10 px-4 py-3 text-sm font-black text-pink-100"
              >
                فتح مركز أمل
              </button>
            </article>

            <article className="rounded-[32px] border border-blue-200/10 bg-blue-300/[0.035] p-6 backdrop-blur-2xl">
              <p className="text-xs font-bold text-blue-200/55">
                WAITING ROOM
              </p>
              <h2 className="mt-2 text-2xl font-black">
                بانتظار الرد
              </h2>

              <div className="mt-5 space-y-3">
                {commandItems
                  .filter((item) => item.category === "waiting")
                  .map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-white/10 bg-black/20 p-4"
                    >
                      <strong className="text-sm">{item.title}</strong>
                      <p className="mt-2 text-xs leading-6 text-white/35">
                        {item.detail}
                      </p>
                    </div>
                  ))}
              </div>
            </article>

            <article className="rounded-[32px] border border-emerald-200/10 bg-emerald-300/[0.035] p-6 backdrop-blur-2xl">
              <p className="text-xs font-bold text-emerald-200/55">
                END OF DAY
              </p>
              <h2 className="mt-2 text-2xl font-black">
                مراجعة نهاية اليوم
              </h2>

              <div className="mt-5 space-y-3">
                {[
                  "ما أهم شيء أنجزته اليوم؟",
                  "ما الذي تأجل إلى الغد؟",
                  "هل يوجد شيء تريد إبلاغ أمل به؟",
                ].map((question) => (
                  <button
                    key={question}
                    type="button"
                    className="w-full rounded-2xl border border-white/10 bg-black/20 p-4 text-right text-sm text-white/55"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </article>
          </div>
        </section>
      </div>

      {showFamilyAdmin && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 p-4 backdrop-blur-xl">
          <div className="mx-auto my-6 max-w-6xl rounded-[34px] border border-cyan-200/15 bg-[#070912] p-5 shadow-2xl sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-cyan-200/55">
                  FAMILY ADMIN
                </p>
                <h2 className="mt-2 text-3xl font-black">
                  إدارة العائلة والحسابات
                </h2>
                <p className="mt-2 text-sm text-white/35">
                  أسماء المستخدمين، الصلاحيات، التفعيل وطلبات
                  إعادة التعيين
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddMember(true)}
                  className="rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950"
                >
                  + إضافة فرد
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowFamilyAdmin(false);
                    setSelectedMember(null);
                  }}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
                >
                  إغلاق
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {members.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => setSelectedMember(member)}
                  className="rounded-[24px] border border-white/10 bg-white/[0.035] p-5 text-right transition hover:border-cyan-200/25"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-white/35">
                        @{member.username}
                      </p>
                      <h3 className="mt-2 text-xl font-black">
                        {member.name}
                      </h3>
                    </div>

                    <span
                      className={`rounded-full px-2 py-1 text-[9px] ${
                        member.status === "active"
                          ? "bg-emerald-300/10 text-emerald-100"
                          : "bg-amber-300/10 text-amber-100"
                      }`}
                    >
                      {statusLabel(member.status)}
                    </span>
                  </div>

                  <p className="mt-4 text-sm text-cyan-100/70">
                    {member.role}
                  </p>
                  <p className="mt-2 text-xs text-white/35">
                    {member.access}
                  </p>
                </button>
              ))}
            </div>

            {selectedMember && (
              <div className="mt-6 rounded-[28px] border border-white/10 bg-black/25 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs text-cyan-200/55">
                      الحساب المحدد
                    </p>
                    <h3 className="mt-2 text-2xl font-black">
                      {selectedMember.name}
                    </h3>
                    <p className="mt-1 text-sm text-white/40">
                      @{selectedMember.username} • {selectedMember.role}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => router.push(selectedMember.route)}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold"
                  >
                    فتح الصفحة
                  </button>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {selectedMember.status === "pending" && (
                    <button
                      type="button"
                      onClick={() =>
                        activateMember(selectedMember.id)
                      }
                      className="rounded-2xl border border-emerald-200/15 bg-emerald-300/10 p-4 text-sm font-black text-emerald-100"
                    >
                      تفعيل الحساب
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      requestPasswordReset(selectedMember)
                    }
                    className="rounded-2xl border border-amber-200/15 bg-amber-300/10 p-4 text-sm font-black text-amber-100"
                  >
                    إعادة تعيين كلمة المرور
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      requestUsernameChange(selectedMember)
                    }
                    className="rounded-2xl border border-blue-200/15 bg-blue-300/10 p-4 text-sm font-black text-blue-100"
                  >
                    تغيير اسم المستخدم
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setNotice(
                        `تم فتح إعدادات صلاحيات ${selectedMember.name}.`,
                      );
                    }}
                    className="rounded-2xl border border-violet-200/15 bg-violet-300/10 p-4 text-sm font-black text-violet-100"
                  >
                    إدارة الصلاحيات
                  </button>
                </div>
              </div>
            )}

            <div className="mt-6 rounded-2xl border border-amber-200/10 bg-amber-300/[0.04] p-4 text-xs leading-6 text-amber-100/65">
              تُنشأ كلمة مختلفة لكل حساب من لوحة إدارة الحسابات، ولا يتم عرض كلمات المرور الأصلية لأي مستخدم.
            </div>
          </div>
        </div>
      )}

      {showAddMember && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4 backdrop-blur-xl">
          <div className="w-full max-w-lg rounded-[32px] border border-white/10 bg-[#080a12] p-6">
            <h2 className="text-2xl font-black">إضافة فرد جديد</h2>
            <p className="mt-2 text-sm text-white/35">
              سيظهر الحساب بانتظار التفعيل والموافقة.
            </p>

            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-2 block text-xs text-white/45">
                  الاسم
                </span>
                <input
                  value={newMember.name}
                  onChange={(event) =>
                    setNewMember((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-cyan-200/40"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs text-white/45">
                  اسم المستخدم
                </span>
                <input
                  dir="ltr"
                  value={newMember.username}
                  onChange={(event) =>
                    setNewMember((current) => ({
                      ...current,
                      username: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-left outline-none focus:border-cyan-200/40"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs text-white/45">
                  الدور
                </span>
                <select
                  value={newMember.role}
                  onChange={(event) =>
                    setNewMember((current) => ({
                      ...current,
                      role: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-white/10 bg-[#0c0e17] px-4 py-3 outline-none"
                >
                  <option>School Admin</option>
                  <option>University</option>
                  <option>Student</option>
                  <option>Child</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs text-white/45">
                  نطاق الوصول
                </span>
                <input
                  value={newMember.access}
                  onChange={(event) =>
                    setNewMember((current) => ({
                      ...current,
                      access: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-cyan-200/40"
                />
              </label>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={addMember}
                className="flex-1 rounded-2xl bg-cyan-300 px-4 py-3 font-black text-slate-950"
              >
                إضافة
              </button>

              <button
                type="button"
                onClick={() => setShowAddMember(false)}
                className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-bold"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
