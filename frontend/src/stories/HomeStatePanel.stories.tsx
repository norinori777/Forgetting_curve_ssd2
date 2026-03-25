import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';

import { HomeStatePanel } from '../components/uniqueParts/HomeStatePanel';

const meta: Meta<typeof HomeStatePanel> = {
  title: 'HomeStatePanel',
  component: HomeStatePanel,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof HomeStatePanel>;

export const FirstUse: Story = {
  args: {
    kind: 'first-use',
    title: '最初の学習カードを登録しましょう。',
    description: '学習カードがまだありません。最初の 1 枚を登録すると、ホームの summary と復習導線が有効になります。',
    actions: [
      { label: '学習カード登録へ', to: '/cards/create', emphasis: 'primary' },
      { label: 'カード一覧へ', to: '/cards' },
    ],
  },
};

export const ErrorState: Story = {
  args: {
    kind: 'error',
    title: 'ホーム情報の取得に失敗しました。',
    description: '通信状態を確認して再試行してください。',
    actions: [
      { label: '再試行', onClick: () => {}, emphasis: 'primary' },
      { label: 'カード一覧へ', to: '/cards' },
    ],
  },
};