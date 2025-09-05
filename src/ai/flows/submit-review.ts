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

// Simulating the SRS data structure that would be in Firestore
// `users/{userId}/srs/{cardId}`
const SrsDataSchema = z.object({
  reps: z.number().default(0),
  ease: z.number().default(2.5),
  intervalDays: z.number().default(0),
  lapses: z.number().default(0),
  dueAt: z.date().nullable().default(null),
  lastReviewAt: z.date().nullable().default(null),
  algorithm: z.enum(['SM2', 'Leitner']).default('SM2'),
  leitnerBox: z.number().optional(),
});
type SrsData = z.infer<typeof SrsDataSchema>;

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
  currentSrsData: SrsDataSchema.describe(
    'The current SRS data for the card before this review.'
  ),
});
export type SubmitReviewInput = z.infer<typeof SubmitReviewInputSchema>;

// The output will be the new state of the SRS data for the card.
export const SubmitReviewOutputSchema = SrsDataSchema;
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
    let { reps, ease, intervalDays, lapses } = currentSrsData;
    const now = new Date();

    if (quality < 3) {
      // Failed recall
      reps = 0; // Reset repetition count
      lapses += 1;
      intervalDays = 1; // Reschedule for tomorrow
    } else {
      // Successful recall
      reps += 1;
      
      // Calculate new interval
      if (reps === 1) {
        intervalDays = 1;
      } else if (reps === 2) {
        intervalDays = 6;
      } else {
        intervalDays = Math.ceil(intervalDays * ease);
      }

      // Update ease factor
      ease += 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
      
      // Clamp ease factor
      if (ease < 1.3) {
        ease = 1.3;
      } else if (ease > 3.0) {
        ease = 3.0;
      }
    }

    // Calculate the next due date, aligning to midnight in Berlin timezone
    const berlinNow = getBerlinMidnight(now);
    const dueAt = new Date(berlinNow.getTime());
    dueAt.setDate(dueAt.getDate() + intervalDays);
    
    const newSrsData: SrsData = {
        ...currentSrsData,
        reps,
        ease,
        intervalDays,
        lapses,
        dueAt,
        lastReviewAt: now,
    };

    // In a real scenario, we would now save this `newSrsData` to Firestore
    // for the specific `userId` and `cardId`.
    // For now, we just return the calculated new state.
    
    return newSrsData;
  }
);
