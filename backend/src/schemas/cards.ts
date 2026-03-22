import { z } from 'zod';

function csvToArray(value: unknown): string[] | undefined {
  if (typeof value !== 'string') return undefined;

  const items = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  return items.length > 0 ? items : undefined;
}

function normalizeOptionalAnswer(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') return value as never;
  return value.trim().length === 0 ? null : value;
}

export const cardSortKeySchema = z
  .enum(['next_review_at', 'proficiency', 'created_at'])
  .default('next_review_at');

export const listCardsQuerySchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  q: z.string().trim().min(1).optional(),
  tagIds: z.preprocess(csvToArray, z.array(z.string().min(1)).optional()),
  collectionIds: z.preprocess(csvToArray, z.array(z.string().min(1)).optional()),
  filter: z.enum(['today', 'overdue', 'unlearned']).optional(),
  sort: cardSortKeySchema,
});

export const createCardBodySchema = z.object({
  title: z.string().trim().min(1),
  content: z.string().trim().min(1),
  answer: z.preprocess(normalizeOptionalAnswer, z.string().nullable().optional()),
  tagNames: z.array(z.string().trim().min(1)).default([]),
  collectionId: z.string().uuid().nullable().optional(),
});

export type CardSortKey = z.infer<typeof cardSortKeySchema>;
export type ListCardsQuery = z.infer<typeof listCardsQuerySchema>;
export type CreateCardBody = z.infer<typeof createCardBodySchema>;

export type CursorPayload =
  | {
      sort: 'next_review_at' | 'created_at';
      value: string; // ISO date
      id: string;
    }
  | {
      sort: 'proficiency';
      value: number;
      id: string;
    };

export function encodeCursor(payload: CursorPayload): string {
  const json = JSON.stringify(payload);
  return Buffer.from(json, 'utf8').toString('base64url');
}

export function decodeCursor(token: string): CursorPayload {
  const json = Buffer.from(token, 'base64url').toString('utf8');
  const parsed = JSON.parse(json) as unknown;

  const dateCursor = z.object({
    sort: z.enum(['next_review_at', 'created_at']),
    value: z.string().min(1),
    id: z.string().min(1),
  });

  const numberCursor = z.object({
    sort: z.literal('proficiency'),
    value: z.number(),
    id: z.string().min(1),
  });

  return z.union([dateCursor, numberCursor]).parse(parsed);
}
