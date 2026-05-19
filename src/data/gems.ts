// Gem system — socketable into equipment. Drop from battles.
import type { LootStat } from './loot';

export type GemTier = 1 | 2 | 3 | 4;

export const GEM_TIER_NAME: Record<GemTier, string> = {
  1: 'Chip', 2: 'Stone', 3: 'Gem', 4: 'Crystal',
};
export const GEM_TIER_COLOR: Record<GemTier, string> = {
  1: '#9ca3af', 2: '#3b82f6', 3: '#a855f7', 4: '#f59e0b',
};

export interface GemDef {
  id: string;             // e.g., 'gem_atk_2'
  stat: LootStat;
  tier: GemTier;
  value: number;          // stat boost provided
  emoji: string;
  name: string;
}

// Generate gem definitions for each stat × tier
const STAT_VALUES: Record<LootStat, [number, number, number, number]> = {
  // [tier 1, 2, 3, 4]
  hp:   [100, 300, 700, 1500],
  atk:  [15, 40, 90, 200],
  def:  [10, 28, 65, 150],
  spd:  [5, 12, 25, 55],
  crit: [0.02, 0.05, 0.10, 0.18],
};

const GEM_EMOJI: Record<LootStat, string> = {
  hp: '🔴', atk: '🟠', def: '🟢', spd: '🟣', crit: '🟡',
};

export const GEMS: GemDef[] = [];
(['hp', 'atk', 'def', 'spd', 'crit'] as LootStat[]).forEach(stat => {
  ([1, 2, 3, 4] as GemTier[]).forEach(tier => {
    GEMS.push({
      id: `gem_${stat}_${tier}`,
      stat,
      tier,
      value: STAT_VALUES[stat][tier - 1],
      emoji: GEM_EMOJI[stat],
      name: `${stat === 'hp' ? 'Ruby' : stat === 'atk' ? 'Garnet' : stat === 'def' ? 'Emerald' : stat === 'spd' ? 'Amethyst' : 'Topaz'} ${GEM_TIER_NAME[tier]}`,
    });
  });
});

export const GEM_BY_ID = Object.fromEntries(GEMS.map(g => [g.id, g]));

// Socket count by equipment rarity
export const SOCKETS_BY_RARITY: Record<number, number> = {
  1: 0,    // Common — no sockets
  2: 1,    // Magic — 1 socket
  3: 1,    // Rare — 1 socket
  4: 2,    // Epic — 2 sockets
  5: 3,    // Legendary — 3 sockets
  6: 3,    // Mythic — 3 sockets
};

// Random gem generator — used by drop logic
export function randomGem(itemLevel: number): GemDef {
  const r = Math.random();
  const tier: GemTier = itemLevel >= 40 && r < 0.05 ? 4
    : itemLevel >= 25 && r < 0.20 ? 3
    : itemLevel >= 15 && r < 0.45 ? 2
    : 1;
  const stats: LootStat[] = ['hp', 'atk', 'def', 'spd', 'crit'];
  const stat = stats[Math.floor(Math.random() * stats.length)];
  const id = `gem_${stat}_${tier}`;
  return GEM_BY_ID[id];
}

// Items table key for owned gems (one row per gem type, count tracks how many)
export const GEM_INVENTORY_PREFIX = 'inv_';
export const gemInventoryKey = (gemId: string) => `${GEM_INVENTORY_PREFIX}${gemId}`;
