function checkGuess(item, guess) {
  return (guess === 'ai') === item.isAI;
}

if (typeof module !== 'undefined') module.exports = { checkGuess };
