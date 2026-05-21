// Ultimate gear sets — endgame, crafted from materials dropped on 3-star clears.
// Each hero has a 5-piece signature set with set-bonuses at 2 / 3 / 5 pieces equipped.

import type { EquipSlot } from '../types';
import type { LootStat } from './loot';

export type Stats = Partial<Record<LootStat, number>>;

export interface SetPieceDef {
  id: string;             // unique craft id, e.g. 'luna_dawn_scepter'
  setId: string;          // groups pieces — 'luna_dawn'
  name: string;
  slot: EquipSlot;
  emoji: string;
  stats: Stats;
  flavor: string;
  isUltimateWeapon?: boolean;   // The signature weapon piece (slot=weapon, slightly stronger)
  cost: { soulshard: number; essence: number; gold: number };
}

export interface UltimateSetDef {
  id: string;             // matches setId on each piece
  name: string;           // display name for the set
  heroId: string;         // which hero this set belongs to
  description: string;
  pieces: SetPieceDef[];
  // Set bonuses at thresholds
  bonuses: { atPieces: number; stats: Stats; description: string }[];
}

// Helper to make a craft cost
const c = (shard: number, ess: number, gold: number) =>
  ({ soulshard: shard, essence: ess, gold });

export const ULTIMATE_SETS: UltimateSetDef[] = [
  // LUNA — Healer / Light
  {
    id: 'luna_dawn',
    name: 'Dawn Regalia',
    heroId: 'luna',
    description: "Robes of the first light. Mends what is broken; burns what should not be.",
    pieces: [
      { id: 'luna_dawn_scepter', setId: 'luna_dawn', name: 'Dawn Scepter', slot: 'weapon', emoji: '☀️',
        stats: { atk: 1120, crit: 0.18, hp: 3200 }, flavor: 'Sealed with morning fire.',
        isUltimateWeapon: true, cost: c(120, 60, 40000) },
      { id: 'luna_dawn_veil', setId: 'luna_dawn', name: 'Dawn Veil', slot: 'armor', emoji: '🥻',
        stats: { def: 480, hp: 7200 }, flavor: 'Woven from dawnlight.',
        cost: c(60, 25, 18000) },
      { id: 'luna_dawn_circlet', setId: 'luna_dawn', name: 'Dawn Circlet', slot: 'helm', emoji: '👑',
        stats: { hp: 3600, def: 280, crit: 0.06 }, flavor: 'Halo of the dawn.',
        cost: c(50, 20, 15000) },
      { id: 'luna_dawn_steps', setId: 'luna_dawn', name: 'Dawn Steps', slot: 'boots', emoji: '👡',
        stats: { spd: 220, hp: 1600 }, flavor: 'Each step a sunrise.',
        cost: c(40, 15, 12000) },
      { id: 'luna_dawn_pendant', setId: 'luna_dawn', name: 'Dawn Pendant', slot: 'accessory', emoji: '☀',
        stats: { atk: 400, crit: 0.12, hp: 2000 }, flavor: 'Pulses with dawnlight.',
        cost: c(50, 20, 15000) },
    ],
    bonuses: [
      { atPieces: 2, stats: { hp: 3000 }, description: '+3000 HP' },
      { atPieces: 3, stats: { atk: 400, crit: 0.10 }, description: '+400 ATK · +10% CRIT' },
      { atPieces: 5, stats: { atk: 800, hp: 6000, crit: 0.15, spd: 60 },
        description: 'Full set: massive all-stat boost; passive healing on ultimate cast' },
    ],
  },

  // AELIA — Mage / Water
  {
    id: 'aelia_frost',
    name: 'Frostwhisper',
    heroId: 'aelia',
    description: "Crystal forged in midnight ice. The cold remembers your name.",
    pieces: [
      { id: 'aelia_frost_crystal', setId: 'aelia_frost', name: 'Frostwhisper Crystal', slot: 'weapon', emoji: '❄️',
        stats: { atk: 1440, crit: 0.20 }, flavor: 'Sings when winter walks.',
        isUltimateWeapon: true, cost: c(120, 60, 40000) },
      { id: 'aelia_frost_robe', setId: 'aelia_frost', name: 'Frostwhisper Robe', slot: 'armor', emoji: '🥋',
        stats: { def: 360, hp: 5600, atk: 400 }, flavor: 'Cold to the touch.',
        cost: c(60, 25, 18000) },
      { id: 'aelia_frost_hood', setId: 'aelia_frost', name: 'Frostwhisper Hood', slot: 'helm', emoji: '🧊',
        stats: { hp: 2800, crit: 0.08, atk: 320 }, flavor: 'Veil of permafrost.',
        cost: c(50, 20, 15000) },
      { id: 'aelia_frost_boots', setId: 'aelia_frost', name: 'Frostwhisper Boots', slot: 'boots', emoji: '🥾',
        stats: { spd: 240, def: 200 }, flavor: 'Walk where rivers freeze.',
        cost: c(40, 15, 12000) },
      { id: 'aelia_frost_talisman', setId: 'aelia_frost', name: 'Frost Talisman', slot: 'accessory', emoji: '💧',
        stats: { atk: 480, crit: 0.15 }, flavor: 'A frozen tear.',
        cost: c(50, 20, 15000) },
    ],
    bonuses: [
      { atPieces: 2, stats: { atk: 400 }, description: '+400 ATK' },
      { atPieces: 3, stats: { crit: 0.15, atk: 300 }, description: '+15% CRIT · +300 ATK' },
      { atPieces: 5, stats: { atk: 1000, crit: 0.20, hp: 3000 },
        description: 'Full set: spells slow targets; ultimate damage +40%' },
    ],
  },

  // KAIUS — Tank / Light
  {
    id: 'kaius_aegis',
    name: 'Aegis of Dawn',
    heroId: 'kaius',
    description: "An unyielding wall of light. The Cross stands.",
    pieces: [
      { id: 'kaius_aegis_blade', setId: 'kaius_aegis', name: 'Aegis Blade', slot: 'weapon', emoji: '🗡️',
        stats: { atk: 960, def: 320, hp: 6000 }, flavor: 'Reflects what strikes it.',
        isUltimateWeapon: true, cost: c(120, 60, 40000) },
      { id: 'kaius_aegis_plate', setId: 'kaius_aegis', name: 'Aegis Plate', slot: 'armor', emoji: '🛡️',
        stats: { def: 880, hp: 14000 }, flavor: 'No blade pierces it.',
        cost: c(60, 25, 18000) },
      { id: 'kaius_aegis_helm', setId: 'kaius_aegis', name: 'Aegis Helm', slot: 'helm', emoji: '⛑️',
        stats: { hp: 7200, def: 480 }, flavor: 'Eyes of the unbroken.',
        cost: c(50, 20, 15000) },
      { id: 'kaius_aegis_greaves', setId: 'kaius_aegis', name: 'Aegis Greaves', slot: 'boots', emoji: '🦶',
        stats: { spd: 160, def: 400, hp: 3200 }, flavor: 'Roots him to the earth.',
        cost: c(40, 15, 12000) },
      { id: 'kaius_aegis_seal', setId: 'kaius_aegis', name: 'Aegis Seal', slot: 'accessory', emoji: '✝️',
        stats: { hp: 4800, def: 320, atk: 240 }, flavor: 'The Cross, bound in light.',
        cost: c(50, 20, 15000) },
    ],
    bonuses: [
      { atPieces: 2, stats: { hp: 5000 }, description: '+5000 HP' },
      { atPieces: 3, stats: { def: 400, hp: 3000 }, description: '+400 DEF · +3000 HP' },
      { atPieces: 5, stats: { hp: 10000, def: 500, atk: 400 },
        description: 'Full set: damage reduction; taunt; passive shield each turn' },
    ],
  },

  // ELARA — Assassin / Earth (archer)
  {
    id: 'elara_worldweave',
    name: 'Worldweave',
    heroId: 'elara',
    description: "Bow of treelines and morning silence. Strikes from beyond sight.",
    pieces: [
      { id: 'elara_worldweave_bow', setId: 'elara_worldweave', name: 'Worldweave Bow', slot: 'weapon', emoji: '🏹',
        stats: { atk: 1360, spd: 200, crit: 0.22 }, flavor: 'Arrows that never miss.',
        isUltimateWeapon: true, cost: c(120, 60, 40000) },
      { id: 'elara_worldweave_vest', setId: 'elara_worldweave', name: 'Worldweave Vest', slot: 'armor', emoji: '🦺',
        stats: { def: 400, hp: 4800, spd: 120 }, flavor: 'Bark-fiber weave.',
        cost: c(60, 25, 18000) },
      { id: 'elara_worldweave_hood', setId: 'elara_worldweave', name: 'Worldweave Hood', slot: 'helm', emoji: '🎩',
        stats: { hp: 2400, spd: 100, crit: 0.10 }, flavor: 'The forest closes around her.',
        cost: c(50, 20, 15000) },
      { id: 'elara_worldweave_boots', setId: 'elara_worldweave', name: 'Worldweave Boots', slot: 'boots', emoji: '🥾',
        stats: { spd: 360, crit: 0.08 }, flavor: 'Silent over leaves.',
        cost: c(40, 15, 12000) },
      { id: 'elara_worldweave_quiver', setId: 'elara_worldweave', name: 'Worldweave Quiver', slot: 'accessory', emoji: '🪶',
        stats: { atk: 520, crit: 0.15, spd: 100 }, flavor: 'Arrows that whisper.',
        cost: c(50, 20, 15000) },
    ],
    bonuses: [
      { atPieces: 2, stats: { spd: 60 }, description: '+60 SPD' },
      { atPieces: 3, stats: { atk: 400, crit: 0.12 }, description: '+400 ATK · +12% CRIT' },
      { atPieces: 5, stats: { atk: 800, spd: 120, crit: 0.20 },
        description: 'Full set: crit chains; first strike each round; +50% ult dmg' },
    ],
  },

  // KENGO — Warrior / Earth (monk)
  {
    id: 'kengo_iron',
    name: 'Iron Mountain',
    heroId: 'kengo',
    description: "Robes worn through a thousand sunrises. The mountain teaches stillness, then fury.",
    pieces: [
      { id: 'kengo_iron_gauntlets', setId: 'kengo_iron', name: 'Iron Mountain Gauntlets', slot: 'weapon', emoji: '🥊',
        stats: { atk: 1280, hp: 6000, def: 320 }, flavor: 'Cracks bedrock.',
        isUltimateWeapon: true, cost: c(120, 60, 40000) },
      { id: 'kengo_iron_robes', setId: 'kengo_iron', name: 'Iron Mountain Robes', slot: 'armor', emoji: '🥋',
        stats: { def: 640, hp: 10000 }, flavor: 'Patches of mountain shadow.',
        cost: c(60, 25, 18000) },
      { id: 'kengo_iron_band', setId: 'kengo_iron', name: 'Iron Mountain Band', slot: 'helm', emoji: '🧵',
        stats: { hp: 4800, def: 360 }, flavor: 'Sashed across the brow.',
        cost: c(50, 20, 15000) },
      { id: 'kengo_iron_sandals', setId: 'kengo_iron', name: 'Iron Mountain Sandals', slot: 'boots', emoji: '👡',
        stats: { spd: 140, def: 320, hp: 2400 }, flavor: 'Worn through stone.',
        cost: c(40, 15, 12000) },
      { id: 'kengo_iron_beads', setId: 'kengo_iron', name: 'Prayer Beads of Iron', slot: 'accessory', emoji: '📿',
        stats: { atk: 440, hp: 3600 }, flavor: 'A thousand recitations.',
        cost: c(50, 20, 15000) },
    ],
    bonuses: [
      { atPieces: 2, stats: { hp: 4000 }, description: '+4000 HP' },
      { atPieces: 3, stats: { atk: 400, def: 200 }, description: '+400 ATK · +200 DEF' },
      { atPieces: 5, stats: { atk: 700, hp: 7000, def: 300 },
        description: 'Full set: counter-attack when hit; iron-skin (10% dmg reduction)' },
    ],
  },

  // LEN — Assassin / Dark
  {
    id: 'len_eclipse',
    name: 'Eclipse Blades',
    heroId: 'len',
    description: "Twin daggers of moonless ink. She steps; you bleed.",
    pieces: [
      { id: 'len_eclipse_blades', setId: 'len_eclipse', name: 'Twin Eclipse Daggers', slot: 'weapon', emoji: '🗡️',
        stats: { atk: 1520, crit: 0.28, spd: 120 }, flavor: 'They drink the dark.',
        isUltimateWeapon: true, cost: c(120, 60, 40000) },
      { id: 'len_eclipse_cloak', setId: 'len_eclipse', name: 'Eclipse Cloak', slot: 'armor', emoji: '🧥',
        stats: { def: 320, hp: 4400, spd: 160 }, flavor: 'Drinks the lamplight.',
        cost: c(60, 25, 18000) },
      { id: 'len_eclipse_mask', setId: 'len_eclipse', name: 'Eclipse Mask', slot: 'helm', emoji: '🎭',
        stats: { hp: 2000, crit: 0.12, spd: 80 }, flavor: 'No one sees her face.',
        cost: c(50, 20, 15000) },
      { id: 'len_eclipse_treads', setId: 'len_eclipse', name: 'Eclipse Treads', slot: 'boots', emoji: '🥾',
        stats: { spd: 400, crit: 0.08 }, flavor: 'Soundless.',
        cost: c(40, 15, 12000) },
      { id: 'len_eclipse_charm', setId: 'len_eclipse', name: 'Eclipse Charm', slot: 'accessory', emoji: '🌒',
        stats: { atk: 560, crit: 0.18 }, flavor: 'A sliver of the lost moon.',
        cost: c(50, 20, 15000) },
    ],
    bonuses: [
      { atPieces: 2, stats: { crit: 0.10 }, description: '+10% CRIT' },
      { atPieces: 3, stats: { atk: 500, spd: 80 }, description: '+500 ATK · +80 SPD' },
      { atPieces: 5, stats: { atk: 1000, crit: 0.25, spd: 120 },
        description: 'Full set: crits deal +30% dmg; assassinate low-HP targets' },
    ],
  },

  // PYRA — Fire Mage
  {
    id: 'pyra_inferno',
    name: 'Infernal Cataclysm',
    heroId: 'pyra',
    description: 'Robes forged in volcanic forge. Every breath rekindles the world-burn.',
    pieces: [
      { id: 'pyra_inferno_staff', setId: 'pyra_inferno', name: 'Infernal Staff', slot: 'weapon', emoji: '🔥',
        stats: { atk: 1440, crit: 0.20, hp: 2400 }, flavor: 'Ember-crystal forever crackling.',
        isUltimateWeapon: true, cost: c(120, 60, 40000) },
      { id: 'pyra_inferno_robes', setId: 'pyra_inferno', name: 'Infernal Robes', slot: 'armor', emoji: '🧥',
        stats: { def: 400, hp: 6000, atk: 400 }, flavor: 'Scorched silk of the burning court.',
        cost: c(60, 25, 18000) },
      { id: 'pyra_inferno_diadem', setId: 'pyra_inferno', name: 'Infernal Diadem', slot: 'helm', emoji: '👑',
        stats: { hp: 2800, crit: 0.10, atk: 320 }, flavor: 'Crown of living flame.',
        cost: c(50, 20, 15000) },
      { id: 'pyra_inferno_sandals', setId: 'pyra_inferno', name: 'Infernal Sandals', slot: 'boots', emoji: '🥿',
        stats: { spd: 220, def: 160, atk: 240 }, flavor: 'Burning footprints linger.',
        cost: c(40, 15, 12000) },
      { id: 'pyra_inferno_ember', setId: 'pyra_inferno', name: 'Heart of Ember', slot: 'accessory', emoji: '💎',
        stats: { atk: 560, crit: 0.15, hp: 1600 }, flavor: 'A heart that never cools.',
        cost: c(50, 20, 15000) },
    ],
    bonuses: [
      { atPieces: 2, stats: { atk: 400 }, description: '+400 ATK' },
      { atPieces: 3, stats: { crit: 0.15, atk: 400 }, description: '+15% CRIT · +400 ATK' },
      { atPieces: 5, stats: { atk: 1200, crit: 0.20, hp: 3000 },
        description: 'Full set: ultimate burn DoT doubled; fire damage +50%' },
    ],
  },

  // KORVAN — Soul Reaper
  {
    id: 'korvan_blackharvest',
    name: 'Black Harvest',
    heroId: 'korvan',
    description: 'A scythe blessed in graveyard ichor. Each cut sips a soul.',
    pieces: [
      { id: 'korvan_blackharvest_scythe', setId: 'korvan_blackharvest', name: 'Black Harvest Scythe', slot: 'weapon', emoji: '⚔️',
        stats: { atk: 1360, crit: 0.25, hp: 3200 }, flavor: 'The blade hums when blood is near.',
        isUltimateWeapon: true, cost: c(120, 60, 40000) },
      { id: 'korvan_blackharvest_cloak', setId: 'korvan_blackharvest', name: 'Reaper Cloak', slot: 'armor', emoji: '🧥',
        stats: { def: 440, hp: 8000, atk: 320 }, flavor: 'Tattered like wings of crows.',
        cost: c(60, 25, 18000) },
      { id: 'korvan_blackharvest_hood', setId: 'korvan_blackharvest', name: 'Skull Hood', slot: 'helm', emoji: '💀',
        stats: { hp: 3200, crit: 0.10, def: 240 }, flavor: 'Bone trims darken every glance.',
        cost: c(50, 20, 15000) },
      { id: 'korvan_blackharvest_treads', setId: 'korvan_blackharvest', name: 'Grave Treads', slot: 'boots', emoji: '👢',
        stats: { spd: 220, def: 200, atk: 200 }, flavor: 'Step without rustling the dead.',
        cost: c(40, 15, 12000) },
      { id: 'korvan_blackharvest_pendant', setId: 'korvan_blackharvest', name: 'Soul-Drink Pendant', slot: 'accessory', emoji: '🌑',
        stats: { atk: 520, crit: 0.18, hp: 2000 }, flavor: 'A small vial of the dying breath.',
        cost: c(50, 20, 15000) },
    ],
    bonuses: [
      { atPieces: 2, stats: { crit: 0.10 }, description: '+10% CRIT' },
      { atPieces: 3, stats: { atk: 500, crit: 0.10 }, description: '+500 ATK · +10% CRIT' },
      { atPieces: 5, stats: { atk: 1000, crit: 0.30, hp: 4000 },
        description: 'Full set: every crit lifesteals; ultimate +50% damage' },
    ],
  },
];

