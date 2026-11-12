export type ItemKind = 'text' | 'image';

export type Difficulty = 'easy' | 'medium' | 'hard' | 'pro';

export const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard', 'pro'];

export interface BaseItem {
  id: string;
  isAI: boolean;
  explanation: string;
  /** The AI-literacy concept this item demonstrates, shown on reveal (e.g. "Token-level repetition"). */
  concept: string;
  /** How obvious the tell is: easy items are blatant, pro items are genuinely close calls. */
  difficulty: Difficulty;
  category?: string;
}

export interface TextItem extends BaseItem {
  kind: 'text';
  text: string;
}

export interface ImageItem extends BaseItem {
  kind: 'image';
  src: string;
  caption: string;
  isPlaceholder: boolean;
}

export type Item = TextItem | ImageItem;
