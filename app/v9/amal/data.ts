export type AmalItem = {
  id: string;
  title: string;
  detail: string;
  category: "health" | "school" | "home" | "ideas" | "family";
  icon: string;
  status?: string;
};

export const todayItems: AmalItem[] = [
  {
    id: "med-1",
    title: "موعد الدواء",
    detail: "الساعة 8:00 مساءً",
    category: "health",
    icon: "✚",
    status: "مهم",
  },
  {
    id: "school-1",
    title: "متابعة Toddle",
    detail: "أحمد وريم وعائشة",
    category: "school",
    icon: "▣",
    status: "مدرسة",
  },
  {
    id: "home-1",
    title: "قائمة مشتريات المنزل",
    detail: "الحليب، الحفاضات، مستلزمات الأطفال",
    category: "home",
    icon: "⌂",
    status: "منزل",
  },
  {
    id: "idea-1",
    title: "فكرة اليوم",
    detail: "نشاط منزلي بسيط لسعود وفاطمة ومحمد",
    category: "ideas",
    icon: "✦",
    status: "فكرة",
  },
];

export const lifeSections = [
  {
    id: "ai",
    title: "AI Companion",
    subtitle: "كل ما تسألين عنه يوميًا في مكان واحد",
    icon: "◎",
    accent: "#f4a9d8",
  },
  {
    id: "medicines",
    title: "الأدوية والصحة",
    subtitle: "المواعيد، الجرعات، المتابعة والتنبيهات",
    icon: "✚",
    accent: "#ff9f9f",
  },
  {
    id: "school",
    title: "إدارة المدرسة",
    subtitle: "Toddle، الواجبات، الإعلانات والتقارير",
    icon: "▣",
    accent: "#8bdcb2",
  },
  {
    id: "home-school",
    title: "مدرسة أمل",
    subtitle: "أنشطة سعود وفاطمة ومحمد في البيت",
    icon: "★",
    accent: "#ffd38b",
  },
  {
    id: "ideas",
    title: "دفتر الأفكار",
    subtitle: "أفكار، خطط، ملاحظات، وصفات وأهداف",
    icon: "✦",
    accent: "#c6a7ff",
  },
  {
    id: "kitchen",
    title: "المطبخ والتسوق",
    subtitle: "الوصفات، قائمة المقاضي وما طبختِ هذا الأسبوع",
    icon: "◌",
    accent: "#f6c97b",
  },
  {
    id: "story",
    title: "Our Story",
    subtitle: "الغرفة الخاصة مع خليفة",
    icon: "♥",
    accent: "#ff8eaa",
  },
  {
    id: "video-studio",
    title: "Amal Video Studio",
    subtitle: "تنسيق المشاهد، كتابة النص وتجهيز فيديوهات السوشيال ميديا",
    icon: "▶",
    accent: "#67e8f9",
    route: "/v9/amal/video-studio",
  },
  {
    id: "journal",
    title: "يومياتي",
    subtitle: "المشاعر، الذكريات وما حدث اليوم",
    icon: "◇",
    accent: "#8ecbff",
  },
];

export const homeKids = [
  {
    name: "سعود",
    activity: "مطابقة الألوان",
    ageGroup: "نشاط منزلي",
  },
  {
    name: "فاطمة",
    activity: "وقت الحكاية والصور",
    ageGroup: "متابعة نمو",
  },
  {
    name: "محمد",
    activity: "أصوات وحركة بسيطة",
    ageGroup: "لعبة اليوم",
  },
];
