import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { SearchBar } from '../components/SearchBar';

const meta: Meta<typeof SearchBar> = {
  title: 'SearchBar',
  component: SearchBar,
};

export default meta;

type Story = StoryObj<typeof SearchBar>;

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <SearchBar
        value={value}
        onDebouncedChange={setValue}
        statusValue="today"
        statusOptions={[
          { value: 'all', label: 'すべて' },
          { value: 'today', label: '今日の復習' },
          { value: 'overdue', label: '期限切れ' },
          { value: 'unlearned', label: '未学習' },
        ]}
        onStatusChange={() => {}}
      />
    );
  },
};
