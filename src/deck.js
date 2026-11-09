function shuffle(items, rng) {
  const result = items.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = result[i];
    result[i] = result[j];
    result[j] = tmp;
  }
  return result;
}

function createDeck(items, rng = Math.random) {
  let queue = [];
  let lastShown = null;

  function reshuffle() {
    queue = shuffle(items, rng);
    if (items.length > 1 && queue[0].id === lastShown) {
      const tmp = queue[0];
      queue[0] = queue[1];
      queue[1] = tmp;
    }
  }

  return {
    next() {
      if (queue.length === 0) reshuffle();
      const item = queue.shift();
      lastShown = item.id;
      return item;
    },
  };
}

if (typeof module !== 'undefined') module.exports = { createDeck };
