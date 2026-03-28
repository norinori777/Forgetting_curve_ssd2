import type { Meta, StoryObj } from '@storybook/react';

import { StatsSummaryCard } from '../components/uniqueParts/StatsSummaryCard';

const meta: Meta<typeof StatsSummaryCard> = {
  title: 'StatsSummaryCard',
  component: StatsSummaryCard,
};

export default meta;

type Story = StoryObj<typeof StatsSummaryCard>;

export const Default: Story = {
  args: {
    label: 'レビュー完了数',
    value: '64',
    hint: '前期間比 +8',
    description: '選択中期間に記録されたレビュー回答数です。',
    testId: 'storybook-stats-summary',
  },
};