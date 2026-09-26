/** API responses keep Mongo-style `_id` for existing clients. */

type WithId = { id: string; legacyMongoId?: string | null };

export function apiId(row: WithId): string {
  return row.legacyMongoId ?? row.id;
}

export function withMongoId<T extends WithId>(row: T): T & { _id: string } {
  const _id = apiId(row);
  return { ...row, _id, id: row.id };
}

export function withMongoIds<T extends WithId>(rows: T[]): (T & { _id: string })[] {
  return rows.map(withMongoId);
}
