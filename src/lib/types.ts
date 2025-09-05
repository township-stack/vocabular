export interface Category {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Card {
  id: string;
  front: string;
  back: string;
  langFront: 'pl' | 'de';
  langBack: 'pl' | 'de';
  categoryId: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
}

export interface SrsData {
  reps: number;
  ease: number;
  intervalDays: number;
  lapses: number;
  dueAt: Date | null;
  lastReviewAt: Date | null;
  algorithm: 'SM2' | 'Leitner';
  leitnerBox?: 1 | 2 | 3 | 4 | 5;
  // Denormalized from Card for querying
  cardId?: string;
  categoryId?: string;
}

export interface StudySession {
  id: string;
  startedAt: Date;
  finishedAt?: Date;
  countTotal: number;
  countCorrect: number;
  countWrong: number;
  categoryFilter?: string;
  notes?: string;
}
