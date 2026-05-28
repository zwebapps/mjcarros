export const IMPORT_STATUSES = [
  "SEARCHING",
  "INSPECTION",
  "NEGOTIATION",
  "PURCHASE",
  "EXPORT",
  "TRANSPORT",
  "REGISTRATION",
  "DELIVERED",
  "CANCELLED",
] as const;

export function importStatusLabel(status: string): string {
  return status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}
