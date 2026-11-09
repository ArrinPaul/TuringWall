(function () {
  const stage = document.querySelector('.stage');
  const quoteText = document.getElementById('quote-text');
  const btnHuman = document.getElementById('btn-human');
  const btnAi = document.getElementById('btn-ai');
  const revealPanel = document.getElementById('reveal-panel');
  const verdictText = document.getElementById('verdict-text');
  const explanationText = document.getElementById('explanation-text');
  const btnNext = document.getElementById('btn-next');

  const deck = createDeck(ITEMS);
  let current = deck.next();
  let state = 'showing';

  function renderCurrent() {
    quoteText.textContent = current.text;
    revealPanel.hidden = true;
    stage.classList.remove('flash-correct', 'flash-incorrect');
    state = 'showing';
  }

  function handleGuess(guess) {
    if (state !== 'showing') return;

    const correct = checkGuess(current, guess);
    stage.classList.add(correct ? 'flash-correct' : 'flash-incorrect');
    verdictText.textContent = correct ? 'Correct!' : 'Not quite!';
    explanationText.textContent = current.explanation;
    revealPanel.hidden = false;
    state = 'revealed';
  }

  function handleNext() {
    if (state !== 'revealed') return;
    current = deck.next();
    renderCurrent();
  }

  btnHuman.addEventListener('click', () => handleGuess('human'));
  btnAi.addEventListener('click', () => handleGuess('ai'));
  btnNext.addEventListener('click', handleNext);

  renderCurrent();
})();
