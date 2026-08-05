export type UserRole =
  | "super_admin"
  | "school_admin"
  | "university_user"
  | "student"
  | "child";

export type Permission =
  | "view_all"
  | "manage_family"
  | "manage_school"
  | "manage_university"
  | "manage_health"
  | "manage_work"
  | "manage_memories"
  | "manage_settings"
  | "view_private_work"
  | "manage_time_capsule";

export type CoreEventType =
  | "task.created"
  | "task.updated"
  | "reminder.created"
  | "school.assignment.created"
  | "university.assignment.created"
  | "health.medication.created"
  | "weather.alert.created"
  | "capsule.created";

export type CoreEvent = {
  id: string;
  type: CoreEventType;
  title: string;
  detail: string;
  createdAt: string;
  actorId: string;
  targetId?: string;
  metadata?: Record<string, string | number | boolean>;
};

export type FamilyUser = {
  id: string;
  name: string;
  role: UserRole;
  color: string;
};

export type Reminder = {
  id: string;
  title: string;
  detail: string;
  dueAt: string;
  ownerId: string;
  createdBy: string;
  scope: "private" | "shared";
  status: "open" | "done";
};

export type CoreState = {
  users: FamilyUser[];
  reminders: Reminder[];
  events: CoreEvent[];
};
