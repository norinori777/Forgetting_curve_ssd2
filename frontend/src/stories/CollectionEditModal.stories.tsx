import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { CollectionEditModal } from '../components/uniqueParts/CollectionEditModal';
import { createInitialCollectionDraft } from '../domain/collectionSettings';

const meta: Meta<typeof CollectionEditModal> = {
  title: 'CollectionEditModal',
  component: CollectionEditModal,
};

export default meta;

type Story = StoryObj<typeof CollectionEditModal>;

export const Default: Story = {
  render: () => {
    const [draft, setDraft] = useState({
      ...createInitialCollectionDraft(),
      name: '理科基礎',
      description: 'テスト前に集中的に見る内容',
    });

    return (
      <CollectionEditModal
        open={true}
        targetName="理科基礎"
        draft={draft}
        submitState="idle"
        submitError={null}
        onNameChange={(value) => setDraft((current) => ({ ...current, name: value }))}
        onDescriptionChange={(value) => setDraft((current) => ({ ...current, description: value }))}
        onSubmit={() => {}}
        onClose={() => {}}
      />
    );
  },
};

export const DuplicateName: Story = {
  args: {
    open: true,
    targetName: '理科基礎',
    draft: {
      name: '朝学習',
      description: '重複パターン確認',
      fieldErrors: {
        name: '同じ名前のコレクションが既に存在します。別の名前を入力してください。',
      },
    },
    submitState: 'failed',
    submitError: null,
    onNameChange: () => {},
    onDescriptionChange: () => {},
    onSubmit: () => {},
    onClose: () => {},
  },
};