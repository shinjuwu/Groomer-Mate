import { render, screen } from '@testing-library/react';
import EmptyState from '../EmptyState';

describe('EmptyState', () => {
  it('renders title and default icon', () => {
    render(<EmptyState title="沒有資料" />);
    expect(screen.getByText('沒有資料')).toBeInTheDocument();
    expect(screen.getByText('📋')).toBeInTheDocument();
  });

  it('renders custom icon and subtitle', () => {
    render(<EmptyState icon="🐾" title="無寵物" subtitle="點擊新增" />);
    expect(screen.getByText('🐾')).toBeInTheDocument();
    expect(screen.getByText('無寵物')).toBeInTheDocument();
    expect(screen.getByText('點擊新增')).toBeInTheDocument();
  });

  it('does not render subtitle when not provided', () => {
    const { container } = render(<EmptyState title="空" />);
    const paragraphs = container.querySelectorAll('p');
    // Only icon + title, no subtitle
    expect(paragraphs).toHaveLength(2);
  });
});
