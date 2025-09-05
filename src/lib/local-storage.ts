import type { Card } from './types';
import { v4 as uuid } from 'uuid';


const toYMD = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;


export function loadCards(): Card[] {
  if (typeof window === "undefined") return [];
  try {
    const cards = JSON.parse(localStorage.getItem("cards") ?? "[]") as Card[];
     // Ensure dueDay is set for old cards for backwards compatibility
     return cards.map((c: Card) => ({
        ...c,
        dueDay: c.dueDay || c.due?.split('T')[0] || toYMD(),
    }));
  } catch {
    return [];
  }
}

export function saveCards(cards: Card[]) {
  localStorage.setItem("cards", JSON.stringify(cards));
}


export function savePairsLocal(pairs: { front: string; back: string }[], categoryId?: string) {
  const existing = loadCards();
  const now = new Date();
  
  const newCards: Card[] = pairs.map(p => ({
    id: uuid(),
    front: p.front,
    back: p.back,
    reps: 0,
    ease: 2.5,
    interval: 0,
    due: now.toISOString(), // Ready for review immediately
    dueDay: toYMD(now),
    createdAt: now.toISOString(),
    categoryId: categoryId || '3', // Default to 'Alltag'
  }));
  saveCards([...existing, ...newCards]);
}

    