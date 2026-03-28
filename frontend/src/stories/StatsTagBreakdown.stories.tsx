import type { Meta, StoryObj } from '@storybook/react';

import { StatsTagBreakdown } from '../components/uniqueParts/StatsTagBreakdown';

const meta: Meta<typeof StatsTagBreakdown> = {
  title: 'StatsTagBreakdown',
  component: StatsTagBreakdown,
};

export default meta;

type Story = StoryObj<typeof StatsTagBreakdown>;

export const Default: Story = {
  args: {
    items: [
      { tagId: 't1', tagName: '語彙', reviewCount: 72, averageAccuracy: 88, isWeakest: false },
      { tagId: 't2', tagName: '文法', reviewCount: 41, averageAccuracy: 79, isWeakest: false },
      { tagId: 't3', tagName: 'リスニング', reviewCount: 23, averageAccuracy: 74, isWeakest: true },
    ],
  },
};

export const Empty: Story = {
  args: {
    items: [],
  },
};