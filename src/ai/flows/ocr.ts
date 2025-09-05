'use server';
/**
 * @fileOverview An AI flow to perform OCR on an image and extract vocabulary.
 *
 * - extractTextFromImage - A function that handles the OCR process.
 * - OcrInput - The input type for the extractTextFromImage function.
 * - OcrOutput - The return type for the extractTextFromImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const OcrInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of text, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type OcrInput = z.infer<typeof OcrInputSchema>;

const OcrOutputSchema = z.object({
  front: z.string().describe('The extracted foreign word or phrase.'),
  back: z.string().describe('The translation of the word or phrase.'),
});
export type OcrOutput = z.infer<typeof OcrOutputSchema>;

export async function extractTextFromImage(input: OcrInput): Promise<OcrOutput> {
  return ocrFlow(input);
}

const prompt = ai.definePrompt({
  name: 'ocrPrompt',
  input: {schema: OcrInputSchema},
  output: {schema: OcrOutputSchema},
  prompt: `You are an OCR assistant for a vocabulary learning app. The user provides a photo containing text. Your task is to identify the main word or short phrase (this will be the 'front' of a flashcard) and its most likely translation based on the context (this will be the 'back'). The app is used for Polish and German.

  Analyze the image and extract the primary text and its translation.

  Photo: {{media url=photoDataUri}}`,
});

const ocrFlow = ai.defineFlow(
  {
    name: 'ocrFlow',
    inputSchema: OcrInputSchema,
    outputSchema: OcrOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
