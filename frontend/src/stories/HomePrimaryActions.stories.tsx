import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';

import { HomePrimaryActions } from '../components/uniqueParts/HomePrimaryActions';

const meta: Meta<typeof HomePrimaryActions> = {
  title: 'HomePrimaryActions',
  component: HomePrimaryActions,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof HomePrimaryActions>;

export const Default: Story = {
  args: {
    busy: false,
    canStartReview: true,
    onStartReview: () => {},
  },
};