// Spirit Bomb event — weekly multi-attempt charge boss.
// Each attempt's damage carries over and permanently weakens the boss this week.
// Tiered rewards based on cumulative % damage dealt. Boss "explodes" at 100%.

import { buildEnemyUnit } from '../lib/stats';
import type { CombatUnit } from '../types';

export const SPIRIT_BOMB_ATTEMPTS_PER_WEEK = 5;

export interface SpiritBossDef {
  id: string;
  name: string;
  description: string;
  emoji: string;
  templateId: string;
  hp: number;
  level: number;
  star: number;
}

export const SPIRIT_BOSSES: SpiritBossDef[] = [
  { id: 'lich_titan', name: 'Lich Titan',
    description: 'A risen colossus. Damage carries — break it across attempts.',
    emoji: '⛰️', templateId: 'graveyardlich', hp: 4_000_000, level: 40, star: 5 },
  { id: 'bone_leviathan', name: 'Bone Leviathan',
    description: 'Walking siege engine of bone. Chip it down.',
    emoji: '🐉', templateId: 'boneknight', hp: 5_000_000, level: 45, star: 5 },
  { id: 'ghoul_swarm_alpha', name: 'Ghoul Swarm Alpha',
    description: 'Faster than mountains erode. Bleed it out.',
    emoji: '🌀', templateId: 'fastghoul', hp: 3_500_000, level: 38, star: 5 },
];

export function currentSpiritBoss(weekIso: string): SpiritBossDef {
  let hash = 0;
  for (let i = 0; i < weekIso.length; i++) hash = (hash * 31 + weekIso.charCodeAt(i)) | 0;
  const idx = Math.abs(hash) % SPIRIT_BOSSES.length;
  return SPIRIT_BOSSES[idx];
}

export function buildSpiritBossUnit(boss: SpiritBossDef, remainingHp: number): CombatUnit {
  const u = buildEnemyUnit(boss.templateId, boss.level, boss.star, 'spirit_boss');
  u.hp = Math.max(1, remainingHp);
  u.maxHp = boss.hp;
  u.atk = Math.floor(u.atk * 2.0);
  u.def = Math.floor(u.def * 1.3);
  return [u][0];
}

// Reward tiers based on cumulative damage as % of max HP
export interface SpiritTier {
  pct: number;
  name: string;
  rewards: { gold: number; gems: number; soulshard: number };
}

// Economy alignment: soulshard rewards +50% (matches World Boss bump).
export const SPIRIT_TIERS: SpiritTier[] = [
  { pct: 0.10, name: 'Spark',   rewards: { gold: 1000, gems: 20,  soulshard: 5 } },
  { pct: 0.25, name: 'Surge',   rewards: { gold: 2500, gems: 60,  soulshard: 15 } },
  { pct: 0.50, name: 'Burst',   rewards: { gold: 6000, gems: 120, soulshard: 38 } },
  { pct: 0.75, name: 'Wave',    rewards: { gold: 10000,gems: 250, soulshard: 75 } },
  { pct: 1.00, name: 'Annihilation', rewards: { gold: 25000, gems: 600, soulshard: 225 } },
];

export function spiritTierFor(pct: number): SpiritTier | null {
  let best: SpiritTier | null = null;
  for (const t of SPIRIT_TIERS) {
    if (pct >= t.pct) best = t;
  }
  return best;
}
