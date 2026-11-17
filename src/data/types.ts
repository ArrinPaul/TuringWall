export type ItemKind = 'text' | 'image';

export type Difficulty = 'easy' | 'medium' | 'hard' | 'pro';

export const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard', 'pro'];

/** A played session is one of the four fixed tiers, or 'mixed' (drawn from all of them). */
export type SessionMode = Difficulty | 'mixed';

/** The tier immediately above `d`, or null if `d` is already the top tier. */
export function nextTierUp(d: Difficulty): Difficulty | null {
  const i = DIFFICULTIES.indexOf(d);
  return i >= 0 && i < DIFFICULTIES.length - 1 ? DIFFICULTIES[i + 1] : null;
}

export interface BaseItem {
  id: string;
  isAI: boolean;
  explanation: string;
  /** The AI-literacy concept this item demonstrates, shown on reveal (e.g. "Token-level repetition"). */
  concept: string;
  /** How obvious the tell is: easy items are blatant, pro items are genuinely close calls. */
  difficulty: Difficulty;
  category?: string;
  /** Exact phrases, words, or visual markers that provide evidence for the tell */
  evidenceHighlights?: string[];
  /** Why someone might be tempted by the opposite guess */
  temptingReason?: string;
  /** Example or note illustrating when this tell can be misleading */
  counterexample?: string;
  /** Takeaway advice for this specific case */
  rememberThis?: string;
}

export interface TextItem extends BaseItem {
  kind: 'text';
  text: string;
}

export interface ImageItem extends BaseItem {
  kind: 'image';
  src: string;
  caption: string;
  /** Attribution text, shown on reveal, only when the source license requires it (e.g. CC BY-SA). */
  credit?: string;
}

export type Item = TextItem | ImageItem;
