import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HistoryCard from '../HistoryCard';
import type { GroomingLog } from '@/types/grooming-log';

const mockLog: GroomingLog = {
  id: 'g1',
  created_at: '2026-03-20T10:00:00Z',
  user_id: 'u1',
  pet_id: 'p1',
  audio_url: null,
  transcription: '逐字稿內容',
  summary: '美容摘要',
  tags: ['皮膚紅腫', '指甲修剪'],
  internal_memo: '內部備註',
  pet_name: 'Lucky',
  customer_name: '王小明',
};

describe('HistoryCard', () => {
  it('renders date, tags, and summary preview', () => {
    render(<HistoryCard log={mockLog} onDelete={jest.fn()} isDeleting={false} />);

    expect(screen.getByText('皮膚紅腫')).toBeInTheDocument();
    expect(screen.getByText('指甲修剪')).toBeInTheDocument();
    expect(screen.getByText('美容摘要')).toBeInTheDocument();
  });

  it('renders pet and customer name badge', () => {
    render(<HistoryCard log={mockLog} onDelete={jest.fn()} isDeleting={false} />);
    expect(screen.getByText('王小明 / Lucky')).toBeInTheDocument();
  });

  it('expands to show details on click', async () => {
    const user = userEvent.setup();
    render(<HistoryCard log={mockLog} onDelete={jest.fn()} isDeleting={false} />);

    // Details not visible initially
    expect(screen.queryByText('逐字稿內容')).not.toBeInTheDocument();

    // Click to expand
    await user.click(screen.getAllByRole('button')[0]);

    expect(screen.getByText('逐字稿內容')).toBeInTheDocument();
    expect(screen.getByText('逐字稿')).toBeInTheDocument();
  });

  it('shows share button when onShare is provided', async () => {
    const user = userEvent.setup();
    const onShare = jest.fn();

    render(
      <HistoryCard log={mockLog} onDelete={jest.fn()} isDeleting={false} onShare={onShare} />,
    );

    // Expand first
    await user.click(screen.getAllByRole('button')[0]);

    const shareBtn = screen.getByText('分享給飼主');
    await user.click(shareBtn);
    expect(onShare).toHaveBeenCalledWith(mockLog);
  });

  it('shows link-pet button when no pet_id', async () => {
    const user = userEvent.setup();
    const onLinkPet = jest.fn();
    const logNoPet = { ...mockLog, pet_id: null };

    render(
      <HistoryCard log={logNoPet} onDelete={jest.fn()} isDeleting={false} onLinkPet={onLinkPet} />,
    );

    await user.click(screen.getAllByRole('button')[0]);

    const linkBtn = screen.getByText('關聯寵物');
    await user.click(linkBtn);
    expect(onLinkPet).toHaveBeenCalledWith('g1');
  });

  it('calls onDelete when delete button clicked', async () => {
    const user = userEvent.setup();
    const onDelete = jest.fn();

    render(<HistoryCard log={mockLog} onDelete={onDelete} isDeleting={false} />);

    await user.click(screen.getAllByRole('button')[0]);
    await user.click(screen.getByText('刪除紀錄'));

    expect(onDelete).toHaveBeenCalledWith('g1');
  });

  it('shows deleting state', async () => {
    const user = userEvent.setup();
    render(<HistoryCard log={mockLog} onDelete={jest.fn()} isDeleting={true} />);

    await user.click(screen.getAllByRole('button')[0]);
    expect(screen.getByText('刪除中...')).toBeInTheDocument();
  });
});
