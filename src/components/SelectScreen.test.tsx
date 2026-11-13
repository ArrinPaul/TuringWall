import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { SelectScreen } from './SelectScreen';

function setup(overrides: Partial<React.ComponentProps<typeof SelectScreen>> = {}) {
  const onNameChange = vi.fn();
  const onRoundsChange = vi.fn();
  const onSelect = vi.fn();
  render(
    <SelectScreen
      name=""
      onNameChange={onNameChange}
      roundsTarget={10}
      onRoundsChange={onRoundsChange}
      clearedModes={[]}
      onSelect={onSelect}
      {...overrides}
    />
  );
  return { onNameChange, onRoundsChange, onSelect };
}

describe('SelectScreen', () => {
  it('renders all four tiers plus Mixed', () => {
    setup();
    expect(screen.getByText('Easy')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('Hard')).toBeInTheDocument();
    expect(screen.getByText('Pro')).toBeInTheDocument();
    expect(screen.getByText('Mixed')).toBeInTheDocument();
  });

  it('clicking a tier calls onSelect with that tier id', () => {
    const { onSelect } = setup();
    fireEvent.click(screen.getByText('Hard'));
    expect(onSelect).toHaveBeenCalledWith('hard');
  });

  it('shows a fixed point value on the four tiers but not on Mixed', () => {
    setup();
    const easyCard = screen.getByText('Easy').closest('button')!;
    const mixedCard = screen.getByText('Mixed').closest('button')!;
    expect(within(easyCard).getByText('+1 pts')).toBeInTheDocument();
    expect(within(mixedCard).queryByText(/\+\d+ pts/)).not.toBeInTheDocument();
  });

  it('clicking Mixed calls onSelect with "mixed"', () => {
    const { onSelect } = setup();
    fireEvent.click(screen.getByText('Mixed'));
    expect(onSelect).toHaveBeenCalledWith('mixed');
  });

  it('typing a name calls onNameChange with the typed value', () => {
    const { onNameChange } = setup();
    fireEvent.change(screen.getByPlaceholderText('Anonymous'), { target: { value: 'Rin' } });
    expect(onNameChange).toHaveBeenCalledWith('Rin');
  });

  it('renders all four session-length options', () => {
    setup();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('clicking a rounds option calls onRoundsChange with that number', () => {
    const { onRoundsChange } = setup();
    fireEvent.click(screen.getByText('7'));
    expect(onRoundsChange).toHaveBeenCalledWith(7);
  });

  it('marks cleared tiers with a "Cleared" badge, and leaves others unmarked', () => {
    setup({ clearedModes: ['easy', 'pro'] });
    const easyCard = screen.getByText('Easy').closest('button')!;
    const mediumCard = screen.getByText('Medium').closest('button')!;
    expect(within(easyCard).getByText('Cleared')).toBeInTheDocument();
    expect(within(mediumCard).queryByText('Cleared')).not.toBeInTheDocument();
  });
});
