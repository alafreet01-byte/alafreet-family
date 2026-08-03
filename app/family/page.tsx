"use client";

import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import AppShell from "../components/AppShell";
import MemberAvatar from "../components/MemberAvatar";
import { familyMembers } from "../data/members";
import type { FamilyMember } from "../types";

const DEFAULT_CODE = "2006";
const PASSWORDS_KEY = "alafreet-family-passwords-v2";
const CONTENT_KEY = "alafreet-family-content-v2";

type PasswordMap = Record<string, string>;
type SectionId = "memories" | "tasks" | "achievements";

type ProfileItem = {
  id: string;
  text: string;
  createdAt: string;
  done?: boolean;
  image?: string;
};

type MemberContent = Record<SectionId, ProfileItem[]>;
type ContentMap = Record<string, MemberContent>;

const sectionInfo: Record<
  SectionId,
  { title: string; icon: string; placeholder: string; empty: string }
> = {
  memories: {
    title: "الذكريات",
    icon: "📸",
    placeholder: "اكتب ذكرى جديدة...",
    empty: "لا توجد ذكريات في هذا القسم بعد.",
  },
  tasks: {
    title: "المهام",
    icon: "✅",
    placeholder: "اكتب مهمة جديدة...",
    empty: "لا توجد مهام في هذا القسم بعد.",
  },
  achievements: {
    title: "الإنجازات",
    icon: "🏆",
    placeholder: "اكتب إنجازًا جديدًا...",
    empty: "لا توجد إنجازات في هذا القسم بعد.",
  },
};

const emptyMemberContent = (): MemberContent => ({
  memories: [],
  tasks: [],
  achievements: [],
});

