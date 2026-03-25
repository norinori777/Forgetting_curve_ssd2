import type { Meta, StoryObj } from '@storybook/react';

import { HomeSummaryCard } from '../components/uniqueParts/HomeSummaryCard';

const meta: Meta<typeof HomeSummaryCard> = {
  title: 'HomeSummaryCard',
  component: HomeSummaryCard,
};

export default meta;

type Story = StoryObj<typeof HomeSummaryCard>;

export const Default: Story = {
  args: {
    label: '今日の復習対象',
    value: 12,
    description: '今日の復習として開始できるカード数です。',
    testId: 'storybook-home-summary',
  },
};