import type { Meta, StoryObj } from '@storybook/react';

import { CollectionManagementList } from '../components/uniqueParts/CollectionManagementList';

const meta: Meta<typeof CollectionManagementList> = {
  title: 'CollectionManagementList',
  component: CollectionManagementList,
};

export default meta;

type Story = StoryObj<typeof CollectionManagementList>;

export const Default: Story = {
  args: {
    items: [
      {
        id: 'collection-1',
        name: '朝学習',
        description: '朝の 15 分で見直す内容',
        cardCount: 12,
        updatedAt: '2026-03-28T09:00:00.000Z',
        canDelete: false,
        deleteBlockedReason: 'カードが残っているため削除できません。',
      },
      {
        id: 'collection-2',
        name: '面接対策',
        description: null,
        cardCount: 0,
        updatedAt: '2026-03-27T09:00:00.000Z',
        canDelete: true,
        deleteBlockedReason: null,
      },
    ],
    loading: false,
    loadError: null,
    onRetry: () => {},
    onEdit: () => {},
    onDelete: () => {},
  },
};

export const Empty: Story = {
  args: {
    items: [],
    loading: false,
    loadError: null,
    onRetry: () => {},
    onEdit: () => {},
    onDelete: () => {},
  },
};