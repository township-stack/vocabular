export interface Category {
  id: string;
  name: string;
  cardCount: number;
}

export interface Card {
  id:string;
  front: string;
  back: string;
  categoryId: string;
}

export interface SrsData {
  cardId: string;
  dueAt: Date | null;
}
