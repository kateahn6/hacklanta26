import { fallbackRecommendationSet, sampleRecommendationSets } from '@/data/mock/recommendations';
import type { RecommendationResult } from '@/types';

/**
 * Returns sample recommendations for a request. This does NOT call an AI
 * model. The real version will POST the request to a Noted! backend endpoint
 * that calls Gemini server-side, so no API key ships in the app.
 */
export async function getRecommendations(prompt: string): Promise<RecommendationResult> {
  await new Promise((resolve) => setTimeout(resolve, 900));

  const words = prompt.toLowerCase();
  const scored = sampleRecommendationSets
    .map((set) => ({ set, score: set.keywords.filter((k) => words.includes(k)).length }))
    .sort((a, b) => b.score - a.score);
  const best = scored[0] && scored[0].score > 0 ? scored[0].set : fallbackRecommendationSet;

  return { prompt, summary: best.summary, items: best.items, source: 'sample' };
}
