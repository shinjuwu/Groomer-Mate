import { render, screen } from '@testing-library/react';
import BottomNav from '../BottomNav';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

describe('BottomNav', () => {
  it('renders 3 tabs', () => {
    render(<BottomNav />);

    expect(screen.getByText('首頁')).toBeInTheDocument();
    expect(screen.getByText('客戶')).toBeInTheDocument();
    expect(screen.getByText('紀錄')).toBeInTheDocument();
  });

  it('highlights active tab', () => {
    render(<BottomNav />);
    const homeLink = screen.getByText('首頁').closest('a');
    expect(homeLink).toHaveClass('text-blue-600');
  });

  it('renders correct links', () => {
    render(<BottomNav />);
    expect(screen.getByText('首頁').closest('a')).toHaveAttribute('href', '/');
    expect(screen.getByText('客戶').closest('a')).toHaveAttribute('href', '/customers');
    expect(screen.getByText('紀錄').closest('a')).toHaveAttribute('href', '/history');
  });
});
