import type { Category, Card } from './types';

const now = new Date();
const toYMD = (d: Date) => d.toISOString().split('T')[0];

export const MOCK_CATEGORIES: Category[] = [
  { id: '1', name: 'Recht Polnisch' },
  { id: '2', name: 'Wirtschaft Polnisch' },
  { id: '3', name: 'Alltag' },
  { id: '4', name: 'IT-Begriffe' },
  { id: '5', name: 'Medizin' },
];

export const MOCK_CARDS: Card[] = [
  // Recht Polnisch
  { id: 'c1', front: 'czynność prawna', back: 'Rechtsgeschäft', categoryId: '1', reps: 0, ease: 2.5, interval: 0, due: now.toISOString(), dueDay: toYMD(now) },
  { id: 'c2', front: 'umowa', back: 'Vertrag', categoryId: '1', reps: 0, ease: 2.5, interval: 0, due: now.toISOString(), dueDay: toYMD(now) },
  { id: 'c3', front: 'kodeks cywilny', back: 'Zivilgesetzbuch', categoryId: '1', reps: 0, ease: 2.5, interval: 0, due: now.toISOString(), dueDay: toYMD(now) },
  { id: 'c4', front: 'pełnomocnictwo', back: 'Vollmacht', categoryId: '1', reps: 0, ease: 2.5, interval: 0, due: now.toISOString(), dueDay: toYMD(now) },
  { id: 'c5', front: 'własność', back: 'Eigentum', categoryId: '1', reps: 0, ease: 2.5, interval: 0, due: now.toISOString(), dueDay: toYMD(now) },
  { id: 'c6', front: 'wierzyciel', back: 'Gläubiger', categoryId: '1', reps: 0, ease: 2.5, interval: 0, due: now.toISOString(), dueDay: toYMD(now) },
  { id: 'c7', front: 'dłużnik', back: 'Schuldner', categoryId: '1', reps: 0, ease: 2.5, interval: 0, due: now.toISOString(), dueDay: toYMD(now) },
  { id: 'c8', front: 'pozew', back: 'Klage', categoryId: '1', reps: 0, ease: 2.5, interval: 0, due: now.toISOString(), dueDay: toYMD(now) },
  { id: 'c9', front: 'sąd', back: 'Gericht', categoryId: '1', reps: 0, ease: 2.5, interval: 0, due: now.toISOString(), dueDay: toYMD(now) },
  { id: 'c10', front: 'odszkodowanie', back: 'Schadensersatz', categoryId: '1', reps: 0, ease: 2.5, interval: 0, due: now.toISOString(), dueDay: toYMD(now) },
  
  // Alltag
  { id: 'c11', front: 'dziękuję', back: 'danke', categoryId: '3', reps: 0, ease: 2.5, interval: 0, due: now.toISOString(), dueDay: toYMD(now) },
  { id: 'c12', front: 'proszę', back: 'bitte', categoryId: '3', reps: 0, ease: 2.5, interval: 0, due: now.toISOString(), dueDay: toYMD(now) },
];

// The following types are kept for future transition to a full Firebase backend.
// They are not actively used in the local-only version.

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

export const MOCK_SRS_DATA_MAP: Record<string, SrsData> = {
  // Due yesterday
  c1: { cardId: 'c1', categoryId: '1', dueAt: new Date(now.getTime() - 86400000), reps: 3, ease: 2.5, intervalDays: 10, lapses: 0, lastReviewAt: new Date(now.getTime() - 10 * 86400000), algorithm: 'SM2' },
  // Due today
  c2: { cardId: 'c2', categoryId: '1', dueAt: new Date(now.getTime() - 3600000), reps: 2, ease: 2.4, intervalDays: 6, lapses: 1, lastReviewAt: new Date(now.getTime() - 6 * 86400000), algorithm: 'SM2' },
  // Due in the past
  c3: { cardId: 'c3', categoryId: '1', dueAt: new Date(now.getTime() - 2 * 86400000), reps: 5, ease: 2.7, intervalDays: 20, lapses: 0, lastReviewAt: new Date(now.getTime() - 20 * 86400000), algorithm: 'SM2' },
  // Due tomorrow
  c4: { cardId: 'c4', categoryId: '1', dueAt: new Date(now.getTime() + 86400000), reps: 1, ease: 2.5, intervalDays: 1, lapses: 0, lastReviewAt: new Date(now.getTime() - 86400000), algorithm: 'SM2' },
  // Not due yet
  c5: { cardId: 'c5', categoryId: '1', dueAt: new Date(now.getTime() + 5 * 86400000), reps: 4, ease: 2.6, intervalDays: 15, lapses: 0, lastReviewAt: new Date(now.getTime() - 10 * 86400000), algorithm: 'SM2' },
  // New card, never reviewed
  c6: { cardId: 'c6', categoryId: '1', dueAt: new Date(), reps: 0, ease: 2.5, intervalDays: 0, lapses: 0, lastReviewAt: null, algorithm: 'SM2' },
};

export const MOCK_SRS_DATA = Object.values(MOCK_SRS_DATA_MAP);
