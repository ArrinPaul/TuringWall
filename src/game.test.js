const assert = require('node:assert');
const test = require('node:test');
const { checkGuess } = require('./game.js');

test('guessing "ai" on an AI item is correct', () => {
  assert.strictEqual(checkGuess({ isAI: true }, 'ai'), true);
});

test('guessing "human" on an AI item is incorrect', () => {
  assert.strictEqual(checkGuess({ isAI: true }, 'human'), false);
});

test('guessing "human" on a human item is correct', () => {
  assert.strictEqual(checkGuess({ isAI: false }, 'human'), true);
});

test('guessing "ai" on a human item is incorrect', () => {
  assert.strictEqual(checkGuess({ isAI: false }, 'ai'), false);
});
