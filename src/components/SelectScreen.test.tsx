import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { SelectScreen } from './SelectScreen';

function setup(overrides: Partial<React.ComponentProps<typeof SelectScreen>> = {}) {
  const onNameChange = vi.fn();
  const onRoundsChange = vi.fn();
  const onSelect = vi.fn();
  const utils = render(
    <SelectScreen
      name=""
      onNameChange={onNameChange}
      onRoundsChange={onRoundsChange}
      clearedModes={[]}
      onSelect={onSelect}
      {...overrides}
    />
  );
  return { onNameChange, onRoundsChange, onSelect, ...utils };
}

function goToTierStep() {
  fireEvent.click(screen.getByText(/Continue/i));
}

function goToLengthStep(tierLabel: string) {
  goToTierStep();
  fireEvent.click(screen.getByText(tierLabel));
}

describe('SelectScreen — step 1 (name)', () => {
  it('starts on the name step, with the tiers not yet shown', () => {
    setup();
    expect(screen.getByText("Who's playing?")).toBeInTheDocument();
    expect(screen.queryByText('Easy')).not.toBeInTheDocument();
  });

  it('typing a name calls onNameChange with the typed value', () => {
    const { onNameChange } = setup();
    fireEvent.change(screen.getByPlaceholderText('Anonymous'), { target: { value: 'Rin' } });
    expect(onNameChange).toHaveBeenCalledWith('Rin');
  });

  it('Continue advances to the hardness step', () => {
    setup();
    goToTierStep();
    expect(screen.getByText('How hard do you want this?')).toBeInTheDocument();
  });

  it('pressing Enter in the name field advances to the hardness step', () => {
    setup();
    fireEvent.keyDown(screen.getByPlaceholderText('Anonymous'), { key: 'Enter' });
    expect(screen.getByText('How hard do you want this?')).toBeInTheDocument();
  });
});

describe('SelectScreen — step 2 (hardness)', () => {
  it('renders all four tiers plus Mixed, and not the length step yet', () => {
    setup();
    goToTierStep();
    expect(screen.getByText('Easy')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('Hard')).toBeInTheDocument();
    expect(screen.getByText('Pro')).toBeInTheDocument();
    expect(screen.getByText('Mixed')).toBeInTheDocument();
    expect(screen.queryByText('How many questions?')).not.toBeInTheDocument();
  });

  it('shows a fixed point value on the four tiers but not on Mixed', () => {
    setup();
    goToTierStep();
    const easyCard = screen.getByText('Easy').closest('button')!;
    const mixedCard = screen.getByText('Mixed').closest('button')!;
    expect(within(easyCard).getByText('+1 pts')).toBeInTheDocument();
    expect(within(mixedCard).queryByText(/\+\d+ pts/)).not.toBeInTheDocument();
  });

  it('marks cleared tiers with a "Cleared" badge, and leaves others unmarked', () => {
    setup({ clearedModes: ['easy', 'pro'] });
    goToTierStep();
    const easyCard = screen.getByText('Easy').closest('button')!;
    const mediumCard = screen.getByText('Medium').closest('button')!;
    expect(within(easyCard).getByText('Cleared')).toBeInTheDocument();
    expect(within(mediumCard).queryByText('Cleared')).not.toBeInTheDocument();
  });

  it('picking a tier advances to the length step without calling onSelect yet', () => {
    const { onSelect } = setup();
    goToTierStep();
    fireEvent.click(screen.getByText('Hard'));
    expect(screen.getByText('How many questions?')).toBeInTheDocument();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('Back returns to the name step', () => {
    setup();
    goToTierStep();
    fireEvent.click(screen.getByText(/Back/i));
    expect(screen.getByText("Who's playing?")).toBeInTheDocument();
  });
});

describe('SelectScreen — step 3 (length)', () => {
  it('renders all four session-length options', () => {
    setup();
    goToLengthStep('Hard');
    expect(screen.getByTestId('rounds-3')).toBeInTheDocument();
    expect(screen.getByTestId('rounds-5')).toBeInTheDocument();
    expect(screen.getByTestId('rounds-7')).toBeInTheDocument();
    expect(screen.getByTestId('rounds-10')).toBeInTheDocument();
  });

  it('picking a length calls onRoundsChange with that number and onSelect with the chosen tier', () => {
    const { onRoundsChange, onSelect } = setup();
    goToLengthStep('Hard');
    fireEvent.click(screen.getByTestId('rounds-7'));
    expect(onRoundsChange).toHaveBeenCalledWith(7);
    expect(onSelect).toHaveBeenCalledWith('hard');
  });

  it('picking Mixed as the tier then a length calls onSelect with "mixed"', () => {
    const { onSelect } = setup();
    goToLengthStep('Mixed');
    fireEvent.click(screen.getByTestId('rounds-3'));
    expect(onSelect).toHaveBeenCalledWith('mixed');
  });

  it('Back returns to the hardness step', () => {
    setup();
    goToLengthStep('Hard');
    fireEvent.click(screen.getByText(/Back/i));
    expect(screen.getByText('How hard do you want this?')).toBeInTheDocument();
  });
});
