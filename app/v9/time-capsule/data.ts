export type Capsule = {
  id: string;
  title: string;
  recipient: string;
  sender: string;
  type: "message" | "photo" | "video" | "audio";
  unlockDate: string;
  occasion: string;
  status: "locked" | "ready";
  color: string;
};

export const capsules: Capsule[] = [
  {
    id: "amal-anniversary",
    title: "رسالة عيد الزواج",
    recipient: "أمل",
    sender: "خليفة",
    type: "message",
    unlockDate: "2026-08-23",
    occasion: "عيد الزواج",
    status: "locked",
    color: "#ff9ab6",
  },
  {
    id: "khalid-graduation",
    title: "رسالة إلى خالد عند التخرج",
    recipient: "خالد",
    sender: "خليفة وأمل",
    type: "video",
    unlockDate: "2030-06-01",
    occasion: "التخرج الجامعي",
    status: "locked",
    color: "#7ecbff",
  },
  {
    id: "mohammed-18",
    title: "رسالة لمحمد في عمر 18",
    recipient: "محمد",
    sender: "خليفة",
    type: "audio",
    unlockDate: "2044-07-06",
    occasion: "عيد الميلاد 18",
    status: "locked",
    color: "#cbdcff",
  },
  {
    id: "family-year",
    title: "فيلم العائلة السنوي",
    recipient: "العائلة",
    sender: "ALAFREET",
    type: "video",
    unlockDate: "2026-12-31",
    occasion: "نهاية السنة",
    status: "locked",
    color: "#f2c765",
  },
];

export const capsuleTypes = [
  { id: "message", label: "رسالة", icon: "✉" },
  { id: "photo", label: "صورة", icon: "◇" },
  { id: "video", label: "فيديو", icon: "▶" },
  { id: "audio", label: "صوت", icon: "◉" },
];
