export type CardSortKey = 'next_review_at' | 'proficiency' | 'created_at';
export type CardFilterKey = 'today' | 'overdue' | 'unlearned';

export type ApiCard = {
  id: string;
  title: string;
  content: string;
  tags: string[];
  collectionId: string | null;
  proficiency: number;
  nextReviewAt: string;
  lastCorrectRate: number;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
};

export type FilterOption = {
  id: string;
  label: string;
  matchedBy?: 'name' | 'alias';
};

export type CardListFilter = {
  q?: string;
  filter?: CardFilterKey;
  sort: CardSortKey;
  tagIds: string[];
  collectionIds: string[];
};

export type ListCardsResponse = {
  items: ApiCard[];
  nextCursor?: string;
};

export type ReviewStartResponse = {
  sessionId: string;
  cardIds: string[];
};

export type BulkAction = 'archive' | 'delete' | 'addTags' | 'removeTags';

export type CardListSuccessFlash = {
  messageKey: string;
  createdCardId?: string;
};

export type CardListLocationState = {
  flash?: CardListSuccessFlash;
};