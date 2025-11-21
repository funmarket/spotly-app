'use server';

/**
 * @fileOverview Generates AI insights for artist profiles based on video performance, votes, views, and booking data.
 *
 * - generateArtistInsights - A function that generates insights for an artist's profile.
 * - ArtistInsightsInput - The input type for the generateArtistInsights function.
 * - ArtistInsightsOutput - The return type for the generateArtistInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ArtistInsightsInputSchema = z.object({
  artistId: z
    .string()
    .describe('The wallet address of the artist.'),
  videoPerformanceData: z.string().describe('The video performance data.'),
  votesData: z.string().describe('The votes data.'),
  viewsData: z.string().describe('The views data.'),
  bookingData: z.string().describe('The booking data.'),
});
export type ArtistInsightsInput = z.infer<typeof ArtistInsightsInputSchema>;

const ArtistInsightsOutputSchema = z.object({
  insights: z.string().describe('AI-generated insights for the artist.'),
});
export type ArtistInsightsOutput = z.infer<typeof ArtistInsightsOutputSchema>;

export async function generateArtistInsights(input: ArtistInsightsInput): Promise<ArtistInsightsOutput> {
  return artistInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'artistInsightsPrompt',
  input: {schema: ArtistInsightsInputSchema},
  output: {schema: ArtistInsightsOutputSchema},
  prompt: `You are an AI assistant providing insights for artists on the TalentVerse platform. Analyze the provided data to generate actionable insights.

  Data:
  - Video Performance Data: {{{videoPerformanceData}}}
  - Votes Data: {{{votesData}}}
  - Views Data: {{{viewsData}}}
  - Booking Data: {{{bookingData}}}

  Instructions:
  1. Identify key trends and patterns in the data.
  2. Suggest specific improvements the artist can make to their content or profile.
  3. Focus on actionable advice that can help the artist improve their performance.
  4. Provide constructive criticism and positive reinforcement where appropriate.
  5. Keep the insights concise and easy to understand.
  6. Do not be overly verbose or repetitive.

  Insights:
  `,
});

const artistInsightsFlow = ai.defineFlow(
  {
    name: 'artistInsightsFlow',
    inputSchema: ArtistInsightsInputSchema,
    outputSchema: ArtistInsightsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
