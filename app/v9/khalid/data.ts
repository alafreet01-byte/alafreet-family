export type Course = {
  id: string;
  code: string;
  title: string;
  instructor: string;
  progress: number;
  color: string;
  next: string;
};

export type UniversityTask = {
  id: string;
  courseId: string;
  title: string;
  due: string;
  type: "assignment" | "project" | "quiz" | "lab";
  status: "new" | "progress" | "done" | "late";
  priority: "high" | "medium" | "low";
};

export const courses: Course[] = [
  {
    id: "programming",
    code: "CPE 201",
    title: "Computer Programming",
    instructor: "UAEU",
    progress: 72,
    color: "#78cfff",
    next: "مختبر برمجة",
  },
  {
    id: "digital-logic",
    code: "CPE 211",
    title: "Digital Logic",
    instructor: "UAEU",
    progress: 58,
    color: "#f1c36b",
    next: "تسليم دائرة",
  },
  {
    id: "calculus",
    code: "MATH 112",
    title: "Calculus",
    instructor: "UAEU",
    progress: 64,
    color: "#b79cff",
    next: "اختبار قصير",
  },
  {
    id: "physics",
    code: "PHYS 101",
    title: "Engineering Physics",
    instructor: "UAEU",
    progress: 81,
    color: "#8ee0b1",
    next: "مراجعة الفصل",
  },
];

export const tasks: UniversityTask[] = [
  {
    id: "t1",
    courseId: "programming",
    title: "Programming Assignment 2",
    due: "غدًا 11:59 مساءً",
    type: "assignment",
    status: "progress",
    priority: "high",
  },
  {
    id: "t2",
    courseId: "digital-logic",
    title: "Logic Circuit Lab",
    due: "بعد يومين",
    type: "lab",
    status: "new",
    priority: "medium",
  },
  {
    id: "t3",
    courseId: "calculus",
    title: "Quiz 3 Review",
    due: "الأحد",
    type: "quiz",
    status: "progress",
    priority: "medium",
  },
  {
    id: "t4",
    courseId: "programming",
    title: "Mini Embedded Project",
    due: "بعد 12 يومًا",
    type: "project",
    status: "new",
    priority: "high",
  },
];

export const engineeringTools = [
  {
    title: "AI Tutor",
    subtitle: "شرح البرمجة والرياضيات والدوائر خطوة بخطوة",
    icon: "◎",
    accent: "#77cfff",
  },
  {
    title: "Engineering Lab",
    subtitle: "المشاريع، الدوائر، الأكواد والتجارب",
    icon: "⚙",
    accent: "#f2c56c",
  },
  {
    title: "Code Vault",
    subtitle: "حفظ الأكواد والمشاريع وربط GitHub لاحقًا",
    icon: "</>",
    accent: "#92e2b4",
  },
  {
    title: "Exam Mode",
    subtitle: "مراجعة، Flash Cards واختبارات قصيرة",
    icon: "◇",
    accent: "#bd9eff",
  },
  {
    title: "Portfolio",
    subtitle: "تجميع أفضل المشاريع والإنجازات الجامعية",
    icon: "▣",
    accent: "#ffad85",
  },
  {
    title: "University Files",
    subtitle: "المحاضرات، ملفات PDF والعروض",
    icon: "▦",
    accent: "#9abfff",
  },
];
