/** Application roles — admin accounts are created via env/setup scripts only. */
export const ROLES = {
  ADMIN: "ADMIN",
  USER: "USER",
  CUSTOMER: "CUSTOMER",
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

/** Email reserved for ADMIN_EMAIL from environment (dealership staff). */
export function isReservedAdminEmail(email: string): boolean {
  const reserved = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!reserved) return false;
  return email.trim().toLowerCase() === reserved;
}

/** Role assigned to every public self-service registration. */
export const SIGNUP_ROLE: AppRole = ROLES.USER;
