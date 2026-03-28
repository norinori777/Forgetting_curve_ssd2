import { z } from 'zod';

function normalizeDescription(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') return value as never;

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

const collectionNameSchema = z.string().trim().min(1).max(60);
const collectionDescriptionSchema = z.preprocess(normalizeDescription, z.string().max(240).nullable().optional()).transform((value) => value ?? null);

export const collectionIdParamSchema = z.object({
  collectionId: z.string().uuid(),
});

export const createCollectionBodySchema = z.object({
  name: collectionNameSchema,
  description: collectionDescriptionSchema,
});

export const updateCollectionBodySchema = z.object({
  name: collectionNameSchema,
  description: collectionDescriptionSchema,
});

export type CreateCollectionBody = z.infer<typeof createCollectionBodySchema>;
export type UpdateCollectionBody = z.infer<typeof updateCollectionBodySchema>;