/** Resolve route/API id: cuid or legacy Mongo ObjectId string. */
export function isLegacyMongoId(id: string): boolean {
  return /^[a-fA-F0-9]{24}$/.test(id);
}

export function legacyMongoFilter(id: string) {
  if (isLegacyMongoId(id)) {
    return { legacyMongoId: id };
  }
  return { id };
}
