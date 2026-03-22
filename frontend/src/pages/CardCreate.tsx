import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { CardCreateForm } from '../components/uniqueParts/CardCreateForm';
import { CardCreatePreview } from '../components/uniqueParts/CardCreatePreview';
import { CollectionSelectorModal } from '../components/uniqueParts/CollectionSelectorModal';
import {
  cardCreateMessages,
  clearStoredCardCreateDraft,
  createCardSuccessFlash,
  createInitialCardCreateDraft,
  isCardCreateDraftDirty,
  normalizeTagNames,
  readStoredCardCreateDraft,
  toCreateCardRequest,
  validateCardCreateDraft,
  writeStoredCardCreateDraft,
  type CardCreateDraft,
} from '../domain/cardCreate';
import { createCard, CreateCardApiError } from '../services/api/cardCreateApi';

function updateDraftState(draft: CardCreateDraft, partial: Partial<CardCreateDraft>): CardCreateDraft {
  const next = { ...draft, ...partial };
  if (partial.tagInput !== undefined) {
    next.tagNames = normalizeTagNames(partial.tagInput);
  }
  return next;
}

export function CardCreate() {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<CardCreateDraft>(() => readStoredCardCreateDraft() ?? createInitialCardCreateDraft());
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [collectionModalOpen, setCollectionModalOpen] = useState(false);

  const tagNames = useMemo(() => normalizeTagNames(draft.tagInput), [draft.tagInput]);
  const isDirty = isCardCreateDraftDirty(draft);

  useEffect(() => {
    if (isDirty) {
      writeStoredCardCreateDraft(draft);
      return;
    }

    clearStoredCardCreateDraft();
  }, [draft, isDirty]);

  useEffect(() => {
    if (!isDirty) return undefined;

    function onBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = cardCreateMessages.helperUnsavedChanges.text;
      return cardCreateMessages.helperUnsavedChanges.text;
    }

    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty]);

  function patchDraft(partial: Partial<CardCreateDraft>) {
    setDraft((current) => updateDraftState(current, { ...partial, submitState: partial.submitState ?? 'idle' }));
  }

  function validate(): boolean {
    const fieldErrors = validateCardCreateDraft(draft);
    setDraft((current) => ({ ...current, fieldErrors }));
    return Object.keys(fieldErrors).length === 0;
  }

  async function submitCard() {
    setSubmitError(null);

    if (!validate()) {
      return;
    }

    setDraft((current) => ({ ...current, submitState: 'submitting' }));

    try {
      const response = await createCard(toCreateCardRequest({ ...draft, tagNames }));
      clearStoredCardCreateDraft();
      await navigate('/cards', { state: { flash: createCardSuccessFlash(response.card.id) } });
    } catch (error) {
      if (error instanceof CreateCardApiError) {
        if (error.body.error === 'invalid_body') {
          const titleError = error.body.details?.fieldErrors?.title?.[0];
          const contentError = error.body.details?.fieldErrors?.content?.[0];

          setDraft((current) => ({
            ...current,
            submitState: 'failed',
            fieldErrors: {
              title: titleError,
              content: contentError,
            },
          }));
          return;
        }

        setSubmitError(
          error.body.message === 'collection_not_found'
            ? cardCreateMessages.errorCollectionNotFound.text
            : cardCreateMessages.errorSubmitFailed.text,
        );
      } else {
        setSubmitError(cardCreateMessages.errorSubmitFailed.text);
      }

      setDraft((current) => ({ ...current, submitState: 'failed' }));
    }
  }

  function resetDraft() {
    clearStoredCardCreateDraft();
    setSubmitError(null);
    setDraft(createInitialCardCreateDraft());
  }

  function navigateBackToList() {
    if (isDirty && !window.confirm(cardCreateMessages.helperUnsavedChanges.text)) {
      return;
    }

    void navigate('/cards');
  }

  return (
    <section className="space-y-6 py-8" aria-labelledby="card-create-page-title">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-primary">Study Card Create</p>
        <h1 id="card-create-page-title" className="text-4xl font-semibold text-text-primary">
          学習カード登録
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-text-secondary">
          新しい学習カードを作成し、タイトル、学習内容、回答、タグ、コレクションを登録できます。
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr),minmax(320px,0.8fr)] lg:items-start">
        <CardCreateForm
          title={draft.title}
          content={draft.content}
          answer={draft.answer}
          tagInput={draft.tagInput}
          collectionLabel={draft.collectionLabel}
          titleError={draft.fieldErrors.title}
          contentError={draft.fieldErrors.content}
          submitError={submitError}
          tagHelperText={cardCreateMessages.helperTagInput.text}
          unsavedChangesMessage={isDirty ? cardCreateMessages.helperUnsavedChanges.text : null}
          submitState={draft.submitState}
          onTitleChange={(value) => patchDraft({ title: value, fieldErrors: { ...draft.fieldErrors, title: undefined } })}
          onContentChange={(value) => patchDraft({ content: value, fieldErrors: { ...draft.fieldErrors, content: undefined } })}
          onAnswerChange={(value) => patchDraft({ answer: value })}
          onTagInputChange={(value) => patchDraft({ tagInput: value })}
          onOpenCollectionPicker={() => setCollectionModalOpen(true)}
          onSubmit={() => void submitCard()}
          onReset={resetDraft}
          onBack={navigateBackToList}
        />

        <CardCreatePreview
          title={draft.title}
          content={draft.content}
          answer={draft.answer}
          tagNames={tagNames}
          collectionLabel={draft.collectionLabel}
        />
      </div>

      <CollectionSelectorModal
        open={collectionModalOpen}
        selectedIds={draft.collectionId ? [draft.collectionId] : []}
        selectionMode="single"
        title="コレクションを選択"
        ariaLabel="card-create-collection-modal"
        applyLabel="選択を確定"
        onToggle={(id, label) => {
          patchDraft({
            collectionId: draft.collectionId === id ? null : id,
            collectionLabel: draft.collectionId === id ? null : label,
          });
        }}
        onClose={() => setCollectionModalOpen(false)}
      />
    </section>
  );
}