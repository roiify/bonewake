import type { HeroTemplate } from '../types';
import { asset } from '../lib/assetPath';

const A = (p: string) => asset(p);

const stat = (hp: number, atk: number, def: number, spd: number, crit = 0.1) =>
  ({ hp, atk, def, spd, crit });

// 6 heroes from Echoes of the Grave. All start at S tier (rarity 3) — the same
// hero can be promoted up through SS / SSS / SSS+ via fragments.
// Stats are tuned for S-tier baseline; each tier multiplies via STAR_MULT in stats.ts.
//
// Pull-weight: lower weight = harder to pull. We use this for the Novice banner
// to favor "weaker" / common-feeling heroes.
export const HERO_TEMPLATES: (HeroTemplate & { pullWeight: number })[] = [
  {
    id: 'kengo',
    name: 'Kengo',
    rarity: 3,
    element: 'earth',
    archetype: 'warrior',
    // Bruiser balance: solid HP/ATK/DEF, moderate SPD/CRIT
    baseStats: stat(1100, 135, 85, 70, 0.13),
    ultimateId: 'iron_palm',
    emoji: '🥋',
    color: '#a16207',
    flavor: 'Wandering monk. His fists shatter bone.',
    pullWeight: 28,
  },
  {
    id: 'elara',
    name: 'Elara',
    rarity: 3,
    element: 'earth',
    archetype: 'assassin',
    // Ranger assassin: fragile, blazing SPD + very high CRIT
    baseStats: stat(820, 140, 55, 90, 0.20),
    ultimateId: 'arrow_volley',
    emoji: '🏹',
    color: '#65a30d',
    flavor: 'Elven archer. Strikes from the treeline.',
    pullWeight: 28,
  },
  {
    id: 'len',
    name: 'Arcaveli',
    rarity: 3,
    element: 'dark',
    archetype: 'assassin',
    // Pure speed-crit dagger assassin: highest SPD/CRIT in the roster
    baseStats: stat(820, 145, 55, 95, 0.22),
    ultimateId: 'shadow_dance',
    emoji: '🗡️',
    color: '#7c3aed',
    flavor: 'Twin-blade killer. Already behind you.',
    pullWeight: 18,
  },
  {
    id: 'luna',
    name: 'Luna',
    rarity: 3,
    element: 'light',
    archetype: 'healer',
    // Survivable support: bumped HP + DEF (per "healer = more defense + heal");
    // value comes from her passive heals + ult, not raw ATK
    baseStats: stat(1200, 110, 110, 65, 0.10),
    ultimateId: 'dawn_resurrection',
    emoji: '✨',
    color: '#fde047',
    flavor: 'Priestess of the dawn. Mends what is broken.',
    pullWeight: 8,
  },
  {
    id: 'aelia',
    name: 'Aelia',
    rarity: 3,
    element: 'water',
    archetype: 'mage',
    // Frost caster: high ATK, fragile, moderate CRIT
    baseStats: stat(850, 170, 60, 75, 0.14),
    ultimateId: 'frost_crystal',
    emoji: '❄️',
    color: '#60a5fa',
    flavor: 'Frost mage. Her crystal sings a winter song.',
    pullWeight: 8,
  },
  {
    id: 'kaius',
    name: 'Kaius',
    rarity: 3,
    element: 'light',
    archetype: 'tank',
    // Wall with respectable swings: highest HP/DEF, lower (but viable) ATK,
    // bottom-tier SPD/CRIT. Atk bumped from 110 so he isn't a damage void.
    baseStats: stat(1800, 145, 145, 50, 0.08),
    ultimateId: 'aegis_judgment',
    emoji: '🛡️',
    color: '#fbbf24',
    flavor: 'Paladin of the Cross. Will not yield.',
    pullWeight: 4,
  },
  {
    id: 'pyra',
    name: 'Pyra',
    rarity: 3,
    element: 'fire',
    archetype: 'mage',
    // Burn DPS: highest ATK among mages, fragile
    baseStats: stat(850, 170, 55, 75, 0.14),
    ultimateId: 'infernal_cataclysm',
    emoji: '🔥',
    color: '#f97316',
    flavor: 'Pyromancer of the Burning Court. Embers ride her breath.',
    pullWeight: 6,
  },
  {
    id: 'korvan',
    name: 'Korvan',
    rarity: 3,
    element: 'dark',
    archetype: 'warrior',
    // Crit-warrior: scythe wielder, balanced HP/ATK/DEF, above-average CRIT
    baseStats: stat(1080, 140, 75, 70, 0.17),
    ultimateId: 'soul_harvest',
    emoji: '🌑',
    color: '#9f1239',
    flavor: 'Soul-Reaper of the Black Harvest. Each kill feeds his blade.',
    pullWeight: 5,
  },
  {
    id: 'george',
    name: 'George',
    rarity: 3,
    element: 'earth',
    archetype: 'warrior',
    // Beefy shapeshifter frontline: highest warrior HP, solid DEF
    baseStats: stat(1280, 130, 95, 65, 0.10),
    ultimateId: 'primal_form',
    emoji: '🐺',
    color: '#16a34a',
    flavor: 'Druid of the Last Grove. Shapeshifts between man, wolf, and bear.',
    pullWeight: 5,
  },
  {
    id: 'manny',
    name: 'Manny',
    rarity: 3,
    element: 'dark',
    archetype: 'mage',
    // Necromancer caster: high ATK, fragile, moderate CRIT
    // Solo lineup: Manny battles alone with his summons. No party slots.
    baseStats: stat(880, 165, 65, 70, 0.14),
    ultimateId: 'army_of_the_dead',
    emoji: '💀',
    color: '#7c3aed',
    flavor: 'Death Caller. Battles alone — his minions are his party.',
    pullWeight: 3,
  },
  // ============ NEW V1 HEROES (Chino, Reiji, Twins) ============
  // Power budgets target ~1300 base power (mid-upper of the existing band
  // of 1100-1340) so they feel competitive without dominating.
  {
    id: 'chino',
    name: 'Chino',
    rarity: 3,
    element: 'dark',
    archetype: 'warrior',
    // Drunken brawler — high SPD + CRIT, moderate HP/DEF. His "drunken
    // ramp" is conveyed through high CRIT chance (he gets reckless and
    // wild as he fights), not a stack mechanic.
    baseStats: stat(1050, 135, 75, 85, 0.16),
    ultimateId: 'drunken_palm',
    emoji: '🍶',
    color: '#d97706',
    flavor: 'Drunken master. The deeper the drink, the wilder the strike.',
    pullWeight: 5,
  },
  {
    id: 'reiji',
    name: 'Reiji',
    rarity: 3,
    element: 'dark',
    archetype: 'warrior',
    // Twin-blade samurai. Yin/yang duality means he can hit hard in any
    // direction — modelled as AOE ult with high ATK/CRIT but glassier
    // than Korvan (lower HP for the dramatic risk-reward feel).
    baseStats: stat(1000, 150, 70, 80, 0.15),
    ultimateId: 'dual_eclipse',
    emoji: '⚔️',
    color: '#e5e7eb',
    flavor: 'Half light, half shadow. His twin blades strike as one.',
    pullWeight: 4,
  },
  {
    id: 'twins',
    name: 'Tatiana & Roiify',
    rarity: 3,
    element: 'light',
    archetype: 'mage',
    // Yin-yang twin duo — one squad slot, two fighters. Per user balance
    // note: Twins sit SLIGHTLY above the rest of the roster (~15-20%
    // higher base power) to reflect that they're two combatants sharing
    // one slot. Combined HP/ATK/SPD pushed up; CRIT moderate.
    baseStats: stat(1300, 175, 80, 90, 0.15),
    ultimateId: 'yin_yang_strike',
    emoji: '☯️',
    color: '#f0abfc',
    flavor: 'Husband and wife, bound as one. They strike together, they fall together.',
    pullWeight: 4,
  },
  // ============ MANNY'S SUMMONS (hidden from gacha/roster) ============
  // These templates exist so the squad logic can fill Manny's solo team
  // with Bone King + Lich Sovereign. They're NOT pullable and don't show
  // in the roster — UI filters them by templateId.
  {
    id: 'bone_king',
    name: 'Bone King',
    rarity: 3,
    element: 'dark',
    archetype: 'warrior',
    // Tank-warrior summon: tanky, low SPD, single-target ult
    baseStats: stat(1150, 115, 100, 50, 0.10),
    ultimateId: 'bone_strike',
    emoji: '🦴',
    color: '#94a3b8',
    flavor: "Manny's risen warrior-king. A wall of bone.",
    pullWeight: 0,  // not pullable
  },
  {
    id: 'lich_sovereign',
    name: 'Lich Sovereign',
    rarity: 3,
    element: 'dark',
    archetype: 'mage',
    // Glass-cannon summon: AOE caster, fragile but dangerous
    baseStats: stat(720, 165, 50, 70, 0.16),
    ultimateId: 'lich_blast',
    emoji: '👑',
    color: '#06b6d4',
    flavor: "Manny's crowned phantom. Voids the air with death.",
    pullWeight: 0,  // not pullable
  },
];

