// Solo World Boss — weekly super-tough boss. 3 free attempts per week. Damage scored;
// boss returns to full HP each attempt (best damage of any attempt counts).

import { buildEnemyUnit } from '../lib/stats';
import type { CombatUnit } from '../types';

export const WORLD_BOSS_ATTEMPTS_PER_WEEK = 3;

export interface WorldBossDef {
  id: string;
  name: string;
  description: string;
  emoji: string;
  templateId: string;        // which enemy sprite
  hpMillions: number;        // total HP in millions
  level: number;
  star: number;
}

// 4 bosses rotate weekly (one per week). HP / level cranked up so the
// fight is a real challenge instead of a tap-and-pass.
export const WORLD_BOSSES: WorldBossDef[] = [
  { id: 'apostate',    name: 'The Crimson Apostate', description: 'A hooded blood-mage whose every gesture costs you blood.', emoji: '🩸',
    templateId: 'worldboss_1',   hpMillions: 4.0, level: 60, star: 6 },
  { id: 'ironknight',  name: 'Ironclad Knight',    description: 'Plate so thick it eats your blows.',                       emoji: '🛡️',
    templateId: 'boneknight',    hpMillions: 5.0, level: 65, star: 6 },
  { id: 'plagueghoul', name: 'Plague Ghoul Alpha', description: 'Faster than the wind. Mean as a curse.',                    emoji: '🧟',
    templateId: 'fastghoul',     hpMillions: 3.5, level: 55, star: 6 },
  { id: 'crowned',     name: 'The Crowned Lich',   description: 'It speaks no words. The cold answers.',                     emoji: '👑',
    templateId: 'graveyardlich', hpMillions: 7.0, level: 80, star: 6 },
];

export function currentBoss(weekIso: string): WorldBossDef {
  // Hash the iso week to pick a boss deterministically
  let hash = 0;
  for (let i = 0; i < weekIso.length; i++) hash = (hash * 31 + weekIso.charCodeAt(i)) | 0;
  const idx = Math.abs(hash) % WORLD_BOSSES.length;
  return WORLD_BOSSES[idx];
}

export function buildBossTeam(boss: WorldBossDef): CombatUnit[] {
  // Single mega-unit with massive HP (we scale HP separately because buildEnemyUnit caps via star multiplier)
  const u = buildEnemyUnit(boss.templateId, boss.level, boss.star, 'wb_boss');
  const targetHp = Math.floor(boss.hpMillions * 1_000_000);
  u.hp = targetHp;
  u.maxHp = targetHp;
  // Slight damage scaling so they aren't trivial
  u.atk = Math.floor(u.atk * 2.5);
  u.def = Math.floor(u.def * 1.5);
  return [u];
}

// Reward tiers based on % of boss HP damaged in a single attempt
export interface RewardTier {
  pct: number;       // require at least this fraction of boss HP damaged
  name: string;
  rewards: { gold: number; gems: number; soulshard: number };
}
export const REWARD_TIERS: RewardTier[] = [
  { pct: 0.01, name: 'Token',   rewards: { gold: 500,  gems: 10,  soulshard: 1 } },
  { pct: 0.05, name: 'Bronze',  rewards: { gold: 1500, gems: 30,  soulshard: 5 } },
  { pct: 0.15, name: 'Silver',  rewards: { gold: 3500, gems: 75,  soulshard: 15 } },
  { pct: 0.30, name: 'Gold',    rewards: { gold: 8000, gems: 150, soulshard: 35 } },
  { pct: 0.60, name: 'Mythic',  rewards: { gold: 15000,gems: 350, soulshard: 75 } },
  { pct: 1.00, name: 'Slayer',  rewards: { gold: 40000,gems: 800, soulshard: 200 } },
];

export function tierFor(damagePct: number): RewardTier {
  let best = REWARD_TIERS[0];
  for (const t of REWARD_TIERS) {
    if (damagePct >= t.pct) best = t;
  }
  return best;
}
