export type MemberId =
  | "khalifa" | "mother" | "khalid" | "ahmed" | "reem"
  | "aisha" | "saud" | "fatima" | "mohammed";

export type FamilyMember = {
  id: MemberId;
  name: string;
  privateName?: string;
  role: string;
  birthday: string;
  icon: string;
  image?: string;
  locked: boolean;
  world: string;
  description: string;
  gradient: string;
  glow: string;
};

export type ItemType = "memory" | "achievement" | "event" | "note" | "task" | "reward";

export type FamilyItem = {
  id: string;
  memberId: MemberId;
  type: ItemType;
  title: string;
  details: string;
  date: string;
  completed?: boolean;
  points?: number;
  createdAt: string;
};
