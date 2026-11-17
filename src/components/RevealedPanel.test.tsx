import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RevealedPanel } from './RevealedPanel';
import { ITEMS } from '../data/items';
import { createStats } from '../game/scoring';

function renderReveal(id: string) {
  const item = ITEMS.find((i) => i.id === id)!;
  render(
    <RevealedPanel
      correct
      item={item}
      explanation={item.explanation}
      onNext={() => {}}
      onShowStats={() => {}}
      stats={createStats(true)}
      lastRoundResult={null}
    />
  );
  return item;
}

describe('RevealedPanel curated evidence', () => {
  it('marks the exact evidence phrases in a text item', () => {
    const item = renderReveal('marketing-ai-unlock-savings');
    const marked = Array.from(document.querySelectorAll('mark')).map((m) => m.textContent);
    expect(marked.length).toBeGreaterThan(0);
    for (const m of marked) expect(item.kind === 'text' && item.text).toContain(m!);
  });

  it('shows the item-specific tempting reason and counterexample', () => {
    const item = renderReveal('marketing-ai-unlock-savings');
    expect(screen.getByText(item.temptingReason!)).toBeInTheDocument();
    expect(screen.getByText(item.counterexample!)).toBeInTheDocument();
  });

  it('uses neutral alt text for image items', () => {
    const item = renderReveal('img-hybrid');
    const img = document.querySelector('img');
    expect(img?.getAttribute('alt')).toBe(item.kind === 'image' ? item.alt : '');
  });
});
