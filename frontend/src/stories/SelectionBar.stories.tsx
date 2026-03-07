import type { Meta, StoryObj } from '@storybook/react';

import { SelectionBar } from '../components/SelectionBar';

const meta: Meta<typeof SelectionBar> = {
  title: 'SelectionBar',
  component: SelectionBar,
};

export default meta;

type Story = StoryObj<typeof SelectionBar>;

export const Empty: Story = {
  args: {
    selectedCount: 0,
    onArchive: () => {},
    onDelete: () => {},
  },
};

export const Selected: Story = {
  args: {
    selectedCount: 3,
    onArchive: () => {},
    onDelete: () => {},
  },
};
