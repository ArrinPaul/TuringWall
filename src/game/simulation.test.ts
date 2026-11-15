import { describe, it, expect, beforeEach } from 'vitest';
import { createDeck } from './deck';
import {
  createStats,
  applyGuess,
  accuracyPercent,
  hitMilestone,
  getRank,
  getStreakLabel,
  DIFFICULTY_POINTS,
  STREAK_MILESTONES,
} from './scoring';
import {
  addEntry,
  loadLeaderboard,
  loadAllLeaderboards,
  withEntry,
  formatAsText,
  roomStanding,
  SESSION_LENGTHS,
  type LeaderboardEntry,
  type SessionLength,
} from '../leaderboard/leaderboard';
import { createGameStore, type GameState, ROUNDS_OPTIONS } from '../store/gameStore';
import { ITEMS } from '../data/items';
import type { Item, SessionMode, Difficulty } from '../data/types';

describe('Game Simulation and Stress Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // =========================================================================
  // 1. DECK SHUFFLING AND DEALING LOGIC
  // =========================================================================
  describe('1. Deck Shuffling and Dealing Logic', () => {
    const modes: SessionMode[] = ['easy', 'medium', 'hard', 'pro', 'mixed'];
    const lengths: SessionLength[] = [3, 5, 7, 10];

    it('ensures no duplicate cards within any single session across all modes and lengths', () => {
      for (const mode of modes) {
        const pool = mode === 'mixed' ? ITEMS : ITEMS.filter((i) => i.difficulty === mode);
        for (const len of lengths) {
          const deck = createDeck(pool);
          const dealtIds = new Set<string>();
          for (let r = 0; r < len; r++) {
            const card = deck.next();
            expect(card).toBeDefined();
            expect(card.id).toBeDefined();
            expect(dealtIds.has(card.id), `Duplicate card ${card.id} in mode ${mode}, length ${len}`).toBe(false);
            dealtIds.add(card.id);
          }
          expect(dealtIds.size).toBe(len);
        }
      }
    });

    it('cycles through 10,000 draws without out-of-bounds error or crashes in any tier', () => {
      for (const tier of modes) {
        const pool = tier === 'mixed' ? ITEMS : ITEMS.filter((i) => i.difficulty === tier);
        const deck = createDeck(pool);
        let lastId: string | null = null;
        let immediateRepeats = 0;

        for (let i = 0; i < 2000; i++) {
          const item = deck.next();
          expect(item).toBeDefined();
          expect(item.id.length).toBeGreaterThan(0);
          if (lastId !== null && item.id === lastId) {
            immediateRepeats++;
          }
          lastId = item.id;
        }

        // The deck's refill anti-consecutive swap prevents immediate repeats
        expect(immediateRepeats).toBe(0);
      }
    });

    it('throws error when creating a deck from an empty pool', () => {
      expect(() => createDeck([])).toThrow('Cannot create a deck from an empty list of items');
    });

    it('handles small decks (1 item and 2 items) gracefully without crashing', () => {
      const singleItem: Item[] = [ITEMS[0]];
      const singleDeck = createDeck(singleItem);
      for (let i = 0; i < 10; i++) {
        expect(singleDeck.next().id).toBe(ITEMS[0].id);
      }

      const pairItems: Item[] = [ITEMS[0], ITEMS[1]];
      const pairDeck = createDeck(pairItems);
      for (let i = 0; i < 20; i++) {
        const card = pairDeck.next();
        expect([ITEMS[0].id, ITEMS[1].id]).toContain(card.id);
      }
    });
  });

  // =========================================================================
  // 2. SCORING SYSTEM
  // =========================================================================
  describe('2. Scoring System', () => {
    it('verifies base points for all difficulty tiers', () => {
      expect(DIFFICULTY_POINTS.easy).toBe(1);
      expect(DIFFICULTY_POINTS.medium).toBe(2);
      expect(DIFFICULTY_POINTS.hard).toBe(3);
      expect(DIFFICULTY_POINTS.pro).toBe(5);
    });

    it('awards correct base points and updates streaks and counts', () => {
      let stats = createStats();
      expect(stats).toEqual({ score: 0, streak: 0, bestStreak: 0, roundsPlayed: 0, correctCount: 0 });

      // Easy correct
      stats = applyGuess(stats, true, DIFFICULTY_POINTS.easy);
      expect(stats).toEqual({ score: 1, streak: 1, bestStreak: 1, roundsPlayed: 1, correctCount: 1 });

      // Medium correct
      stats = applyGuess(stats, true, DIFFICULTY_POINTS.medium);
      expect(stats).toEqual({ score: 3, streak: 2, bestStreak: 2, roundsPlayed: 2, correctCount: 2 });

      // Hard correct
      stats = applyGuess(stats, true, DIFFICULTY_POINTS.hard);
      expect(stats).toEqual({ score: 6, streak: 3, bestStreak: 3, roundsPlayed: 3, correctCount: 3 });

      // Pro correct
      stats = applyGuess(stats, true, DIFFICULTY_POINTS.pro);
      expect(stats).toEqual({ score: 11, streak: 4, bestStreak: 4, roundsPlayed: 4, correctCount: 4 });

      // Wrong guess
      stats = applyGuess(stats, false, DIFFICULTY_POINTS.pro);
      expect(stats).toEqual({ score: 11, streak: 0, bestStreak: 4, roundsPlayed: 5, correctCount: 4 });

      // Next correct
      stats = applyGuess(stats, true, DIFFICULTY_POINTS.easy);
      expect(stats).toEqual({ score: 12, streak: 1, bestStreak: 4, roundsPlayed: 6, correctCount: 5 });
    });

    it('verifies streak milestone detection and streak labels', () => {
      expect(STREAK_MILESTONES).toEqual([3, 5, 8, 12]);

      // Milestones trigger when newly reached
      expect(hitMilestone(2, 3)).toBe(true);
      expect(hitMilestone(3, 4)).toBe(false);
      expect(hitMilestone(4, 5)).toBe(true);
      expect(hitMilestone(5, 6)).toBe(false);
      expect(hitMilestone(7, 8)).toBe(true);
      expect(hitMilestone(8, 9)).toBe(false);
      expect(hitMilestone(11, 12)).toBe(true);

      // Milestones do not trigger on reset or decrease
      expect(hitMilestone(3, 0)).toBe(false);
      expect(hitMilestone(5, 0)).toBe(false);
      expect(hitMilestone(3, 3)).toBe(false);

      // Streak labels
      expect(getStreakLabel(0)).toBeNull();
      expect(getStreakLabel(1)).toBeNull();
      expect(getStreakLabel(2)).toBeNull();
      expect(getStreakLabel(3)).toBe('Pattern spotted');
      expect(getStreakLabel(4)).toBe('Pattern spotted');
      expect(getStreakLabel(5)).toBe('Reading the signal');
      expect(getStreakLabel(7)).toBe('Reading the signal');
      expect(getStreakLabel(8)).toBe('Consistent detector');
      expect(getStreakLabel(11)).toBe('Consistent detector');
      expect(getStreakLabel(12)).toBe('Near-perfect run');
      expect(getStreakLabel(15)).toBe('Near-perfect run');
    });

    it('verifies accuracy calculation and rank mapping across boundary percentages', () => {
      expect(accuracyPercent(createStats())).toBe(0);

      const s1 = { score: 1, streak: 1, bestStreak: 1, roundsPlayed: 3, correctCount: 1 };
      expect(accuracyPercent(s1)).toBe(33); // 1/3 = 33.33% -> 33
      expect(getRank(33).title).toBe('Feature Spotter');

      const s2 = { score: 2, streak: 2, bestStreak: 2, roundsPlayed: 3, correctCount: 2 };
      expect(accuracyPercent(s2)).toBe(67); // 2/3 = 66.67% -> 67
      expect(getRank(67).title).toBe('Pattern Analyst');

      const s3 = { score: 3, streak: 3, bestStreak: 3, roundsPlayed: 4, correctCount: 3 };
      expect(accuracyPercent(s3)).toBe(75);
      expect(getRank(75).title).toBe('Signal Reader');

      const s4 = { score: 9, streak: 9, bestStreak: 9, roundsPlayed: 10, correctCount: 9 };
      expect(accuracyPercent(s4)).toBe(90);
      expect(getRank(90).title).toBe('Model Whisperer');

      const s5 = { score: 10, streak: 10, bestStreak: 10, roundsPlayed: 10, correctCount: 10 };
      expect(accuracyPercent(s5)).toBe(100);
      expect(getRank(100).title).toBe('Model Whisperer');

      const sZero = { score: 0, streak: 0, bestStreak: 0, roundsPlayed: 10, correctCount: 0 };
      expect(accuracyPercent(sZero)).toBe(0);
      expect(getRank(0).title).toBe('Feature Spotter');
    });
  });

  // =========================================================================
  // 3. LEADERBOARD SYSTEM
  // =========================================================================
  describe('3. Leaderboard System', () => {
    it('stores entries strictly partitioned by session length (3, 5, 7, 10)', () => {
      for (const len of SESSION_LENGTHS) {
        addEntry({
          name: `Player-${len}q`,
          difficulty: 'pro',
          score: len * 5,
          accuracy: 100,
          bestStreak: len,
          timestamp: Date.now(),
          roundsTarget: len,
        });
      }

      for (const len of SESSION_LENGTHS) {
        const board = loadLeaderboard(len);
        expect(board.length).toBe(1);
        expect(board[0].name).toBe(`Player-${len}q`);
        expect(board[0].roundsTarget).toBe(len);
      }
    });

    it('sorts entries descending by score and caps at 50 entries', () => {
      for (let i = 1; i <= 60; i++) {
        addEntry({
          name: `Bot-${i}`,
          difficulty: 'easy',
          score: i,
          accuracy: 50,
          bestStreak: 2,
          timestamp: Date.now() + i,
          roundsTarget: 10,
        });
      }

      const board = loadLeaderboard(10);
      expect(board.length).toBe(50);
      expect(board[0].score).toBe(60);
      expect(board[0].name).toBe('Bot-60');
      expect(board[49].score).toBe(11);
      expect(board[49].name).toBe('Bot-11');
    });

    it('verifies tie-breaking behavior when scores are identical', () => {
      // In Javascript stable sort with (b.score - a.score), identical scores preserve insertion order
      const initial = withEntry([], {
        name: 'EarlyBot',
        difficulty: 'medium',
        score: 10,
        accuracy: 100,
        bestStreak: 5,
        timestamp: 1000,
        roundsTarget: 5,
      });

      const updated = withEntry(initial, {
        name: 'LateBot',
        difficulty: 'hard',
        score: 10,
        accuracy: 50,
        bestStreak: 2,
        timestamp: 2000,
        roundsTarget: 5,
      });

      expect(updated.length).toBe(2);
      expect(updated[0].name).toBe('EarlyBot');
      expect(updated[1].name).toBe('LateBot');
    });

    it('verifies roomStanding calculation for same-mode players today', () => {
      const now = Date.now();
      const entries: LeaderboardEntry[] = [
        { name: 'A', difficulty: 'easy', score: 3, accuracy: 30, bestStreak: 1, timestamp: now, roundsTarget: 10 },
        { name: 'B', difficulty: 'easy', score: 7, accuracy: 70, bestStreak: 3, timestamp: now, roundsTarget: 10 },
        { name: 'C', difficulty: 'easy', score: 9, accuracy: 90, bestStreak: 5, timestamp: now, roundsTarget: 10 },
        { name: 'D', difficulty: 'hard', score: 15, accuracy: 50, bestStreak: 2, timestamp: now, roundsTarget: 10 },
      ];

      const standingEasyScore8 = roomStanding(entries, 'easy', 8);
      // Beats A (3) and B (7), but not C (9). Total easy is 3.
      expect(standingEasyScore8).toEqual({ beaten: 2, total: 3 });

      const standingHardScore15 = roomStanding(entries, 'hard', 15);
      // Beats 0 (score 15 is equal to D, not strictly greater). Total hard is 1.
      expect(standingHardScore15).toEqual({ beaten: 0, total: 1 });
    });

    it('formats TSV plain text correctly with tab delimiters', () => {
      const entry: LeaderboardEntry = {
        name: 'AceHunter',
        difficulty: 'pro',
        score: 35,
        accuracy: 70,
        bestStreak: 5,
        timestamp: new Date(2026, 10, 15, 12, 0, 0).getTime(),
        roundsTarget: 7,
      };

      const tsv = formatAsText([entry]);
      const lines = tsv.split('\n');
      expect(lines[0]).toBe('Name\tDifficulty\tRounds\tScore\tAccuracy\tBest Streak\tDate');
      const cols = lines[1].split('\t');
      expect(cols[0]).toBe('AceHunter');
      expect(cols[1]).toBe('pro');
      expect(cols[2]).toBe('7');
      expect(cols[3]).toBe('35');
      expect(cols[4]).toBe('70%');
      expect(cols[5]).toBe('5');
    });
  });

  // =========================================================================
  // 4. MULTI-BOT SIMULATION ENGINE ACROSS ALL MODES AND LENGTHS
  // =========================================================================
  describe('4. Automated Player Bots Multi-Session Simulation', () => {
    const modes: SessionMode[] = ['easy', 'medium', 'hard', 'pro', 'mixed'];
    const lengths: SessionLength[] = [3, 5, 7, 10];

    interface BotProfile {
      name: string;
      strategy: (item: Item, roundIndex: number) => 'human' | 'ai';
    }

    const bots: BotProfile[] = [
      {
        name: 'Sherlock (100% Perfect)',
        strategy: (item) => (item.isAI ? 'ai' : 'human'),
      },
      {
        name: 'BlindGuesser (0% Inverted)',
        strategy: (item) => (item.isAI ? 'human' : 'ai'),
      },
      {
        name: 'CoinFlipper (Deterministic 50%)',
        strategy: (_, roundIndex) => (roundIndex % 2 === 0 ? 'ai' : 'human'),
      },
      {
        name: 'Streaker (3 Correct, 1 Wrong)',
        strategy: (item, roundIndex) => {
          const shouldWin = roundIndex % 4 !== 3;
          return shouldWin ? (item.isAI ? 'ai' : 'human') : (item.isAI ? 'human' : 'ai');
        },
      },
    ];

    it('simulates all bots playing across all modes and session lengths', () => {
      let totalSessionsSimulated = 0;
      let totalRoundsSimulated = 0;

      for (const bot of bots) {
        for (const mode of modes) {
          for (const len of lengths) {
            localStorage.clear();
            const store = createGameStore(ITEMS);

            // Set up player
            store.getState().setPlayerName(bot.name);
            store.getState().setRoundsTarget(len);
            expect(store.getState().roundsTarget).toBe(len);

            // Go to select then start
            store.getState().goToSelect();
            expect(store.getState().screen).toBe('select');

            store.getState().startRound(mode);
            expect(store.getState().screen).toBe('playing');
            expect(store.getState().difficulty).toBe(mode);
            expect(store.getState().current).toBeDefined();

            const itemsEncountered: string[] = [];

            // Play every round
            for (let round = 0; round < len; round++) {
              const currentItem = store.getState().current!;
              expect(currentItem).toBeDefined();
              expect(itemsEncountered.includes(currentItem.id)).toBe(false);
              itemsEncountered.push(currentItem.id);

              const guessChoice = bot.strategy(currentItem, round);
              const expectedCorrect = (guessChoice === 'ai') === currentItem.isAI;

              store.getState().guess(guessChoice);
              expect(store.getState().screen).toBe('revealed');
              expect(store.getState().lastGuessCorrect).toBe(expectedCorrect);
              expect(store.getState().stats.roundsPlayed).toBe(round + 1);

              // Advance to next round or stats screen
              store.getState().next();
              if (round < len - 1) {
                expect(store.getState().screen).toBe('playing');
              } else {
                expect(store.getState().screen).toBe('stats');
              }
              totalRoundsSimulated++;
            }

            // Verify final stats
            const s = store.getState();
            expect(s.screen).toBe('stats');
            expect(s.stats.roundsPlayed).toBe(len);
            expect(s.sessionSaved).toBe(true);

            // Verify accuracy
            const expectedAccuracy = Math.round((s.stats.correctCount / len) * 100);
            expect(accuracyPercent(s.stats)).toBe(expectedAccuracy);

            // Verify leaderboard persistence
            const board = loadLeaderboard(len);
            expect(board.length).toBe(1);
            expect(board[0].name).toBe(bot.name);
            expect(board[0].difficulty).toBe(mode);
            expect(board[0].score).toBe(s.stats.score);
            expect(board[0].accuracy).toBe(expectedAccuracy);
            expect(board[0].bestStreak).toBe(s.stats.bestStreak);

            // Verify bot-specific expectations
            if (bot.name.includes('100% Perfect')) {
              expect(s.stats.correctCount).toBe(len);
              expect(s.stats.streak).toBe(len);
              expect(s.stats.bestStreak).toBe(len);
              expect(accuracyPercent(s.stats)).toBe(100);
              expect(getRank(100).title).toBe('Model Whisperer');
            } else if (bot.name.includes('0% Inverted')) {
              expect(s.stats.correctCount).toBe(0);
              expect(s.stats.score).toBe(0);
              expect(s.stats.streak).toBe(0);
              expect(s.stats.bestStreak).toBe(0);
              expect(accuracyPercent(s.stats)).toBe(0);
              expect(getRank(0).title).toBe('Feature Spotter');
            }

            // Return to attract for clean loop
            store.getState().returnToAttract();
            expect(store.getState().screen).toBe('attract');
            expect(store.getState().current).toBeNull();
            expect(store.getState().difficulty).toBeNull();

            totalSessionsSimulated++;
          }
        }
      }

      expect(totalSessionsSimulated).toBe(bots.length * modes.length * lengths.length); // 4 * 5 * 4 = 80 sessions
      expect(totalRoundsSimulated).toBe(bots.length * modes.length * (3 + 5 + 7 + 10)); // 4 * 5 * 25 = 500 rounds
    });

    it('simulates jumping straight to Stats via showStats() on the final round', () => {
      const store = createGameStore(ITEMS);
      store.getState().setPlayerName('JumpBot');
      store.getState().setRoundsTarget(3);
      store.getState().startRound('easy');

      // Round 1
      store.getState().guess(store.getState().current!.isAI ? 'ai' : 'human');
      store.getState().next();

      // Round 2
      store.getState().guess(store.getState().current!.isAI ? 'ai' : 'human');
      store.getState().next();

      // Round 3 (final round)
      store.getState().guess(store.getState().current!.isAI ? 'ai' : 'human');
      expect(store.getState().screen).toBe('revealed');

      // Instead of next(), click showStats()
      store.getState().showStats();
      expect(store.getState().screen).toBe('stats');
      expect(store.getState().sessionSaved).toBe(true);

      const board = loadLeaderboard(3);
      expect(board.length).toBe(1);
      expect(board[0].name).toBe('JumpBot');
      expect(board[0].score).toBe(3);
    });
  });

  // =========================================================================
  // 5. STRESS TEST AND EDGE CASES
  // =========================================================================
  describe('5. Edge Cases and Stress Tests', () => {
    it('handles sudden exit mid-session without corrupting state or saving incomplete session', () => {
      const store = createGameStore(ITEMS);
      store.getState().setPlayerName('RageQuitter');
      store.getState().setRoundsTarget(10);
      store.getState().startRound('hard');

      // Play 4 rounds and quit
      for (let r = 0; r < 4; r++) {
        store.getState().guess('ai');
        store.getState().next();
      }
      expect(store.getState().stats.roundsPlayed).toBe(4);

      // Sudden exit to attract screen
      store.getState().returnToAttract();
      expect(store.getState().screen).toBe('attract');
      expect(store.getState().stats.roundsPlayed).toBe(0);
      expect(store.getState().stats.score).toBe(0);
      expect(store.getState().current).toBeNull();

      // Incomplete session must NEVER be written to the leaderboard
      const board = loadLeaderboard(10);
      expect(board.length).toBe(0);
    });

    it('ignores rapid inputs and prevents race conditions or double guesses', () => {
      const store = createGameStore(ITEMS);
      store.getState().startRound('easy');
      expect(store.getState().screen).toBe('playing');

      const initialSeq = store.getState().guessSeq;

      // Spam 5 guesses rapidly
      store.getState().guess('ai');
      store.getState().guess('human');
      store.getState().guess('ai');
      store.getState().guess('human');
      store.getState().guess('ai');

      // Only the first guess should take effect!
      expect(store.getState().screen).toBe('revealed');
      expect(store.getState().stats.roundsPlayed).toBe(1);
      expect(store.getState().guessSeq).toBe(initialSeq + 1);

      // Spam next() 5 times rapidly
      store.getState().next();
      store.getState().next();
      store.getState().next();
      store.getState().next();

      // Only the first next() should transition to round 2
      expect(store.getState().screen).toBe('playing');
      expect(store.getState().stats.roundsPlayed).toBe(1);
    });

    it('ignores guess() and next() in invalid screens', () => {
      const store = createGameStore(ITEMS);

      // In attract screen
      expect(store.getState().screen).toBe('attract');
      store.getState().guess('ai');
      expect(store.getState().screen).toBe('attract');
      store.getState().next();
      expect(store.getState().screen).toBe('attract');

      // In select screen
      store.getState().goToSelect();
      expect(store.getState().screen).toBe('select');
      store.getState().guess('ai');
      expect(store.getState().screen).toBe('select');
      store.getState().next();
      expect(store.getState().screen).toBe('select');
    });

    it('handles empty, whitespace-only, and excessively long player names', () => {
      // Empty string
      const storeEmpty = createGameStore(ITEMS);
      storeEmpty.getState().setPlayerName('');
      storeEmpty.getState().setRoundsTarget(3);
      storeEmpty.getState().startRound('easy');
      for (let i = 0; i < 3; i++) {
        storeEmpty.getState().guess('ai');
        storeEmpty.getState().next();
      }
      const board1 = loadLeaderboard(3);
      expect(board1[0].name).toBe('Anonymous');

      // Whitespace only
      localStorage.clear();
      const storeWhitespace = createGameStore(ITEMS);
      storeWhitespace.getState().setPlayerName('     \t \n  ');
      storeWhitespace.getState().setRoundsTarget(3);
      storeWhitespace.getState().startRound('easy');
      for (let i = 0; i < 3; i++) {
        storeWhitespace.getState().guess('ai');
        storeWhitespace.getState().next();
      }
      const board2 = loadLeaderboard(3);
      expect(board2[0].name).toBe('Anonymous');

      // 5,000 characters long name
      localStorage.clear();
      const longName = 'A'.repeat(5000);
      const storeLong = createGameStore(ITEMS);
      storeLong.getState().setPlayerName(longName);
      storeLong.getState().setRoundsTarget(3);
      storeLong.getState().startRound('easy');
      for (let i = 0; i < 3; i++) {
        storeLong.getState().guess('ai');
        storeLong.getState().next();
      }
      const board3 = loadLeaderboard(3);
      expect(board3[0].name).toBe(longName);
      expect(board3[0].name.length).toBe(5000);
    });

    it('handles special characters, unicode, emojis, and HTML tags in player name', () => {
      const specialNames = [
        '🎮👾 Master AI Hunter 🚀✨',
        '<script>alert("xss")</script>',
        '"quoted" & <escaped>',
        'Name With Tab \t Inside',
        'Multi\nLine\nName',
        'Null\0Byte',
      ];

      for (let i = 0; i < specialNames.length; i++) {
        const name = specialNames[i];
        addEntry({
          name,
          difficulty: 'pro',
          score: 10 + i,
          accuracy: 80,
          bestStreak: 4,
          timestamp: Date.now(),
          roundsTarget: 5,
        });
      }

      const board = loadLeaderboard(5);
      expect(board.length).toBe(specialNames.length);

      // Verify serialization roundtrip
      for (const name of specialNames) {
        expect(board.some((e) => e.name === name)).toBe(true);
      }

      // Verify TSV export with special characters
      const tsv = formatAsText(board);
      expect(tsv).toBeDefined();
      expect(typeof tsv).toBe('string');
      expect(tsv.length).toBeGreaterThan(0);
    });

    it('accurately detects newPersonalBest status', () => {
      // First run on empty board
      const store1 = createGameStore(ITEMS);
      store1.getState().setPlayerName('Player1');
      store1.getState().setRoundsTarget(3);
      store1.getState().startRound('easy');
      for (let i = 0; i < 3; i++) {
        store1.getState().guess(store1.getState().current!.isAI ? 'ai' : 'human');
        store1.getState().next();
      }
      // Note: With empty prior leaderboard, priorBest is null, so isNewBest is false.
      // (as designed in gameStore.ts line 67: priorBest !== null && state.stats.score > priorBest)
      expect(store1.getState().stats.score).toBe(3);
      expect(store1.getState().newPersonalBest).toBe(false);

      // Second player ties score of 3
      const store2 = createGameStore(ITEMS);
      store2.getState().setPlayerName('Player2');
      store2.getState().setRoundsTarget(3);
      store2.getState().startRound('easy');
      for (let i = 0; i < 3; i++) {
        store2.getState().guess(store2.getState().current!.isAI ? 'ai' : 'human');
        store2.getState().next();
      }
      // Prior best was 3, score is 3 -> NOT strictly greater
      expect(store2.getState().stats.score).toBe(3);
      expect(store2.getState().newPersonalBest).toBe(false);

      // Third player scores higher on medium mode:
      const storeMed1 = createGameStore(ITEMS);
      storeMed1.getState().setPlayerName('Med1');
      storeMed1.getState().setRoundsTarget(3);
      storeMed1.getState().startRound('medium');
      // 1 correct, 2 wrong -> score = 2
      storeMed1.getState().guess(storeMed1.getState().current!.isAI ? 'ai' : 'human'); // +2
      storeMed1.getState().next();
      storeMed1.getState().guess(storeMed1.getState().current!.isAI ? 'human' : 'ai'); // +0
      storeMed1.getState().next();
      storeMed1.getState().guess(storeMed1.getState().current!.isAI ? 'human' : 'ai'); // +0
      storeMed1.getState().next();
      expect(storeMed1.getState().stats.score).toBe(2);

      // Med2 scores 6 (beating 2)
      const storeMed2 = createGameStore(ITEMS);
      storeMed2.getState().setPlayerName('Med2');
      storeMed2.getState().setRoundsTarget(3);
      storeMed2.getState().startRound('medium');
      for (let i = 0; i < 3; i++) {
        storeMed2.getState().guess(storeMed2.getState().current!.isAI ? 'ai' : 'human'); // +2 each = 6
        storeMed2.getState().next();
      }
      expect(storeMed2.getState().stats.score).toBe(6);
      expect(storeMed2.getState().newPersonalBest).toBe(true);
    });
  });
});
