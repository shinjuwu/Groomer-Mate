import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FormModal from '../FormModal';

describe('FormModal', () => {
  it('renders nothing when not open', () => {
    const { container } = render(
      <FormModal title="Test" open={false} onClose={jest.fn()} onSubmit={jest.fn()}>
        <input />
      </FormModal>,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders title and children when open', () => {
    render(
      <FormModal title="新增客戶" open={true} onClose={jest.fn()} onSubmit={jest.fn()}>
        <input placeholder="姓名" />
      </FormModal>,
    );

    expect(screen.getByText('新增客戶')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('姓名')).toBeInTheDocument();
  });

  it('calls onSubmit when form submitted', async () => {
    const onSubmit = jest.fn();
    const user = userEvent.setup();

    render(
      <FormModal title="Test" open={true} onClose={jest.fn()} onSubmit={onSubmit}>
        <input />
      </FormModal>,
    );

    await user.click(screen.getByText('儲存'));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when cancel clicked', async () => {
    const onClose = jest.fn();
    const user = userEvent.setup();

    render(
      <FormModal title="Test" open={true} onClose={onClose} onSubmit={jest.fn()}>
        <input />
      </FormModal>,
    );

    await user.click(screen.getByText('取消'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows custom submit label', () => {
    render(
      <FormModal title="Test" open={true} onClose={jest.fn()} onSubmit={jest.fn()} submitLabel="確認關聯">
        <input />
      </FormModal>,
    );

    expect(screen.getByText('確認關聯')).toBeInTheDocument();
  });

  it('shows loading state when submitting', () => {
    render(
      <FormModal title="Test" open={true} onClose={jest.fn()} onSubmit={jest.fn()} isSubmitting={true}>
        <input />
      </FormModal>,
    );

    expect(screen.getByText('處理中...')).toBeInTheDocument();
  });
});
