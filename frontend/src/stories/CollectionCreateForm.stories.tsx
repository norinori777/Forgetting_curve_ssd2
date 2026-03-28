import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { CollectionCreateForm } from '../components/uniqueParts/CollectionCreateForm';
import { createInitialCollectionDraft } from '../domain/collectionSettings';

const meta: Meta<typeof CollectionCreateForm> = {
  title: 'CollectionCreateForm',
  component: CollectionCreateForm,
};

export default meta;

type Story = StoryObj<typeof CollectionCreateForm>;

export const Default: Story = {
  render: () => {
    const [draft, setDraft] = useState({
      ...createInitialCollectionDraft(),
      name: '朝学習',
      description: '出勤前に確認するカードをまとめる',
    });

    return (
      <CollectionCreateForm
        draft={draft}
        submitState="idle"
        submitError={null}
        onNameChange={(value) => setDraft((current) => ({ ...current, name: value }))}
        onDescriptionChange={(value) => setDraft((current) => ({ ...current, description: value }))}
        onSubmit={() => {}}
        onReset={() => setDraft(createInitialCollectionDraft())}
      />
    );
  },
};

export const Failed: Story = {
  args: {
    draft: {
      name: '朝学習',
      description: '出勤前に確認するカードをまとめる',
      fieldErrors: {},
    },
    submitState: 'failed',
    submitError: 'コレクションの保存に失敗しました。時間をおいて再試行してください。',
    onNameChange: () => {},
    onDescriptionChange: () => {},
    onSubmit: () => {},
    onReset: () => {},
  },
};