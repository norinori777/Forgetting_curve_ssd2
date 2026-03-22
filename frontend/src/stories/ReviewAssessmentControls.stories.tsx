import type { Meta, StoryObj } from '@storybook/react';

import { ReviewAssessmentControls } from '../components/uniqueParts/ReviewAssessmentControls';

const meta: Meta<typeof ReviewAssessmentControls> = {
  title: 'ReviewAssessmentControls',
  component: ReviewAssessmentControls,
};

export default meta;

type Story = StoryObj<typeof ReviewAssessmentControls>;

export const Default: Story = {
  args: {
    answerVisible: true,
    locked: false,
    currentAssessment: 'remembered',
    canGoPrev: true,
    canGoNext: true,
    onRevealAnswer: () => {},
    onSelectAssessment: () => {},
    onPrev: () => {},
    onNext: () => {},
    onBackToList: () => {},
  },
};