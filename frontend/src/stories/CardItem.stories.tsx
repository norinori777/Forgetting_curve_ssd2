import type { Meta, StoryObj } from '@storybook/react';

import { CardItem } from '../components/CardItem';
import type { ApiCard } from '../domain/cardList';

const meta: Meta<typeof CardItem> = {
  title: 'CardItem',
  component: CardItem,
};

export default meta;

type Story = StoryObj<typeof CardItem>;

const baseCard: ApiCard = {
  id: 'c1',
  title: 'Sample Card',
  content: 'content',
  answer: 'これはサンプル回答です。\n2行目も表示できます。',
  tags: ['tag1', 'tag2'],
  collectionId: null,
  proficiency: 10,
  nextReviewAt: new Date().toISOString(),
  lastCorrectRate: 0.5,
  isArchived: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const defaultArgs = {
  selected: false,
  card: baseCard,
};

export const Default: Story = {
  args: {
    ...defaultArgs,
  },
};

export const AnswerHidden: Story = {
  args: {
    ...defaultArgs,
    answerVisible: false,
  },
};

export const AnswerVisible: Story = {
  args: {
    ...defaultArgs,
    answerVisible: true,
  },
};

export const Unanswered: Story = {
  args: {
    ...defaultArgs,
    card: {
      ...baseCard,
      id: 'c2',
      title: 'No Answer Card',
      answer: null,
    },
  },
};

export const LongAnswerInline: Story = {
  args: {
    ...defaultArgs,
    answerVisible: true,
    card: {
      ...baseCard,
      id: 'c3',
      title: 'Long Answer Card',
      answer:
        '1行目の回答です。\n2行目の回答です。\n3行目の回答です。\n4行目の回答です。\n5行目の回答です。',
    },
  },
};
