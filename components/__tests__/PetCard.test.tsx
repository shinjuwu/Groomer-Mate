import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PetCard from '../PetCard';
import type { Pet } from '@/types/pet';

const mockPet: Pet = {
  id: 'p1',
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
  customer_id: 'c1',
  user_id: 'u1',
  name: 'Lucky',
  species: '狗',
  breed: '貴賓',
  weight_kg: 5.0,
  birth_date: null,
  notes: null,
};

describe('PetCard', () => {
  it('renders pet name, species, and breed', () => {
    render(<PetCard pet={mockPet} onClick={jest.fn()} />);
    expect(screen.getByText('Lucky')).toBeInTheDocument();
    expect(screen.getByText('狗')).toBeInTheDocument();
    expect(screen.getByText('貴賓')).toBeInTheDocument();
  });

  it('shows correct species emoji', () => {
    render(<PetCard pet={mockPet} onClick={jest.fn()} />);
    expect(screen.getByText('🐕')).toBeInTheDocument();
  });

  it('shows cat emoji for cats', () => {
    const cat = { ...mockPet, species: '貓' };
    render(<PetCard pet={cat} onClick={jest.fn()} />);
    expect(screen.getByText('🐈')).toBeInTheDocument();
  });

  it('shows default emoji for unknown species', () => {
    const other = { ...mockPet, species: '鳥' };
    render(<PetCard pet={other} onClick={jest.fn()} />);
    expect(screen.getByText('🐾')).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const onClick = jest.fn();
    const user = userEvent.setup();

    render(<PetCard pet={mockPet} onClick={onClick} />);
    await user.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
