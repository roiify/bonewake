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
    // Mainstream-gacha alignment: SSS dropped to 1% (was 2%), SS to 18%
    // (was 24%), pity pushed to 150 (was 120), cost bumped to 15 gems
    // (was 10). Industry comparison: Genshin 0.6% / Wuthering Waves 0.8%
    // / FGO 1%. Bonewake now sits at the generous end of the standard
    // range — SSS still feels achievable but isn't trivial.
    description: 'Best odds. Featured SSS hero · pity SSS at 150.',
    cost: { currency: 'gems', amount: 15 },
    rates: { 3: 0.81, 4: 0.18, 5: 0.01 },
    pityFive: 150,
    featuredHeroId: 'luna',
  },
  {
    id: 'standard',
    name: 'Standard Wish',
    kind: 'hero',
    description: 'Cheap gold pulls. Mostly S, rare SS, almost never SSS.',
    // SSS halved again (0.25% → 0.10%), SS trimmed (7% → 5%) to keep
    // the standard banner as a low-stakes filler, not a real SSS path.
    cost: { currency: 'gold', amount: 100 },
    rates: { 3: 0.9490, 4: 0.05, 5: 0.0010 },
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
