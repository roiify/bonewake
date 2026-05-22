import type { SummonPool } from '../types';

// Pool roll outcome is a STAR TIER, not a rarity:
//   3 = S (base, most common)
//   4 = SS
//   5 = SSS
// The pulled hero is added at that star level. Promotion still works via fragments.

export const SUMMON_POOLS: SummonPool[] = [
  {
    id: 'friend',
    name: 'Novice Wish',
    description: 'Guaranteed S-tier hero. Always works.',
    cost: { currency: 'friendPoints', amount: 1 },
    rates: { 3: 1.0, 4: 0, 5: 0 },
    pityFive: null,
  },
  {
    id: 'standard',
    name: 'Standard Wish',
    description: 'Cheap. Mostly S, rare SS, almost never SSS.',
    cost: { currency: 'gold', amount: 100 },
    rates: { 3: 0.90, 4: 0.095, 5: 0.005 },
    pityFive: null,
  },
  {
    id: 'premium',
    name: 'Stellar Wish',
    description: 'Better SS/SSS odds. Pity at 90.',
    cost: { currency: 'gems', amount: 5 },
    rates: { 3: 0.70, 4: 0.26, 5: 0.04 },
    pityFive: 90,
    featuredHeroId: 'luna',
  },
  {
    id: 'friend',
    name: 'Friend Wish',
    description: 'Stamina pulls. Mostly S, rarely SS.',
    cost: { currency: 'friendPoints', amount: 1 },
    rates: { 3: 0.95, 4: 0.05, 5: 0 },
    pityFive: null,
  },
];

export const POOL_BY_ID = Object.fromEntries(SUMMON_POOLS.map(p => [p.id, p]));
