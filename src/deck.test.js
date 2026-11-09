const assert = require('node:assert');
const test = require('node:test');
const { createDeck } = require('./deck.js');

const fixture = [
  { id: 'a', text: 'A', isAI: false, explanation: 'x' },
  { id: 'b', text: 'B', isAI: true, explanation: 'x' },
  { id: 'c', text: 'C', isAI: false, explanation: 'x' },
];

test('next() returns every item exactly once before any repeat', () => {
  const deck = createDeck(fixture);
  const seen = new Set();
  for (let i = 0; i < fixture.length; i++) {
    const item = deck.next();
    assert.ok(!seen.has(item.id), `repeated ${item.id} before full cycle`);
    seen.add(item.id);
  }
  assert.strictEqual(seen.size, fixture.length);
});

test('after exhausting the deck, next() reshuffles and keeps returning valid items', () => {
  const deck = createDeck(fixture);
  const validIds = new Set(fixture.map((i) => i.id));
  for (let i = 0; i < fixture.length * 3; i++) {
    const item = deck.next();
    assert.ok(validIds.has(item.id));
  }
});

test("reshuffle avoids repeating the item shown right before it as the next deck's first item, when more than one item exists", () => {
  // Deterministic rng stub: always returns 0, which would put the same
  // item first every reshuffle if the deck did not guard against it.
  const rng = () => 0;
  const deck = createDeck(fixture, rng);
  deck.next();
  deck.next();
  const lastBeforeReshuffle = deck.next(); // exhausts the first cycle
  const firstOfNextCycle = deck.next();
  assert.notStrictEqual(firstOfNextCycle.id, lastBeforeReshuffle.id);
});