// Manny's summon IDs — used to filter from gacha/roster and to auto-fill
// the squad slots when Manny is picked.
export const MANNY_SUMMON_IDS = ['bone_king', 'lich_sovereign'] as const;
// All hidden hero templateIds — exclude from gacha pull pool and roster display.
export const HIDDEN_HERO_IDS = new Set<string>(MANNY_SUMMON_IDS);

export const HERO_BY_ID = Object.fromEntries(HERO_TEMPLATES.map(h => [h.id, h]));

// Portrait sprites — south-facing (camera-facing), used in menus, rosters,
// hero detail portrait card. Battle uses HERO_SPRITES (east-facing) instead.
export const HERO_PORTRAITS: Record<string, string> = {
  luna:   A('sprites/pixellab/heroes/pro/luna_south.png'),
  elara:  A('sprites/pixellab/heroes/pro/elara_south.png'),
  aelia:  A('sprites/pixellab/heroes/pro/aelia_south.png'),
  kengo:  A('sprites/pixellab/heroes/pro/kengo_south.png'),
  len:    A('sprites/pixellab/heroes/pro/len_south.png'),
  kaius:  A('sprites/pixellab/heroes/pro/kaius_south.png'),
  pyra:   A('sprites/pixellab/heroes/pro/pyra_south.png'),
  korvan: A('sprites/pixellab/heroes/pro/korvan_south.png'),
  george: A('sprites/pixellab/heroes/pro/george_south.png'),
  manny:  A('sprites/pixellab/heroes/pro/manny_south.png'),
  bone_king:      A('sprites/pixellab/heroes/pro/bone_king_south.png'),
  lich_sovereign: A('sprites/pixellab/heroes/pro/lich_sovereign_south.png'),
  chino:    A('sprites/pixellab/heroes/pro/chino_south.png'),
  reiji:    A('sprites/pixellab/heroes/pro/reiji_south.png'),
  twins:    A('sprites/pixellab/heroes/pro/twins_south.png'),
};

