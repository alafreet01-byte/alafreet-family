"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { students } from "./data";

type StudentFilter = "all" | "ahmed" | "reem" | "aisha";

type LiveAssignment = {
  id: string;
  student_id: string;
  subject: string;
  title: string;
  details: string | null;
  due_at: string | null;
  status: "new" | "progress" | "done" | "late";
};

type LiveAnnouncement = {
  id: string;
  title: string;
  detail: string;
  type: string;
  createdAt: string;
};

function statusLabel(status: "new" | "progress" | "done" | "late") {
  if (status === "new") return "جديد";
  if (status === "progress") return "قيد التنفيذ";
  if (status === "done") return "مكتمل";
  return "متأخر";
}

export default function SchoolCenterPage() {
  const router = useRouter();
  const [viewer, setViewer] = useState<{ id: string; role: string } | null>(null);
  const [viewerLoading, setViewerLoading] = useState(true);
  const [liveTasks, setLiveTasks] = useState<LiveAssignment[]>([]);
  const [taskMessage, setTaskMessage] = useState("");
  const [liveAnnouncements, setLiveAnnouncements] = useState<LiveAnnouncement[]>([]);
  const [announcementMessage, setAnnouncementMessage] = useState("");
  const [newAnnouncement, setNewAnnouncement] = useState({ title: "", detail: "", type: "إعلان" });
  const [newTask, setNewTask] = useState({
    studentId: "ahmed",
    subject: "",
    title: "",
    dueAt: "",
  });
  const [activeStudent, setActiveStudent] =
    useState<StudentFilter>("all");

  useEffect(() => {
    void (async () => {
      const response = await fetch("/api/school/assignments", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) {
        setTaskMessage(data.error ?? "تعذر تحميل الواجبات.");
        setViewerLoading(false);
        return;
      }

      setLiveTasks(data.assignments ?? []);
      if (data.viewer) {
        setViewer(data.viewer);
        if (data.viewer.role === "student" || data.viewer.role === "child") {
          setActiveStudent(data.viewer.id as StudentFilter);
          setNewTask((current) => ({ ...current, studentId: data.viewer.id }));
        }
      }
      setViewerLoading(false);
    })();
  }, []);

  useEffect(() => {
    void (async () => {
      const response = await fetch("/api/school/announcements", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) {
        setAnnouncementMessage(data.error ?? "تعذر تحميل الإعلانات.");
        return;
      }
      setLiveAnnouncements(data.announcements ?? []);
    })();
  }, []);

  const isSchoolManager =
    viewer?.role === "super_admin" || viewer?.role === "school_admin";

  const visibleStudents = useMemo(() => {
    if (isSchoolManager || !viewer) return students;
    return students.filter((student) => student.id === viewer.id);
  }, [isSchoolManager, viewer]);

  const visibleTasks = useMemo(() => {
    if (activeStudent === "all") return liveTasks;
    return liveTasks.filter((task) => task.student_id === activeStudent);
  }, [activeStudent, liveTasks]);

  async function updateTaskStatus(task: LiveAssignment) {
    const nextStatus = task.status === "done" ? "progress" : "done";
    const response = await fetch("/api/school/assignments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: task.id, status: nextStatus }),
    });
    const data = await response.json();
    if (!response.ok) {
      setTaskMessage(data.error ?? "تعذر تحديث المهمة.");
      return;
    }
    setLiveTasks((current) =>
      current.map((item) => (item.id === task.id ? data.assignment : item)),
    );
    setTaskMessage(nextStatus === "done" ? "تم إكمال المهمة." : "أعيدت المهمة إلى قيد التنفيذ.");
  }

  async function createTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTaskMessage("");
    const response = await fetch("/api/school/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...newTask,
        dueAt: newTask.dueAt ? new Date(newTask.dueAt).toISOString() : null,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      setTaskMessage(data.error ?? "تعذر إضافة الواجب.");
      return;
    }
    setLiveTasks((current) => [...current, data.assignment]);
    setNewTask({ studentId: "ahmed", subject: "", title: "", dueAt: "" });
    setTaskMessage("تمت إضافة الواجب وإرساله للطالب.");
  }

  async function deleteTask(id: string) {
    const response = await fetch("/api/school/assignments", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await response.json();
    if (!response.ok) {
      setTaskMessage(data.error ?? "تعذر حذف الواجب.");
      return;
    }
    setLiveTasks((current) => current.filter((task) => task.id !== id));
    setTaskMessage("تم حذف الواجب.");
  }

  async function createAnnouncement(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAnnouncementMessage("");
    const response = await fetch("/api/school/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newAnnouncement),
    });
    const data = await response.json();
    if (!response.ok) {
      setAnnouncementMessage(data.error ?? "تعذر نشر الإعلان.");
      return;
    }
    setLiveAnnouncements((current) => [data.announcement, ...current]);
    setNewAnnouncement({ title: "", detail: "", type: "إعلان" });
    setAnnouncementMessage("تم نشر الإعلان للعائلة.");
  }

  async function deleteAnnouncement(id: string) {
    const response = await fetch("/api/school/announcements", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await response.json();
    if (!response.ok) {
      setAnnouncementMessage(data.error ?? "تعذر حذف الإعلان.");
      return;
    }
    setLiveAnnouncements((current) => current.filter((item) => item.id !== id));
    setAnnouncementMessage("تم حذف الإعلان.");
  }

  if (viewerLoading) {
    return (
      <main dir="rtl" className="flex min-h-screen items-center justify-center bg-[#02030a] text-emerald-100">
        جاري تجهيز مركز المدرسة…
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen overflow-x-hidden bg-[#02030a] text-white"
    >
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_82%_8%,rgba(83,205,152,0.16),transparent_24%),radial-gradient(circle_at_14%_28%,rgba(84,102,214,0.16),transparent_30%),linear-gradient(180deg,#02030a_0%,#07100d_55%,#010105_100%)]" />

      <header className="border-b border-white/10 bg-black/25 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.34em] text-emerald-200/45">
              TODDLE SCHOOL CENTER
            </p>

            <h1 className="mt-2 text-3xl font-black">
              مركز المدرسة
            </h1>

            <p className="mt-2 text-sm text-white/35">
              {isSchoolManager
                ? "أحمد، ريم وعائشة في مكان واحد تحت إدارة أمل"
                : "واجباتك وإعلاناتك المدرسية في مكان واحد"}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => router.push("/v9/home")}
              className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm font-bold text-white/70"
            >
              البيت الرقمي
            </button>

            {isSchoolManager && (
              <button
                type="button"
                className="rounded-2xl border border-emerald-200/20 bg-emerald-300/10 px-4 py-3 text-sm font-black text-emerald-100"
              >
                + استيراد من Toddle
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <section className="grid gap-4 lg:grid-cols-3">
          {visibleStudents.map((student, index) => {
            const percentage = student.total > 0
              ? Math.round((student.completed / student.total) * 100)
              : 0;

            return (
              <motion.button
                key={student.id}
                type="button"
                onClick={() =>
                  setActiveStudent(student.id as StudentFilter)
                }
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06 }}
                className="rounded-[28px] border border-white/10 bg-white/[0.035] p-5 text-right backdrop-blur-xl transition hover:-translate-y-1"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-full text-2xl font-black"
                    style={{
                      color: student.color,
                      background: `${student.color}16`,
                      border: `1px solid ${student.color}30`,
                    }}
                  >
                    {student.icon}
                  </div>

                  <div>
                    <h2 className="text-xl font-black">{student.name}</h2>
                    <p className="mt-1 text-sm text-white/35">
                      {student.grade} • {student.platform}
                    </p>
                  </div>
                </div>

                <div className="mt-5">
                  <div className="flex items-center justify-between text-xs text-white/35">
                    <span>الإنجاز</span>
                    <span>{percentage}%</span>
                  </div>

                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/30">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${percentage}%`,
                        background: student.color,
                      }}
                    />
                  </div>
                </div>
              </motion.button>
            );
          })}
        </section>

        <section className="mt-6 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <article className="rounded-[32px] border border-white/10 bg-white/[0.035] p-6 backdrop-blur-2xl">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black text-emerald-200/55">
                  ASSIGNMENTS
                </p>

                <h2 className="mt-2 text-2xl font-black">
                  الواجبات والمهام
                </h2>
              </div>

              {isSchoolManager && <div className="flex flex-wrap gap-2">
                {[
                  ["all", "الكل"],
                  ["ahmed", "أحمد"],
                  ["reem", "ريم"],
                  ["aisha", "عائشة"],
                ].map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() =>
                      setActiveStudent(id as StudentFilter)
                    }
                    className={`rounded-full px-3 py-2 text-xs font-black transition ${
                      activeStudent === id
                        ? "bg-emerald-300/15 text-emerald-100"
                        : "bg-white/[0.035] text-white/35"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>}
            </div>

            <div className="mt-5 space-y-3">
              {taskMessage && (
                <p className="rounded-2xl border border-emerald-200/10 bg-emerald-300/[0.06] p-3 text-sm text-emerald-50">
                  {taskMessage}
                </p>
              )}
              {visibleTasks.length === 0 && (
                <p className="rounded-2xl border border-white/8 bg-black/20 p-5 text-sm text-white/40">
                  لا توجد واجبات مسجلة حاليًا.
                </p>
              )}
              {visibleTasks.map((task) => {
                const student = students.find(
                  (item) => item.id === task.student_id,
                );

                return (
                  <motion.article
                    key={task.id}
                    layout
                    className="rounded-2xl border border-white/8 bg-black/20 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <strong>{task.title}</strong>
                          <span className="rounded-full bg-white/[0.05] px-2 py-1 text-[9px] text-white/40">
                            {task.subject}
                          </span>
                        </div>

                        <p className="mt-2 text-xs leading-6 text-white/35">
                          {student?.name} • {student?.grade}
                        </p>
                      </div>

                      <span className="rounded-full bg-emerald-300/10 px-2 py-1 text-[9px] font-black text-emerald-100">
                        {statusLabel(task.status)}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[10px] text-white/30">
                      <span>
                        {task.due_at
                          ? new Intl.DateTimeFormat("ar-AE", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            }).format(new Date(task.due_at))
                          : "دون موعد محدد"}
                      </span>
                      <button
                        type="button"
                        onClick={() => void updateTaskStatus(task)}
                        className="rounded-xl border border-white/8 bg-white/[0.035] px-3 py-2 text-white/50"
                      >
                        {task.status === "done" ? "إعادة فتح" : "تم الإنجاز"}
                      </button>
                      {isSchoolManager && (
                        <button
                          type="button"
                          onClick={() => void deleteTask(task.id)}
                          className="rounded-xl border border-rose-200/10 bg-rose-300/10 px-3 py-2 text-rose-100"
                        >
                          حذف
                        </button>
                      )}
                    </div>
                  </motion.article>
                );
              })}
            </div>
          </article>

          <div className="space-y-4">
            <article className="rounded-[32px] border border-amber-200/10 bg-amber-300/[0.035] p-6 backdrop-blur-2xl">
              <p className="text-xs font-black text-amber-200/55">
                ANNOUNCEMENTS
              </p>

              <h2 className="mt-2 text-2xl font-black">
                الإعلانات
              </h2>

              <div className="mt-5 space-y-3">
                {announcementMessage && (
                  <p className="rounded-2xl border border-amber-200/10 bg-amber-300/[0.06] p-3 text-sm text-amber-50">
                    {announcementMessage}
                  </p>
                )}
                {liveAnnouncements.length === 0 && (
                  <p className="rounded-2xl border border-white/8 bg-black/20 p-4 text-sm text-white/40">
                    لا توجد إعلانات منشورة حاليًا.
                  </p>
                )}
                {liveAnnouncements.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-white/8 bg-black/20 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <strong className="text-sm">{item.title}</strong>
                      <span className="rounded-full bg-amber-300/10 px-2 py-1 text-[9px] text-amber-100">
                        {item.type}
                      </span>
                    </div>

                    <p className="mt-2 text-xs leading-6 text-white/35">
                      {item.detail}
                    </p>
                    {isSchoolManager && (
                      <button
                        type="button"
                        onClick={() => void deleteAnnouncement(item.id)}
                        className="mt-3 rounded-xl bg-rose-300/10 px-3 py-2 text-xs text-rose-100"
                      >
                        حذف الإعلان
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </article>

            {isSchoolManager && (
              <article className="rounded-[32px] border border-amber-200/10 bg-amber-300/[0.035] p-6 backdrop-blur-2xl">
                <p className="text-xs font-black text-amber-200/55">NEW ANNOUNCEMENT</p>
                <h2 className="mt-2 text-2xl font-black">نشر إعلان</h2>
                <form onSubmit={createAnnouncement} className="mt-5 grid gap-3">
                  <input
                    required
                    value={newAnnouncement.title}
                    onChange={(event) => setNewAnnouncement({ ...newAnnouncement, title: event.target.value })}
                    placeholder="عنوان الإعلان"
                    className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 outline-none"
                  />
                  <textarea
                    required
                    rows={3}
                    value={newAnnouncement.detail}
                    onChange={(event) => setNewAnnouncement({ ...newAnnouncement, detail: event.target.value })}
                    placeholder="تفاصيل الإعلان"
                    className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 outline-none"
                  />
                  <select
                    value={newAnnouncement.type}
                    onChange={(event) => setNewAnnouncement({ ...newAnnouncement, type: event.target.value })}
                    className="rounded-2xl border border-white/10 bg-[#090d14] px-4 py-3 outline-none"
                  >
                    <option>إعلان</option>
                    <option>عاجل</option>
                    <option>نشاط</option>
                    <option>تذكير</option>
                  </select>
                  <button type="submit" className="rounded-2xl bg-amber-300 px-4 py-3 font-black text-slate-950">
                    نشر الإعلان
                  </button>
                </form>
              </article>
            )}

            {viewer && (
              <article className="rounded-[32px] border border-emerald-200/10 bg-emerald-300/[0.035] p-6 backdrop-blur-2xl">
                <p className="text-xs font-black text-emerald-200/55">NEW ASSIGNMENT</p>
                <h2 className="mt-2 text-2xl font-black">
                  {isSchoolManager ? "إضافة واجب" : "إضافة واجب لنفسي"}
                </h2>
                <form onSubmit={createTask} className="mt-5 grid gap-3">
                  {isSchoolManager ? (
                    <select
                      value={newTask.studentId}
                      onChange={(event) => setNewTask({ ...newTask, studentId: event.target.value })}
                      className="rounded-2xl border border-white/10 bg-[#090d14] px-4 py-3 outline-none"
                    >
                      {students.map((student) => (
                        <option key={student.id} value={student.id}>{student.name}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white/45">
                      سيُضاف الواجب إلى حسابك فقط.
                    </p>
                  )}
                  <input
                    required
                    value={newTask.subject}
                    onChange={(event) => setNewTask({ ...newTask, subject: event.target.value })}
                    placeholder="المادة"
                    className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 outline-none"
                  />
                  <input
                    required
                    value={newTask.title}
                    onChange={(event) => setNewTask({ ...newTask, title: event.target.value })}
                    placeholder="عنوان الواجب"
                    className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 outline-none"
                  />
                  <input
                    type="datetime-local"
                    value={newTask.dueAt}
                    onChange={(event) => setNewTask({ ...newTask, dueAt: event.target.value })}
                    className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 outline-none"
                  />
                  <button type="submit" className="rounded-2xl bg-emerald-300 px-4 py-3 font-black text-slate-950">
                    إرسال الواجب
                  </button>
                </form>
              </article>
            )}

            {isSchoolManager && <article className="rounded-[32px] border border-blue-200/10 bg-blue-300/[0.035] p-6 backdrop-blur-2xl">
              <p className="text-xs font-black text-blue-200/55">
                IMPORT FROM TODDLE
              </p>

              <h2 className="mt-2 text-2xl font-black">
                إضافة من Toddle
              </h2>

              <p className="mt-4 text-sm leading-8 text-white/40">
                ارفع Screenshot أو PDF من Toddle، ثم راجع البيانات قبل حفظها.
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className="rounded-2xl border border-blue-200/15 bg-blue-300/10 p-4 text-sm font-black text-blue-100"
                >
                  رفع Screenshot
                </button>

                <button
                  type="button"
                  className="rounded-2xl border border-white/8 bg-black/20 p-4 text-sm font-black text-white/55"
                >
                  رفع PDF
                </button>
              </div>
            </article>}

            {isSchoolManager && <article className="rounded-[32px] border border-pink-200/10 bg-pink-300/[0.035] p-6 backdrop-blur-2xl">
              <p className="text-xs font-black text-pink-200/55">
                AMAL SCHOOL ADMIN
              </p>

              <h2 className="mt-2 text-2xl font-black">
                صلاحيات أمل
              </h2>

              <p className="mt-4 text-sm leading-8 text-white/40">
                أمل تستطيع إضافة وتعديل الواجبات والإعلانات والجداول والتنبيهات
                المدرسية، مع بقاء التحكم النهائي للأب.
              </p>
            </article>}
          </div>
        </section>
      </div>
    </main>
  );
}