export const SET_BY_ID = Object.fromEntries(ULTIMATE_SETS.map(s => [s.id, s]));
export const PIECE_BY_ID: Record<string, SetPieceDef> = {};
for (const s of ULTIMATE_SETS) for (const p of s.pieces) PIECE_BY_ID[p.id] = p;

export const SET_BY_HERO: Record<string, UltimateSetDef> = Object.fromEntries(
  ULTIMATE_SETS.map(s => [s.heroId, s])
);

// Materials
export const MAT_SOULSHARD = 'mat_soulshard';
export const MAT_ESSENCE_PREFIX = 'mat_essence_';
export const essenceItemId = (heroId: string) => `${MAT_ESSENCE_PREFIX}${heroId}`;

export const MATERIAL_META: Record<string, { name: string; emoji: string; description: string }> = {
  [MAT_SOULSHARD]: {
    name: 'Soulshard',
    emoji: '💠',
    description: '3-star clear drop. Used in every craft.',
  },
};

export function essenceMeta(heroId: string) {
  return {
    id: essenceItemId(heroId),
    name: `${heroId.charAt(0).toUpperCase() + heroId.slice(1)} Essence`,
    emoji: '🔮',
    description: `Rare 3-star drop. Crafts ${heroId}'s set.`,
  };
}

// Mythic rarity color (above Legendary)
export const MYTHIC_COLOR = '#fb7185'; // rose
