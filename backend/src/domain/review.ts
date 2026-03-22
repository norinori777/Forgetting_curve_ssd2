import type { CardFilterKey, CardListFilter, CardSortKey } from './cardList.js';

export type ReviewSessionStatus = 'in_progress' | 'completed';
export type ReviewAssessment = 'forgot' | 'uncertain' | 'remembered' | 'perfect';
export type ReviewReasonSource = 'next_review_at' | 'overdue' | 'filter_match' | 'unlearned' | 'manual_selection';
export type ReviewNavigationDirection = 'prev' | 'next';

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

export type StartReviewRequest = {
  filter?: CardListFilter;
  cardIds?: string[];
};

export type StartReviewResponse = {
  snapshot: ReviewSessionSnapshot;
};

export type UpdateAssessmentRequest = {
  cardId: string;
  assessment: ReviewAssessment;
};

export type NavigateReviewRequest = {
  direction: ReviewNavigationDirection;
};

export class ReviewRepositoryError extends Error {
  constructor(
    public readonly code:
      | 'SESSION_NOT_FOUND'
      | 'NOT_CURRENT_CARD'
      | 'CARD_LOCKED'
      | 'ASSESSMENT_REQUIRED'
      | 'NO_CARDS'
      | 'DATABASE_ERROR',
    message: string,
  ) {
    super(message);
  }
}

export function toReviewFilterSummary(filter?: CardListFilter): ReviewFilterSummary {
  return {
    q: filter?.q?.trim() || null,
    filter: filter?.filter ?? null,
    sort: filter?.sort ?? 'next_review_at',
    tagLabels: [],
    collectionLabels: [],
  };
}