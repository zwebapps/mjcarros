/** Shared build-time guard — no DB during `next build` when SKIP_DB_ENV_VALIDATION=1. */
export function skipDbConnectionDuringBuild(): boolean {
  const v = process.env.SKIP_DB_ENV_VALIDATION;
  return v === "1" || v === "true";
}
