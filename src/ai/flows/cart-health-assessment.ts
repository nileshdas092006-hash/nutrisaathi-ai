'use server';
/**
 * @fileOverview A Genkit flow to analyze a shopping cart with regional context.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CartHealthAssessmentInputSchema = z.object({
  foodItems: z.array(z.string()),
  userProfile: z.object({
    age: z.number().optional(),
    weight: z.number().optional(),
    healthConditions: z.array(z.string()).optional(),
    dietType: z.string().optional(),
    region: z.string().optional(),
  }).optional(),
  language: z.string().optional(),
});
export type CartHealthAssessmentInput = z.infer<typeof CartHealthAssessmentInputSchema>;

const CartHealthAssessmentOutputSchema = z.object({
  cartHealthScore: z.number().default(50),
  riskSummary: z.string().default('Analysis complete.'),
  replacements: z.array(z.object({
    originalItem: z.string(),
    replacement: z.string(),
    reason: z.string(),
  })).default([]),
});
export type CartHealthAssessmentOutput = z.infer<typeof CartHealthAssessmentOutputSchema>;

const cartHealthAssessmentPrompt = ai.definePrompt({
  name: 'cartHealthAssessmentPrompt',
  input: {schema: CartHealthAssessmentInputSchema},
  output: {schema: CartHealthAssessmentOutputSchema},
  prompt: `You are NutriSaathi AI. Analyze this grocery basket for a user from {{{userProfile.region}}}.
Basket: {{#each foodItems}}{{this}}, {{/each}}
Output in {{{language}}}. Provide health score (0-100), risk summary, and regional swaps. Be concise.`,
});

const cartHealthAssessmentFlow = ai.defineFlow(
  {
    name: 'cartHealthAssessmentFlow',
    inputSchema: CartHealthAssessmentInputSchema,
    outputSchema: CartHealthAssessmentOutputSchema,
  },
  async input => {
    try {
      if (!input.foodItems || input.foodItems.length === 0) {
        return {
          cartHealthScore: 100,
          riskSummary: "Your basket is empty. Add items to see your score.",
          replacements: [],
        };
      }
      const {output} = await cartHealthAssessmentPrompt(input);
      return output!;
    } catch (e) {
      console.error("Cart Analysis Flow Failed:", e);
      return {
        cartHealthScore: 50,
        riskSummary: "We couldn't analyze your full basket due to a timeout. Please try again with fewer items.",
        replacements: [],
      };
    }
  }
);

export async function cartHealthAssessment(input: CartHealthAssessmentInput): Promise<CartHealthAssessmentOutput> {
  return cartHealthAssessmentFlow(input);
}
