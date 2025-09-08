import type { Card } from './types';

export type ReviewQuality = 0 | 1 | 2 | 3 | 4 | 5;

export interface SrsState {
  reps: number;
  ease: number;          // ease factor (EF), typical range 1.3..3.0
  interval: number;      // in days
}

export interface ReviewResult extends SrsState {
  dueISO: string;        // next due datetime ISO
  dueDay: string;        // YYYY-MM-DD for stable day comparison
}

const MIN_EASE = 1.3;
const MAX_EASE = 3.0;

function toYMD(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function updateSm2Like(state: SrsState, quality: ReviewQuality): ReviewResult {
  let { reps, ease, interval } = state;

  if (quality < 3) {
    reps = 0;
    interval = 1;
  } else {
    reps = (reps || 0) + 1;
    if (reps === 1) interval = 1;
    else if (reps === 2) interval = 6;
    else interval = Math.round((interval || 1) * ease);

    ease = ease + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
    if (ease < MIN_EASE) ease = MIN_EASE;
    if (ease > MAX_EASE) ease = MAX_EASE;
  }

  const due = new Date(Date.now() + interval * 864e5);
  return {
    reps,
    ease,
    interval,
    dueISO: due.toISOString(),
    dueDay: toYMD(new Date(Date.now() + interval * 86400000)).toString(),
  };
}

export function applyReviewToCard(card: Card, quality: ReviewQuality): Card {
  const res = updateSm2Like({ reps: card.reps || 0, ease: card.ease || 2.5, interval: card.interval || 0 }, quality);
  return {
    ...card,
    reps: res.reps,
    ease: res.ease,
    interval: res.interval,
    due: res.dueISO,
    dueDay: res.dueDay,
  };
}


