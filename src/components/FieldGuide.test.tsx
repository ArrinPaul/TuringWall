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
});
