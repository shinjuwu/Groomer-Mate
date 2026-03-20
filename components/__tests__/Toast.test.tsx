import { render, screen, act } from '@testing-library/react';
import Toast from '../Toast';

jest.useFakeTimers();

describe('Toast', () => {
  it('renders success message', () => {
    render(<Toast message="已儲存" type="success" onClose={jest.fn()} />);
    expect(screen.getByText('已儲存')).toBeInTheDocument();
  });

  it('renders error message', () => {
    render(<Toast message="失敗" type="error" onClose={jest.fn()} />);
    expect(screen.getByText('失敗')).toBeInTheDocument();
  });

  it('auto-dismisses after 3 seconds', () => {
    const onClose = jest.fn();
    render(<Toast message="test" type="success" onClose={onClose} />);

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    // After fade-out animation (300ms)
    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
