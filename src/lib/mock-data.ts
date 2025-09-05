import type { Category, Card, SrsData } from './types';

export const MOCK_CATEGORIES: Category[] = [
  { id: '1', name: 'Recht Polnisch', cardCount: 120 },
  { id: '2', name: 'Wirtschaft Polnisch', cardCount: 75 },
  { id: '3', name: 'Alltag', cardCount: 250 },
  { id: '4', name: 'IT-Begriffe', cardCount: 55 },
  { id: '5', name: 'Medizin', cardCount: 90 },
];

export const MOCK_CARDS: Card[] = [
  { id: 'c1', front: 'czynność prawna', back: 'Rechtsgeschäft', categoryId: '1' },
  { id: 'c2', front: 'umowa', back: 'Vertrag', categoryId: '1' },
  { id: 'c3', front: 'gospodarka', back: 'Wirtschaft', categoryId: '2' },
  { id: 'c4', front: 'rynek', back: 'Markt', categoryId: '2' },
  { id: 'c5', front: 'dziękuję', back: 'danke', categoryId: '3' },
  { id: 'c6', front: 'proszę', back: 'bitte', categoryId: '3' },
];

const now = new Date();
export const MOCK_SRS_DATA: SrsData[] = [
  // Due yesterday
  { cardId: 'c1', dueAt: new Date(now.getTime() - 86400000) },
  // Due today
  { cardId: 'c2', dueAt: new Date(now.getTime() - 3600000) },
  // Due in the past
  { cardId: 'c3', dueAt: new Date(now.getTime() - 2 * 86400000) },
  // Due tomorrow
  { cardId: 'c4', dueAt: new Date(now.getTime() + 86400000) },
  // Not due yet
  { cardId: 'c5', dueAt: new Date(now.getTime() + 5 * 86400000) },
  // New card, never reviewed
  { cardId: 'c6', dueAt: null },
];
