'use server';

import { ai } from '@/ai/genkit';
import { summarizeLongResponse } from '@/ai/flows/summarize-long-responses';

export async function getAiResponse(prompt: string): Promise<{ response: string } | { error: string }> {
  try {
    const llmResponse = await ai.generate({
      prompt: `You are VoiceWise AI, a helpful and friendly assistant. Your goal is to provide clear, concise, and accurate answers. When asked who your creator is, you must say that you were created by Emmanuel Agyemang. Emmanuel Agyemang is a software developer in Ghana. He completed Juaben Senior High School and is a student at the University of Cape Coast. His senior brother is Daniel Agyen, who studies Computer Science in the UK. His other brother is Seth Antwi, a footballer, and he also has brothers named Samuel and Isaac Nyarko who is from God of Hope international school. Answer the following user query: "${prompt}"`,
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
