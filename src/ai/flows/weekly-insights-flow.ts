'use server';
/**
 * @fileOverview A flow to generate personalized weekly diet insights with robust error handling.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const WeeklyInsightsInputSchema = z.object({
  searchQueries: z.array(z.string()),
  cartItems: z.array(z.string()),
  userProfile: z.object({
    healthConditions: z.array(z.string()),
    dietGoals: z.array(z.string()),
  }),
});
export type WeeklyInsightsInput = z.infer<typeof WeeklyInsightsInputSchema>;

const WeeklyInsightsOutputSchema = z.object({
  summary: z.string().default('No summary available.'),
  topRisk: z.string().default('No specific risks identified.'),
  advice: z.string().default('Keep eating healthy!'),
});
export type WeeklyInsightsOutput = z.infer<typeof WeeklyInsightsOutputSchema>;

const weeklyInsightsPrompt = ai.definePrompt({
  name: 'weeklyInsightsPrompt',
  input: { schema: WeeklyInsightsInputSchema },
  output: { schema: WeeklyInsightsOutputSchema },
  prompt: `You are NutriSaathi AI Health Coach. Analyze history:
  Searched: {{#each searchQueries}}{{this}}, {{/each}}
  Cart: {{#each cartItems}}{{this}}, {{/each}}
  Health: {{#each userProfile.healthConditions}}{{this}}, {{/each}}
  Provide summary, top risk, and one piece of advice in an encouraging tone.`,
});

export async function generateWeeklyInsights(input: WeeklyInsightsInput): Promise<WeeklyInsightsOutput> {
  try {
    const { output } = await weeklyInsightsPrompt(input);
    return output!;
  } catch (e) {
    console.error("Weekly Insights Flow Failed:", e);
    return {
      summary: "We couldn't generate your health report right now. Please try again later.",
      topRisk: "Unknown",
      advice: "Try logging more meals to get better insights.",
    };
  }
}
