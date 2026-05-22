// Hero-specific passive talents. Each hero has 9 unique nodes across 3 branches.
import type { LootStat } from './loot';

export type TalentBranch = 'might' | 'finesse' | 'endurance';

export interface TalentNode {
  id: string;            // globally unique: "<heroId>_<branch>_<rank>"
  heroId: string;
  branch: TalentBranch;
  rank: 1 | 2 | 3;
  name: string;
  description: string;
  cost: number;
  bonus: Partial<Record<LootStat, number>>;
}

// Helper to build a hero's 9 nodes
type N = { name: string; description: string; bonus: Partial<Record<LootStat, number>> };
function mk(heroId: string, branch: TalentBranch, rank: 1|2|3, n: N): TalentNode {
  // Cost curve: 1pt → 2pt → 2pt (was 1/2/3).
  // Slightly cheaper rank-3 so deep specialization is reachable without
  // requiring level 28 to max one hero, but rank-2/3 still gate properly.
  const cost = rank === 1 ? 1 : 2;
  return {
    id: `${heroId}_${branch}_${rank}`,
    heroId, branch, rank,
    cost,
    ...n,
  };
}

export const TALENT_TREE: TalentNode[] = [
  // ============ LUNA — Priestess / Healer ============
  mk('luna', 'might', 1, { name: 'Burning Light',  description: '+25 ATK · dawn cuts through',          bonus: { atk: 25 } }),
  mk('luna', 'might', 2, { name: 'Searing Word',   description: '+60 ATK · words of fire',              bonus: { atk: 60 } }),
  mk('luna', 'might', 3, { name: 'Sunlance',       description: '+140 ATK · +6% CRIT',                  bonus: { atk: 140, crit: 0.06 } }),
  mk('luna', 'finesse', 1, { name: 'Steady Hand',  description: '+8 SPD · steady chant',                bonus: { spd: 8 } }),
  mk('luna', 'finesse', 2, { name: 'Holy Rhythm',  description: '+18 SPD · +30 ATK',                    bonus: { spd: 18, atk: 30 } }),
  mk('luna', 'finesse', 3, { name: 'Dance of Dawn',description: '+35 SPD · +8% CRIT',                   bonus: { spd: 35, crit: 0.08 } }),
  mk('luna', 'endurance', 1, { name: 'Inner Light',description: '+300 HP · light shields her',         bonus: { hp: 300 } }),
  mk('luna', 'endurance', 2, { name: 'Sanctuary',   description: '+50 DEF · cannot be moved',          bonus: { def: 50 } }),
  mk('luna', 'endurance', 3, { name: 'Beacon',     description: '+1200 HP · +80 DEF',                   bonus: { hp: 1200, def: 80 } }),

  // ============ AELIA — Frost Mage ============
  mk('aelia', 'might', 1, { name: 'Frostbite',     description: '+35 ATK · stings the lungs',           bonus: { atk: 35 } }),
  mk('aelia', 'might', 2, { name: 'Crystal Surge', description: '+80 ATK · crystals pulse',             bonus: { atk: 80 } }),
  mk('aelia', 'might', 3, { name: 'Glacial Crown', description: '+180 ATK · +10% CRIT',                 bonus: { atk: 180, crit: 0.10 } }),
  mk('aelia', 'finesse', 1, { name: 'Quick Cast',  description: '+10 SPD',                               bonus: { spd: 10 } }),
  mk('aelia', 'finesse', 2, { name: 'Snowfoot',    description: '+20 SPD · +5% CRIT',                   bonus: { spd: 20, crit: 0.05 } }),
  mk('aelia', 'finesse', 3, { name: 'Winter Step', description: '+40 SPD · +12% CRIT',                  bonus: { spd: 40, crit: 0.12 } }),
  mk('aelia', 'endurance', 1, { name: 'Frost Ward',description: '+250 HP',                              bonus: { hp: 250 } }),
  mk('aelia', 'endurance', 2, { name: 'Ice Mantle',description: '+40 DEF · +200 HP',                    bonus: { def: 40, hp: 200 } }),
  mk('aelia', 'endurance', 3, { name: 'Permafrost',description: '+1000 HP · +70 DEF',                   bonus: { hp: 1000, def: 70 } }),

  // ============ KAIUS — Holy Paladin / Tank ============
  mk('kaius', 'might', 1, { name: 'Holy Edge',     description: '+20 ATK',                              bonus: { atk: 20 } }),
  mk('kaius', 'might', 2, { name: 'Judgement',     description: '+50 ATK · +30 DEF',                    bonus: { atk: 50, def: 30 } }),
  mk('kaius', 'might', 3, { name: 'Wrath of Cross',description: '+120 ATK · +60 DEF',                   bonus: { atk: 120, def: 60 } }),
  mk('kaius', 'finesse', 1, { name: 'Square Stance',description: '+6 SPD · +20 DEF',                    bonus: { spd: 6, def: 20 } }),
  mk('kaius', 'finesse', 2, { name: 'Discipline',  description: '+15 SPD · +5% CRIT',                   bonus: { spd: 15, crit: 0.05 } }),
  mk('kaius', 'finesse', 3, { name: 'Saint\'s Tempo',description: '+30 SPD · +8% CRIT',                 bonus: { spd: 30, crit: 0.08 } }),
  mk('kaius', 'endurance', 1, { name: 'Iron Will', description: '+600 HP',                              bonus: { hp: 600 } }),
  mk('kaius', 'endurance', 2, { name: 'Shield Wall',description: '+100 DEF · +500 HP',                  bonus: { def: 100, hp: 500 } }),
  mk('kaius', 'endurance', 3, { name: 'Unyielding',description: '+2500 HP · +150 DEF',                  bonus: { hp: 2500, def: 150 } }),

  // ============ ELARA — Elven Archer ============
  mk('elara', 'might', 1, { name: 'Sharpened Tips', description: '+30 ATK',                             bonus: { atk: 30 } }),
  mk('elara', 'might', 2, { name: 'Killing Stroke',description: '+70 ATK · +6% CRIT',                   bonus: { atk: 70, crit: 0.06 } }),
  mk('elara', 'might', 3, { name: 'One Shot',      description: '+150 ATK · +12% CRIT',                 bonus: { atk: 150, crit: 0.12 } }),
  mk('elara', 'finesse', 1, { name: 'Quickdraw',    description: '+15 SPD',                              bonus: { spd: 15 } }),
  mk('elara', 'finesse', 2, { name: 'Treadlight',   description: '+30 SPD · +6% CRIT',                  bonus: { spd: 30, crit: 0.06 } }),
  mk('elara', 'finesse', 3, { name: 'Wind\'s Eye',  description: '+50 SPD · +10% CRIT',                 bonus: { spd: 50, crit: 0.10 } }),
  mk('elara', 'endurance', 1, { name: 'Hunter\'s Cloak',description: '+200 HP',                          bonus: { hp: 200 } }),
  mk('elara', 'endurance', 2, { name: 'Forest Born',description: '+30 DEF · +250 HP',                   bonus: { def: 30, hp: 250 } }),
  mk('elara', 'endurance', 3, { name: 'Untouchable',description: '+800 HP · +40 SPD',                   bonus: { hp: 800, spd: 40 } }),

  // ============ KENGO — Monk / Warrior ============
  mk('kengo', 'might', 1, { name: 'Iron Knuckle',  description: '+30 ATK',                              bonus: { atk: 30 } }),
  mk('kengo', 'might', 2, { name: 'Mountain Strike',description: '+70 ATK · +40 DEF',                   bonus: { atk: 70, def: 40 } }),
  mk('kengo', 'might', 3, { name: 'Earth Shatter', description: '+160 ATK · +500 HP',                   bonus: { atk: 160, hp: 500 } }),
  mk('kengo', 'finesse', 1, { name: 'Breath Control',description: '+8 SPD · +200 HP',                   bonus: { spd: 8, hp: 200 } }),
  mk('kengo', 'finesse', 2, { name: 'Stance Shift',description: '+18 SPD · +40 ATK',                    bonus: { spd: 18, atk: 40 } }),
  mk('kengo', 'finesse', 3, { name: 'Flow State',  description: '+35 SPD · +6% CRIT',                   bonus: { spd: 35, crit: 0.06 } }),
  mk('kengo', 'endurance', 1, { name: 'Stone Body',description: '+500 HP',                              bonus: { hp: 500 } }),
  mk('kengo', 'endurance', 2, { name: 'Calloused',  description: '+70 DEF · +400 HP',                   bonus: { def: 70, hp: 400 } }),
  mk('kengo', 'endurance', 3, { name: 'Mountain Heart',description: '+1800 HP · +100 DEF',              bonus: { hp: 1800, def: 100 } }),

  // ============ LEN — Shadow Assassin ============
  mk('len', 'might', 1, { name: 'Twin Edges',      description: '+40 ATK',                              bonus: { atk: 40 } }),
  mk('len', 'might', 2, { name: 'Backstab',        description: '+90 ATK · +8% CRIT',                   bonus: { atk: 90, crit: 0.08 } }),
  mk('len', 'might', 3, { name: 'Reaper',          description: '+200 ATK · +15% CRIT',                 bonus: { atk: 200, crit: 0.15 } }),
  mk('len', 'finesse', 1, { name: 'Shadow Step',    description: '+18 SPD',                              bonus: { spd: 18 } }),
  mk('len', 'finesse', 2, { name: 'Whisper Walk',  description: '+35 SPD · +6% CRIT',                   bonus: { spd: 35, crit: 0.06 } }),
  mk('len', 'finesse', 3, { name: 'Eclipse',       description: '+55 SPD · +12% CRIT',                  bonus: { spd: 55, crit: 0.12 } }),
  mk('len', 'endurance', 1, { name: 'Smoke Cloak', description: '+150 HP · +10 SPD',                    bonus: { hp: 150, spd: 10 } }),
  mk('len', 'endurance', 2, { name: 'Vanish',       description: '+25 DEF · +250 HP',                   bonus: { def: 25, hp: 250 } }),
  mk('len', 'endurance', 3, { name: 'No Witnesses',description: '+600 HP · +25 SPD',                    bonus: { hp: 600, spd: 25 } }),
];

export const TALENT_BY_ID = Object.fromEntries(TALENT_TREE.map(t => [t.id, t]));

export const BRANCH_COLOR: Record<TalentBranch, string> = {
  might:     '#ef4444',
  finesse:   '#a855f7',
  endurance: '#22c55e',
};
export const BRANCH_NAME: Record<TalentBranch, string> = {
  might: 'Might', finesse: 'Finesse', endurance: 'Endurance',
};

export function talentPointsForLevel(level: number): number {
  return Math.max(0, level - 10);
}

// Filter by hero AND branch
export function nodesForHeroBranch(heroId: string, branch: TalentBranch): TalentNode[] {
  return TALENT_TREE
    .filter(t => t.heroId === heroId && t.branch === branch)
    .sort((a, b) => a.rank - b.rank);
}
