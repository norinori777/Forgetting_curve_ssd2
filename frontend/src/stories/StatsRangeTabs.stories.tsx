import type { Meta, StoryObj } from '@storybook/react';

import { StatsRangeTabs } from '../components/uniqueParts/StatsRangeTabs';

const meta: Meta<typeof StatsRangeTabs> = {
  title: 'StatsRangeTabs',
  component: StatsRangeTabs,
};

export default meta;

type Story = StoryObj<typeof StatsRangeTabs>;

export const Default: Story = {
  args: {
    selectedRange: '7d',
    onSelect: () => {},
  },
};