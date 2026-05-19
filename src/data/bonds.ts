// Hero Bonds: bonuses when specific heroes are in the same squad.
import type { LootStat } from './loot';

export interface BondDef {
  id: string;
  name: string;
  description: string;
  heroIds: string[];          // ALL these heroes must be in squad
  bonus: Partial<Record<LootStat, number>>;  // applied to every member of the bond
  emoji: string;
}

export const BONDS: BondDef[] = [
  // PAIRS
  { id: 'dawn_brigade',  name: 'Dawn Brigade',  description: 'Light champions stand together.',
    heroIds: ['luna', 'kaius'], bonus: { hp: 800, def: 50 }, emoji: '☀️' },
  { id: 'frost_paladin', name: 'Glacial Order', description: 'Frost mage paired with paladin shield.',
    heroIds: ['aelia', 'kaius'], bonus: { def: 60, atk: 50 }, emoji: '🧊' },
  { id: 'shadowblades',  name: 'Shadowblades',  description: 'Two assassins move as one.',
    heroIds: ['len', 'elara'], bonus: { spd: 25, crit: 0.08 }, emoji: '🗡️' },
  { id: 'mountain_creed',name: 'Mountain Creed',description: 'Monk and elf, forest and stone.',
    heroIds: ['kengo', 'elara'], bonus: { hp: 600, spd: 15 }, emoji: '🏔️' },
  { id: 'lightbearers',  name: 'Lightbearers',  description: 'Priestess and paladin radiate hope.',
    heroIds: ['luna', 'kaius'], bonus: { hp: 400, atk: 30 }, emoji: '✨' },

  // TRIPLES (full squad bonds — must be the entire squad)
  { id: 'light_choir',   name: 'Light Choir',   description: 'All Light heroes — a hymn of dawn.',
    heroIds: ['luna', 'kaius'], bonus: { atk: 100, hp: 500 }, emoji: '🎵' },
  { id: 'frost_court',   name: 'Frost Court',   description: 'Aelia leads a winter retinue.',
    heroIds: ['aelia', 'luna', 'kaius'], bonus: { atk: 80, def: 70, hp: 600 }, emoji: '❄️' },
  { id: 'twilight_pack', name: 'Twilight Pack', description: 'Three predators of the dusk.',
    heroIds: ['len', 'elara', 'kengo'], bonus: { spd: 30, crit: 0.10, atk: 80 }, emoji: '🌒' },
  { id: 'full_party',    name: 'United Front',  description: 'Any 3 heroes form a true team.',
    heroIds: ['*', '*', '*'], bonus: { hp: 300, atk: 30 }, emoji: '🤝' },
];

// Compute active bonds for a given squad of hero template IDs
export function activeBonds(squadTemplateIds: string[]): BondDef[] {
  const out: BondDef[] = [];
  const set = new Set(squadTemplateIds);
  for (const b of BONDS) {
    const need = b.heroIds;
    if (need.every(id => id === '*' || set.has(id))) {
      // Wildcard "any" bonds require squad to be at least that many heroes
      const wildcards = need.filter(id => id === '*').length;
      if (squadTemplateIds.length < wildcards) continue;
      out.push(b);
    }
  }
  return out;
}

// Returns aggregated bonus stats for a hero on a given squad — applies bond bonuses
// to EACH member of the bond.
export function bondBonusFor(heroTemplateId: string, squadTemplateIds: string[]): Partial<Record<LootStat, number>> {
  const out: Partial<Record<LootStat, number>> = {};
  for (const b of activeBonds(squadTemplateIds)) {
    // The hero benefits if they're either in heroIds explicitly or in a wildcard bond
    const isWildcard = b.heroIds.some(id => id === '*');
    const isMember = b.heroIds.includes(heroTemplateId);
    if (isWildcard || isMember) {
      for (const [stat, val] of Object.entries(b.bonus)) {
        out[stat as LootStat] = (out[stat as LootStat] ?? 0) + (val as number);
      }
    }
  }
  return out;
}
