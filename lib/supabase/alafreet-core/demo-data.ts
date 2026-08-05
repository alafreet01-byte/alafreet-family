import type { CoreState } from "./types";

export const demoCoreState: CoreState = {
  users: [
    {
      id: "khalifa",
      name: "خليفة",
      role: "super_admin",
      color: "#f2bf55",
    },
    {
      id: "amal",
      name: "أمل",
      role: "school_admin",
      color: "#f2a8d3",
    },
    {
      id: "khalid",
      name: "خالد",
      role: "university_user",
      color: "#75c9ff",
    },
    {
      id: "ahmed",
      name: "أحمد",
      role: "student",
      color: "#ffc27a",
    },
    {
      id: "reem",
      name: "ريم",
      role: "student",
      color: "#dca6ff",
    },
    {
      id: "aisha",
      name: "عائشة",
      role: "child",
      color: "#ffabc2",
    },
  ],

  reminders: [
    {
      id: "rem-1",
      title: "تجديد تأمين السيارة",
      detail: "مراجعة العرض وتجهيز المستندات",
      dueAt: "2026-08-08T09:00:00+04:00",
      ownerId: "khalifa",
      createdBy: "amal",
      scope: "shared",
      status: "open",
    },
    {
      id: "rem-2",
      title: "متابعة واجبات Toddle",
      detail: "أحمد وريم وعائشة",
      dueAt: "2026-08-04T18:00:00+04:00",
      ownerId: "amal",
      createdBy: "amal",
      scope: "shared",
      status: "open",
    },
  ],

  events: [
    {
      id: "evt-1",
      type: "reminder.created",
      title: "أمل أضافت تذكيرًا",
      detail: "تجديد تأمين السيارة",
      createdAt: "2026-08-04T02:20:00+04:00",
      actorId: "amal",
      targetId: "khalifa",
    },
    {
      id: "evt-2",
      type: "school.assignment.created",
      title: "واجب مدرسي جديد",
      detail: "أحمد — رياضيات",
      createdAt: "2026-08-04T01:40:00+04:00",
      actorId: "amal",
      targetId: "ahmed",
    },
    {
      id: "evt-3",
      type: "university.assignment.created",
      title: "مهمة جامعية",
      detail: "خالد — Programming Assignment",
      createdAt: "2026-08-04T00:50:00+04:00",
      actorId: "khalid",
      targetId: "khalid",
    },
  ],
};
