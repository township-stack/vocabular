
export interface Card {
  id: string;
  front: string;
  back: string;
  reps: number;
  ease: number;
  interval: number;
  due: string | null;
  categoryId?: string; // Keep for potential future use with categories
  createdAt?: string; // Keep for potential future use
}

export interface Category {
  id: string;
  name:string;
}

// The following types are kept for future transition to a full Firebase backend.
// They are not actively used in the local-only version.

export interface Profile {
  displayName: string;
  locale: 'de-DE';
  defaultLangFront: 'pl';
  defaultLangBack: 'de';
  createdAt: Date;
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
  cardId?: string; // Denormalized from Card for querying
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
