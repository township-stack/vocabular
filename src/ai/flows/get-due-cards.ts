'use server';

/**
 * @fileOverview A flow to retrieve vocabulary cards that are due for review.
 *
 * - getDueCards - A function that fetches due cards based on SRS data.
 * - GetDueCardsInput - The input type for the getDueCards function.
 * - GetDueCardsOutput - The return type for the getDueCards function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { Card, SrsData } from '@/lib/types';
import { MOCK_CARDS, MOCK_SRS_DATA_MAP } from '@/lib/mock-data';

export const GetDueCardsInputSchema = z.object({
  userId: z.string().describe('The ID of the user.'),
  categoryId: z.string().optional().describe('Optional category ID to filter due cards.'),
  limit: z.number().optional().default(50).describe('The maximum number of cards to return.'),
  timezone: z.string().default('Europe/Berlin').describe('The user\'s timezone to determine the current day.'),
});
export type GetDueCardsInput = z.infer<typeof GetDueCardsInputSchema>;

export const GetDueCardsOutputSchema = z.object({
  dueCards: z.array(z.object({
    card: z.custom<Card>(),
    srs: z.custom<SrsData>(),
  })),
});
export type GetDueCardsOutput = z.infer<typeof GetDueCardsOutputSchema>;


function getEndOfDay(timezone: string): Date {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '23',
    minute: '59',
    second: '59',
    timeZone: timezone,
    hour12: false,
  };
  const formatter = new Intl.DateTimeFormat('en-US', options);
  const parts = formatter.formatToParts(now);
  
  const year = parseInt(parts.find(p => p.type === 'year')!.value);
  const month = parseInt(parts.find(p => p.type === 'month')!.value) -1;
  const day = parseInt(parts.find(p => p.type === 'day')!.value);
  
  // This correctly creates a date for the end of the day in the specified timezone
  const dateInTimezone = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
  
  return dateInTimezone;
}


export async function getDueCards(input: GetDueCardsInput): Promise<GetDueCardsOutput> {
  return getDueCardsFlow(input);
}

const getDueCardsFlow = ai.defineFlow(
  {
    name: 'getDueCardsFlow',
    inputSchema: GetDueCardsInputSchema,
    outputSchema: GetDueCardsOutputSchema,
  },
  async ({ userId, categoryId, limit, timezone }) => {
    // In a real app, this would be a Firestore query.
    // We simulate it using mock data for now.
    
    console.log(`Getting due cards for user ${userId} with category ${categoryId} and limit ${limit}`);

    const todayEnd = getEndOfDay(timezone);

    const allSrsData = Object.values(MOCK_SRS_DATA_MAP);

    const dueSrsEntries = allSrsData
      .filter(srs => {
        if (!srs.dueAt) return false;
        // Important: Compare timestamps correctly
        const isDue = srs.dueAt.getTime() <= todayEnd.getTime();
        const categoryMatch = !categoryId || (srs.categoryId === categoryId);
        return isDue && categoryMatch;
      })
      .sort((a, b) => (a.dueAt?.getTime() || 0) - (b.dueAt?.getTime() || 0));

    const cardMap = new Map(MOCK_CARDS.map(card => [card.id, card]));

    const dueCards = dueSrsEntries
        .slice(0, limit)
        .map(srs => {
            const card = cardMap.get(srs.cardId!);
            if (card) {
                return { card, srs };
            }
            return null;
        })
        .filter((item): item is { card: Card; srs: SrsData } => item !== null);

    return { dueCards };
  }
);
