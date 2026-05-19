import type { EquipSlot } from '../types';

export type LootRarity = 1 | 2 | 3 | 4 | 5;

export const LOOT_RARITY_NAME: Record<LootRarity, string> = {
  1: 'Common',
  2: 'Magic',
  3: 'Rare',
  4: 'Epic',
  5: 'Legendary',
};

export const LOOT_RARITY_COLOR: Record<LootRarity, string> = {
  1: '#9ca3af', // gray
  2: '#3b82f6', // blue
  3: '#facc15', // yellow
  4: '#a855f7', // purple
  5: '#f97316', // orange
};

export type LootStat = 'hp' | 'atk' | 'def' | 'spd' | 'crit';

export interface BaseItem {
  id: string;
  name: string;
  slot: EquipSlot;
  emoji: string;
  primary: LootStat;
  // Roll range at item level 1. Scales with item level (×(1 + (ilvl-1)*0.06))
  baseMin: number;
  baseMax: number;
  // Possible affix stats (excluding primary)
  affixPool: LootStat[];
}

export const BASE_ITEMS: BaseItem[] = [
  // Weapons
  { id: 'sword',  name: 'Sword',  slot: 'weapon', emoji: '⚔️', primary: 'atk',
    baseMin: 25, baseMax: 50, affixPool: ['atk', 'crit', 'spd', 'hp'] },
  { id: 'staff',  name: 'Staff',  slot: 'weapon', emoji: '🪄', primary: 'atk',
    baseMin: 30, baseMax: 60, affixPool: ['atk', 'crit', 'hp'] },
  { id: 'bow',    name: 'Bow',    slot: 'weapon', emoji: '🏹', primary: 'atk',
    baseMin: 22, baseMax: 45, affixPool: ['atk', 'spd', 'crit', 'def'] },
  { id: 'axe',    name: 'Axe',    slot: 'weapon', emoji: '🪓', primary: 'atk',
    baseMin: 30, baseMax: 55, affixPool: ['atk', 'hp', 'crit'] },

  // Armor
  { id: 'plate',  name: 'Plate Armor', slot: 'armor', emoji: '🛡️', primary: 'def',
    baseMin: 14, baseMax: 35, affixPool: ['hp', 'def', 'atk'] },
  { id: 'robe',   name: 'Robe',        slot: 'armor', emoji: '🥻', primary: 'def',
    baseMin: 6, baseMax: 18, affixPool: ['hp', 'atk', 'crit', 'spd'] },
  { id: 'leather',name: 'Leather Vest',slot: 'armor', emoji: '🦺', primary: 'def',
    baseMin: 10, baseMax: 24, affixPool: ['hp', 'spd', 'def'] },

  // Helms
  { id: 'helm',   name: 'Helm',  slot: 'helm', emoji: '⛑️', primary: 'hp',
    baseMin: 80, baseMax: 180, affixPool: ['hp', 'def', 'atk'] },
  { id: 'hood',   name: 'Hood',  slot: 'helm', emoji: '🧥', primary: 'hp',
    baseMin: 60, baseMax: 140, affixPool: ['spd', 'crit', 'hp'] },
  { id: 'crown',  name: 'Crown', slot: 'helm', emoji: '👑', primary: 'hp',
    baseMin: 100, baseMax: 220, affixPool: ['hp', 'crit', 'atk'] },

  // Boots
  { id: 'boots',  name: 'Boots', slot: 'boots', emoji: '🥾', primary: 'spd',
    baseMin: 6, baseMax: 18, affixPool: ['spd', 'def', 'hp'] },
  { id: 'sandals',name: 'Sandals', slot: 'boots', emoji: '👡', primary: 'spd',
    baseMin: 8, baseMax: 22, affixPool: ['spd', 'crit', 'def'] },

  // Accessories
  { id: 'amulet', name: 'Amulet', slot: 'accessory', emoji: '🔮', primary: 'crit',
    baseMin: 0.03, baseMax: 0.08, affixPool: ['atk', 'crit', 'spd', 'hp'] },
  { id: 'ring',   name: 'Ring',   slot: 'accessory', emoji: '💍', primary: 'atk',
    baseMin: 15, baseMax: 35, affixPool: ['atk', 'crit', 'hp'] },
  { id: 'talisman', name: 'Talisman', slot: 'accessory', emoji: '🧿', primary: 'hp',
    baseMin: 60, baseMax: 140, affixPool: ['hp', 'def', 'crit'] },
];

export const BASE_BY_ID = Object.fromEntries(BASE_ITEMS.map(b => [b.id, b]));

// Naming pools
export const PREFIXES = [
  'Iron', 'Steel', 'Bone', 'Shadow', 'Frost', 'Flame', 'Storm', 'Ancient',
  'Ruined', 'Sacred', 'Cursed', 'Royal', 'Dread', 'Glowing', 'Pale', 'Eldritch',
  'Grim', 'Sunlit', 'Lunar', 'Silver',
];

export const SUFFIX_BY_STAT: Record<LootStat, string[]> = {
  hp:   ['the Bear', 'the Mountain', 'Vigor', 'the Whale', 'the Boar', 'Stoneskin'],
  atk:  ['Slaying', 'the Bear', 'Ruin', 'the Storm', 'Doom', 'Carnage'],
  def:  ['Warding', 'the Turtle', 'the Wall', 'Iron', 'Aegis', 'Bulwark'],
  spd:  ['the Wind', 'the Fox', 'Haste', 'Swiftness', 'the Hare', 'Zephyr'],
  crit: ['Precision', 'the Hawk', 'the Eye', 'the Adept', 'Striking', 'Mastery'],
};

// Unique legendary names (rolled randomly for rarity 5)
export const LEGENDARY_NAMES: Record<EquipSlot, string[]> = {
  weapon:    ['Soulreaver', 'Worldender', 'Dawnbringer', 'Bonehowl', 'Voidpiercer'],
  armor:     ['Aegis of the Fallen', 'Carapace of Stars', 'Worldweave', 'Lichgrip Plate'],
  helm:      ['Crown of Embers', 'Witness Crown', 'Diadem of Silence', 'Skullveil'],
  boots:     ['Stridercaps', 'Wandering Hoof', 'Shadowstride', 'Moonwalker'],
  accessory: ['Heart of Yore', 'Lifestone', 'Souldrop', 'Eye of the Abyss', 'Astral Talisman'],
};

// Drop rate weights — sum doesn't have to be 100, the function normalizes.
export const RARITY_WEIGHTS: Record<LootRarity, number> = {
  1: 60,  // Common
  2: 28,  // Magic
  3: 9,   // Rare
  4: 2.5, // Epic
  5: 0.5, // Legendary
};

// Affix count per rarity
export const AFFIX_COUNT: Record<LootRarity, number> = {
  1: 0, 2: 1, 3: 2, 4: 3, 5: 4,
};

// Primary stat magnitude multiplier per rarity (above the baseMin/Max range)
export const PRIMARY_MULT: Record<LootRarity, [number, number]> = {
  1: [0.5, 0.8],   // 50-80% of base range
  2: [0.7, 1.0],
  3: [0.9, 1.2],
  4: [1.1, 1.4],
  5: [1.3, 1.7],
};
