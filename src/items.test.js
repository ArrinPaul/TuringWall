const assert = require('node:assert');
const test = require('node:test');
const ITEMS = require('./items.js');

test('items.js exports 6-8 well-formed items with unique ids', () => {
  assert.ok(ITEMS.length >= 6 && ITEMS.length <= 8, `expected 6-8 items, got ${ITEMS.length}`);
  const ids = new Set();
  for (const item of ITEMS) {
    assert.strictEqual(typeof item.id, 'string');
    assert.ok(!ids.has(item.id), `duplicate id ${item.id}`);
    ids.add(item.id);
    assert.strictEqual(typeof item.text, 'string');
    assert.ok(item.text.length > 0);
    assert.strictEqual(typeof item.isAI, 'boolean');
    assert.strictEqual(typeof item.explanation, 'string');
    assert.ok(item.explanation.length > 0);
  }
});
