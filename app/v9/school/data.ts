export type Student = {
  id: string;
  name: string;
  grade: string;
  platform: string;
  color: string;
  icon: string;
  completed: number;
  total: number;
};

export type SchoolTask = {
  id: string;
  studentId: string;
  subject: string;
  title: string;
  due: string;
  status: "new" | "progress" | "done" | "late";
  priority: "high" | "medium" | "low";
};

export const students: Student[] = [
  {
    id: "ahmed",
    name: "أحمد",
    grade: "الصف العاشر",
    platform: "Toddle",
    color: "#ffc27a",
    icon: "أ",
    completed: 3,
    total: 5,
  },
  {
    id: "reem",
    name: "ريم",
    grade: "الصف الثامن",
    platform: "Toddle",
    color: "#dca6ff",
    icon: "ر",
    completed: 4,
    total: 6,
  },
  {
    id: "aisha",
    name: "عائشة",
    grade: "KG2",
    platform: "Toddle",
    color: "#ffabc2",
    icon: "ع",
    completed: 2,
    total: 3,
  },
];

export const tasks: SchoolTask[] = [
  {
    id: "a1",
    studentId: "ahmed",
    subject: "رياضيات",
    title: "حل تمارين الوحدة الرابعة",
    due: "اليوم 8:00 مساءً",
    status: "progress",
    priority: "high",
  },
  {
    id: "a2",
    studentId: "ahmed",
    subject: "علوم",
    title: "تقرير التجربة العملية",
    due: "غدًا",
    status: "new",
    priority: "medium",
  },
  {
    id: "r1",
    studentId: "reem",
    subject: "لغة إنجليزية",
    title: "Reading Reflection",
    due: "اليوم",
    status: "late",
    priority: "high",
  },
  {
    id: "r2",
    studentId: "reem",
    subject: "رياضيات",
    title: "مراجعة للاختبار",
    due: "بعد يومين",
    status: "progress",
    priority: "medium",
  },
  {
    id: "i1",
    studentId: "aisha",
    subject: "KG2 Activity",
    title: "نشاط الحروف والألوان",
    due: "اليوم",
    status: "new",
    priority: "low",
  },
];

export const announcements = [
  {
    title: "إعلان جديد من المدرسة",
    detail: "يرجى مراجعة Toddle والاطلاع على التحديث الأخير.",
    type: "جديد",
  },
  {
    title: "موعد تسليم قريب",
    detail: "تبقى أقل من 24 ساعة على أحد واجبات ريم.",
    type: "عاجل",
  },
  {
    title: "نشاط KG2",
    detail: "نشاط عائشة اليوم أصبح متاحًا.",
    type: "نشاط",
  },
];
