import type { Meta, StoryObj } from '@storybook/react';

import { CardCsvImportPanel } from '../components/uniqueParts/CardCsvImportPanel';

const meta: Meta<typeof CardCsvImportPanel> = {
  title: 'CardCsvImportPanel',
  component: CardCsvImportPanel,
};

export default meta;

type Story = StoryObj<typeof CardCsvImportPanel>;

export const Idle: Story = {
  args: {
    selectedFileName: null,
    selectedFileSize: null,
    detectedEncoding: null,
    phase: 'idle',
    generalError: null,
    canImport: false,
    helperFormatText: '1列目: タイトル、2列目: 学習内容、3列目: 回答、4列目: タグ、5列目: コレクション。タグはセミコロン区切り、学習内容の改行は \\n で表現します。',
    helperEncodingText: '対応文字コード: UTF-8 / UTF-8 BOM / Shift_JIS',
    helperBlockedText: 'エラーが1件でもある場合は一括登録できません。',
    onFileChange: () => {},
    onImport: () => {},
    onCancel: () => {},
  },
};

export const ReadyToImport: Story = {
  args: {
    selectedFileName: 'cards-import-valid.csv',
    selectedFileSize: 2560,
    detectedEncoding: 'utf-8',
    phase: 'ready',
    generalError: null,
    canImport: true,
    helperFormatText: '1列目: タイトル、2列目: 学習内容、3列目: 回答、4列目: タグ、5列目: コレクション。タグはセミコロン区切り、学習内容の改行は \\n で表現します。',
    helperEncodingText: '対応文字コード: UTF-8 / UTF-8 BOM / Shift_JIS',
    helperBlockedText: 'エラーが1件でもある場合は一括登録できません。',
    onFileChange: () => {},
    onImport: () => {},
    onCancel: () => {},
  },
};

export const WithValidationError: Story = {
  args: {
    selectedFileName: 'cards-import-invalid.csv',
    selectedFileSize: 1980,
    detectedEncoding: 'shift_jis',
    phase: 'failed',
    generalError: 'CSVの検証に失敗しました。内容を確認して再アップロードしてください。',
    canImport: false,
    helperFormatText: '1列目: タイトル、2列目: 学習内容、3列目: 回答、4列目: タグ、5列目: コレクション。タグはセミコロン区切り、学習内容の改行は \\n で表現します。',
    helperEncodingText: '対応文字コード: UTF-8 / UTF-8 BOM / Shift_JIS',
    helperBlockedText: 'エラーが1件でもある場合は一括登録できません。',
    onFileChange: () => {},
    onImport: () => {},
    onCancel: () => {},
  },
};