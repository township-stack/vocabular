'use server';

/**
 * @fileOverview A flow to handle a user's review of a study card and update its SRS data.
 *
 * - submitReview - A function that processes a card review and calculates the next review date using an SM-2 like algorithm.
 * - SubmitReviewInput - The input type for the submitReview function.
 * - SubmitReviewOutput - The return type for the submitReview function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { SrsData } from '@/lib/types';
import { updateSm2Like } from '@/lib/srs';


export const SubmitReviewInputSchema = z.object({
  cardId: z.string().describe('The ID of the card being reviewed.'),
  userId: z.string().describe('The ID of the user performing the review.'),
  quality: z
    .number()
    .min(0)
    .max(5)
    .describe(
      'The quality of the recall (0: complete blackout, 5: perfect recall).'
    ),
  currentSrsData: z.custom<SrsData>().describe(
    'The current SRS data for the card before this review.'
  ),
});
export type SubmitReviewInput = z.infer<typeof SubmitReviewInputSchema>;

export const SubmitReviewOutputSchema = z.custom<SrsData>();
export type SubmitReviewOutput = z.infer<typeof SubmitReviewOutputSchema>;

function getBerlinMidnight(date: Date): Date {
    const berlinTime = new Date(date.toLocaleString('en-US', { timeZone: 'Europe/Berlin' }));
    berlinTime.setHours(0, 0, 0, 0);
    return berlinTime;
}


export async function submitReview(
  input: SubmitReviewInput
): Promise<SubmitReviewOutput> {
  return submitReviewFlow(input);
}

const submitReviewFlow = ai.defineFlow(
  {
    name: 'submitReviewFlow',
    inputSchema: SubmitReviewInputSchema,
    outputSchema: SubmitReviewOutputSchema,
  },
  async ({ quality, currentSrsData }) => {
    const now = new Date();
    const calc = updateSm2Like({
      reps: currentSrsData.reps || 0,
      ease: currentSrsData.ease || 2.5,
      interval: currentSrsData.intervalDays || 0,
    }, Math.max(0, Math.min(5, quality)) as 0|1|2|3|4|5);

    const newSrsData: SrsData = {
      ...currentSrsData,
      reps: calc.reps,
      ease: calc.ease,
      intervalDays: calc.interval,
      lapses: currentSrsData.lapses || 0, // optional: erhöhen bei quality < 3, falls benötigt
      dueAt: new Date(calc.dueISO),
      lastReviewAt: now,
    };

    return newSrsData;
  }
);
