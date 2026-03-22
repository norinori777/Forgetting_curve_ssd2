import type { Meta, StoryObj } from '@storybook/react';

import { CardCreatePreview } from '../components/uniqueParts/CardCreatePreview';

const meta: Meta<typeof CardCreatePreview> = {
  title: 'CardCreatePreview',
  component: CardCreatePreview,
};

export default meta;

type Story = StoryObj<typeof CardCreatePreview>;

export const Default: Story = {
  args: {
    title: '英単語セットA',
    content: 'photosynthesis = 光合成',
    answer: '植物が光エネルギーを使って糖を合成するはたらき\n葉緑体で行われる',
    tagNames: ['英語', '基礎'],
    collectionLabel: 'TOEIC 600',
  },
};

export const Empty: Story = {
  args: {
    title: '',
    content: '',
    answer: '',
    tagNames: [],
    collectionLabel: null,
  },
};