import type { Meta, StoryObj } from '@storybook/react';

import { HomeRecentActivities } from '../components/uniqueParts/HomeRecentActivities';

const meta: Meta<typeof HomeRecentActivities> = {
  title: 'HomeRecentActivities',
  component: HomeRecentActivities,
};

export default meta;

type Story = StoryObj<typeof HomeRecentActivities>;

export const Default: Story = {
  args: {
    activities: [
      { id: 'a1', type: 'review_started', occurredAt: '2026-03-26T09:30:00.000Z', label: '4件の復習を開始', count: 4 },
      { id: 'a2', type: 'review_completed', occurredAt: '2026-03-26T08:30:00.000Z', label: '3件の復習を完了', count: 3 },
      { id: 'a3', type: 'card_created', occurredAt: '2026-03-25T18:00:00.000Z', label: '学習カードを追加', count: 1 },
    ],
  },
};

export const Empty: Story = {
  args: {
    activities: [],
  },
};