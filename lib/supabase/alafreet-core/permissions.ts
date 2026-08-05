import type { Permission, UserRole } from "./types";

const rolePermissions: Record<UserRole, Permission[]> = {
  super_admin: [
    "view_all",
    "manage_family",
    "manage_school",
    "manage_university",
    "manage_health",
    "manage_work",
    "manage_memories",
    "manage_settings",
    "view_private_work",
    "manage_time_capsule",
  ],

  school_admin: [
    "manage_school",
    "manage_health",
    "manage_memories",
    "manage_time_capsule",
  ],

  university_user: [
    "manage_university",
    "manage_memories",
    "manage_time_capsule",
  ],

  student: [
    "manage_memories",
  ],

  child: [],
};

export function hasPermission(
  role: UserRole,
  permission: Permission,
) {
  return rolePermissions[role].includes(permission);
}

export function getRolePermissions(role: UserRole) {
  return rolePermissions[role];
}
