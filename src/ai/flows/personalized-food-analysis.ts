'use server';
/**
 * @fileOverview This file defines a Genkit flow for personalized food analysis.
 * It features robust error handling, fuzzy search, and cultural context.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ProcessingLevelSchema = z.enum(['low', 'medium', 'high', 'ultra-processed']);

const NutritionalInfoSchema = z.object({
  name: z.string(),
  aliases: z.array(z.string()).optional(),
  calories: z.number().default(0),
  sugar: z.number().default(0),
  sodium: z.number().default(0),
  fat: z.number().default(0),
  protein: z.number().default(0),
  processingLevel: ProcessingLevelSchema.default('medium'),
});

type NutritionalInfo = z.infer<typeof NutritionalInfoSchema>;

function getLevenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

const indianFoodDatabase: NutritionalInfo[] = [
  { name: 'Samosa', aliases: ['samoosa', 'समोंसा', 'singara'], calories: 260, sugar: 2, sodium: 450, fat: 15, protein: 5, processingLevel: 'medium' },
  { name: 'Idli', aliases: ['idly', 'इडಲಿ', 'rice cake'], calories: 50, sugar: 0, sodium: 150, fat: 1, protein: 2, processingLevel: 'low' },
  { name: 'Maggi Instant Noodles', aliases: ['maggy', 'मैगी', 'instant noodles'], calories: 380, sugar: 3, sodium: 900, fat: 14, protein: 8, processingLevel: 'ultra-processed' },
  { name: 'Paneer Butter Masala', aliases: ['पनीर बटर मसाला', 'paneer makhani'], calories: 350, sugar: 5, sodium: 600, fat: 28, protein: 12, processingLevel: 'medium' },
  { name: 'Poha', aliases: ['पोहा', 'flattened rice'], calories: 180, sugar: 2, sodium: 300, fat: 5, protein: 3, processingLevel: 'low' },
];

const getIndianFoodNutritionalInfoTool = ai.defineTool(
  {
    name: 'getIndianFoodNutritionalInfo',
    description: 'Retrieves nutritional info for Indian food.',
    inputSchema: z.object({ foodName: z.string() }),
    outputSchema: z.any(),
  },
  async (input) => {
    try {
      const normalizedQuery = (input.foodName || '').toLowerCase().trim();
      if (!normalizedQuery) return { suggestions: [], matchType: 'none' };
      
      for (const item of indianFoodDatabase) {
        const namesToMatch = [item.name.toLowerCase(), ...(item.aliases || []).map(a => a.toLowerCase())];
        if (namesToMatch.includes(normalizedQuery)) {
          return { food: item, suggestions: [], matchType: 'exact', matchedName: item.name };
        }
      }

      const matches = indianFoodDatabase.map(item => {
        const namesToMatch = [item.name.toLowerCase(), ...(item.aliases || []).map(a => a.toLowerCase())];
        const minDistance = Math.min(...namesToMatch.map(name => getLevenshteinDistance(normalizedQuery, name)));
        return { item, distance: minDistance };
      }).sort((a, b) => a.distance - b.distance);

      if (matches[0] && matches[0].distance <= 3) {
        return { food: matches[0].item, suggestions: matches.slice(1, 4).map(m => m.item.name), matchType: 'fuzzy', matchedName: matches[0].item.name };
      }

      return { suggestions: matches.slice(0, 3).map(m => m.item.name), matchType: 'none' };
    } catch (e) {
      return { suggestions: [], matchType: 'none' };
    }
  }
);

const UserProfileSchema = z.object({
  age: z.number().default(25),
  weight: z.number().default(65),
  healthConditions: z.array(z.string()).default([]),
  dietType: z.string().default('Omnivore'),
  region: z.string().default('General India'),
});

const PersonalizedFoodAnalysisInputSchema = z.object({
  foodQuery: z.string(),
  userProfile: UserProfileSchema.partial().optional(),
});
export type PersonalizedFoodAnalysisInput = z.infer<typeof PersonalizedFoodAnalysisInputSchema>;

const PersonalizedFoodAnalysisOutputSchema = z.object({
  healthScore: z.number().min(0).max(100).default(50),
  decision: z.enum(['Buy', 'Moderate', 'Avoid']).default('Moderate'),
  safeQuantity: z.string().default('Moderate consumption'),
  avoidanceWarnings: z.string().default('No specific warnings'),
  healthierAlternatives: z.array(z.string()).default([]),
  explanation: z.string().max(1000).default('Analysis complete.'),
  scoreBreakdown: z.array(z.string()).default([]),
  isFound: z.boolean().default(false),
  suggestions: z.array(z.string()).default([]),
  matchType: z.string().default('none'),
  matchedName: z.string().optional(),
});
export type PersonalizedFoodAnalysisOutput = z.infer<typeof PersonalizedFoodAnalysisOutputSchema>;

const personalizedFoodAnalysisPrompt = ai.definePrompt({
  name: 'personalizedFoodAnalysisPrompt',
  input: {
    schema: z.object({
      foodQuery: z.string(),
      userProfile: UserProfileSchema,
      foodInfo: NutritionalInfoSchema.optional(),
      healthScore: z.number(),
      decision: z.enum(['Buy', 'Moderate', 'Avoid']),
      matchType: z.string(),
      matchedName: z.string().optional(),
    }),
  },
  output: { schema: PersonalizedFoodAnalysisOutputSchema },
  prompt: `You are NutriSaathi AI. Assess "{{{foodQuery}}}" for a user from {{{userProfile.region}}}.
  User: Age {{{userProfile.age}}}, Weight {{{userProfile.weight}}}kg, Health {{{userProfile.healthConditions}}}.
  {{#if foodInfo}}Database match: {{{matchedName}}}. Nutritional data provided.{{/if}}
  Provide cultural alternatives for {{{userProfile.region}}}. Keep explanation concise (max 300 chars).`,
});

const personalizedFoodAnalysisFlow = ai.defineFlow(
  {
    name: 'personalizedFoodAnalysisFlow',
    inputSchema: PersonalizedFoodAnalysisInputSchema,
    outputSchema: PersonalizedFoodAnalysisOutputSchema,
  },
  async (input) => {
    try {
      const toolResult = await getIndianFoodNutritionalInfoTool({ foodName: input.foodQuery });
      const { food: foodInfo, suggestions, matchType, matchedName } = toolResult;
      
      let score = 70;
      if (foodInfo) {
        if (foodInfo.sugar > 15) score -= 20;
        if (foodInfo.sodium > 500) score -= 15;
        if (foodInfo.processingLevel === 'ultra-processed') score -= 25;
      }
      const decision = score >= 70 ? 'Buy' : score >= 40 ? 'Moderate' : 'Avoid';

      const userProfile = {
        age: input.userProfile?.age ?? 25,
        weight: input.userProfile?.weight ?? 65,
        healthConditions: input.userProfile?.healthConditions || [],
        dietType: input.userProfile?.dietType || 'Omnivore',
        region: input.userProfile?.region || 'General India',
      };

      const { output } = await personalizedFoodAnalysisPrompt({
        foodQuery: input.foodQuery,
        userProfile,
        foodInfo,
        healthScore: Math.max(0, score),
        decision,
        matchType,
        matchedName,
      });

      return {
        ...output!,
        isFound: matchType !== 'none',
        suggestions: suggestions || [],
        matchType,
        matchedName,
      };
    } catch (e) {
      console.error("Analysis Flow Failed:", e);
      return {
        healthScore: 50,
        decision: 'Moderate',
        safeQuantity: 'Unknown',
        avoidanceWarnings: 'Analysis temporarily unavailable.',
        healthierAlternatives: [],
        explanation: 'We encountered an error analyzing this food. Please try again with a different dish.',
        scoreBreakdown: ['System Timeout'],
        isFound: false,
        suggestions: [],
        matchType: 'error',
      };
    }
  }
);

export async function personalizedFoodAnalysis(input: PersonalizedFoodAnalysisInput): Promise<PersonalizedFoodAnalysisOutput> {
  return personalizedFoodAnalysisFlow(input);
}
