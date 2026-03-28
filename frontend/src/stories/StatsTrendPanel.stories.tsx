import type { Meta, StoryObj } from '@storybook/react';

import { StatsTrendPanel } from '../components/uniqueParts/StatsTrendPanel';

const meta: Meta<typeof StatsTrendPanel> = {
  title: 'StatsTrendPanel',
  component: StatsTrendPanel,
};

export default meta;

type Story = StoryObj<typeof StatsTrendPanel>;

export const Default: Story = {
  args: {
    title: '学習量の推移',
    description: 'レビュー完了数の増減がひと目で分かります。',
    testId: 'storybook-stats-trend',
    series: {
      metric: 'completed_reviews',
      bucketUnit: 'day',
      points: [
        { key: '1', label: '3/22', value: 4, from: '2026-03-22T00:00:00.000Z', to: '2026-03-22T23:59:59.999Z' },
        { key: '2', label: '3/23', value: 6, from: '2026-03-23T00:00:00.000Z', to: '2026-03-23T23:59:59.999Z' },
        { key: '3', label: '3/24', value: 8, from: '2026-03-24T00:00:00.000Z', to: '2026-03-24T23:59:59.999Z' },
      ],
    },
  },
};

export const Empty: Story = {
  args: {
    title: '正答率の推移',
    description: '選択中期間の定着状況を追えます。',
    testId: 'storybook-stats-trend-empty',
    series: null,
  },
};