export const HERO_SPRITES: Record<string, {
  idle: string;
  attack: string;
  skill: string;     // mid-power skill (fires at 50 energy)
  ult: string;       // full cinematic (fires at 100 energy)
  hit: string;
  death: string;
  // Optional dedicated healing animation. Used when this hero's action is
  // a heal (action.heal > 0). When omitted the renderer falls back to
  // attack so the old behavior is preserved.
  heal?: string;
  cols: number;
  rows: number;
}> = {
  // New PixelLab mature-fantasy sprites. Static for now (all 5 poses point to the
  // same base) — multi-frame animation strips will replace these per-pose as the
  // animate-with-text pipeline produces them.
  luna:           { idle: A('sprites/pixellab/heroes/pro/luna_east.png'), attack: A('sprites/pixellab/heroes/pro/luna_east.png'), skill: A('sprites/pixellab/heroes/pro/luna_east.png'), ult: A('sprites/pixellab/heroes/pro/luna_east.png'), hit: A('sprites/pixellab/heroes/pro/luna_east.png'), death: A('sprites/pixellab/heroes/pro/luna_east.png'), cols: 1, rows: 1 },
  elara:          { idle: A('sprites/pixellab/heroes/pro/elara_east.png'), attack: A('sprites/pixellab/heroes/pro/elara_east.png'), skill: A('sprites/pixellab/heroes/pro/elara_east.png'), ult: A('sprites/pixellab/heroes/pro/elara_east.png'), hit: A('sprites/pixellab/heroes/pro/elara_east.png'), death: A('sprites/pixellab/heroes/pro/elara_east.png'), cols: 1, rows: 1 },
  aelia:          { idle: A('sprites/pixellab/heroes/pro/aelia_east.png'), attack: A('sprites/pixellab/heroes/pro/aelia_east.png'), skill: A('sprites/pixellab/heroes/pro/aelia_east.png'), ult: A('sprites/pixellab/heroes/pro/aelia_east.png'), hit: A('sprites/pixellab/heroes/pro/aelia_east.png'), death: A('sprites/pixellab/heroes/pro/aelia_east.png'), cols: 1, rows: 1 },
  kengo:          { idle: A('sprites/pixellab/heroes/pro/kengo_east.png'), attack: A('sprites/pixellab/heroes/pro/kengo_east.png'), skill: A('sprites/pixellab/heroes/pro/kengo_east.png'), ult: A('sprites/pixellab/heroes/pro/kengo_east.png'), hit: A('sprites/pixellab/heroes/pro/kengo_east.png'), death: A('sprites/pixellab/heroes/pro/kengo_east.png'), cols: 1, rows: 1 },
  len:            { idle: A('sprites/pixellab/heroes/pro/len_east.png'), attack: A('sprites/pixellab/heroes/pro/len_east.png'), skill: A('sprites/pixellab/heroes/pro/len_east.png'), ult: A('sprites/pixellab/heroes/pro/len_east.png'), hit: A('sprites/pixellab/heroes/pro/len_east.png'), death: A('sprites/pixellab/heroes/pro/len_east.png'), cols: 1, rows: 1 },
  kaius:          { idle: A('sprites/pixellab/heroes/pro/kaius_east.png'), attack: A('sprites/pixellab/heroes/pro/kaius_east.png'), skill: A('sprites/pixellab/heroes/pro/kaius_east.png'), ult: A('sprites/pixellab/heroes/pro/kaius_east.png'), hit: A('sprites/pixellab/heroes/pro/kaius_east.png'), death: A('sprites/pixellab/heroes/pro/kaius_east.png'), cols: 1, rows: 1 },
  pyra:           { idle: A('sprites/pixellab/heroes/pro/pyra_east.png'), attack: A('sprites/pixellab/heroes/pro/pyra_east.png'), skill: A('sprites/pixellab/heroes/pro/pyra_east.png'), ult: A('sprites/pixellab/heroes/pro/pyra_east.png'), hit: A('sprites/pixellab/heroes/pro/pyra_east.png'), death: A('sprites/pixellab/heroes/pro/pyra_east.png'), cols: 1, rows: 1 },
  korvan:         { idle: A('sprites/pixellab/heroes/pro/korvan_east.png'), attack: A('sprites/pixellab/heroes/pro/korvan_east.png'), skill: A('sprites/pixellab/heroes/pro/korvan_east.png'), ult: A('sprites/pixellab/heroes/pro/korvan_east.png'), hit: A('sprites/pixellab/heroes/pro/korvan_east.png'), death: A('sprites/pixellab/heroes/pro/korvan_east.png'), cols: 1, rows: 1 },
  // George shapeshifts: skill = wolf form, ult = bear form. attack stays in human form.
  george:         { idle: A('sprites/pixellab/heroes/pro/george_east.png'), attack: A('sprites/pixellab/heroes/pro/george_east.png'), skill: A('sprites/pixellab/heroes/pro/george_east.png'), ult: A('sprites/pixellab/heroes/pro/george_east.png'), hit: A('sprites/pixellab/heroes/pro/george_east.png'), death: A('sprites/pixellab/heroes/pro/george_east.png'), cols: 1, rows: 1 },
  manny:          { idle: A('sprites/pixellab/heroes/pro/manny_east.png'), attack: A('sprites/pixellab/heroes/pro/manny_east.png'), skill: A('sprites/pixellab/heroes/pro/manny_east.png'), ult: A('sprites/pixellab/heroes/pro/manny_east.png'), hit: A('sprites/pixellab/heroes/pro/manny_east.png'), death: A('sprites/pixellab/heroes/pro/manny_east.png'), cols: 1, rows: 1 },
  bone_king:      { idle: A('sprites/pixellab/heroes/pro/bone_king_east.png'), attack: A('sprites/pixellab/heroes/pro/bone_king_east.png'), skill: A('sprites/pixellab/heroes/pro/bone_king_east.png'), ult: A('sprites/pixellab/heroes/pro/bone_king_east.png'), hit: A('sprites/pixellab/heroes/pro/bone_king_east.png'), death: A('sprites/pixellab/heroes/pro/bone_king_east.png'), cols: 1, rows: 1 },
  lich_sovereign: { idle: A('sprites/pixellab/heroes/pro/lich_sovereign_east.png'), attack: A('sprites/pixellab/heroes/pro/lich_sovereign_east.png'), skill: A('sprites/pixellab/heroes/pro/lich_sovereign_east.png'), ult: A('sprites/pixellab/heroes/pro/lich_sovereign_east.png'), hit: A('sprites/pixellab/heroes/pro/lich_sovereign_east.png'), death: A('sprites/pixellab/heroes/pro/lich_sovereign_east.png'), cols: 1, rows: 1 },
  chino:          { idle: A('sprites/pixellab/heroes/pro/chino_east.png'), attack: A('sprites/pixellab/heroes/pro/chino_east.png'), skill: A('sprites/pixellab/heroes/pro/chino_east.png'), ult: A('sprites/pixellab/heroes/pro/chino_east.png'), hit: A('sprites/pixellab/heroes/pro/chino_east.png'), death: A('sprites/pixellab/heroes/pro/chino_east.png'), cols: 1, rows: 1 },
  reiji:          { idle: A('sprites/pixellab/heroes/pro/reiji_east.png'), attack: A('sprites/pixellab/heroes/pro/reiji_east.png'), skill: A('sprites/pixellab/heroes/pro/reiji_east.png'), ult: A('sprites/pixellab/heroes/pro/reiji_east.png'), hit: A('sprites/pixellab/heroes/pro/reiji_east.png'), death: A('sprites/pixellab/heroes/pro/reiji_east.png'), cols: 1, rows: 1 },
  twins:          { idle: A('sprites/pixellab/heroes/pro/twins_east.png'), attack: A('sprites/pixellab/heroes/pro/twins_east.png'), skill: A('sprites/pixellab/heroes/pro/twins_east.png'), ult: A('sprites/pixellab/heroes/pro/twins_east.png'), hit: A('sprites/pixellab/heroes/pro/twins_east.png'), death: A('sprites/pixellab/heroes/pro/twins_east.png'), cols: 1, rows: 1 },
};

