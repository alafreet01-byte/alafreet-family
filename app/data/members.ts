import type { FamilyMember } from "../types";

export const familyMembers: FamilyMember[] = [
  { id:"khalifa", name:"خليفة", role:"قائد العائلة", birthday:"1979-09-08", icon:"👨🏻", locked:true, world:"مركز القيادة", description:"إدارة العائلة والمناسبات والملفات والقرارات المهمة.", gradient:"from-cyan-400 to-blue-700", glow:"rgba(34,211,238,.85)" },
  { id:"mother", name:"الأم", privateName:"أمل", role:"قلب العائلة", birthday:"1989-02-22", icon:"👩🏻", locked:true, world:"العالم الخاص", description:"الذكريات الخاصة والحياة العائلية.", gradient:"from-pink-400 to-purple-700", glow:"rgba(236,72,153,.85)" },
  { id:"khalid", name:"خالد", role:"الابن الأكبر", birthday:"2008-04-13", icon:"🧑🏻‍💻", image:"/family/khalid.jpg", locked:true, world:"مركز العمليات السيبرانية", description:"الدراسة والمشروعات التقنية والطموحات.", gradient:"from-blue-400 to-indigo-700", glow:"rgba(96,165,250,.85)" },
  { id:"ahmed", name:"أحمد", role:"الابن", birthday:"2011-11-15", icon:"🚀", image:"/family/ahmed.jpg", locked:false, world:"عالم الاستكشاف", description:"الدراسة والهوايات والمغامرات.", gradient:"from-orange-400 to-red-700", glow:"rgba(251,146,60,.85)" },
  { id:"reem", name:"ريم", role:"الابنة", birthday:"2012-10-28", icon:"🎨", image:"/family/reem.jpg", locked:false, world:"عالم الإبداع", description:"الرسم والأفكار والذكريات.", gradient:"from-fuchsia-400 to-purple-700", glow:"rgba(217,70,239,.85)" },
  { id:"aisha", name:"عائشة", role:"الابنة", birthday:"2021-02-27", icon:"🌸", image:"/family/aisha.jpg", locked:false, world:"عالم النجوم", description:"القصص والتعلم والمرح.", gradient:"from-cyan-300 to-teal-600", glow:"rgba(45,212,191,.85)" },
  { id:"saud", name:"سعود", role:"الابن", birthday:"2024-09-17", icon:"🧸", locked:false, world:"عالم المرح", description:"اللعب والنمو.", gradient:"from-emerald-400 to-cyan-700", glow:"rgba(16,185,129,.85)" },
  { id:"fatima", name:"فاطمة", role:"الابنة", birthday:"2025-06-20", icon:"🌷", locked:false, world:"عالم الزهور", description:"الطفولة والذكريات الجميلة.", gradient:"from-rose-400 to-pink-700", glow:"rgba(244,114,182,.85)" },
  { id:"mohammed", name:"محمد", role:"الابن", birthday:"2026-07-06", icon:"🌙", locked:false, world:"عالم القمر", description:"الطفل الجديد للعائلة.", gradient:"from-sky-400 to-indigo-700", glow:"rgba(56,189,248,.85)" }
];
