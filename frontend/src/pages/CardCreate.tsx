import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { CardCreateForm } from '../components/uniqueParts/CardCreateForm';
import { CardCreatePreview } from '../components/uniqueParts/CardCreatePreview';
import { CardCsvImportIssueList } from '../components/uniqueParts/CardCsvImportIssueList';
import { CardCsvImportPanel } from '../components/uniqueParts/CardCsvImportPanel';
import { CardCsvImportPreviewTable } from '../components/uniqueParts/CardCsvImportPreviewTable';
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
import {
  buildCardCsvImportSuccessFlash,
  cardCsvImportMessages,
  createInitialCardCsvImportDraft,
  isCardCsvImportDirty,
  mergeValidatedRows,
  parseCardCsvFile,
  toCardImportRowInputs,
  type CardCsvImportDraft,
  type CardCsvImportMode,
} from '../domain/cardCsvImport';
import { createCard, CreateCardApiError } from '../services/api/cardCreateApi';
import { CardCsvImportApiError, importCardsFromCsv, validateCardCsvImport } from '../services/api/cardCsvImportApi';

function updateDraftState(draft: CardCreateDraft, partial: Partial<CardCreateDraft>): CardCreateDraft {
  const next = { ...draft, ...partial };
  if (partial.tagInput !== undefined) {
    next.tagNames = normalizeTagNames(partial.tagInput);
  }
  return next;
}