export const ENEMY_SPRITES: Record<string, {
  idle: string;
  attack?: string;
  skill?: string;
  hit?: string;
  death?: string;
  // Optional south-facing portrait used only in pre-battle preview
  // thumbnails. Battle still uses idle (east-facing, mirrored).
  portrait?: string;
  cols: number;
  rows: number;
  // Painted-boss attack atlases generated via PixelLab animate_object
  // are 9 frames wide while their idle is a single painted PNG. When
  // present, attackCols overrides cols for the attack/skill animation
  // only — idle / hit / death still use the cols/rows above (typically 1).
  attackCols?: number;
}> = {
  // World boss tier
  worldboss_1: { idle: A('sprites/echoes/enemies/worldboss_1_idle.png'), attack: A('sprites/echoes/enemies/worldboss_1_attack.png'), skill: A('sprites/echoes/enemies/worldboss_1_idle.png'), hit: A('sprites/echoes/enemies/worldboss_1_hit.png'), death: A('sprites/echoes/enemies/worldboss_1_idle.png'), portrait: A('sprites/echoes/enemies/worldboss_1_portrait.png'), cols: 17, rows: 1 },
  shambler: { idle: A('sprites/pixellab/enemies/pro/shambler_west.png'), attack: A('sprites/pixellab/enemies/pro/shambler_west.png'), skill: A('sprites/pixellab/enemies/pro/shambler_west.png'), hit: A('sprites/pixellab/enemies/pro/shambler_west.png'), death: A('sprites/pixellab/enemies/pro/shambler_west.png'), portrait: A('sprites/pixellab/enemies/pro/shambler_south.png'), cols: 1, rows: 1 },
  boneknight: { idle: A('sprites/pixellab/enemies/pro/boneknight_west.png'), attack: A('sprites/pixellab/enemies/pro/boneknight_west.png'), skill: A('sprites/pixellab/enemies/pro/boneknight_west.png'), hit: A('sprites/pixellab/enemies/pro/boneknight_west.png'), death: A('sprites/pixellab/enemies/pro/boneknight_west.png'), portrait: A('sprites/pixellab/enemies/pro/boneknight_south.png'), cols: 1, rows: 1 },
  fastghoul: { idle: A('sprites/pixellab/enemies/pro/fastghoul_west.png'), attack: A('sprites/pixellab/enemies/pro/fastghoul_west.png'), skill: A('sprites/pixellab/enemies/pro/fastghoul_west.png'), hit: A('sprites/pixellab/enemies/pro/fastghoul_west.png'), death: A('sprites/pixellab/enemies/pro/fastghoul_west.png'), portrait: A('sprites/pixellab/enemies/pro/fastghoul_south.png'), cols: 1, rows: 1 },
  graveyardlich: { idle: A('sprites/pixellab/enemies/pro/graveyardlich_west.png'), attack: A('sprites/pixellab/enemies/pro/graveyardlich_west.png'), skill: A('sprites/pixellab/enemies/pro/graveyardlich_west.png'), hit: A('sprites/pixellab/enemies/pro/graveyardlich_west.png'), death: A('sprites/pixellab/enemies/pro/graveyardlich_west.png'), portrait: A('sprites/pixellab/enemies/pro/graveyardlich_south.png'), cols: 1, rows: 1 },
  // Chapter 7 enemies are single-frame portraits (cols:1 rows:1) — each pose
  // is one full 1024x1024 image, not a 4x4 atlas like the original cast.
  undead_archer: { idle: A('sprites/pixellab/enemies/pro/undead_archer_west.png'), attack: A('sprites/pixellab/enemies/pro/undead_archer_west.png'), skill: A('sprites/pixellab/enemies/pro/undead_archer_west.png'), hit: A('sprites/pixellab/enemies/pro/undead_archer_west.png'), death: A('sprites/pixellab/enemies/pro/undead_archer_west.png'), portrait: A('sprites/pixellab/enemies/pro/undead_archer_south.png'), cols: 1, rows: 1 },
  plague_caster: { idle: A('sprites/pixellab/enemies/pro/plague_caster_west.png'), attack: A('sprites/pixellab/enemies/pro/plague_caster_west.png'), skill: A('sprites/pixellab/enemies/pro/plague_caster_west.png'), hit: A('sprites/pixellab/enemies/pro/plague_caster_west.png'), death: A('sprites/pixellab/enemies/pro/plague_caster_west.png'), portrait: A('sprites/pixellab/enemies/pro/plague_caster_south.png'), cols: 1, rows: 1 },
  fallen_captain: { idle: A('sprites/pixellab/enemies/pro/fallen_captain_west.png'), attack: A('sprites/pixellab/enemies/pro/fallen_captain_west.png'), skill: A('sprites/pixellab/enemies/pro/fallen_captain_west.png'), hit: A('sprites/pixellab/enemies/pro/fallen_captain_west.png'), death: A('sprites/pixellab/enemies/pro/fallen_captain_west.png'), portrait: A('sprites/pixellab/enemies/pro/fallen_captain_south.png'), cols: 1, rows: 1 },
  skeletal_warhorse: { idle: A('sprites/pixellab/enemies/pro/skeletal_warhorse_west.png'), attack: A('sprites/pixellab/enemies/pro/skeletal_warhorse_west.png'), skill: A('sprites/pixellab/enemies/pro/skeletal_warhorse_west.png'), hit: A('sprites/pixellab/enemies/pro/skeletal_warhorse_west.png'), death: A('sprites/pixellab/enemies/pro/skeletal_warhorse_west.png'), portrait: A('sprites/pixellab/enemies/pro/skeletal_warhorse_south.png'), cols: 1, rows: 1 },
  carrion_spider: { idle: A('sprites/pixellab/enemies/pro/carrion_spider_west.png'), attack: A('sprites/pixellab/enemies/pro/carrion_spider_west.png'), skill: A('sprites/pixellab/enemies/pro/carrion_spider_west.png'), hit: A('sprites/pixellab/enemies/pro/carrion_spider_west.png'), death: A('sprites/pixellab/enemies/pro/carrion_spider_west.png'), portrait: A('sprites/pixellab/enemies/pro/carrion_spider_south.png'), cols: 1, rows: 1 },
  phantom_knight: { idle: A('sprites/pixellab/enemies/pro/phantom_knight_west.png'), attack: A('sprites/pixellab/enemies/pro/phantom_knight_west.png'), skill: A('sprites/pixellab/enemies/pro/phantom_knight_west.png'), hit: A('sprites/pixellab/enemies/pro/phantom_knight_west.png'), death: A('sprites/pixellab/enemies/pro/phantom_knight_west.png'), portrait: A('sprites/pixellab/enemies/pro/phantom_knight_south.png'), cols: 1, rows: 1 },
  wailing_wraith: { idle: A('sprites/pixellab/enemies/pro/wailing_wraith_west.png'), attack: A('sprites/pixellab/enemies/pro/wailing_wraith_west.png'), skill: A('sprites/pixellab/enemies/pro/wailing_wraith_west.png'), hit: A('sprites/pixellab/enemies/pro/wailing_wraith_west.png'), death: A('sprites/pixellab/enemies/pro/wailing_wraith_west.png'), portrait: A('sprites/pixellab/enemies/pro/wailing_wraith_south.png'), cols: 1, rows: 1 },
  // Chapter 8 — Zombie Legion + Necromancer's Court
  zombie_knight: { idle: A('sprites/pixellab/enemies/pro/zombie_knight_west.png'), attack: A('sprites/pixellab/enemies/pro/zombie_knight_west.png'), skill: A('sprites/pixellab/enemies/pro/zombie_knight_west.png'), hit: A('sprites/pixellab/enemies/pro/zombie_knight_west.png'), death: A('sprites/pixellab/enemies/pro/zombie_knight_west.png'), portrait: A('sprites/pixellab/enemies/pro/zombie_knight_south.png'), cols: 1, rows: 1 },
  zombie_berserker: { idle: A('sprites/pixellab/enemies/pro/zombie_berserker_west.png'), attack: A('sprites/pixellab/enemies/pro/zombie_berserker_west.png'), skill: A('sprites/pixellab/enemies/pro/zombie_berserker_west.png'), hit: A('sprites/pixellab/enemies/pro/zombie_berserker_west.png'), death: A('sprites/pixellab/enemies/pro/zombie_berserker_west.png'), portrait: A('sprites/pixellab/enemies/pro/zombie_berserker_south.png'), cols: 1, rows: 1 },
  shield_bearer: { idle: A('sprites/pixellab/enemies/pro/shield_bearer_west.png'), attack: A('sprites/pixellab/enemies/pro/shield_bearer_west.png'), skill: A('sprites/pixellab/enemies/pro/shield_bearer_west.png'), hit: A('sprites/pixellab/enemies/pro/shield_bearer_west.png'), death: A('sprites/pixellab/enemies/pro/shield_bearer_west.png'), portrait: A('sprites/pixellab/enemies/pro/shield_bearer_south.png'), cols: 1, rows: 1 },
  zombie_mage: { idle: A('sprites/pixellab/enemies/pro/zombie_mage_west.png'), attack: A('sprites/pixellab/enemies/pro/zombie_mage_west.png'), skill: A('sprites/pixellab/enemies/pro/zombie_mage_west.png'), hit: A('sprites/pixellab/enemies/pro/zombie_mage_west.png'), death: A('sprites/pixellab/enemies/pro/zombie_mage_west.png'), portrait: A('sprites/pixellab/enemies/pro/zombie_mage_south.png'), cols: 1, rows: 1 },
  grave_channeler: { idle: A('sprites/pixellab/enemies/pro/grave_channeler_west.png'), attack: A('sprites/pixellab/enemies/pro/grave_channeler_west.png'), skill: A('sprites/pixellab/enemies/pro/grave_channeler_west.png'), hit: A('sprites/pixellab/enemies/pro/grave_channeler_west.png'), death: A('sprites/pixellab/enemies/pro/grave_channeler_west.png'), portrait: A('sprites/pixellab/enemies/pro/grave_channeler_south.png'), cols: 1, rows: 1 },
  soul_leech: { idle: A('sprites/pixellab/enemies/pro/soul_leech_west.png'), attack: A('sprites/pixellab/enemies/pro/soul_leech_west.png'), skill: A('sprites/pixellab/enemies/pro/soul_leech_west.png'), hit: A('sprites/pixellab/enemies/pro/soul_leech_west.png'), death: A('sprites/pixellab/enemies/pro/soul_leech_west.png'), portrait: A('sprites/pixellab/enemies/pro/soul_leech_south.png'), cols: 1, rows: 1 },
  rotwolf: { idle: A('sprites/pixellab/enemies/pro/rotwolf_west.png'), attack: A('sprites/pixellab/enemies/pro/rotwolf_west.png'), skill: A('sprites/pixellab/enemies/pro/rotwolf_west.png'), hit: A('sprites/pixellab/enemies/pro/rotwolf_west.png'), death: A('sprites/pixellab/enemies/pro/rotwolf_west.png'), portrait: A('sprites/pixellab/enemies/pro/rotwolf_south.png'), cols: 1, rows: 1 },
  bone_bear: { idle: A('sprites/pixellab/enemies/pro/bone_bear_west.png'), attack: A('sprites/pixellab/enemies/pro/bone_bear_west.png'), skill: A('sprites/pixellab/enemies/pro/bone_bear_west.png'), hit: A('sprites/pixellab/enemies/pro/bone_bear_west.png'), death: A('sprites/pixellab/enemies/pro/bone_bear_west.png'), portrait: A('sprites/pixellab/enemies/pro/bone_bear_south.png'), cols: 1, rows: 1 },
  // Chapter 9 — Necromancer's Court
  possessed_corpse: { idle: A('sprites/pixellab/enemies/pro/possessed_corpse_west.png'), attack: A('sprites/pixellab/enemies/pro/possessed_corpse_west.png'), skill: A('sprites/pixellab/enemies/pro/possessed_corpse_west.png'), hit: A('sprites/pixellab/enemies/pro/possessed_corpse_west.png'), death: A('sprites/pixellab/enemies/pro/possessed_corpse_west.png'), portrait: A('sprites/pixellab/enemies/pro/possessed_corpse_south.png'), cols: 1, rows: 1 },
  grave_digger: { idle: A('sprites/pixellab/enemies/pro/grave_digger_west.png'), attack: A('sprites/pixellab/enemies/pro/grave_digger_west.png'), skill: A('sprites/pixellab/enemies/pro/grave_digger_west.png'), hit: A('sprites/pixellab/enemies/pro/grave_digger_west.png'), death: A('sprites/pixellab/enemies/pro/grave_digger_west.png'), portrait: A('sprites/pixellab/enemies/pro/grave_digger_south.png'), cols: 1, rows: 1 },
  plague_monk: { idle: A('sprites/pixellab/enemies/pro/plague_monk_west.png'), attack: A('sprites/pixellab/enemies/pro/plague_monk_west.png'), skill: A('sprites/pixellab/enemies/pro/plague_monk_west.png'), hit: A('sprites/pixellab/enemies/pro/plague_monk_west.png'), death: A('sprites/pixellab/enemies/pro/plague_monk_west.png'), portrait: A('sprites/pixellab/enemies/pro/plague_monk_south.png'), cols: 1, rows: 1 },
  necromancer: { idle: A('sprites/pixellab/enemies/pro/necromancer_west.png'), attack: A('sprites/pixellab/enemies/pro/necromancer_west.png'), skill: A('sprites/pixellab/enemies/pro/necromancer_west.png'), hit: A('sprites/pixellab/enemies/pro/necromancer_west.png'), death: A('sprites/pixellab/enemies/pro/necromancer_west.png'), portrait: A('sprites/pixellab/enemies/pro/necromancer_south.png'), cols: 1, rows: 1 },
  // ============ CH 10-29 LATE-GAME — static single-frame for now.
  // Same sprite used for every action slot until per-pose animations exist.
  // Ch 10-14 Necropolis Royalty
  royal_lich: { idle: A('sprites/pixellab/enemies/pro/royal_lich_west.png'), attack: A('sprites/pixellab/enemies/pro/royal_lich_west.png'), skill: A('sprites/pixellab/enemies/pro/royal_lich_west.png'), hit: A('sprites/pixellab/enemies/pro/royal_lich_west.png'), death: A('sprites/pixellab/enemies/pro/royal_lich_west.png'), portrait: A('sprites/pixellab/enemies/pro/royal_lich_south.png'), cols: 1, rows: 1 },
  bone_executioner: { idle: A('sprites/pixellab/enemies/pro/bone_executioner_west.png'), attack: A('sprites/pixellab/enemies/pro/bone_executioner_west.png'), skill: A('sprites/pixellab/enemies/pro/bone_executioner_west.png'), hit: A('sprites/pixellab/enemies/pro/bone_executioner_west.png'), death: A('sprites/pixellab/enemies/pro/bone_executioner_west.png'), portrait: A('sprites/pixellab/enemies/pro/bone_executioner_south.png'), cols: 1, rows: 1 },
  gilded_revenant: { idle: A('sprites/pixellab/enemies/pro/gilded_revenant_west.png'), attack: A('sprites/pixellab/enemies/pro/gilded_revenant_west.png'), skill: A('sprites/pixellab/enemies/pro/gilded_revenant_west.png'), hit: A('sprites/pixellab/enemies/pro/gilded_revenant_west.png'), death: A('sprites/pixellab/enemies/pro/gilded_revenant_west.png'), portrait: A('sprites/pixellab/enemies/pro/gilded_revenant_south.png'), cols: 1, rows: 1 },
  crypt_assassin: { idle: A('sprites/pixellab/enemies/pro/crypt_assassin_west.png'), attack: A('sprites/pixellab/enemies/pro/crypt_assassin_west.png'), skill: A('sprites/pixellab/enemies/pro/crypt_assassin_west.png'), hit: A('sprites/pixellab/enemies/pro/crypt_assassin_west.png'), death: A('sprites/pixellab/enemies/pro/crypt_assassin_west.png'), portrait: A('sprites/pixellab/enemies/pro/crypt_assassin_south.png'), cols: 1, rows: 1 },
  plague_priest: { idle: A('sprites/pixellab/enemies/pro/plague_priest_west.png'), attack: A('sprites/pixellab/enemies/pro/plague_priest_west.png'), skill: A('sprites/pixellab/enemies/pro/plague_priest_west.png'), hit: A('sprites/pixellab/enemies/pro/plague_priest_west.png'), death: A('sprites/pixellab/enemies/pro/plague_priest_west.png'), portrait: A('sprites/pixellab/enemies/pro/plague_priest_south.png'), cols: 1, rows: 1 },
  // Ch 15-19 Abyssal Crypts
  void_zombie: { idle: A('sprites/pixellab/enemies/pro/void_zombie_west.png'), attack: A('sprites/pixellab/enemies/pro/void_zombie_west.png'), skill: A('sprites/pixellab/enemies/pro/void_zombie_west.png'), hit: A('sprites/pixellab/enemies/pro/void_zombie_west.png'), death: A('sprites/pixellab/enemies/pro/void_zombie_west.png'), portrait: A('sprites/pixellab/enemies/pro/void_zombie_south.png'), cols: 1, rows: 1 },
  abyssal_warden: { idle: A('sprites/pixellab/enemies/pro/abyssal_warden_west.png'), attack: A('sprites/pixellab/enemies/pro/abyssal_warden_west.png'), skill: A('sprites/pixellab/enemies/pro/abyssal_warden_west.png'), hit: A('sprites/pixellab/enemies/pro/abyssal_warden_west.png'), death: A('sprites/pixellab/enemies/pro/abyssal_warden_west.png'), portrait: A('sprites/pixellab/enemies/pro/abyssal_warden_south.png'), cols: 1, rows: 1 },
  shade_caller: { idle: A('sprites/pixellab/enemies/pro/shade_caller_west.png'), attack: A('sprites/pixellab/enemies/pro/shade_caller_west.png'), skill: A('sprites/pixellab/enemies/pro/shade_caller_west.png'), hit: A('sprites/pixellab/enemies/pro/shade_caller_west.png'), death: A('sprites/pixellab/enemies/pro/shade_caller_west.png'), portrait: A('sprites/pixellab/enemies/pro/shade_caller_south.png'), cols: 1, rows: 1 },
  dread_knight: { idle: A('sprites/pixellab/enemies/pro/dread_knight_west.png'), attack: A('sprites/pixellab/enemies/pro/dread_knight_west.png'), skill: A('sprites/pixellab/enemies/pro/dread_knight_west.png'), hit: A('sprites/pixellab/enemies/pro/dread_knight_west.png'), death: A('sprites/pixellab/enemies/pro/dread_knight_west.png'), portrait: A('sprites/pixellab/enemies/pro/dread_knight_south.png'), cols: 1, rows: 1 },
  corpse_hound: { idle: A('sprites/pixellab/enemies/pro/corpse_hound_west.png'), attack: A('sprites/pixellab/enemies/pro/corpse_hound_west.png'), skill: A('sprites/pixellab/enemies/pro/corpse_hound_west.png'), hit: A('sprites/pixellab/enemies/pro/corpse_hound_west.png'), death: A('sprites/pixellab/enemies/pro/corpse_hound_west.png'), portrait: A('sprites/pixellab/enemies/pro/corpse_hound_south.png'), cols: 1, rows: 1 },
  // Ch 20-24 Cosmic Corruption
  starfall_lich: { idle: A('sprites/pixellab/enemies/pro/starfall_lich_west.png'), attack: A('sprites/pixellab/enemies/pro/starfall_lich_west.png'), skill: A('sprites/pixellab/enemies/pro/starfall_lich_west.png'), hit: A('sprites/pixellab/enemies/pro/starfall_lich_west.png'), death: A('sprites/pixellab/enemies/pro/starfall_lich_west.png'), portrait: A('sprites/pixellab/enemies/pro/starfall_lich_south.png'), cols: 1, rows: 1 },
  void_juggernaut: { idle: A('sprites/pixellab/enemies/pro/void_juggernaut_west.png'), attack: A('sprites/pixellab/enemies/pro/void_juggernaut_west.png'), skill: A('sprites/pixellab/enemies/pro/void_juggernaut_west.png'), hit: A('sprites/pixellab/enemies/pro/void_juggernaut_west.png'), death: A('sprites/pixellab/enemies/pro/void_juggernaut_west.png'), portrait: A('sprites/pixellab/enemies/pro/void_juggernaut_south.png'), cols: 1, rows: 1 },
  astral_archer: { idle: A('sprites/pixellab/enemies/pro/astral_archer_west.png'), attack: A('sprites/pixellab/enemies/pro/astral_archer_west.png'), skill: A('sprites/pixellab/enemies/pro/astral_archer_west.png'), hit: A('sprites/pixellab/enemies/pro/astral_archer_west.png'), death: A('sprites/pixellab/enemies/pro/astral_archer_west.png'), portrait: A('sprites/pixellab/enemies/pro/astral_archer_south.png'), cols: 1, rows: 1 },
  orb_caster: { idle: A('sprites/pixellab/enemies/pro/orb_caster_west.png'), attack: A('sprites/pixellab/enemies/pro/orb_caster_west.png'), skill: A('sprites/pixellab/enemies/pro/orb_caster_west.png'), hit: A('sprites/pixellab/enemies/pro/orb_caster_west.png'), death: A('sprites/pixellab/enemies/pro/orb_caster_west.png'), portrait: A('sprites/pixellab/enemies/pro/orb_caster_south.png'), cols: 1, rows: 1 },
  soul_devourer: { idle: A('sprites/pixellab/enemies/pro/soul_devourer_west.png'), attack: A('sprites/pixellab/enemies/pro/soul_devourer_west.png'), skill: A('sprites/pixellab/enemies/pro/soul_devourer_west.png'), hit: A('sprites/pixellab/enemies/pro/soul_devourer_west.png'), death: A('sprites/pixellab/enemies/pro/soul_devourer_west.png'), portrait: A('sprites/pixellab/enemies/pro/soul_devourer_south.png'), cols: 1, rows: 1 },
  // Ch 25-29 Final Apocalypse
  apocalypse_horror: { idle: A('sprites/pixellab/enemies/pro/apocalypse_horror_west.png'), attack: A('sprites/pixellab/enemies/pro/apocalypse_horror_west.png'), skill: A('sprites/pixellab/enemies/pro/apocalypse_horror_west.png'), hit: A('sprites/pixellab/enemies/pro/apocalypse_horror_west.png'), death: A('sprites/pixellab/enemies/pro/apocalypse_horror_west.png'), portrait: A('sprites/pixellab/enemies/pro/apocalypse_horror_south.png'), cols: 1, rows: 1 },
  world_eater_husk: { idle: A('sprites/pixellab/enemies/pro/world_eater_husk_west.png'), attack: A('sprites/pixellab/enemies/pro/world_eater_husk_west.png'), skill: A('sprites/pixellab/enemies/pro/world_eater_husk_west.png'), hit: A('sprites/pixellab/enemies/pro/world_eater_husk_west.png'), death: A('sprites/pixellab/enemies/pro/world_eater_husk_west.png'), portrait: A('sprites/pixellab/enemies/pro/world_eater_husk_south.png'), cols: 1, rows: 1 },
  blood_titan: { idle: A('sprites/pixellab/enemies/pro/blood_titan_west.png'), attack: A('sprites/pixellab/enemies/pro/blood_titan_west.png'), skill: A('sprites/pixellab/enemies/pro/blood_titan_west.png'), hit: A('sprites/pixellab/enemies/pro/blood_titan_west.png'), death: A('sprites/pixellab/enemies/pro/blood_titan_west.png'), portrait: A('sprites/pixellab/enemies/pro/blood_titan_south.png'), cols: 1, rows: 1 },
  ash_lord: { idle: A('sprites/pixellab/enemies/pro/ash_lord_west.png'), attack: A('sprites/pixellab/enemies/pro/ash_lord_west.png'), skill: A('sprites/pixellab/enemies/pro/ash_lord_west.png'), hit: A('sprites/pixellab/enemies/pro/ash_lord_west.png'), death: A('sprites/pixellab/enemies/pro/ash_lord_west.png'), portrait: A('sprites/pixellab/enemies/pro/ash_lord_south.png'), cols: 1, rows: 1 },
  final_revenant: { idle: A('sprites/pixellab/enemies/pro/final_revenant_west.png'), attack: A('sprites/pixellab/enemies/pro/final_revenant_west.png'), skill: A('sprites/pixellab/enemies/pro/final_revenant_west.png'), hit: A('sprites/pixellab/enemies/pro/final_revenant_west.png'), death: A('sprites/pixellab/enemies/pro/final_revenant_west.png'), portrait: A('sprites/pixellab/enemies/pro/final_revenant_south.png'), cols: 1, rows: 1 },
  // ============ NEW BOSS-TIER PAINTED SPRITES (PixelLab) ============
  // Single-frame 400×400 PNGs — no atlas. Same image is reused for idle/
  // attack/hit/death since these are one-shot weekly bosses (animation
  // budget went into the painting detail, not the frame count).
  bonewake_dragon: { idle: A('sprites/pixellab/enemies/pro/bonewake_dragon_west.png'), attack: A('sprites/pixellab/enemies/pro/bonewake_dragon_west.png'), skill: A('sprites/pixellab/enemies/pro/bonewake_dragon_west.png'), hit: A('sprites/pixellab/enemies/pro/bonewake_dragon_west.png'), death: A('sprites/pixellab/enemies/pro/bonewake_dragon_west.png'), portrait: A('sprites/pixellab/enemies/pro/bonewake_dragon_south.png'), cols: 1, rows: 1 },
  plague_hydra: { idle: A('sprites/pixellab/enemies/pro/plague_hydra_west.png'), attack: A('sprites/pixellab/enemies/pro/plague_hydra_west.png'), skill: A('sprites/pixellab/enemies/pro/plague_hydra_west.png'), hit: A('sprites/pixellab/enemies/pro/plague_hydra_west.png'), death: A('sprites/pixellab/enemies/pro/plague_hydra_west.png'), portrait: A('sprites/pixellab/enemies/pro/plague_hydra_south.png'), cols: 1, rows: 1 },
  rot_phoenix: { idle: A('sprites/pixellab/enemies/pro/rot_phoenix_west.png'), attack: A('sprites/pixellab/enemies/pro/rot_phoenix_west.png'), skill: A('sprites/pixellab/enemies/pro/rot_phoenix_west.png'), hit: A('sprites/pixellab/enemies/pro/rot_phoenix_west.png'), death: A('sprites/pixellab/enemies/pro/rot_phoenix_west.png'), portrait: A('sprites/pixellab/enemies/pro/rot_phoenix_south.png'), cols: 1, rows: 1 },
  bone_cerberus: { idle: A('sprites/pixellab/enemies/pro/bone_cerberus_west.png'), attack: A('sprites/pixellab/enemies/pro/bone_cerberus_west.png'), skill: A('sprites/pixellab/enemies/pro/bone_cerberus_west.png'), hit: A('sprites/pixellab/enemies/pro/bone_cerberus_west.png'), death: A('sprites/pixellab/enemies/pro/bone_cerberus_west.png'), portrait: A('sprites/pixellab/enemies/pro/bone_cerberus_south.png'), cols: 1, rows: 1 },
  wraith_kraken: { idle: A('sprites/pixellab/enemies/pro/wraith_kraken_west.png'), attack: A('sprites/pixellab/enemies/pro/wraith_kraken_west.png'), skill: A('sprites/pixellab/enemies/pro/wraith_kraken_west.png'), hit: A('sprites/pixellab/enemies/pro/wraith_kraken_west.png'), death: A('sprites/pixellab/enemies/pro/wraith_kraken_west.png'), portrait: A('sprites/pixellab/enemies/pro/wraith_kraken_south.png'), cols: 1, rows: 1 },
  necro_sphinx: { idle: A('sprites/pixellab/enemies/pro/necro_sphinx_west.png'), attack: A('sprites/pixellab/enemies/pro/necro_sphinx_west.png'), skill: A('sprites/pixellab/enemies/pro/necro_sphinx_west.png'), hit: A('sprites/pixellab/enemies/pro/necro_sphinx_west.png'), death: A('sprites/pixellab/enemies/pro/necro_sphinx_west.png'), portrait: A('sprites/pixellab/enemies/pro/necro_sphinx_south.png'), cols: 1, rows: 1 },
  crimson_centaur: { idle: A('sprites/pixellab/enemies/pro/crimson_centaur_west.png'), attack: A('sprites/pixellab/enemies/pro/crimson_centaur_west.png'), skill: A('sprites/pixellab/enemies/pro/crimson_centaur_west.png'), hit: A('sprites/pixellab/enemies/pro/crimson_centaur_west.png'), death: A('sprites/pixellab/enemies/pro/crimson_centaur_west.png'), portrait: A('sprites/pixellab/enemies/pro/crimson_centaur_south.png'), cols: 1, rows: 1 },
  lich_king: { idle: A('sprites/pixellab/enemies/pro/lich_king_west.png'), attack: A('sprites/pixellab/enemies/pro/lich_king_west.png'), skill: A('sprites/pixellab/enemies/pro/lich_king_west.png'), hit: A('sprites/pixellab/enemies/pro/lich_king_west.png'), death: A('sprites/pixellab/enemies/pro/lich_king_west.png'), portrait: A('sprites/pixellab/enemies/pro/lich_king_south.png'), cols: 1, rows: 1 },
  bone_titan: { idle: A('sprites/pixellab/enemies/pro/bone_titan_west.png'), attack: A('sprites/pixellab/enemies/pro/bone_titan_west.png'), skill: A('sprites/pixellab/enemies/pro/bone_titan_west.png'), hit: A('sprites/pixellab/enemies/pro/bone_titan_west.png'), death: A('sprites/pixellab/enemies/pro/bone_titan_west.png'), portrait: A('sprites/pixellab/enemies/pro/bone_titan_south.png'), cols: 1, rows: 1 },
  plague_doctor: { idle: A('sprites/pixellab/enemies/pro/plague_doctor_undead_west.png'), attack: A('sprites/pixellab/enemies/pro/plague_doctor_undead_west.png'), skill: A('sprites/pixellab/enemies/pro/plague_doctor_undead_west.png'), hit: A('sprites/pixellab/enemies/pro/plague_doctor_undead_west.png'), death: A('sprites/pixellab/enemies/pro/plague_doctor_undead_west.png'), portrait: A('sprites/pixellab/enemies/pro/plague_doctor_undead_south.png'), cols: 1, rows: 1 },
  ash_empress: { idle: A('sprites/pixellab/enemies/pro/ash_empress_west.png'), attack: A('sprites/pixellab/enemies/pro/ash_empress_west.png'), skill: A('sprites/pixellab/enemies/pro/ash_empress_west.png'), hit: A('sprites/pixellab/enemies/pro/ash_empress_west.png'), death: A('sprites/pixellab/enemies/pro/ash_empress_west.png'), portrait: A('sprites/pixellab/enemies/pro/ash_empress_south.png'), cols: 1, rows: 1 },
  soul_reaper: { idle: A('sprites/pixellab/enemies/pro/soul_reaper_west.png'), attack: A('sprites/pixellab/enemies/pro/soul_reaper_west.png'), skill: A('sprites/pixellab/enemies/pro/soul_reaper_west.png'), hit: A('sprites/pixellab/enemies/pro/soul_reaper_west.png'), death: A('sprites/pixellab/enemies/pro/soul_reaper_west.png'), portrait: A('sprites/pixellab/enemies/pro/soul_reaper_south.png'), cols: 1, rows: 1 },
  voidlord: { idle: A('sprites/pixellab/enemies/pro/voidlord_west.png'), attack: A('sprites/pixellab/enemies/pro/voidlord_west.png'), skill: A('sprites/pixellab/enemies/pro/voidlord_west.png'), hit: A('sprites/pixellab/enemies/pro/voidlord_west.png'), death: A('sprites/pixellab/enemies/pro/voidlord_west.png'), portrait: A('sprites/pixellab/enemies/pro/voidlord_south.png'), cols: 1, rows: 1 },
  worm_god: { idle: A('sprites/pixellab/enemies/pro/worm_god_west.png'), attack: A('sprites/pixellab/enemies/pro/worm_god_west.png'), skill: A('sprites/pixellab/enemies/pro/worm_god_west.png'), hit: A('sprites/pixellab/enemies/pro/worm_god_west.png'), death: A('sprites/pixellab/enemies/pro/worm_god_west.png'), portrait: A('sprites/pixellab/enemies/pro/worm_god_south.png'), cols: 1, rows: 1 },
  // Net-new pro-mode horror enemies (west = in-battle, south = portrait).
  bloated_glutton:  { idle: A('sprites/pixellab/enemies/pro/bloated_glutton_west.png'), attack: A('sprites/pixellab/enemies/pro/bloated_glutton_west.png'), skill: A('sprites/pixellab/enemies/pro/bloated_glutton_west.png'), hit: A('sprites/pixellab/enemies/pro/bloated_glutton_west.png'), death: A('sprites/pixellab/enemies/pro/bloated_glutton_west.png'), portrait: A('sprites/pixellab/enemies/pro/bloated_glutton_south.png'), cols: 1, rows: 1 },
  hangman:          { idle: A('sprites/pixellab/enemies/pro/hangman_west.png'), attack: A('sprites/pixellab/enemies/pro/hangman_west.png'), skill: A('sprites/pixellab/enemies/pro/hangman_west.png'), hit: A('sprites/pixellab/enemies/pro/hangman_west.png'), death: A('sprites/pixellab/enemies/pro/hangman_west.png'), portrait: A('sprites/pixellab/enemies/pro/hangman_south.png'), cols: 1, rows: 1 },
  conjoined_horror: { idle: A('sprites/pixellab/enemies/pro/conjoined_horror_west.png'), attack: A('sprites/pixellab/enemies/pro/conjoined_horror_west.png'), skill: A('sprites/pixellab/enemies/pro/conjoined_horror_west.png'), hit: A('sprites/pixellab/enemies/pro/conjoined_horror_west.png'), death: A('sprites/pixellab/enemies/pro/conjoined_horror_west.png'), portrait: A('sprites/pixellab/enemies/pro/conjoined_horror_south.png'), cols: 1, rows: 1 },
  stitched_brute:   { idle: A('sprites/pixellab/enemies/pro/stitched_brute_west.png'), attack: A('sprites/pixellab/enemies/pro/stitched_brute_west.png'), skill: A('sprites/pixellab/enemies/pro/stitched_brute_west.png'), hit: A('sprites/pixellab/enemies/pro/stitched_brute_west.png'), death: A('sprites/pixellab/enemies/pro/stitched_brute_west.png'), portrait: A('sprites/pixellab/enemies/pro/stitched_brute_south.png'), cols: 1, rows: 1 },
  drowned_lurker:   { idle: A('sprites/pixellab/enemies/pro/drowned_lurker_west.png'), attack: A('sprites/pixellab/enemies/pro/drowned_lurker_west.png'), skill: A('sprites/pixellab/enemies/pro/drowned_lurker_west.png'), hit: A('sprites/pixellab/enemies/pro/drowned_lurker_west.png'), death: A('sprites/pixellab/enemies/pro/drowned_lurker_west.png'), portrait: A('sprites/pixellab/enemies/pro/drowned_lurker_south.png'), cols: 1, rows: 1 },
  acid_vomiter:     { idle: A('sprites/pixellab/enemies/pro/acid_vomiter_west.png'), attack: A('sprites/pixellab/enemies/pro/acid_vomiter_west.png'), skill: A('sprites/pixellab/enemies/pro/acid_vomiter_west.png'), hit: A('sprites/pixellab/enemies/pro/acid_vomiter_west.png'), death: A('sprites/pixellab/enemies/pro/acid_vomiter_west.png'), portrait: A('sprites/pixellab/enemies/pro/acid_vomiter_south.png'), cols: 1, rows: 1 },
  plague_bride:     { idle: A('sprites/pixellab/enemies/pro/plague_bride_west.png'), attack: A('sprites/pixellab/enemies/pro/plague_bride_west.png'), skill: A('sprites/pixellab/enemies/pro/plague_bride_west.png'), hit: A('sprites/pixellab/enemies/pro/plague_bride_west.png'), death: A('sprites/pixellab/enemies/pro/plague_bride_west.png'), portrait: A('sprites/pixellab/enemies/pro/plague_bride_south.png'), cols: 1, rows: 1 },
  chained_prisoner: { idle: A('sprites/pixellab/enemies/pro/chained_prisoner_west.png'), attack: A('sprites/pixellab/enemies/pro/chained_prisoner_west.png'), skill: A('sprites/pixellab/enemies/pro/chained_prisoner_west.png'), hit: A('sprites/pixellab/enemies/pro/chained_prisoner_west.png'), death: A('sprites/pixellab/enemies/pro/chained_prisoner_west.png'), portrait: A('sprites/pixellab/enemies/pro/chained_prisoner_south.png'), cols: 1, rows: 1 },
  crawling_torso:   { idle: A('sprites/pixellab/enemies/pro/crawling_torso_west.png'), attack: A('sprites/pixellab/enemies/pro/crawling_torso_west.png'), skill: A('sprites/pixellab/enemies/pro/crawling_torso_west.png'), hit: A('sprites/pixellab/enemies/pro/crawling_torso_west.png'), death: A('sprites/pixellab/enemies/pro/crawling_torso_west.png'), portrait: A('sprites/pixellab/enemies/pro/crawling_torso_south.png'), cols: 1, rows: 1 },
  maggot_host:      { idle: A('sprites/pixellab/enemies/pro/maggot_host_west.png'), attack: A('sprites/pixellab/enemies/pro/maggot_host_west.png'), skill: A('sprites/pixellab/enemies/pro/maggot_host_west.png'), hit: A('sprites/pixellab/enemies/pro/maggot_host_west.png'), death: A('sprites/pixellab/enemies/pro/maggot_host_west.png'), portrait: A('sprites/pixellab/enemies/pro/maggot_host_south.png'), cols: 1, rows: 1 },
  butcher_zombie:   { idle: A('sprites/pixellab/enemies/pro/butcher_zombie_west.png'), attack: A('sprites/pixellab/enemies/pro/butcher_zombie_west.png'), skill: A('sprites/pixellab/enemies/pro/butcher_zombie_west.png'), hit: A('sprites/pixellab/enemies/pro/butcher_zombie_west.png'), death: A('sprites/pixellab/enemies/pro/butcher_zombie_west.png'), portrait: A('sprites/pixellab/enemies/pro/butcher_zombie_south.png'), cols: 1, rows: 1 },
};

