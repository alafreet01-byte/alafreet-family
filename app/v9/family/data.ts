export type FamilyMember = {
  id: string;
  name: string;
  role: string;
  color: string;
  angle: number;
  radius: number;
  height: number;
  subtitle: string;
};

export const familyMembers: FamilyMember[] = [
  { id: "khalifa", name: "خليفة", role: "الأب", color: "#ffd76d", angle: 0, radius: 4.25, height: 0.5, subtitle: "قائد عالم العائلة" },
  { id: "amal", name: "أمل", role: "الأم", color: "#ffb4dc", angle: 0.7, radius: 4.55, height: 0.85, subtitle: "قلب العائلة" },
  { id: "khalid", name: "خالد", role: "ابن", color: "#83d1ff", angle: 1.4, radius: 4.3, height: -0.05, subtitle: "المستقبل والتقنية" },
  { id: "ahmed", name: "أحمد", role: "ابن", color: "#ffc27a", angle: 2.1, radius: 4.6, height: 0.55, subtitle: "طاقة وإنجاز" },
  { id: "reem", name: "ريم", role: "ابنة", color: "#dca6ff", angle: 2.8, radius: 4.2, height: -0.25, subtitle: "لمسة جميلة" },
  { id: "aisha", name: "عائشة", role: "ابنة", color: "#ffabc2", angle: 3.5, radius: 4.55, height: 0.35, subtitle: "فرحة العائلة" },
  { id: "saud", name: "سعود", role: "ابن", color: "#98e9c7", angle: 4.2, radius: 4.3, height: 0.75, subtitle: "روح مرحة" },
  { id: "fatima", name: "فاطمة", role: "ابنة", color: "#ffd4ab", angle: 4.9, radius: 4.5, height: -0.05, subtitle: "نور هادئ" },
  { id: "mohammed", name: "محمد", role: "ابن", color: "#cadcff", angle: 5.6, radius: 4.2, height: 0.3, subtitle: "أصغر نجوم العالم" },
];

export function getFamilyMember(id: string) {
  return familyMembers.find((member) => member.id === id);
}
