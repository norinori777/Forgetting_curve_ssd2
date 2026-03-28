import type { Meta, StoryObj } from '@storybook/react';

import { StatsInsightPanel } from '../components/uniqueParts/StatsInsightPanel';

const meta: Meta<typeof StatsInsightPanel> = {
  title: 'StatsInsightPanel',
  component: StatsInsightPanel,
};

export default meta;

type Story = StoryObj<typeof StatsInsightPanel>;

export const Default: Story = {
  args: {
    items: [
      { id: 'trend-overview', kind: 'trend', message: 'レビュー完了数は前期間より 8 件増えています。', relatedTagId: null },
      { id: 'focus-weakest-tag', kind: 'focus', message: '要改善: リスニング（正答率 74%）', relatedTagId: 't3' },
    ],
  },
};

export const CachedFallback: Story = {
  args: {
    items: [{ id: 'trend-overview', kind: 'trend', message: '前回取得した統計を表示しています。', relatedTagId: null }],
    isStale: true,
  },
};