export type CommandItem = {
  id: string;
  title: string;
  detail: string;
  category: "work" | "family" | "waiting" | "decision";
  priority: "high" | "medium" | "low";
  owner: "خليفة" | "أمل";
  due: string;
  private?: boolean;
};

export const commandItems: CommandItem[] = [
  {
    id: "w1",
    title: "متابعة اتفاق الحراس الإضافيين",
    detail: "تأكيد آلية التكاليف والرد النهائي مع الأطراف المعنية.",
    category: "work",
    priority: "high",
    owner: "خليفة",
    due: "اليوم",
    private: true,
  },
  {
    id: "w2",
    title: "مراجعة جدول المناوبات",
    detail: "التأكد من تغطية وردية المساء وعدم وجود نقص.",
    category: "work",
    priority: "medium",
    owner: "خليفة",
    due: "غدًا",
    private: true,
  },
  {
    id: "f1",
    title: "موعد المدرسة",
    detail: "متابعة إعلان Toddle والواجبات المطلوبة.",
    category: "family",
    priority: "medium",
    owner: "أمل",
    due: "هذا الأسبوع",
  },
  {
    id: "f2",
    title: "تجديد تأمين السيارة",
    detail: "مراجعة العرض وتجهيز المستندات.",
    category: "family",
    priority: "high",
    owner: "أمل",
    due: "بعد 4 أيام",
  },
  {
    id: "p1",
    title: "بانتظار رد الجامعة",
    detail: "متابعة القبول والإجراءات الخاصة بخالد.",
    category: "waiting",
    priority: "high",
    owner: "خليفة",
    due: "بانتظار الرد",
  },
  {
    id: "d1",
    title: "رحلة العائلة القادمة",
    detail: "اختيار المكان والميزانية والموعد المناسب.",
    category: "decision",
    priority: "low",
    owner: "أمل",
    due: "هذا الشهر",
  },
];

export const quickStats = [
  { label: "مهام اليوم", value: "6", detail: "2 مهمة عاجلة" },
  { label: "بانتظار الرد", value: "3", detail: "آخر تحديث أمس" },
  { label: "مواعيد الأسبوع", value: "5", detail: "الأسرة والعمل" },
  { label: "قرارات مفتوحة", value: "2", detail: "بحاجة مراجعة" },
];

export const tabs = [
  { id: "all", label: "الكل" },
  { id: "work", label: "العمل" },
  { id: "family", label: "العائلة" },
  { id: "waiting", label: "بانتظار الرد" },
  { id: "decision", label: "القرارات" },
];
