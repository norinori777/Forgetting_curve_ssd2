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
    return <SearchBar value={value} onDebouncedChange={setValue} />;
  },
};
