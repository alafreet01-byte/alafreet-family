export type IntelligenceItem = {
  id: string;
  person: string;
  title: string;
  detail: string;
  category: "health" | "school" | "university" | "family" | "weather";
  urgency: "high" | "medium" | "low";
  icon: string;
};

export const intelligenceItems: IntelligenceItem[] = [
  {
    id: "amal-med",
    person: "أمل",
    title: "موعد الدواء",
    detail: "الساعة 8:00 مساءً",
    category: "health",
    urgency: "high",
    icon: "✿",
  },
  {
    id: "khalid-project",
    person: "خالد",
    title: "مشروع جامعي",
    detail: "متابعة مادة هندسة الحاسوب",
    category: "university",
    urgency: "medium",
    icon: "⚙",
  },
  {
    id: "ahmed-homework",
    person: "أحمد",
    title: "واجبان في Toddle",
    detail: "الصف التاسع",
    category: "school",
    urgency: "high",
    icon: "▣",
  },
  {
    id: "reem-exam",
    person: "ريم",
    title: "اختبار قريب",
    detail: "الصف الثامن",
    category: "school",
    urgency: "medium",
    icon: "▣",
  },
  {
    id: "aisha-activity",
    person: "عائشة",
    title: "نشاط KG2",
    detail: "نشاط اليوم متاح",
    category: "school",
    urgency: "low",
    icon: "◆",
  },
  {
    id: "saud-home",
    person: "سعود",
    title: "نشاط منزلي",
    detail: "ضمن مدرسة أمل",
    category: "family",
    urgency: "low",
    icon: "⌂",
  },
  {
    id: "fatima-growth",
    person: "فاطمة",
    title: "متابعة النمو",
    detail: "تحديث أسبوعي",
    category: "health",
    urgency: "medium",
    icon: "♡",
  },
  {
    id: "mohammed-play",
    person: "محمد",
    title: "لعبة اليوم",
    detail: "نشاط مناسب للعمر",
    category: "family",
    urgency: "low",
    icon: "★",
  },
];

export const priorities = [
  {
    title: "الأولوية الأولى",
    detail: "متابعة دواء أمل الساعة 8:00 مساءً",
    level: "عاجل",
  },
  {
    title: "الأولوية الثانية",
    detail: "أحمد لديه واجبان لم يكتملَا بعد",
    level: "مدرسة",
  },
  {
    title: "الأولوية الثالثة",
    detail: "متابعة مشروع خالد الجامعي",
    level: "جامعة",
  },
];

export const nightReport = [
  "إنجاز مهام اليوم",
  "مراجعة الواجبات المدرسية",
  "تأكيد الأدوية",
  "ترحيل المهام غير المكتملة",
];
