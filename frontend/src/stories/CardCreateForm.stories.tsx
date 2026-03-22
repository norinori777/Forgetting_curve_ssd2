import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { CardCreateForm } from '../components/uniqueParts/CardCreateForm';

const meta: Meta<typeof CardCreateForm> = {
  title: 'CardCreateForm',
  component: CardCreateForm,
};

export default meta;

type Story = StoryObj<typeof CardCreateForm>;

export const Default: Story = {
  render: () => {
    const [title, setTitle] = useState('英単語セットA');
    const [content, setContent] = useState('photosynthesis = 光合成');
    const [answer, setAnswer] = useState('植物が光エネルギーを使って糖を合成するはたらき');
    const [tagInput, setTagInput] = useState('英語, 基礎');

    return (
      <CardCreateForm
        title={title}
        content={content}
        answer={answer}
        tagInput={tagInput}
        collectionLabel="TOEIC 600"
        tagHelperText="カンマ区切りで複数入力"
        submitState="idle"
        onTitleChange={setTitle}
        onContentChange={setContent}
        onAnswerChange={setAnswer}
        onTagInputChange={setTagInput}
        onOpenCollectionPicker={() => {}}
        onSubmit={() => {}}
        onReset={() => {
          setTitle('');
          setContent('');
          setAnswer('');
          setTagInput('');
        }}
        onBack={() => {}}
      />
    );
  },
};

export const Failed: Story = {
  args: {
    title: '英単語セットA',
    content: 'photosynthesis = 光合成',
    answer: '植物が光エネルギーを使って糖を合成するはたらき',
    tagInput: '英語, 基礎',
    collectionLabel: 'TOEIC 600',
    submitError: 'カードの登録に失敗しました。時間をおいて再試行してください。',
    tagHelperText: 'カンマ区切りで複数入力',
    unsavedChangesMessage: '未保存の入力内容があります。このまま移動すると内容は失われます。',
    submitState: 'failed',
    onTitleChange: () => {},
    onContentChange: () => {},
    onAnswerChange: () => {},
    onTagInputChange: () => {},
    onOpenCollectionPicker: () => {},
    onSubmit: () => {},
    onReset: () => {},
    onBack: () => {},
  },
};