export function CardCreate() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<CardCsvImportMode>('single');
  const [draft, setDraft] = useState<CardCreateDraft>(() => readStoredCardCreateDraft() ?? createInitialCardCreateDraft());
  const [csvDraft, setCsvDraft] = useState<CardCsvImportDraft>(() => createInitialCardCsvImportDraft());
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [collectionModalOpen, setCollectionModalOpen] = useState(false);

  const tagNames = useMemo(() => normalizeTagNames(draft.tagInput), [draft.tagInput]);
  const isDirty = isCardCreateDraftDirty(draft);
  const isCsvDirty = isCardCsvImportDirty(csvDraft);

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
    if ((isDirty || isCsvDirty) && !window.confirm(cardCreateMessages.helperUnsavedChanges.text)) {
      return;
    }

    void navigate('/cards');
  }

  function switchToSingleMode() {
    setMode('single');
    setCsvDraft(createInitialCardCsvImportDraft());
  }

  function switchToCsvMode() {
    setMode('csv');
  }

  async function handleCsvFileChange(file: File | null) {
    if (!file) {
      setCsvDraft(createInitialCardCsvImportDraft());
      return;
    }

    setMode('csv');
    setCsvDraft({
      ...createInitialCardCsvImportDraft(),
      selectedFileName: file.name,
      selectedFileSize: file.size,
      phase: 'parsing',
    });

    try {
      const parsed = await parseCardCsvFile(file);
      const baseDraft: CardCsvImportDraft = {
        selectedFileName: file.name,
        selectedFileSize: file.size,
        detectedEncoding: parsed.detectedEncoding,
        phase: 'parsed',
        rows: parsed.rows,
        issues: parsed.issues,
        summary: parsed.summary,
        generalError: null,
      };

      if (parsed.summary.totalRows === 0 || parsed.issues.length > 0) {
        setCsvDraft({ ...baseDraft, phase: 'ready' });
        return;
      }

      setCsvDraft({ ...baseDraft, phase: 'validating' });
      const response = await validateCardCsvImport({
        headerSkipped: parsed.summary.headerSkipped,
        rows: toCardImportRowInputs(parsed.rows),
      });

      setCsvDraft({
        selectedFileName: file.name,
        selectedFileSize: file.size,
        detectedEncoding: parsed.detectedEncoding,
        phase: 'ready',
        rows: mergeValidatedRows(parsed.rows, response.rows),
        issues: response.issues,
        summary: { ...response.summary, headerSkipped: parsed.summary.headerSkipped },
        generalError: null,
      });
    } catch (error) {
      if (error instanceof CardCsvImportApiError) {
        setCsvDraft((current) => ({
          ...current,
          phase: 'failed',
          generalError: cardCsvImportMessages.errorValidateFailed.text,
          issues: error.body.details?.issues ?? current.issues,
          rows: error.body.details?.rows ? mergeValidatedRows(current.rows, error.body.details.rows) : current.rows,
          summary: error.body.details?.summary ?? current.summary,
        }));
        return;
      }

      setCsvDraft((current) => ({
        ...current,
        phase: 'failed',
        generalError:
          typeof error === 'object' && error !== null && 'messageText' in error
            ? String((error as { messageText: unknown }).messageText)
            : cardCsvImportMessages.errorValidateFailed.text,
      }));
    }
  }

  async function submitCsvImport() {
    if (!csvDraft.summary.canImport) {
      setCsvDraft((current) => ({
        ...current,
        generalError: current.selectedFileName ? cardCsvImportMessages.helperImportBlocked.text : cardCsvImportMessages.validationFileRequired.text,
      }));
      return;
    }

    setCsvDraft((current) => ({ ...current, phase: 'importing', generalError: null }));

    try {
      const response = await importCardsFromCsv({
        headerSkipped: csvDraft.summary.headerSkipped,
        rows: toCardImportRowInputs(csvDraft.rows),
      });

      setCsvDraft(createInitialCardCsvImportDraft());
      await navigate('/cards', { state: { flash: buildCardCsvImportSuccessFlash(response.importedCount) } });
    } catch (error) {
      if (error instanceof CardCsvImportApiError && error.body.error === 'validation_failed') {
        setCsvDraft((current) => ({
          ...current,
          phase: 'failed',
          generalError: cardCsvImportMessages.errorValidateFailed.text,
          rows: error.body.details?.rows ? mergeValidatedRows(current.rows, error.body.details.rows) : current.rows,
          issues: error.body.details?.issues ?? current.issues,
          summary: error.body.details?.summary ?? current.summary,
        }));
        return;
      }

      setCsvDraft((current) => ({
        ...current,
        phase: 'failed',
        generalError: cardCsvImportMessages.errorImportFailed.text,
      }));
    }
  }

  function cancelCsvImport() {
    setCsvDraft(createInitialCardCsvImportDraft());
    setMode('single');
  }

  return (
    <section className="space-y-6 py-8" aria-labelledby="card-create-page-title">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-primary">Study Card Create</p>
        <h1 id="card-create-page-title" className="text-4xl font-semibold text-text-primary">
          学習カード登録
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-text-secondary">
          新しい学習カードを作成し、単票登録または CSV 一括登録で追加できます。
        </p>
      </header>

      <div className="inline-flex rounded-full border border-border-subtle bg-surface-panel p-1" role="tablist" aria-label="登録モード">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'single'}
          onClick={switchToSingleMode}
          className={`rounded-full px-4 py-2 text-sm font-medium ${mode === 'single' ? 'bg-brand-primary text-white' : 'text-text-primary'}`}
        >
          単票登録
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'csv'}
          onClick={switchToCsvMode}
          className={`rounded-full px-4 py-2 text-sm font-medium ${mode === 'csv' ? 'bg-brand-primary text-white' : 'text-text-primary'}`}
        >
          CSV一括登録
        </button>
      </div>

      {mode === 'single' ? (
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
      ) : (
        <div className="space-y-6">
          <CardCsvImportPanel
            selectedFileName={csvDraft.selectedFileName}
            selectedFileSize={csvDraft.selectedFileSize}
            detectedEncoding={csvDraft.detectedEncoding}
            phase={csvDraft.phase}
            generalError={csvDraft.generalError}
            canImport={csvDraft.summary.canImport}
            helperFormatText={cardCsvImportMessages.helperFormat.text}
            helperEncodingText={cardCsvImportMessages.helperSupportedEncoding.text}
            helperBlockedText={cardCsvImportMessages.helperImportBlocked.text}
            onFileChange={(file) => void handleCsvFileChange(file)}
            onImport={() => void submitCsvImport()}
            onCancel={cancelCsvImport}
          />

          <CardCsvImportIssueList issues={csvDraft.issues} />
          <CardCsvImportPreviewTable summary={csvDraft.summary} rows={csvDraft.rows} />
        </div>
      )}

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