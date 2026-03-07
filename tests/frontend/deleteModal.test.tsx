import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DeleteConfirmModal } from '../../frontend/src/components/DeleteConfirmModal';

describe('DeleteConfirmModal', () => {
  it('shows selected items and calls onConfirm', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <DeleteConfirmModal
        open={true}
        items={[
          { id: 'c1', title: 'Card 1' },
          { id: 'c2', title: 'Card 2' },
        ]}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    expect(screen.getByRole('dialog', { name: 'delete-confirm' })).toBeInTheDocument();
    expect(screen.getByText('Card 1')).toBeInTheDocument();
    expect(screen.getByText('Card 2')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '削除を確定' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('cancels on Escape', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <DeleteConfirmModal
        open={true}
        items={[{ id: 'c1', title: 'Card 1' }]}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    await user.keyboard('{Escape}');

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
