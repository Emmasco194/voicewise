'use server';

import { ai } from '@/ai/genkit';
import { summarizeLongResponse } from '@/ai/flows/summarize-long-responses';

export async function getAiResponse(prompt: string): Promise<{ response: string } | { error: string }> {
  try {
    const llmResponse = await ai.generate({
      prompt: `You are VoiceWise AI, a helpful and friendly assistant. Your goal is to provide clear, concise, and accurate answers. Answer the following user query: "${prompt}"`,
    });

    const responseText = llmResponse.text;
    if (!responseText) {
      return { error: 'Failed to get a response from the AI.' };
    }
    
    return { response: responseText };
  } catch (error) {
    console.error('AI response error:', error);
    return { error: 'An unexpected error occurred while contacting the AI.' };
  }
}

export async function getSummarizedResponse(textToSummarize: string): Promise<{ summary: string } | { error: string }> {
  try {
    const summary = await summarizeLongResponse(textToSummarize);
    return { summary };
  } catch (error) {
    console.error('Summarization error:', error);
    return { error: 'Failed to summarize the response.' };
  }
}
