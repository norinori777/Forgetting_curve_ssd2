import { useEffect, useState } from 'react';

import { CollectionCreateForm } from '../components/uniqueParts/CollectionCreateForm';
import { CollectionDeleteDialog } from '../components/uniqueParts/CollectionDeleteDialog';
import { CollectionEditModal } from '../components/uniqueParts/CollectionEditModal';
import { CollectionManagementList } from '../components/uniqueParts/CollectionManagementList';
import {
  applyDuplicateNameError,
  collectionSettingsMessages,
  createCollectionDraftFromItem,
  createInitialCollectionDraft,
  toCollectionRequest,
  validateCollectionDraft,
  type CollectionDraft,
  type CollectionManagementItem,
  type CollectionMutationState,
} from '../domain/collectionSettings';
import {
  CollectionSettingsApiError,
  createManagedCollection,
  deleteManagedCollection,
  fetchManagedCollections,
  updateManagedCollection,
} from '../services/api/collectionSettingsApi';

export function Settings() {
  const [items, setItems] = useState<CollectionManagementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [createDraft, setCreateDraft] = useState(createInitialCollectionDraft());
  const [createSubmitState, setCreateSubmitState] = useState<CollectionMutationState>('idle');
  const [createSubmitError, setCreateSubmitError] = useState<string | null>(null);

  const [editingItem, setEditingItem] = useState<CollectionManagementItem | null>(null);
  const [editDraft, setEditDraft] = useState<CollectionDraft | null>(null);
  const [editSubmitState, setEditSubmitState] = useState<CollectionMutationState>('idle');
  const [editSubmitError, setEditSubmitError] = useState<string | null>(null);

  const [deleteItem, setDeleteItem] = useState<CollectionManagementItem | null>(null);
  const [deleteSubmitState, setDeleteSubmitState] = useState<CollectionMutationState>('idle');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    void loadCollections();
  }, []);

  async function loadCollections(): Promise<void> {
    setLoading(true);
    setLoadError(null);

    try {
      const response = await fetchManagedCollections();
      setItems(response.items);
    } catch {
      setLoadError(collectionSettingsMessages.errorLoadFailed.text);
    } finally {
      setLoading(false);
    }
  }

  function handleCreateNameChange(value: string) {
    setCreateDraft((current) => ({
      ...current,
      name: value,
      fieldErrors: {
        ...current.fieldErrors,
        name: undefined,
      },
    }));
    setCreateSubmitError(null);
  }

  function handleCreateDescriptionChange(value: string) {
    setCreateDraft((current) => ({ ...current, description: value }));
    setCreateSubmitError(null);
  }

  function handleEditNameChange(value: string) {
    setEditDraft((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        name: value,
        fieldErrors: {
          ...current.fieldErrors,
          name: undefined,
        },
      };
    });
    setEditSubmitError(null);
  }

  function handleEditDescriptionChange(value: string) {
    setEditDraft((current) => (current ? { ...current, description: value } : current));
    setEditSubmitError(null);
  }

  async function submitCreate(): Promise<void> {
    const fieldErrors = validateCollectionDraft(createDraft);
    if (Object.keys(fieldErrors).length > 0) {
      setCreateDraft((current) => ({ ...current, fieldErrors }));
      return;
    }

    setCreateSubmitState('submitting');
    setCreateSubmitError(null);

    try {
      await createManagedCollection(toCollectionRequest(createDraft));
      setCreateDraft(createInitialCollectionDraft());
      setSuccessMessage(collectionSettingsMessages.successCreated.text);
      await loadCollections();
      setCreateSubmitState('idle');
    } catch (error) {
      if (error instanceof CollectionSettingsApiError && error.code === 'duplicate_name') {
        setCreateDraft((current) => applyDuplicateNameError(current));
      } else {
        setCreateSubmitError(collectionSettingsMessages.errorSubmitFailed.text);
      }

      setCreateSubmitState('failed');
    }
  }

  async function submitEdit(): Promise<void> {
    if (!editingItem || !editDraft) {
      return;
    }

    const fieldErrors = validateCollectionDraft(editDraft);
    if (Object.keys(fieldErrors).length > 0) {
      setEditDraft((current) => (current ? { ...current, fieldErrors } : current));
      return;
    }

    setEditSubmitState('submitting');
    setEditSubmitError(null);

    try {
      await updateManagedCollection(editingItem.id, toCollectionRequest(editDraft));
      setSuccessMessage(collectionSettingsMessages.successUpdated.text);
      setEditingItem(null);
      setEditDraft(null);
      setEditSubmitState('idle');
      await loadCollections();
    } catch (error) {
      if (error instanceof CollectionSettingsApiError && error.code === 'duplicate_name') {
        setEditDraft((current) => (current ? applyDuplicateNameError(current) : current));
      } else {
        setEditSubmitError(collectionSettingsMessages.errorSubmitFailed.text);
      }

      setEditSubmitState('failed');
    }
  }

  async function submitDelete(): Promise<void> {
    if (!deleteItem) {
      return;
    }

    if (!deleteItem.canDelete) {
      return;
    }

    setDeleteSubmitState('submitting');
    setDeleteError(null);

    try {
      await deleteManagedCollection(deleteItem.id);
      setSuccessMessage(collectionSettingsMessages.successDeleted.text);
      setDeleteItem(null);
      setDeleteSubmitState('idle');
      await loadCollections();
    } catch (error) {
      if (error instanceof CollectionSettingsApiError && error.code === 'collection_in_use') {
        setDeleteItem((current) =>
          current
            ? {
                ...current,
                canDelete: false,
                deleteBlockedReason: collectionSettingsMessages.errorCollectionInUse.text,
              }
            : current,
        );
        setDeleteSubmitState('idle');
        return;
      }

      setDeleteError(collectionSettingsMessages.errorDeleteFailed.text);
      setDeleteSubmitState('failed');
    }
  }

  function openEditModal(item: CollectionManagementItem) {
    setEditingItem(item);
    setEditDraft(createCollectionDraftFromItem(item));
    setEditSubmitState('idle');
    setEditSubmitError(null);
  }

  function closeEditModal() {
    setEditingItem(null);
    setEditDraft(null);
    setEditSubmitState('idle');
    setEditSubmitError(null);
  }

  function closeDeleteDialog() {
    setDeleteItem(null);
    setDeleteSubmitState('idle');
    setDeleteError(null);
  }

  return (
    <section className="space-y-6" aria-labelledby="settings-page-title">
      <div className="rounded-[28px] border border-border-subtle bg-surface-panel p-6 md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-primary">Settings</p>
        <h1 id="settings-page-title" className="mt-2 text-4xl font-semibold text-text-primary">
          設定
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-text-secondary">
          学習環境や表示方法、コレクション管理をまとめて調整できます。
        </p>

        <div className="mt-6 flex flex-wrap gap-2 text-sm">
          <span className="rounded-full border border-border-subtle px-4 py-2 text-text-secondary">表示設定</span>
          <span className="rounded-full border border-border-subtle px-4 py-2 text-text-secondary">復習設定</span>
          <span className="rounded-full bg-brand-primary px-4 py-2 font-medium text-white">コレクション管理</span>
          <span className="rounded-full border border-border-subtle px-4 py-2 text-text-secondary">通知</span>
        </div>
      </div>

      {successMessage ? (
        <div role="status" className="rounded-2xl bg-brand-primary/10 px-4 py-3 text-sm text-brand-primary">
          {successMessage}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.92fr),minmax(0,1.08fr)] lg:items-start">
        <CollectionCreateForm
          draft={createDraft}
          submitState={createSubmitState}
          submitError={createSubmitError}
          onNameChange={handleCreateNameChange}
          onDescriptionChange={handleCreateDescriptionChange}
          onSubmit={() => void submitCreate()}
          onReset={() => {
            setCreateDraft(createInitialCollectionDraft());
            setCreateSubmitState('idle');
            setCreateSubmitError(null);
          }}
        />

        <CollectionManagementList
          items={items}
          loading={loading}
          loadError={loadError}
          onRetry={() => void loadCollections()}
          onEdit={openEditModal}
          onDelete={(item) => {
            setDeleteItem(item);
            setDeleteSubmitState('idle');
            setDeleteError(null);
          }}
        />
      </div>

      <CollectionEditModal
        open={Boolean(editingItem && editDraft)}
        targetName={editingItem?.name ?? ''}
        draft={editDraft}
        submitState={editSubmitState}
        submitError={editSubmitError}
        onNameChange={handleEditNameChange}
        onDescriptionChange={handleEditDescriptionChange}
        onSubmit={() => void submitEdit()}
        onClose={closeEditModal}
      />

      <CollectionDeleteDialog
        open={Boolean(deleteItem)}
        item={deleteItem}
        submitState={deleteSubmitState}
        deleteError={deleteError}
        onConfirm={() => void submitDelete()}
        onClose={closeDeleteDialog}
      />
    </section>
  );
}