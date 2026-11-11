export interface Deck<T> {
  next(): T;
}

export function createDeck<T extends { id: string }>(
  items: T[],
  rng: () => number = Math.random
): Deck<T> {
  if (items.length === 0) {
    throw new Error('Cannot create a deck from an empty list of items');
  }

  let queue: T[] = [];
  let lastShownId: string | null = null;

  function shuffle(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function refill(): void {
    queue = shuffle(items);
    if (items.length > 1 && lastShownId !== null && queue[0].id === lastShownId) {
      // Swap the first item with the second element so there is no immediate repeat
      const swapIdx = queue.length > 1 ? 1 : 0;
      const temp = queue[0];
      queue[0] = queue[swapIdx];
      queue[swapIdx] = temp;
    }
  }

  return {
    next(): T {
      if (queue.length === 0) {
        refill();
      }
      const item = queue.shift()!;
      lastShownId = item.id;
      return item;
    },
  };
}
