import { UserRole } from "@prisma/client";

/** Application roles */
export const ROLES = {
  ADMIN: "ADMIN",
  USER: "USER",
  CUSTOMER: "CUSTOMER",
  DEALER: "DEALER",
} as const;

export type AppRole = (typeof ROLES)[keyof typeof ROLES];

const VALID_ROLES = new Set<string>(Object.values(ROLES));

export function normalizeRole(role: unknown): AppRole {
  if (typeof role === "string" && VALID_ROLES.has(role)) {
    return role as AppRole;
  }
  return ROLES.USER;
}

export function isAdminRole(role: unknown): boolean {
  return normalizeRole(role) === ROLES.ADMIN;
}

export function isDealerRole(role: unknown): boolean {
  return normalizeRole(role) === ROLES.DEALER;
}

export function isStaffRole(role: unknown): boolean {
  const r = normalizeRole(role);
  return r === ROLES.ADMIN || r === ROLES.DEALER;
}

/** Email reserved for ADMIN_EMAIL from environment (dealership staff). */
export function isReservedAdminEmail(email: string): boolean {
  const reserved = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!reserved) return false;
  return email.trim().toLowerCase() === reserved;
}

/** Role assigned to every public self-service registration. */
export const SIGNUP_ROLE: AppRole = ROLES.CUSTOMER;

/** Map API string roles to Prisma UserRole enum. */
export function toPrismaUserRole(role: string): UserRole {
  const upper = role.toUpperCase();
  if (upper === "ADMIN") return UserRole.ADMIN;
  if (upper === "CUSTOMER") return UserRole.CUSTOMER;
  if (upper === "DEALER") return UserRole.DEALER;
  return UserRole.USER;
}

export function prismaRoleToAppRole(role: UserRole): AppRole {
  if (role === UserRole.ADMIN) return ROLES.ADMIN;
  if (role === UserRole.CUSTOMER) return ROLES.CUSTOMER;
  if (role === UserRole.DEALER) return ROLES.DEALER;
  return ROLES.USER;
}
