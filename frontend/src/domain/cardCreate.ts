import type { CardListSuccessFlash } from './cardList';

export const cardCreateMessages = {
  successCreated: {
    key: 'cardCreate.success.created',
    text: 'カードを登録しました',
  },
  errorSubmitFailed: {
    key: 'cardCreate.error.submitFailed',
    text: 'カードの登録に失敗しました。時間をおいて再試行してください。',
  },
  errorCollectionNotFound: {
    key: 'cardCreate.error.collectionNotFound',
    text: '選択したコレクションが見つかりません。再選択してください。',
  },
  validationTitleRequired: {
    key: 'cardCreate.validation.titleRequired',
    text: 'タイトルは必須です',
  },
  validationContentRequired: {
    key: 'cardCreate.validation.contentRequired',
    text: '学習内容は必須です',
  },
  helperTagInput: {
    key: 'cardCreate.helper.tagInput',
    text: 'カンマ区切りで複数入力',
  },
  helperUnsavedChanges: {
    key: 'cardCreate.helper.unsavedChanges',
    text: '未保存の入力内容があります。このまま移動すると内容は失われます。',
  },
} as const;

export type CardCreateSubmitState = 'idle' | 'submitting' | 'failed';

export type CardCreateFieldErrors = {
  title?: string;
  content?: string;
};

export type CardCreateDraft = {
  title: string;
  content: string;
  answer: string;
  tagInput: string;
  tagNames: string[];
  collectionId: string | null;
  collectionLabel: string | null;
  submitState: CardCreateSubmitState;
  fieldErrors: CardCreateFieldErrors;
};

export type CreateCardRequest = {
  title: string;
  content: string;
  answer?: string | null;
  tagNames: string[];
  collectionId?: string | null;
};

export type CreateCardResponse = {
  ok: true;
  card: {
    id: string;
    title: string;
    content: string;
    answer: string | null;
    tags: string[];
    collectionId: string | null;
    proficiency: number;
    nextReviewAt: string;
    lastCorrectRate: number;
    isArchived: boolean;
    createdAt: string;
    updatedAt: string;
  };
};

export type CreateCardErrorResponse = {
  error: 'invalid_body' | 'bad_request' | 'database_error';
  message?: string;
  details?: {
    fieldErrors?: Record<string, string[]>;
    formErrors?: string[];
  };
};

const draftStorageKey = 'card-create:draft';

function createEmptyDraft(): CardCreateDraft {
  return {
    title: '',
    content: '',
    answer: '',
    tagInput: '',
    tagNames: [],
    collectionId: null,
    collectionLabel: null,
    submitState: 'idle',
    fieldErrors: {},
  };
}

export function createInitialCardCreateDraft(): CardCreateDraft {
  return createEmptyDraft();
}

export function normalizeTagNames(tagInput: string): string[] {
  return Array.from(
    new Set(
      tagInput
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

export function validateCardCreateDraft(draft: Pick<CardCreateDraft, 'title' | 'content'>): CardCreateFieldErrors {
  const fieldErrors: CardCreateFieldErrors = {};

  if (draft.title.trim().length === 0) {
    fieldErrors.title = cardCreateMessages.validationTitleRequired.text;
  }

  if (draft.content.trim().length === 0) {
    fieldErrors.content = cardCreateMessages.validationContentRequired.text;
  }

  return fieldErrors;
}

export function isCardCreateDraftDirty(draft: Pick<CardCreateDraft, 'title' | 'content' | 'answer' | 'tagInput' | 'collectionId'>): boolean {
  return (
    draft.title.trim().length > 0 ||
    draft.content.trim().length > 0 ||
    draft.answer.length > 0 ||
    draft.tagInput.trim().length > 0 ||
    draft.collectionId !== null
  );
}

export function toCreateCardRequest(draft: CardCreateDraft): CreateCardRequest {
  return {
    title: draft.title.trim(),
    content: draft.content.trim(),
    answer: draft.answer,
    tagNames: normalizeTagNames(draft.tagInput),
    collectionId: draft.collectionId,
  };
}

export function createCardSuccessFlash(createdCardId?: string): CardListSuccessFlash {
  return {
    messageKey: cardCreateMessages.successCreated.key,
    createdCardId,
  };
}

export function readStoredCardCreateDraft(): CardCreateDraft | null {
  if (typeof window === 'undefined') return null;

  const raw = window.sessionStorage.getItem(draftStorageKey);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<CardCreateDraft>;
    return {
      ...createEmptyDraft(),
      title: typeof parsed.title === 'string' ? parsed.title : '',
      content: typeof parsed.content === 'string' ? parsed.content : '',
      answer: typeof parsed.answer === 'string' ? parsed.answer : '',
      tagInput: typeof parsed.tagInput === 'string' ? parsed.tagInput : '',
      tagNames: typeof parsed.tagInput === 'string' ? normalizeTagNames(parsed.tagInput) : [],
      collectionId: typeof parsed.collectionId === 'string' ? parsed.collectionId : null,
      collectionLabel: typeof parsed.collectionLabel === 'string' ? parsed.collectionLabel : null,
    };
  } catch {
    return null;
  }
}

export function writeStoredCardCreateDraft(draft: CardCreateDraft): void {
  if (typeof window === 'undefined') return;

  window.sessionStorage.setItem(
    draftStorageKey,
    JSON.stringify({
      title: draft.title,
      content: draft.content,
      answer: draft.answer,
      tagInput: draft.tagInput,
      collectionId: draft.collectionId,
      collectionLabel: draft.collectionLabel,
    }),
  );
}

export function clearStoredCardCreateDraft(): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(draftStorageKey);
}