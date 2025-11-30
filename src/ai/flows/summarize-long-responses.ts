'use server';

/**
 * @fileOverview Summarizes long AI responses into concise points.
 *
 * - summarizeLongResponse - A function that summarizes a long text response.
 * - SummarizeLongResponseInput - The input type for the summarizeLongResponse function.
 * - SummarizeLongResponseOutput - The return type for the summarizeLongResponse function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeLongResponseInputSchema = z.string().describe('The long text response to summarize.');
export type SummarizeLongResponseInput = z.infer<typeof SummarizeLongResponseInputSchema>;

const SummarizeLongResponseOutputSchema = z.string().describe('The summarized text response.');
export type SummarizeLongResponseOutput = z.infer<typeof SummarizeLongResponseOutputSchema>;

export async function summarizeLongResponse(input: SummarizeLongResponseInput): Promise<SummarizeLongResponseOutput> {
  return summarizeLongResponseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeLongResponsePrompt',
  input: {schema: SummarizeLongResponseInputSchema},
  output: {schema: SummarizeLongResponseOutputSchema},
  prompt: `Summarize the following text into concise points:\n\n{{text}}`,
});

const summarizeLongResponseFlow = ai.defineFlow(
  {
    name: 'summarizeLongResponseFlow',
    inputSchema: SummarizeLongResponseInputSchema,
    outputSchema: SummarizeLongResponseOutputSchema,
  },
  async input => {
    const {output} = await prompt({text: input});
    return output!;
  }
);
