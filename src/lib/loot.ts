import {
  BASE_ITEMS,
  BASE_BY_ID,
  PREFIXES,
  SUFFIX_BY_STAT,
  LEGENDARY_NAMES,
  RARITY_WEIGHTS,
  AFFIX_COUNT,
  PRIMARY_MULT,
  type LootRarity,
  type LootStat,
} from '../data/loot';
import { uid } from './id';
import type { OwnedEquipment } from './db';

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function rollFloat(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

// Roll a rarity weighted by the global table, with optional min floor
export function rollRarity(minRarity: LootRarity = 1, luckBoost = 0): LootRarity {
  const entries = (Object.entries(RARITY_WEIGHTS) as [string, number][])
    .map(([k, v]) => [Number(k) as LootRarity, v] as const)
    .filter(([k]) => k >= minRarity);
  // Luck boost = shifts weight toward higher tiers (multiplier on rarity index)
  const weighted = entries.map(([r, w]) => [r, w * Math.pow(1 + luckBoost, r - 1)] as const);
  const total = weighted.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [tier, w] of weighted) {
    r -= w;
    if (r <= 0) return tier;
  }
  return 1;
}

// Generate a value for a given stat at a given item level + magnitude factor
function rollStatValue(stat: LootStat, ilvl: number, magnitude: number): number {
  const lvlMult = 1 + (ilvl - 1) * 0.08;
  // Base ranges per stat (separate from base item primary)
  const RANGE: Record<LootStat, [number, number]> = {
    hp:   [40, 120],
    atk:  [8, 24],
    def:  [6, 18],
    spd:  [3, 9],
    crit: [0.02, 0.06],
  };
  const [lo, hi] = RANGE[stat];
  const val = rollFloat(lo, hi) * lvlMult * magnitude;
  // crit is a percentage; cap and round to 4 places
  if (stat === 'crit') return Math.round(val * 10000) / 10000;
  return Math.round(val);
}

export function genLoot(opts: {
  itemLevel: number;
  minRarity?: LootRarity;
  luckBoost?: number;
  forcedBaseId?: string;
}): OwnedEquipment {
  const ilvl = Math.max(1, opts.itemLevel);
  const rarity = rollRarity(opts.minRarity ?? 1, opts.luckBoost ?? 0);
  const base = opts.forcedBaseId ? (BASE_BY_ID[opts.forcedBaseId] ?? pick(BASE_ITEMS)) : pick(BASE_ITEMS);

  // Primary stat roll
  const [magMin, magMax] = PRIMARY_MULT[rarity];
  const mag = rollFloat(magMin, magMax);
  const lvlMult = 1 + (ilvl - 1) * 0.08;
  const rawPrimary = rollFloat(base.baseMin, base.baseMax) * mag * lvlMult;
  const primaryValue = base.primary === 'crit'
    ? Math.round(rawPrimary * 10000) / 10000
    : Math.round(rawPrimary);

  // Affixes
  const affixCount = AFFIX_COUNT[rarity];
  const affixStats: LootStat[] = [];
  const candidatePool = base.affixPool.filter(s => s !== base.primary);
  for (let i = 0; i < affixCount && candidatePool.length > 0; i++) {
    const idx = Math.floor(Math.random() * candidatePool.length);
    affixStats.push(candidatePool[idx]);
    candidatePool.splice(idx, 1);
  }
  const affixes = affixStats.map(stat => ({
    stat,
    value: rollStatValue(stat, ilvl, mag * 0.7),
  }));

  // Name generation
  let name: string;
  if (rarity === 5) {
    name = pick(LEGENDARY_NAMES[base.slot]);
  } else if (rarity >= 3) {
    const prefix = pick(PREFIXES);
    const primarySuffix = affixes.length > 0
      ? pick(SUFFIX_BY_STAT[affixes[0].stat])
      : pick(SUFFIX_BY_STAT[base.primary]);
    name = `${prefix} ${base.name} of ${primarySuffix}`;
  } else if (rarity === 2) {
    const suffixStat = affixes[0]?.stat ?? base.primary;
    name = `${base.name} of ${pick(SUFFIX_BY_STAT[suffixStat])}`;
  } else {
    name = base.name;
  }

  return {
    id: uid(),
    baseType: base.id,
    rarity,
    itemLevel: ilvl,
    name,
    primary: { stat: base.primary, value: primaryValue },
    affixes,
    upgradeLevel: 0,
    equippedTo: null,
    obtainedAt: Date.now(),
    // legacy fields kept for backward compat — unused by new code
    templateId: undefined,
    level: undefined,
  };
}

// Aggregate stats for a given equipment instance (primary + affixes + upgrade bonus).
// Mythic items use +12% per ascension level; non-Mythic use +10% per upgrade level.
export function equipStats(eq: OwnedEquipment): Partial<Record<LootStat, number>> {
  const out: Partial<Record<LootStat, number>> = {};
  const isMythic = (eq.rarity ?? 0) >= 6 && !!eq.craftedPieceId;
  const upgradeMult = isMythic
    ? 1 + (eq.upgradeLevel ?? 0) * 0.12
    : 1 + (eq.upgradeLevel ?? 0) * 0.1;
  if (eq.primary) {
    const k = eq.primary.stat as LootStat;
    const v = eq.primary.value * upgradeMult;
    out[k] = (out[k] ?? 0) + (k === 'crit' ? Math.round(v * 10000) / 10000 : Math.round(v));
  }
  for (const a of eq.affixes ?? []) {
    const k = a.stat as LootStat;
    const v = a.value * upgradeMult;
    out[k] = (out[k] ?? 0) + (k === 'crit' ? Math.round(v * 10000) / 10000 : Math.round(v));
  }
  return out;
}

// Power rating used for sorting in the bag
export function equipPower(eq: OwnedEquipment): number {
  const s = equipStats(eq);
  return Math.round((s.hp ?? 0) / 4 + (s.atk ?? 0) * 3 + (s.def ?? 0) * 2 + (s.spd ?? 0) * 5 + (s.crit ?? 0) * 800);
}
