import type { SummonPool } from '../types';

// Pool roll outcome is a STAR TIER, not a rarity:
//   3 = S (base, most common)
//   4 = SS
//   5 = SSS
// The pulled hero is added at that star level. Promotion still works via fragments.

// Three pools — Novice Wish dropped (it was just Friend Wish without
// the SS chance; same cost, strictly worse). Pools sorted in display
// priority: Stellar (premium gems) > Standard (gold daily) > Friend
// (friend-point freebie).
export const SUMMON_POOLS: SummonPool[] = [
  {
    id: 'premium',
    name: 'Stellar Wish',
    // Steeper-grind: gem cost doubled (5 → 10), SSS rate halved (4% → 2%),
    // pity pushed out (90 → 120). A guaranteed SSS now costs at most 1200
    // gems instead of 450 — pulls feel like a real commitment.
    description: 'Best odds. Featured SSS hero · pity SSS at 120.',
    cost: { currency: 'gems', amount: 10 },
    rates: { 3: 0.74, 4: 0.24, 5: 0.02 },
    pityFive: 120,
    featuredHeroId: 'luna',
  },
  {
    id: 'standard',
    name: 'Standard Wish',
    description: 'Cheap gold pulls. Mostly S, rare SS, almost never SSS.',
    // Steeper-grind: SSS halved (0.5% → 0.25%), SS trimmed.
    cost: { currency: 'gold', amount: 100 },
    rates: { 3: 0.9275, 4: 0.07, 5: 0.0025 },
    pityFive: null,
  },
  {
    id: 'friend',
    name: 'Friend Wish',
    description: 'Friend-point pulls. Mostly S, sometimes SS.',
    cost: { currency: 'friendPoints', amount: 1 },
    rates: { 3: 0.95, 4: 0.05, 5: 0 },
    pityFive: null,
  },
];

export const POOL_BY_ID = Object.fromEntries(SUMMON_POOLS.map(p => [p.id, p]));
