import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchBar from '../SearchBar';

jest.useFakeTimers();

describe('SearchBar', () => {
  it('renders with placeholder', () => {
    render(<SearchBar placeholder="搜尋客戶" onSearch={jest.fn()} />);
    expect(screen.getByPlaceholderText('搜尋客戶')).toBeInTheDocument();
  });

  it('calls onSearch after debounce', async () => {
    const onSearch = jest.fn();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    render(<SearchBar onSearch={onSearch} debounceMs={300} />);

    await user.type(screen.getByRole('textbox'), '王');

    // Not called yet (within debounce)
    expect(onSearch).not.toHaveBeenCalledWith('王');

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(onSearch).toHaveBeenCalledWith('王');
  });

  it('shows clear button when value is present', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<SearchBar onSearch={jest.fn()} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'test');

    // Clear button should be present
    const clearButton = screen.getByRole('button');
    expect(clearButton).toBeInTheDocument();

    await user.click(clearButton);
    expect(input).toHaveValue('');
  });
});
