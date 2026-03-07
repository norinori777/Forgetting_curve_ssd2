import type { Meta, StoryObj } from '@storybook/react';

import { DeleteConfirmModal } from '../components/DeleteConfirmModal';

const meta: Meta<typeof DeleteConfirmModal> = {
  title: 'DeleteConfirmModal',
  component: DeleteConfirmModal,
};

export default meta;

type Story = StoryObj<typeof DeleteConfirmModal>;

export const Open: Story = {
  args: {
    open: true,
    items: [
      { id: 'c1', title: 'Card 1' },
      { id: 'c2', title: 'Card 2' },
    ],
    onConfirm: () => {},
    onCancel: () => {},
  },
};
