import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PetSelector from '../PetSelector';

const mockFetchCustomers = jest.fn();
const mockFetchPets = jest.fn();

jest.mock('@/lib/api', () => ({
  fetchCustomers: (...args: any[]) => mockFetchCustomers(...args),
  fetchPets: (...args: any[]) => mockFetchPets(...args),
}));

const customers = [
  { id: 'c1', name: '王小明' },
  { id: 'c2', name: '李大華' },
];

const pets = [
  { id: 'p1', name: 'Lucky', species: '狗', breed: '貴賓' },
  { id: 'p2', name: 'Mimi', species: '貓', breed: null },
];

describe('PetSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchCustomers.mockResolvedValue({ data: customers });
    mockFetchPets.mockResolvedValue({ data: pets });
  });

  it('loads and renders customer options', async () => {
    render(<PetSelector onSelect={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('王小明')).toBeInTheDocument();
      expect(screen.getByText('李大華')).toBeInTheDocument();
    });
  });

  it('loads pets when customer selected', async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();

    render(<PetSelector onSelect={onSelect} />);

    await waitFor(() => {
      expect(screen.getByText('王小明')).toBeInTheDocument();
    });

    await user.selectOptions(screen.getAllByRole('combobox')[0], 'c1');

    await waitFor(() => {
      expect(mockFetchPets).toHaveBeenCalledWith('c1');
    });
  });

  it('calls onSelect(null) when customer changes', async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();

    render(<PetSelector onSelect={onSelect} />);

    await waitFor(() => {
      expect(screen.getByText('王小明')).toBeInTheDocument();
    });

    await user.selectOptions(screen.getAllByRole('combobox')[0], 'c1');

    // Should call onSelect(null) when switching customer
    expect(onSelect).toHaveBeenCalledWith(null);
  });
});
