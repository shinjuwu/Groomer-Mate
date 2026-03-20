import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfirmDialog from '../ConfirmDialog';

describe('ConfirmDialog', () => {
  it('renders nothing when not open', () => {
    const { container } = render(
      <ConfirmDialog open={false} message="test" onConfirm={jest.fn()} onCancel={jest.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('displays message when open', () => {
    render(
      <ConfirmDialog open={true} message="確定刪除？" onConfirm={jest.fn()} onCancel={jest.fn()} />,
    );
    expect(screen.getByText('確定刪除？')).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button clicked', async () => {
    const onConfirm = jest.fn();
    const user = userEvent.setup();

    render(
      <ConfirmDialog open={true} message="test" onConfirm={onConfirm} onCancel={jest.fn()} />,
    );

    await user.click(screen.getByText('確認刪除'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel button clicked', async () => {
    const onCancel = jest.fn();
    const user = userEvent.setup();

    render(
      <ConfirmDialog open={true} message="test" onConfirm={jest.fn()} onCancel={onCancel} />,
    );

    await user.click(screen.getByText('取消'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', () => {
    render(
      <ConfirmDialog open={true} message="test" onConfirm={jest.fn()} onCancel={jest.fn()} isLoading={true} />,
    );
    expect(screen.getByText('處理中...')).toBeInTheDocument();
  });

  it('uses custom confirm label', () => {
    render(
      <ConfirmDialog open={true} message="test" confirmLabel="是的" onConfirm={jest.fn()} onCancel={jest.fn()} />,
    );
    expect(screen.getByText('是的')).toBeInTheDocument();
  });
});
