import type { Category, Card, SrsData } from './types';

const now = new Date();

export const MOCK_CATEGORIES: Category[] = [
  { id: '1', name: 'Recht Polnisch', createdAt: now, updatedAt: now },
  { id: '2', name: 'Wirtschaft Polnisch', createdAt: now, updatedAt: now },
  { id: '3', name: 'Alltag', createdAt: now, updatedAt: now },
  { id: '4', name: 'IT-Begriffe', createdAt: now, updatedAt: now },
  { id: '5', name: 'Medizin', createdAt: now, updatedAt: now },
];

export const MOCK_CARDS: Card[] = [
  { id: 'c1', front: 'czynność prawna', back: 'Rechtsgeschäft', categoryId: '1', langFront: 'pl', langBack: 'de', createdAt: now, updatedAt: now, tags: [] },
  { id: 'c2', front: 'umowa', back: 'Vertrag', categoryId: '1', langFront: 'pl', langBack: 'de', createdAt: now, updatedAt: now, tags: [] },
  { id: 'c3', front: 'gospodarka', back: 'Wirtschaft', categoryId: '2', langFront: 'pl', langBack: 'de', createdAt: now, updatedAt: now, tags: [] },
  { id: 'c4', front: 'rynek', back: 'Markt', categoryId: '2', langFront: 'pl', langBack: 'de', createdAt: now, updatedAt: now, tags: [] },
  { id: 'c5', front: 'dziękuję', back: 'danke', categoryId: '3', langFront: 'pl', langBack: 'de', createdAt: now, updatedAt: now, tags: [] },
  { id: 'c6', front: 'proszę', back: 'bitte', categoryId: '3', langFront: 'pl', langBack: 'de', createdAt: now, updatedAt: now, tags: [] },
];


export const MOCK_SRS_DATA_MAP: Record<string, SrsData> = {
  // Due yesterday
  c1: { cardId: 'c1', categoryId: '1', dueAt: new Date(now.getTime() - 86400000), reps: 3, ease: 2.5, intervalDays: 10, lapses: 0, lastReviewAt: new Date(now.getTime() - 10 * 86400000), algorithm: 'SM2' },
  // Due today
  c2: { cardId: 'c2', categoryId: '1', dueAt: new Date(now.getTime() - 3600000), reps: 2, ease: 2.4, intervalDays: 6, lapses: 1, lastReviewAt: new Date(now.getTime() - 6 * 86400000), algorithm: 'SM2' },
  // Due in the past
  c3: { cardId: 'c3', categoryId: '2', dueAt: new Date(now.getTime() - 2 * 86400000), reps: 5, ease: 2.7, intervalDays: 20, lapses: 0, lastReviewAt: new Date(now.getTime() - 20 * 86400000), algorithm: 'SM2' },
  // Due tomorrow
  c4: { cardId: 'c4', categoryId: '2', dueAt: new Date(now.getTime() + 86400000), reps: 1, ease: 2.5, intervalDays: 1, lapses: 0, lastReviewAt: new Date(now.getTime() - 86400000), algorithm: 'SM2' },
  // Not due yet
  c5: { cardId: 'c5', categoryId: '3', dueAt: new Date(now.getTime() + 5 * 86400000), reps: 4, ease: 2.6, intervalDays: 15, lapses: 0, lastReviewAt: new Date(now.getTime() - 10 * 86400000), algorithm: 'SM2' },
  // New card, never reviewed
  c6: { cardId: 'c6', categoryId: '3', dueAt: null, reps: 0, ease: 2.5, intervalDays: 0, lapses: 0, lastReviewAt: null, algorithm: 'SM2' },
};

export const MOCK_SRS_DATA = Object.values(MOCK_SRS_DATA_MAP);
