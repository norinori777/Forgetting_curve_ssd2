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

export type CardListFilter = {
  q?: string;
  filter?: CardFilterKey;
  sort: CardSortKey;
  tagIds: string[];
  collectionIds: string[];
};

export type ListCardsQuery = CardListFilter & {
  cursor?: string;
  limit: number;
};

export type FilterOption = {
  id: string;
  label: string;
  matchedBy?: 'name' | 'alias';
};

export type ReviewStartResponse = {
  sessionId: string;
  cardIds: string[];
};

export type ListCardsResponse = {
  items: ApiCard[];
  nextCursor?: string;
};

export type BulkAction = 'archive' | 'delete' | 'addTags' | 'removeTags';

export type BulkRequest = {
  action: BulkAction;
  cardIds: string[];
  tagIds?: string[];
};