export default function Page() {
  const [selected, setSelected] = useState<FamilyMember | null>(null);
  const [pending, setPending] = useState<FamilyMember | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const [passwords, setPasswords] = useState<PasswordMap>({});
  const [content, setContent] = useState<ContentMap>({});
  const [ready, setReady] = useState(false);

  const [activeSection, setActiveSection] =
    useState<SectionId>("memories");
  const [newItemText, setNewItemText] = useState("");
  const [editingItem, setEditingItem] = useState<ProfileItem | null>(null);
  const [editingText, setEditingText] = useState("");
  const [newMemoryImage, setNewMemoryImage] = useState("");
  const [editingImage, setEditingImage] = useState("");

  const [changeFor, setChangeFor] = useState<FamilyMember | null>(null);
  const [currentCode, setCurrentCode] = useState("");
  const [newCode, setNewCode] = useState("");
  const [confirmCode, setConfirmCode] = useState("");
  const [changeError, setChangeError] = useState("");

  const [showAdminReset, setShowAdminReset] = useState(false);
  const [adminCode, setAdminCode] = useState("");
  const [resetMemberId, setResetMemberId] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [resetConfirm, setResetConfirm] = useState("");
  const [resetError, setResetError] = useState("");

  useEffect(() => {
    try {
      const savedPasswords = window.localStorage.getItem(PASSWORDS_KEY);
      const savedContent = window.localStorage.getItem(CONTENT_KEY);

      if (savedPasswords) {
        setPasswords(JSON.parse(savedPasswords) as PasswordMap);
      }

      if (savedContent) {
        setContent(JSON.parse(savedContent) as ContentMap);
      }
    } catch {
      setPasswords({});
      setContent({});
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(PASSWORDS_KEY, JSON.stringify(passwords));
  }, [passwords, ready]);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(CONTENT_KEY, JSON.stringify(content));
  }, [content, ready]);

  const selectedContent = useMemo(() => {
    if (!selected) return emptyMemberContent();
    return content[selected.id] ?? emptyMemberContent();
  }, [content, selected]);

  const currentItems = selectedContent[activeSection];

  function memberCode(memberId: string) {
    return passwords[memberId] ?? DEFAULT_CODE;
  }

  function open(member: FamilyMember) {
    setActiveSection("memories");
    setNewItemText("");
    setNewMemoryImage("");
    setEditingItem(null);

    if (member.locked) {
      setPending(member);
      setCode("");
      setError("");
      return;
    }

    setSelected(member);
  }

  function unlock() {
    if (!pending) return;

    if (code !== memberCode(pending.id)) {
      setError("الرمز غير صحيح");
      return;
    }

    setSelected(pending);
    setPending(null);
    setCode("");
    setError("");
  }

  function addItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selected || !newItemText.trim()) return;

    const item: ProfileItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      text: newItemText.trim(),
      createdAt: new Date().toISOString(),
      done: activeSection === "tasks" ? false : undefined,
      image:
        activeSection === "memories" && newMemoryImage
          ? newMemoryImage
          : undefined,
    };

    setContent((current) => {
      const memberContent =
        current[selected.id] ?? emptyMemberContent();

      return {
        ...current,
        [selected.id]: {
          ...memberContent,
          [activeSection]: [...memberContent[activeSection], item],
        },
      };
    });

    setNewItemText("");
    setNewMemoryImage("");
  }

  function startEditItem(item: ProfileItem) {
    setEditingItem(item);
    setEditingText(item.text);
    setEditingImage(item.image ?? "");
  }

  function saveEditedItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selected || !editingItem || !editingText.trim()) return;

    setContent((current) => {
      const memberContent =
        current[selected.id] ?? emptyMemberContent();

      return {
        ...current,
        [selected.id]: {
          ...memberContent,
          [activeSection]: memberContent[activeSection].map((item) =>
            item.id === editingItem.id
              ? {
                  ...item,
                  text: editingText.trim(),
                  image:
                    activeSection === "memories" && editingImage
                      ? editingImage
                      : undefined,
                }
              : item,
          ),
        },
      };
    });

    setEditingItem(null);
    setEditingText("");
    setEditingImage("");
  }

  function deleteItem(itemId: string) {
    if (!selected) return;

    const confirmed = window.confirm("هل تريد حذف هذا العنصر؟");
    if (!confirmed) return;

    setContent((current) => {
      const memberContent =
        current[selected.id] ?? emptyMemberContent();

      return {
        ...current,
        [selected.id]: {
          ...memberContent,
          [activeSection]: memberContent[activeSection].filter(
            (item) => item.id !== itemId,
          ),
        },
      };
    });
  }

  function toggleTask(itemId: string) {
    if (!selected || activeSection !== "tasks") return;

    setContent((current) => {
      const memberContent =
        current[selected.id] ?? emptyMemberContent();

      return {
        ...current,
        [selected.id]: {
          ...memberContent,
          tasks: memberContent.tasks.map((item) =>
            item.id === itemId ? { ...item, done: !item.done } : item,
          ),
        },
      };
    });
  }

  function readImage(file: File, onDone: (value: string) => void) {
    if (!file.type.startsWith("image/")) {
      window.alert("اختر صورة فقط");
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      window.alert("حجم الصورة كبير. اختر صورة أقل من 3 MB");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        onDone(reader.result);
      }
    };

    reader.onerror = () => {
      window.alert("تعذر قراءة الصورة");
    };

    reader.readAsDataURL(file);
  }

  function handleNewMemoryImage(file?: File) {
    if (!file) return;
    readImage(file, setNewMemoryImage);
  }

  function handleEditingImage(file?: File) {
    if (!file) return;
    readImage(file, setEditingImage);
  }

  function openChangePassword(member: FamilyMember) {
    setChangeFor(member);
    setCurrentCode("");
    setNewCode("");
    setConfirmCode("");
    setChangeError("");
  }

  function savePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!changeFor) return;

    if (currentCode !== memberCode(changeFor.id)) {
      setChangeError("الرمز الحالي غير صحيح");
      return;
    }

    if (!/^\d{4,8}$/.test(newCode)) {
      setChangeError("الرمز الجديد يجب أن يكون من 4 إلى 8 أرقام");
      return;
    }

    if (newCode !== confirmCode) {
      setChangeError("تأكيد الرمز غير مطابق");
      return;
    }

    setPasswords((current) => ({
      ...current,
      [changeFor.id]: newCode,
    }));

    setChangeFor(null);
    window.alert("تم تغيير الرمز بنجاح");
  }

  function openAdminReset() {
    setShowAdminReset(true);
    setAdminCode("");
    setResetMemberId("");
    setResetCode("");
    setResetConfirm("");
    setResetError("");
  }

  function saveAdminReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (adminCode !== memberCode("khalifa")) {
      setResetError("رمز خليفة غير صحيح");
      return;
    }

    if (!resetMemberId) {
      setResetError("اختر فردًا من العائلة");
      return;
    }

    if (!/^\d{4,8}$/.test(resetCode)) {
      setResetError("الرمز الجديد يجب أن يكون من 4 إلى 8 أرقام");
      return;
    }

    if (resetCode !== resetConfirm) {
      setResetError("تأكيد الرمز غير مطابق");
      return;
    }

    setPasswords((current) => ({
      ...current,
      [resetMemberId]: resetCode,
    }));

    setShowAdminReset(false);
    window.alert("تم تعيين الرمز الجديد بنجاح");
  }

  return (
    <AppShell title="أفراد العائلة" subtitle="ملفات العائلة">
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {familyMembers.map((member) => (
          <button
            key={member.id}
            type="button"
            onClick={() => open(member)}
            className="rounded-3xl border border-white/10 bg-white/5 p-6 text-right transition hover:-translate-y-1 hover:border-cyan-400/30"
          >
            <div className="flex items-start justify-between">
              <MemberAvatar member={member} />
              <span>{member.locked ? "🔒" : "←"}</span>
            </div>

            <h2 className="mt-5 text-2xl font-black">{member.name}</h2>
            <p className="text-cyan-300">{member.world}</p>
            <p className="mt-3 leading-7 text-slate-400">
              {member.description}
            </p>
          </button>
        ))}
      </div>

      {pending && (
        <Modal onClose={() => setPending(null)}>
          <div className="text-center">
            <div className="mx-auto w-fit">
              <MemberAvatar member={pending} />
            </div>

            <h2 className="mt-5 text-2xl font-black">
              ملف {pending.name} مقفول
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              أدخل الرمز الخاص بهذا الملف
            </p>

            <input
              autoFocus
              type="password"
              inputMode="numeric"
              maxLength={8}
              value={code}
              onChange={(event) => {
                setCode(event.target.value);
                setError("");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") unlock();
              }}
              placeholder="••••"
              className="mt-5 w-full rounded-2xl border border-white/10 bg-black/30 p-4 text-center text-2xl tracking-[.7em] outline-none focus:border-cyan-400"
            />

            {error && <p className="mt-2 text-red-300">{error}</p>}

            <button
              type="button"
              onClick={unlock}
              className="mt-4 w-full rounded-2xl bg-cyan-600 py-4 font-black"
            >
              فتح الملف
            </button>
          </div>
        </Modal>
      )}

      {selected && (
        <Modal wide onClose={() => setSelected(null)}>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <MemberAvatar member={selected} />

            <div>
              <p className="text-cyan-300">{selected.world}</p>
              <h2 className="mt-1 text-4xl font-black">
                {selected.id === "mother"
                  ? selected.privateName ?? selected.name
                  : selected.name}
              </h2>
              <p className="mt-2 text-slate-400">{selected.role}</p>
            </div>
          </div>

          <p className="mt-6 leading-8 text-slate-300">
            {selected.description}
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <InfoCard title="تاريخ الميلاد" text={selected.birthday} />
            <InfoCard
              title="العمر"
              text={`${getAge(selected.birthday)} سنة`}
            />
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {(Object.keys(sectionInfo) as SectionId[]).map((section) => (
              <button
                key={section}
                type="button"
                onClick={() => {
                  setActiveSection(section);
                  setNewItemText("");
                  setEditingItem(null);
                }}
                className={`rounded-2xl px-5 py-3 font-black transition ${
                  activeSection === section
                    ? "bg-cyan-500 text-white"
                    : "bg-white/10 text-slate-300 hover:bg-white/15"
                }`}
              >
                {sectionInfo[section].icon} {sectionInfo[section].title}
              </button>
            ))}
          </div>

          <section className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-5">
            <form
              onSubmit={addItem}
              className="flex flex-col gap-3 sm:flex-row"
            >
              <input
                value={newItemText}
                onChange={(event) => setNewItemText(event.target.value)}
                placeholder={sectionInfo[activeSection].placeholder}
                className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-cyan-400"
              />

              {activeSection === "memories" && (
                <label className="cursor-pointer rounded-2xl border border-cyan-400/25 bg-cyan-500/10 px-5 py-3 text-center font-black text-cyan-200">
                  📷 تصوير أو اختيار صورة
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(event) =>
                      handleNewMemoryImage(event.target.files?.[0])
                    }
                    className="hidden"
                  />
                </label>
              )}

              <button
                type="submit"
                className="rounded-2xl bg-cyan-500 px-7 py-3 font-black"
              >
                إضافة
              </button>
            </form>

            {activeSection === "memories" && newMemoryImage && (
              <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3">
                <img
                  src={newMemoryImage}
                  alt="معاينة الصورة الجديدة"
                  className="max-h-72 w-full rounded-xl object-contain"
                />

                <button
                  type="button"
                  onClick={() => setNewMemoryImage("")}
                  className="mt-3 rounded-xl bg-red-500/15 px-4 py-2 font-bold text-red-200"
                >
                  إزالة الصورة
                </button>
              </div>
            )}

            <div className="mt-5 space-y-3">
              {currentItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-slate-500">
                  {sectionInfo[activeSection].empty}
                </div>
              ) : (
                currentItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-white/10 bg-black/20 p-4"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        {item.image && (
                          <button
                            type="button"
                            onClick={() => window.open(item.image, "_blank")}
                            className="mb-4 block w-full"
                            title="اضغط لعرض الصورة بحجم أكبر"
                          >
                            <img
                              src={item.image}
                              alt={item.text || "صورة ذكرى"}
                              className="max-h-80 w-full rounded-2xl object-cover"
                            />
                          </button>
                        )}

                        <p
                          className={`break-words font-bold leading-7 ${
                            item.done
                              ? "text-slate-500 line-through"
                              : "text-white"
                          }`}
                        >
                          {item.text}
                        </p>

                        <p className="mt-2 text-xs text-slate-500">
                          {formatDate(item.createdAt)}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {activeSection === "tasks" && (
                          <button
                            type="button"
                            onClick={() => toggleTask(item.id)}
                            className={`rounded-xl px-3 py-2 text-sm font-bold ${
                              item.done
                                ? "bg-amber-500/15 text-amber-200"
                                : "bg-emerald-500/15 text-emerald-200"
                            }`}
                          >
                            {item.done ? "إلغاء الإنجاز" : "تم الإنجاز"}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => startEditItem(item)}
                          className="rounded-xl bg-blue-500/15 px-3 py-2 text-sm font-bold text-blue-200"
                        >
                          ✏️ تعديل
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteItem(item.id)}
                          className="rounded-xl bg-red-500/15 px-3 py-2 text-sm font-bold text-red-200"
                        >
                          🗑️ حذف
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <div className="mt-6 flex flex-wrap gap-3">
            {selected.locked && (
              <button
                type="button"
                onClick={() => openChangePassword(selected)}
                className="rounded-2xl border border-amber-400/25 bg-amber-500/10 px-5 py-3 font-black text-amber-200"
              >
                🔑 تغيير الرمز
              </button>
            )}

            {selected.id === "khalifa" && (
              <button
                type="button"
                onClick={openAdminReset}
                className="rounded-2xl border border-cyan-400/25 bg-cyan-500/10 px-5 py-3 font-black text-cyan-200"
              >
                🛡️ إدارة رموز العائلة
              </button>
            )}
          </div>
        </Modal>
      )}

      {editingItem && (
        <Modal onClose={() => setEditingItem(null)}>
          <form onSubmit={saveEditedItem}>
            <h2 className="text-2xl font-black">تعديل العنصر</h2>

            <textarea
              autoFocus
              rows={5}
              value={editingText}
              onChange={(event) => setEditingText(event.target.value)}
              className="mt-5 w-full resize-none rounded-2xl border border-white/10 bg-black/30 p-4 outline-none focus:border-cyan-400"
            />

            {activeSection === "memories" && (
              <div className="mt-4">
                <label className="block cursor-pointer rounded-2xl border border-cyan-400/25 bg-cyan-500/10 px-5 py-3 text-center font-black text-cyan-200">
                  📷 تصوير أو استبدال الصورة
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(event) =>
                      handleEditingImage(event.target.files?.[0])
                    }
                    className="hidden"
                  />
                </label>

                {editingImage && (
                  <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3">
                    <img
                      src={editingImage}
                      alt="معاينة الصورة"
                      className="max-h-72 w-full rounded-xl object-contain"
                    />

                    <button
                      type="button"
                      onClick={() => setEditingImage("")}
                      className="mt-3 rounded-xl bg-red-500/15 px-4 py-2 font-bold text-red-200"
                    >
                      إزالة الصورة
                    </button>
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              className="mt-4 w-full rounded-2xl bg-cyan-600 py-4 font-black"
            >
              حفظ التعديل
            </button>
          </form>
        </Modal>
      )}

      {changeFor && (
        <Modal onClose={() => setChangeFor(null)}>
          <form onSubmit={savePassword}>
            <h2 className="text-2xl font-black">
              تغيير رمز {changeFor.name}
            </h2>

            <PasswordField
              label="الرمز الحالي"
              value={currentCode}
              onChange={(value) => {
                setCurrentCode(value);
                setChangeError("");
              }}
            />

            <PasswordField
              label="الرمز الجديد"
              value={newCode}
              onChange={(value) => {
                setNewCode(value);
                setChangeError("");
              }}
            />

            <PasswordField
              label="تأكيد الرمز الجديد"
              value={confirmCode}
              onChange={(value) => {
                setConfirmCode(value);
                setChangeError("");
              }}
            />

            {changeError && (
              <p className="mt-3 font-bold text-red-300">{changeError}</p>
            )}

            <button
              type="submit"
              className="mt-5 w-full rounded-2xl bg-cyan-600 py-4 font-black"
            >
              حفظ الرمز الجديد
            </button>
          </form>
        </Modal>
      )}

      {showAdminReset && (
        <Modal onClose={() => setShowAdminReset(false)}>
          <form onSubmit={saveAdminReset}>
            <h2 className="text-2xl font-black">
              إدارة رموز العائلة
            </h2>

            <PasswordField
              label="رمز خليفة للتأكيد"
              value={adminCode}
              onChange={(value) => {
                setAdminCode(value);
                setResetError("");
              }}
            />

            <label className="mt-5 block">
              <span className="mb-2 block text-sm font-bold text-slate-300">
                اختر الفرد
              </span>

              <select
                value={resetMemberId}
                onChange={(event) => {
                  setResetMemberId(event.target.value);
                  setResetError("");
                }}
                className="w-full rounded-2xl border border-white/10 bg-[#111827] p-4 outline-none"
              >
                <option value="">اختر فردًا</option>
                {familyMembers
                  .filter((member) => member.locked)
                  .map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
              </select>
            </label>

            <PasswordField
              label="الرمز الجديد"
              value={resetCode}
              onChange={(value) => {
                setResetCode(value);
                setResetError("");
              }}
            />

            <PasswordField
              label="تأكيد الرمز"
              value={resetConfirm}
              onChange={(value) => {
                setResetConfirm(value);
                setResetError("");
              }}
            />

            {resetError && (
              <p className="mt-3 font-bold text-red-300">{resetError}</p>
            )}

            <button
              type="submit"
              className="mt-5 w-full rounded-2xl bg-cyan-600 py-4 font-black"
            >
              تعيين الرمز الجديد
            </button>
          </form>
        </Modal>
      )}
    </AppShell>
  );
}

function Modal({
  children,
  onClose,
  wide = false,
}: {
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-5 backdrop-blur-xl">
      <div
        className={`relative max-h-[92vh] w-full overflow-y-auto rounded-[36px] border border-white/15 bg-[#070a18] p-7 ${
          wide ? "max-w-4xl" : "max-w-md"
        }`}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute left-5 top-5 rounded-xl bg-white/10 px-3 py-2"
        >
          ✕
        </button>

        {children}
      </div>
    </div>
  );
}

function InfoCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <h3 className="text-sm font-bold text-slate-400">{title}</h3>
      <p className="mt-2 text-xl font-black">{text}</p>
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="mt-5 block">
      <span className="mb-2 block text-sm font-bold text-slate-300">
        {label}
      </span>

      <input
        type="password"
        inputMode="numeric"
        maxLength={8}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-black/30 p-4 outline-none focus:border-cyan-400"
      />
    </label>
  );
}

function getAge(birthday: string) {
  const birthDate = new Date(birthday);
  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 &&
      today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }

  return Math.max(age, 0);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ar-AE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
