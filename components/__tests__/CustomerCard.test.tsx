import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CustomerCard from '../CustomerCard';
import type { Customer } from '@/types/customer';

const mockCustomer: Customer = {
  id: 'c1',
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
  user_id: 'u1',
  name: '王小明',
  phone: '0912345678',
  line_id: null,
  notes: '常客',
};

describe('CustomerCard', () => {
  it('renders customer name and phone', () => {
    render(<CustomerCard customer={mockCustomer} onClick={jest.fn()} />);
    expect(screen.getByText('王小明')).toBeInTheDocument();
    expect(screen.getByText('0912345678')).toBeInTheDocument();
  });

  it('renders pet count badge', () => {
    render(<CustomerCard customer={mockCustomer} petCount={3} onClick={jest.fn()} />);
    expect(screen.getByText('3 隻寵物')).toBeInTheDocument();
  });

  it('renders notes', () => {
    render(<CustomerCard customer={mockCustomer} onClick={jest.fn()} />);
    expect(screen.getByText('常客')).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const onClick = jest.fn();
    const user = userEvent.setup();

    render(<CustomerCard customer={mockCustomer} onClick={onClick} />);
    await user.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
