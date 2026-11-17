import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FieldGuide } from './FieldGuide';
import { allConcepts } from '../character/fieldGuide';

describe('FieldGuide', () => {
  it('renders every concept from the glossary', () => {
    render(<FieldGuide onClose={vi.fn()} />);
    const concepts = allConcepts();
    expect(concepts.length).toBeGreaterThan(0);
    for (const concept of concepts) {
      expect(screen.getByText(concept)).toBeInTheDocument();
    }
  });

  it('calls onClose when the Close button is clicked', () => {
    const onClose = vi.fn();
    render(<FieldGuide onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose on Escape', () => {
    const onClose = vi.fn();
    render(<FieldGuide onClose={onClose} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('filters concepts when a search term is typed', () => {
    render(<FieldGuide onClose={vi.fn()} />);
    const searchInput = screen.getByPlaceholderText(/search tells/i);
    fireEvent.change(searchInput, { target: { value: 'platitude' } });
    expect(screen.getByText('Universal platitude')).toBeInTheDocument();
    expect(screen.queryByText('Authentic casual brevity')).not.toBeInTheDocument();
  });

  it('expands concept card on click to reveal counterexample and practice CTA', () => {
    const onPracticeTell = vi.fn();
    render(<FieldGuide onClose={vi.fn()} onPracticeTell={onPracticeTell} />);
    const cardTitle = screen.getByText('Universal platitude');
    fireEvent.click(cardTitle);
    expect(screen.getByText(/when this clue fails/i)).toBeInTheDocument();
    const practiceBtn = screen.getByRole('button', { name: /practice this tell/i });
    expect(practiceBtn).toBeInTheDocument();
    fireEvent.click(practiceBtn);
    expect(onPracticeTell).toHaveBeenCalledWith('Universal platitude');
  });
});
