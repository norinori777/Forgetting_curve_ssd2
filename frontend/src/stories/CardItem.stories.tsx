import type { Meta, StoryObj } from '@storybook/react';

import { CardItem } from '../components/CardItem';

const meta: Meta<typeof CardItem> = {
  title: 'CardItem',
  component: CardItem,
};

export default meta;

type Story = StoryObj<typeof CardItem>;

export const Default: Story = {
  args: {
    selected: false,
    card: {
      id: 'c1',
      title: 'Sample Card',
      content: 'content',
      tags: ['tag1', 'tag2'],
      collectionId: null,
      proficiency: 10,
      nextReviewAt: new Date().toISOString(),
      lastCorrectRate: 0.5,
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  },
};
