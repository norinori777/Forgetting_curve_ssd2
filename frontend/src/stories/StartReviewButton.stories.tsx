import type { Meta, StoryObj } from '@storybook/react';

import { StartReviewButton } from '../components/StartReviewButton';

const meta: Meta<typeof StartReviewButton> = {
  title: 'StartReviewButton',
  component: StartReviewButton,
};

export default meta;

type Story = StoryObj<typeof StartReviewButton>;

export const Enabled: Story = {
  args: {
    disabled: false,
    onClick: () => {},
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    onClick: () => {},
  },
};
