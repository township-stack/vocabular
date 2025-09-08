import type { Card } from './types';
import { v4 as uuid } from 'uuid';
import { MOCK_CARDS } from './mock-data';


const toYMD = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

// --- Storage Versioning ---
const STORAGE_VERSION_KEY = 'cards_version';
const STORAGE_DATA_KEY = 'cards';
const CURRENT_VERSION = 1;

function getStoredVersion(): number {
  const raw = localStorage.getItem(STORAGE_VERSION_KEY);
  const v = raw ? parseInt(raw, 10) : 0;
  return Number.isFinite(v) ? v : 0;
}

function setStoredVersion(v: number) {
  localStorage.setItem(STORAGE_VERSION_KEY, String(v));
}

function migrateCards(cards: Card[], fromVersion: number): Card[] {
  let migrated = cards.slice();

  // v0 -> v1: ensure dueDay/backfills createdAt/defaults
  if (fromVersion < 1) {
    const now = new Date();
    migrated = migrated.map((c) => ({
      ...c,
      reps: c.reps ?? 0,
      ease: c.ease ?? 2.5,
      interval: c.interval ?? 0,
      due: c.due ?? now.toISOString(),
      dueDay: c.dueDay || c.due?.split('T')[0] || toYMD(now),
      createdAt: c.createdAt || now.toISOString(),
    }));
  }

  return migrated;
}


export function loadCards(): Card[] {
  if (typeof window === "undefined") return [];
  try {
    const storedCards = localStorage.getItem(STORAGE_DATA_KEY);
    if (!storedCards) {
      // If no cards are in local storage, load mock data
      saveCards(MOCK_CARDS);
      setStoredVersion(CURRENT_VERSION);
      return MOCK_CARDS;
    }
    const cards = JSON.parse(storedCards) as Card[];
    const version = getStoredVersion();
    if (version < CURRENT_VERSION) {
      const migrated = migrateCards(cards, version);
      saveCards(migrated);
      setStoredVersion(CURRENT_VERSION);
      return migrated;
    }
    return cards;
  } catch {
    return [];
  }
}

export function saveCards(cards: Card[]) {
  localStorage.setItem(STORAGE_DATA_KEY, JSON.stringify(cards));
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
  setStoredVersion(CURRENT_VERSION);
}

    
