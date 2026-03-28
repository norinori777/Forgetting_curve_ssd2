export const collectionSettingsMessages = {
  successCreated: {
    key: 'collectionSettings.success.created',
    text: 'コレクションを登録しました。',
  },
  successUpdated: {
    key: 'collectionSettings.success.updated',
    text: 'コレクションを更新しました。',
  },
  successDeleted: {
    key: 'collectionSettings.success.deleted',
    text: 'コレクションを削除しました。',
  },
  errorLoadFailed: {
    key: 'collectionSettings.error.loadFailed',
    text: 'コレクション一覧の取得に失敗しました。時間をおいて再試行してください。',
  },
  errorSubmitFailed: {
    key: 'collectionSettings.error.submitFailed',
    text: 'コレクションの保存に失敗しました。時間をおいて再試行してください。',
  },
  errorDeleteFailed: {
    key: 'collectionSettings.error.deleteFailed',
    text: 'コレクションの削除に失敗しました。時間をおいて再試行してください。',
  },
  errorDuplicateName: {
    key: 'collectionSettings.error.duplicateName',
    text: '同じ名前のコレクションが既に存在します。別の名前を入力してください。',
  },
  errorCollectionInUse: {
    key: 'collectionSettings.error.collectionInUse',
    text: 'カードが残っているコレクションは削除できません。',
  },
  validationNameRequired: {
    key: 'collectionSettings.validation.nameRequired',
    text: 'コレクション名は必須です',
  },
  validationNameTooLong: {
    key: 'collectionSettings.validation.nameTooLong',
    text: 'コレクション名は60文字以内で入力してください。',
  },
  helperDescription: {
    key: 'collectionSettings.helper.description',
    text: '説明は任意です。設定画面で用途を識別しやすい内容を入力できます。',
  },
  helperDeleteBlocked: {
    key: 'collectionSettings.helper.deleteBlocked',
    text: 'カードが残っているため削除できません。先にカード側のコレクションを外してください。',
  },
  helperEmptyState: {
    key: 'collectionSettings.helper.emptyState',
    text: 'まだコレクションがありません。最初のコレクションを作成して、学習カードを整理しやすくしましょう。',
  },
} as const;

export type CollectionManagementItem = {
  id: string;
  name: string;
  description: string | null;
  cardCount: number;
  updatedAt: string;
  canDelete: boolean;
  deleteBlockedReason: string | null;
};

export type CollectionDraftFieldErrors = {
  name?: string;
};

export type CollectionDraft = {
  name: string;
  description: string;
  fieldErrors: CollectionDraftFieldErrors;
};

export type CollectionMutationState = 'idle' | 'submitting' | 'failed';

export type CreateCollectionRequest = {
  name: string;
  description: string | null;
};

export type UpdateCollectionRequest = CreateCollectionRequest;

export type CollectionListResponse = {
  items: CollectionManagementItem[];
};

export type CollectionMutationResponse = {
  ok: true;
  collection: CollectionManagementItem;
};

export type CollectionDeleteResponse = {
  ok: true;
  deletedId: string;
};

function createEmptyDraft(): CollectionDraft {
  return {
    name: '',
    description: '',
    fieldErrors: {},
  };
}

export function createInitialCollectionDraft(): CollectionDraft {
  return createEmptyDraft();
}

export function cloneCollectionDraft(source: Pick<CollectionDraft, 'name' | 'description'>): CollectionDraft {
  return {
    name: source.name,
    description: source.description,
    fieldErrors: {},
  };
}

export function createCollectionDraftFromItem(item: CollectionManagementItem): CollectionDraft {
  return cloneCollectionDraft({
    name: item.name,
    description: item.description ?? '',
  });
}

export function validateCollectionDraft(draft: Pick<CollectionDraft, 'name'>): CollectionDraftFieldErrors {
  const fieldErrors: CollectionDraftFieldErrors = {};

  const trimmedName = draft.name.trim();

  if (trimmedName.length === 0) {
    fieldErrors.name = collectionSettingsMessages.validationNameRequired.text;
  } else if (trimmedName.length > 60) {
    fieldErrors.name = collectionSettingsMessages.validationNameTooLong.text;
  }

  return fieldErrors;
}

export function applyDuplicateNameError(draft: CollectionDraft): CollectionDraft {
  return {
    ...draft,
    fieldErrors: {
      ...draft.fieldErrors,
      name: collectionSettingsMessages.errorDuplicateName.text,
    },
  };
}

export function toCollectionRequest(draft: Pick<CollectionDraft, 'name' | 'description'>): CreateCollectionRequest {
  const description = draft.description.trim();

  return {
    name: draft.name.trim(),
    description: description.length > 0 ? description : null,
  };
}

export function isCollectionDraftDirty(draft: Pick<CollectionDraft, 'name' | 'description'>): boolean {
  return draft.name.trim().length > 0 || draft.description.trim().length > 0;
}