import type { SummonPool } from '../types';

// Pool roll outcome is a STAR TIER, not a rarity:
//   3 = S (base, most common)
//   4 = SS
//   5 = SSS
// The pulled hero is added at that star level. Promotion still works via fragments.
//
// Five pools total — two hero pulls + three resource-summon pools that
// replaced Friend Wish (which was strictly worse than the gold-daily
// Standard pool once the player had any equipment).
//
// Order is display priority: Stellar > Standard > Equipment > Socket > Material.
export const SUMMON_POOLS: SummonPool[] = [
  {
    id: 'premium',
    name: 'Stellar Wish',
    kind: 'hero',
    description: 'Best odds. Featured SSS hero · pity SSS at 120.',
    cost: { currency: 'gems', amount: 10 },
    rates: { 3: 0.74, 4: 0.24, 5: 0.02 },
    pityFive: 120,
    featuredHeroId: 'luna',
  },
  {
    id: 'standard',
    name: 'Standard Wish',
    kind: 'hero',
    description: 'Cheap gold pulls. Mostly S, rare SS, almost never SSS.',
    cost: { currency: 'gold', amount: 100 },
    rates: { 3: 0.9275, 4: 0.07, 5: 0.0025 },
    pityFive: null,
  },
  {
    id: 'equipment',
    name: 'Equipment Wish',
    kind: 'equipment',
    description: 'Random gear roll at high item level. Mostly Rare+, chance for Legendary.',
    cost: { currency: 'gems', amount: 8 },
    rates: { 3: 0, 4: 0, 5: 0 }, // unused for non-hero pools
    pityFive: null,
    equipmentItemLevel: 60,
    equipmentMinRarity: 3,
  },
  {
    id: 'socket',
    name: 'Socket Wish',
    kind: 'socket',
    description: 'Random socketable gem. Stat & tier are RNG up to Crystal (T4).',
    cost: { currency: 'gold', amount: 250 },
    rates: { 3: 0, 4: 0, 5: 0 },
    pityFive: null,
    socketMaxTier: 4,
  },
  {
    id: 'material',
    name: 'Material Wish',
    kind: 'material',
    description: 'Bundle of soulshards. Small chance to also pull a hero essence.',
    cost: { currency: 'gold', amount: 200 },
    rates: { 3: 0, 4: 0, 5: 0 },
    pityFive: null,
    materialSoulshardMin: 8,
    materialSoulshardMax: 20,
    materialEssenceChance: 0.12,
  },
];

export const POOL_BY_ID = Object.fromEntries(SUMMON_POOLS.map(p => [p.id, p]));
