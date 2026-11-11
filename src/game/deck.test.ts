import { describe, it, expect } from 'vitest';
import { createDeck } from './deck';

const fixture = [
  { id: 'a', text: 'A' },
  { id: 'b', text: 'B' },
  { id: 'c', text: 'C' },
];

describe('createDeck', () => {
  it('next() returns every item exactly once before any repeat', () => {
    const deck = createDeck(fixture);
    const seen = new Set<string>();
    for (let i = 0; i < fixture.length; i++) {
      const item = deck.next();
      expect(seen.has(item.id)).toBe(false);
      seen.add(item.id);
    }
    expect(seen.size).toBe(fixture.length);
  });

  it('after exhausting the deck, next() reshuffles and keeps returning valid items', () => {
    const deck = createDeck(fixture);
    const validIds = new Set(fixture.map((i) => i.id));
    for (let i = 0; i < fixture.length * 3; i++) {
      const item = deck.next();
      expect(validIds.has(item.id)).toBe(true);
    }
  });

  it('reshuffle avoids repeating the item shown right before it as the next deck\'s first item, when more than one item exists', () => {
    const rng = () => 0;
    const deck = createDeck(fixture, rng);
    deck.next();
    deck.next();
    const lastOfFirstCycle = deck.next();
    const firstOfNextCycle = deck.next();
    expect(firstOfNextCycle.id).not.toBe(lastOfFirstCycle.id);
  });
});
