import type { Meta, StoryObj } from '@storybook/react';

import { CardCsvImportPreviewTable } from '../components/uniqueParts/CardCsvImportPreviewTable';

const meta: Meta<typeof CardCsvImportPreviewTable> = {
  title: 'CardCsvImportPreviewTable',
  component: CardCsvImportPreviewTable,
};

export default meta;

type Story = StoryObj<typeof CardCsvImportPreviewTable>;

export const MixedValidation: Story = {
  args: {
    summary: {
      totalRows: 3,
      headerSkipped: true,
      validRows: 2,
      invalidRows: 1,
      canImport: false,
      importedRows: null,
    },
    rows: [
      {
        rowNumber: 2,
        title: '英単語セットA',
        content: 'photosynthesis = 光合成',
        answer: '植物が光エネルギーを使って糖を合成するはたらき',
        tagCell: '英語;基礎',
        tagNames: ['英語', '基礎'],
        collectionName: 'TOEIC 600',
        resolvedCollectionId: 'col1',
        status: 'valid',
        issues: [],
      },
      {
        rowNumber: 3,
        title: '化学用語集',
        content: 'pH = 水素イオン濃度指数',
        answer: null,
        tagCell: '理科',
        tagNames: ['理科'],
        collectionName: null,
        resolvedCollectionId: null,
        status: 'valid',
        issues: [],
      },
      {
        rowNumber: 4,
        title: '長文読解',
        content: '関係代名詞の用法',
        answer: '先行詞を修飾する節',
        tagCell: '英語;応用',
        tagNames: ['英語', '応用'],
        collectionName: '未知コレクション',
        resolvedCollectionId: null,
        status: 'invalid',
        issues: [
          {
            scope: 'row',
            rowNumber: 4,
            code: 'collection_not_found',
            messageKey: 'cardCsvImport.validation.collectionNotFound',
            messageText: '指定されたコレクションが見つかりません。',
            detail: '未知コレクション',
          },
        ],
      },
    ],
  },
};

export const AllValid: Story = {
  args: {
    summary: {
      totalRows: 2,
      headerSkipped: true,
      validRows: 2,
      invalidRows: 0,
      canImport: true,
      importedRows: null,
    },
    rows: [
      {
        rowNumber: 2,
        title: '英単語セットA',
        content: 'photosynthesis = 光合成',
        answer: '植物が光エネルギーを使って糖を合成するはたらき',
        tagCell: '英語;基礎',
        tagNames: ['英語', '基礎'],
        collectionName: 'TOEIC 600',
        resolvedCollectionId: 'col1',
        status: 'valid',
        issues: [],
      },
      {
        rowNumber: 3,
        title: '英単語セットB',
        content: 'cell division = 細胞分裂',
        answer: null,
        tagCell: '英語',
        tagNames: ['英語'],
        collectionName: null,
        resolvedCollectionId: null,
        status: 'valid',
        issues: [],
      },
    ],
  },
};