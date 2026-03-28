const defaultCollectionOwnerId = '00000000-0000-0000-0000-000000000001';

export function resolveCollectionOwnerId(): string {
  const configuredOwnerId = process.env.COLLECTION_OWNER_ID?.trim();
  return configuredOwnerId && configuredOwnerId.length > 0 ? configuredOwnerId : defaultCollectionOwnerId;
}