// IDs of the painted boss-tier templates — used by combat to render
// significantly larger and by world/shatter rotations to populate the
// daily-rotation pool. Order MATCHES the day-of-week (Sun-Sat) for each
// list so currentBoss/currentSpiritBoss can pick by `date.getDay()`.
export const PAINTED_BOSS_IDS = new Set<string>([
  'bonewake_dragon', 'plague_hydra', 'rot_phoenix', 'bone_cerberus',
  'wraith_kraken', 'necro_sphinx', 'crimson_centaur',
  'lich_king', 'bone_titan', 'plague_doctor', 'ash_empress',
  'soul_reaper', 'voidlord', 'worm_god',
]);
export const WORLD_BOSS_BY_DAY = [
  'bonewake_dragon',  // Sun
  'plague_hydra',     // Mon
  'rot_phoenix',      // Tue
  'bone_cerberus',    // Wed
  'wraith_kraken',    // Thu
  'necro_sphinx',     // Fri
  'crimson_centaur',  // Sat
];
export const SHATTER_BOSS_BY_DAY = [
  'lich_king',     // Sun
  'bone_titan',    // Mon
  'plague_doctor', // Tue
  'ash_empress',   // Wed
  'soul_reaper',   // Thu
  'voidlord',      // Fri
  'worm_god',      // Sat
];
