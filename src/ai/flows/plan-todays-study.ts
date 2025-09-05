'use server';

/**
 * @fileOverview A flow that uses AI to plan a user's daily study session by analyzing their learning habits and SRS data to set a personalized target for the number of cards to review.
 *
 * - planTodaysStudy - A function that handles the planning of the study session.
 * - PlanTodaysStudyInput - The input type for the planTodaysStudy function.
 * - PlanTodaysStudyOutput - The return type for the planTodaysStudy function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PlanTodaysStudyInputSchema = z.object({
  userId: z.string().describe('The ID of the user for whom to plan the study session.'),
  categoryId: z.string().optional().describe('Optional category ID to filter cards.'),
  targetCount: z
    .number()
    .optional()
    .describe('The user-specified target count of cards for the study session.'),
});
export type PlanTodaysStudyInput = z.infer<typeof PlanTodaysStudyInputSchema>;

const PlanTodaysStudyOutputSchema = z.object({
  recommendedTargetCount: z
    .number()
    .describe('The AI-recommended target count of cards for the study session.'),
  reasoning: z
    .string()
    .describe(
      'The AI reasoning behind the recommended target count, based on the user’s learning habits and SRS data.'
    ),
});
export type PlanTodaysStudyOutput = z.infer<typeof PlanTodaysStudyOutputSchema>;

export async function planTodaysStudy(input: PlanTodaysStudyInput): Promise<PlanTodaysStudyOutput> {
  return planTodaysStudyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'planTodaysStudyPrompt',
  input: {schema: PlanTodaysStudyInputSchema},
  output: {schema: PlanTodaysStudyOutputSchema},
  prompt: `You are an AI study plan assistant. Analyze the user's learning history and SRS data to recommend an optimal daily target for card reviews.

  User ID: {{{userId}}}
  Category ID (optional): {{{categoryId}}}
  User-specified target count (optional): {{{targetCount}}}

  Consider the following factors:
  - User's past study sessions (frequency, duration, performance)
  - SRS data (number of cards due, ease factors, intervals)
  - User's specified target count (if provided, adjust accordingly)

  Reason your recommendation and provide a recommendedTargetCount.
  `,
});

const planTodaysStudyFlow = ai.defineFlow(
  {
    name: 'planTodaysStudyFlow',
    inputSchema: PlanTodaysStudyInputSchema,
    outputSchema: PlanTodaysStudyOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
