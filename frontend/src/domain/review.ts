import type { CardFilterKey, CardListFilter, CardSortKey } from './cardList';

export type ReviewSessionStatus = 'in_progress' | 'completed';
export type ReviewAssessment = 'forgot' | 'uncertain' | 'remembered' | 'perfect';
export type ReviewReasonSource = 'next_review_at' | 'overdue' | 'filter_match' | 'unlearned' | 'manual_selection';
export type ReviewViewState = 'empty' | 'start-error';

export type ReviewReason = {
  label: string;
  detail: string | null;
  source: ReviewReasonSource | null;
};

export type ReviewCardSnapshot = {
  cardId: string;
  title: string;
  content: string;
  answer: string | null;
  tags: string[];
  collectionLabel: string | null;
  nextReviewAt: string | null;
  reviewReason: ReviewReason;
  currentAssessment: ReviewAssessment | null;
  locked: boolean;
};

export type ReviewFilterSummary = {
  q: string | null;
  filter: CardFilterKey | null;
  sort: CardSortKey;
  tagLabels: string[];
  collectionLabels: string[];
};

export type ReviewSessionSummary = {
  forgotCount: number;
  uncertainCount: number;
  rememberedCount: number;
  perfectCount: number;
  assessedCount: number;
  totalCount: number;
};

export type ReviewSessionSnapshot = {
  sessionId: string;
  status: ReviewSessionStatus;
  currentIndex: number;
  totalCount: number;
  remainingCount: number;
  canGoPrev: boolean;
  canGoNext: boolean;
  filterSummary: ReviewFilterSummary;
  currentCard: ReviewCardSnapshot | null;
  summary: ReviewSessionSummary;
};

export type ReviewStartResponse = {
  snapshot: ReviewSessionSnapshot;
};

export type CachedReviewSessionSnapshot = {
  sessionId: string;
  snapshot: ReviewSessionSnapshot;
  cachedAt: string;
};

export type PendingReviewAssessment = {
  sessionId: string;
  cardId: string;
  assessment: ReviewAssessment;
  queuedAt: string;
  basedOnIndex: number;
};

export type ReviewNavigateDirection = 'prev' | 'next';

export type ReviewShortcutKey = '1' | '2' | '3' | '4';

export const REVIEW_SHORTCUTS: Record<ReviewShortcutKey, ReviewAssessment> = {
  '1': 'forgot',
  '2': 'uncertain',
  '3': 'remembered',
  '4': 'perfect',
};

export function formatFilterSummary(summary: ReviewFilterSummary): string {
  const parts: string[] = [];
  if (summary.filter) parts.push(`状態: ${summary.filter}`);
  if (summary.q) parts.push(`検索: ${summary.q}`);
  if (summary.tagLabels.length > 0) parts.push(`タグ: ${summary.tagLabels.join(', ')}`);
  if (summary.collectionLabels.length > 0) parts.push(`コレクション: ${summary.collectionLabels.join(', ')}`);
  parts.push(`ソート: ${summary.sort}`);
  return parts.join(' / ');
}

export function isReviewInputFilter(value: unknown): value is CardListFilter {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as CardListFilter;
  return typeof candidate.sort === 'string' && Array.isArray(candidate.tagIds) && Array.isArray(candidate.collectionIds);
}