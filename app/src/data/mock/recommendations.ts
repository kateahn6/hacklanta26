import type { Recommendation } from '@/types';

export interface SampleRecommendationSet {
  /** Words in the request that select this set. */
  keywords: string[];
  summary: string;
  items: Recommendation[];
}

// Hand-written sample responses. A future Noted! backend endpoint will call
// Gemini with the user's request and return this same shape.
export const sampleRecommendationSets: SampleRecommendationSet[] = [
  {
    keywords: ['art', 'coffee', 'cafe', 'café', 'midtown', 'affordable', 'cheap', 'gallery', 'museum'],
    summary: 'Affordable art and coffee, mostly a short ride from Midtown.',
    items: [
      {
        placeId: 'p-contemporary',
        reason: 'Free admission and rotating, experimental shows. Lena calls it "always weird and wonderful."',
        postcardId: 'pc-contemporary-free',
      },
      {
        placeId: 'p-condesa',
        reason: 'An independent café locals love. A cortado and a pastry come in under $10.',
        postcardId: 'pc-condesa-cortado',
        scrapbookId: 'sb-independent-cafes',
      },
      {
        placeId: 'p-high',
        reason: 'The Midtown anchor for art, and free on second Sundays if you are on a budget.',
        postcardId: 'pc-high-atrium',
      },
      {
        placeId: 'p-krog-tunnel',
        reason: 'Free, ever-changing street art. Part of Maya’s creative Saturday route.',
        postcardId: 'pc-krog-tunnel',
        scrapbookId: 'sb-creative-saturday',
      },
    ],
  },
  {
    keywords: ['outside', 'outdoor', 'nature', 'park', 'quiet', 'walk', 'green', 'garden', 'calm'],
    summary: 'Calm, green places for a slow afternoon outdoors.',
    items: [
      {
        placeId: 'p-piedmont',
        reason: 'Wide lawns and lake views. Bring a blanket and stay a while.',
        postcardId: 'pc-piedmont-blanket',
        scrapbookId: 'sb-quiet-afternoon',
      },
      {
        placeId: 'p-oakland',
        reason: 'A surprisingly peaceful garden walk under old oaks, with great guided tours.',
        postcardId: 'pc-oakland-quiet',
      },
      {
        placeId: 'p-botanical',
        reason: 'Seasonal blooms right next to Piedmont Park. Weekday mornings are calmest.',
        postcardId: 'pc-garden-bloom',
      },
      {
        placeId: 'p-beltline',
        reason: 'An easy, flat path that links parks, murals, and food halls.',
        postcardId: 'pc-beltline-ride',
      },
    ],
  },
  {
    keywords: ['music', 'night', 'show', 'concert', 'date', 'friends', 'evening', 'live', 'record'],
    summary: 'Evenings with live music and a great view to end on.',
    items: [
      {
        placeId: 'p-variety',
        reason: 'An intimate venue where every seat feels close to the stage.',
        postcardId: 'pc-variety-front-row',
      },
      {
        placeId: 'p-fox',
        reason: 'A historic theater worth visiting for the ceiling alone.',
        postcardId: 'pc-fox-ceiling',
        scrapbookId: 'sb-visiting-friends',
      },
      {
        placeId: 'p-criminal',
        reason: 'Dig through the crates before a show in Little Five Points.',
        postcardId: 'pc-criminal-crates',
      },
      {
        placeId: 'p-jackson',
        reason: 'End the night with the classic skyline view at blue hour.',
        postcardId: 'pc-jackson-blue-hour',
      },
    ],
  },
];

/** Used when no keyword matches the request. */
export const fallbackRecommendationSet: SampleRecommendationSet = {
  keywords: [],
  summary: 'A mix of community favorites across a few neighborhoods.',
  items: [
    { placeId: 'p-l5p', reason: 'Eclectic shops and cafés. Easy to lose an afternoon here.', postcardId: 'pc-l5p-afternoon' },
    {
      placeId: 'p-sweet-auburn',
      reason: 'A historic market with lunch counters to graze through.',
      postcardId: 'pc-sweet-auburn-lunch',
    },
    { placeId: 'p-krog-tunnel', reason: 'Free street art that changes every week.', postcardId: 'pc-krog-tunnel' },
    { placeId: 'p-piedmont', reason: 'The city’s backyard for a slow afternoon.', postcardId: 'pc-piedmont-blanket' },
  ],
};
