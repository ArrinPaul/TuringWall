export type ItemKind = 'text' | 'image';

export interface BaseItem {
  id: string;
  isAI: boolean;
  explanation: string;
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
