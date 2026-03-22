import type { Meta, StoryObj } from '@storybook/react';

import { ReviewCompletionSummary } from '../components/uniqueParts/ReviewCompletionSummary';

const meta: Meta<typeof ReviewCompletionSummary> = {
  title: 'ReviewCompletionSummary',
  component: ReviewCompletionSummary,
};

export default meta;

type Story = StoryObj<typeof ReviewCompletionSummary>;

export const Default: Story = {
  args: {
    summary: {
      forgotCount: 1,
      uncertainCount: 2,
      rememberedCount: 3,
      perfectCount: 4,
      assessedCount: 10,
      totalCount: 10,
    },
    onBackToList: () => {},
  },
};