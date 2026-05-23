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
  luna:   A('sprites/pixellab/heroes/portraits/luna.png'),
  elara:  A('sprites/pixellab/heroes/portraits/elara.png'),
  aelia:  A('sprites/pixellab/heroes/portraits/aelia.png'),
  kengo:  A('sprites/pixellab/heroes/portraits/kengo.png'),
  len:    A('sprites/pixellab/heroes/portraits/len.png'),
  kaius:  A('sprites/pixellab/heroes/portraits/kaius.png'),
  pyra:   A('sprites/pixellab/heroes/portraits/pyra.png'),
  korvan: A('sprites/pixellab/heroes/portraits/korvan.png'),
  george: A('sprites/pixellab/heroes/portraits/george.png'),
  manny:  A('sprites/pixellab/heroes/portraits/manny.png'),
  bone_king:      A('sprites/pixellab/heroes/portraits/bone_king.png'),
  lich_sovereign: A('sprites/pixellab/heroes/portraits/lich_sovereign.png'),
  chino:    A('sprites/pixellab/heroes/portraits/chino.png'),
  reiji:    A('sprites/pixellab/heroes/portraits/samurai.png'),
  twins:    A('sprites/pixellab/heroes/portraits/twins.png'),
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
  luna:   { idle: A('sprites/pixellab/heroes/luna_idle.png'), attack: A('sprites/pixellab/heroes/luna_attack.png'), skill: A('sprites/pixellab/heroes/luna_skill.png'), ult: A('sprites/pixellab/heroes/luna_ult.png'), hit: A('sprites/pixellab/heroes/luna_idle.png'), death: A('sprites/pixellab/heroes/luna_death.png'), heal: A('sprites/pixellab/heroes/luna_heal.png'), cols: 43, rows: 1 },
  elara:  { idle: A('sprites/pixellab/heroes/elara_idle.png'),  attack: A('sprites/pixellab/heroes/elara_attack.png'),  skill: A('sprites/pixellab/heroes/elara_skill.png'),  ult: A('sprites/pixellab/heroes/elara_skill.png'),  hit: A('sprites/pixellab/heroes/elara_idle.png'),  death: A('sprites/pixellab/heroes/elara_death.png'),  cols: 43, rows: 1 },
  aelia:  { idle: A('sprites/pixellab/heroes/aelia_idle.png'),  attack: A('sprites/pixellab/heroes/aelia_attack.png'),  skill: A('sprites/pixellab/heroes/aelia_skill.png'),  ult: A('sprites/pixellab/heroes/aelia_skill.png'),  hit: A('sprites/pixellab/heroes/aelia_idle.png'),  death: A('sprites/pixellab/heroes/aelia_death.png'),  cols: 43, rows: 1 },
  kengo:  { idle: A('sprites/pixellab/heroes/kengo_idle.png'),  attack: A('sprites/pixellab/heroes/kengo_attack.png'),  skill: A('sprites/pixellab/heroes/kengo_skill.png'),  ult: A('sprites/pixellab/heroes/kengo_skill.png'),  hit: A('sprites/pixellab/heroes/kengo_idle.png'),  death: A('sprites/pixellab/heroes/kengo_death.png'),  cols: 43, rows: 1 },
  len:    { idle: A('sprites/pixellab/heroes/len_idle.png'),    attack: A('sprites/pixellab/heroes/len_attack.png'),    skill: A('sprites/pixellab/heroes/len_skill.png'),    ult: A('sprites/pixellab/heroes/len_skill.png'),    hit: A('sprites/pixellab/heroes/len_idle.png'),    death: A('sprites/pixellab/heroes/len_death.png'),    cols: 43, rows: 1 },
  kaius:  { idle: A('sprites/pixellab/heroes/kaius_idle.png'),  attack: A('sprites/pixellab/heroes/kaius_attack.png'),  skill: A('sprites/pixellab/heroes/kaius_skill.png'),  ult: A('sprites/pixellab/heroes/kaius_skill.png'),  hit: A('sprites/pixellab/heroes/kaius_idle.png'),  death: A('sprites/pixellab/heroes/kaius_death.png'),  cols: 43, rows: 1 },
  pyra:   { idle: A('sprites/pixellab/heroes/pyra_idle.png'),   attack: A('sprites/pixellab/heroes/pyra_attack.png'),   skill: A('sprites/pixellab/heroes/pyra_skill.png'),   ult: A('sprites/pixellab/heroes/pyra_skill.png'),   hit: A('sprites/pixellab/heroes/pyra_idle.png'),   death: A('sprites/pixellab/heroes/pyra_death.png'),   cols: 43, rows: 1 },
  korvan: { idle: A('sprites/pixellab/heroes/korvan_idle.png'), attack: A('sprites/pixellab/heroes/korvan_attack.png'), skill: A('sprites/pixellab/heroes/korvan_skill.png'), ult: A('sprites/pixellab/heroes/korvan_ult.png'), hit: A('sprites/pixellab/heroes/korvan_idle.png'), death: A('sprites/pixellab/heroes/korvan_death.png'), cols: 43, rows: 1 },
  // George shapeshifts: skill = wolf form, ult = bear form. attack stays in human form.
  george: { idle: A('sprites/pixellab/heroes/george_idle.png'), attack: A('sprites/pixellab/heroes/george_attack.png'), skill: A('sprites/pixellab/heroes/george_skill.png'), ult: A('sprites/pixellab/heroes/george_ult.png'), hit: A('sprites/pixellab/heroes/george_idle.png'), death: A('sprites/pixellab/heroes/george_death.png'), cols: 43, rows: 1 },
  manny:  { idle: A('sprites/pixellab/heroes/manny_idle.png'),  attack: A('sprites/pixellab/heroes/manny_attack.png'),  skill: A('sprites/pixellab/heroes/manny_skill.png'),  ult: A('sprites/pixellab/heroes/manny_ult.png'),  hit: A('sprites/pixellab/heroes/manny_idle.png'),  death: A('sprites/pixellab/heroes/manny_death.png'), cols: 43, rows: 1 },
  bone_king:      { idle: A('sprites/pixellab/heroes/bone_king_v1_idle.png'),      attack: A('sprites/pixellab/heroes/bone_king_v1_attack.png'),      skill: A('sprites/pixellab/heroes/bone_king_v1_skill.png'),      ult: A('sprites/pixellab/heroes/bone_king_v1_ult.png'),      hit: A('sprites/pixellab/heroes/bone_king_v1_hit.png'),      death: A('sprites/pixellab/heroes/bone_king_v1_death.png'),      cols: 9, rows: 1 },
  lich_sovereign: { idle: A('sprites/pixellab/heroes/lich_sovereign_idle.png'), attack: A('sprites/pixellab/heroes/lich_sovereign_attack.png'), skill: A('sprites/pixellab/heroes/lich_sovereign_skill.png'), ult: A('sprites/pixellab/heroes/lich_sovereign_ult.png'), hit: A('sprites/pixellab/heroes/lich_sovereign_idle.png'), death: A('sprites/pixellab/heroes/lich_sovereign_death.png'), cols: 43, rows: 1 },
  chino:   { idle: A('sprites/pixellab/heroes/chino_idle.png'),    attack: A('sprites/pixellab/heroes/chino_attack.png'),    skill: A('sprites/pixellab/heroes/chino_skill.png'),    ult: A('sprites/pixellab/heroes/chino_ult.png'),    hit: A('sprites/pixellab/heroes/chino_idle.png'),    death: A('sprites/pixellab/heroes/chino_death.png'),    cols: 43, rows: 1 },
  reiji:   { idle: A('sprites/pixellab/heroes/reiji_v1_idle.png'),  attack: A('sprites/pixellab/heroes/reiji_v1_attack.png'),  skill: A('sprites/pixellab/heroes/reiji_v1_skill.png'),  ult: A('sprites/pixellab/heroes/reiji_v1_ult.png'),  hit: A('sprites/pixellab/heroes/reiji_v1_hit.png'),  death: A('sprites/pixellab/heroes/reiji_v1_death.png'),  cols: 9, rows: 1 },
  twins:   { idle: A('sprites/pixellab/heroes/twins_idle.png'),    attack: A('sprites/pixellab/heroes/twins_attack.png'),    skill: A('sprites/pixellab/heroes/twins_skill.png'),    ult: A('sprites/pixellab/heroes/twins_ult.png'),    hit: A('sprites/pixellab/heroes/twins_idle.png'),    death: A('sprites/pixellab/heroes/twins_death.png'),    cols: 43, rows: 1 },
};

export const ENEMY_SPRITES: Record<string, {
  idle: string;
  attack?: string;
  skill?: string;
  hit?: string;
  death?: string;
  cols: number;
  rows: number;
}> = {
  // World boss tier
  worldboss_1:   { idle: A('sprites/echoes/enemies/worldboss_1_idle.png'),    attack: A('sprites/echoes/enemies/worldboss_1_idle.png'),   skill: A('sprites/echoes/enemies/worldboss_1_idle.png'),   hit: A('sprites/echoes/enemies/worldboss_1_idle.png'),   death: A('sprites/echoes/enemies/worldboss_1_idle.png'),   cols: 1, rows: 1 },
  shambler:      { idle: A('sprites/echoes/enemies/shambler_idle.png'),      attack: A('sprites/echoes/enemies/shambler_attack.png'), skill: A('sprites/echoes/enemies/shambler_idle.png'), hit: A('sprites/echoes/enemies/shambler_idle.png'), death: A('sprites/echoes/enemies/shambler_idle.png'),      cols: 17, rows: 1 },
  boneknight:    { idle: A('sprites/echoes/enemies/boneknight_idle.png'),    attack: A('sprites/echoes/enemies/boneknight_idle.png'), skill: A('sprites/echoes/enemies/boneknight_idle.png'), hit: A('sprites/echoes/enemies/boneknight_idle.png'), death: A('sprites/echoes/enemies/boneknight_idle.png'),    cols: 1, rows: 1 },
  fastghoul:     { idle: A('sprites/echoes/enemies/fastghoul_idle.png'),     attack: A('sprites/echoes/enemies/fastghoul_idle.png'), skill: A('sprites/echoes/enemies/fastghoul_idle.png'), hit: A('sprites/echoes/enemies/fastghoul_idle.png'), death: A('sprites/echoes/enemies/fastghoul_idle.png'),     cols: 1, rows: 1 },
  graveyardlich: { idle: A('sprites/echoes/enemies/graveyardlich_idle.png'), attack: A('sprites/echoes/enemies/graveyardlich_idle.png'), skill: A('sprites/echoes/enemies/graveyardlich_idle.png'), hit: A('sprites/echoes/enemies/graveyardlich_idle.png'), death: A('sprites/echoes/enemies/graveyardlich_idle.png'), cols: 1, rows: 1 },
  // Chapter 7 enemies are single-frame portraits (cols:1 rows:1) — each pose
  // is one full 1024x1024 image, not a 4x4 atlas like the original cast.
  undead_archer:     { idle: A('sprites/echoes/enemies/undead_archer_idle.png'),     attack: A('sprites/echoes/enemies/undead_archer_idle.png'), skill: A('sprites/echoes/enemies/undead_archer_idle.png'), hit: A('sprites/echoes/enemies/undead_archer_idle.png'), death: A('sprites/echoes/enemies/undead_archer_idle.png'),     cols: 1, rows: 1 },
  plague_caster:     { idle: A('sprites/echoes/enemies/plague_caster_idle.png'),     attack: A('sprites/echoes/enemies/plague_caster_idle.png'), skill: A('sprites/echoes/enemies/plague_caster_idle.png'), hit: A('sprites/echoes/enemies/plague_caster_idle.png'), death: A('sprites/echoes/enemies/plague_caster_idle.png'),     cols: 1, rows: 1 },
  fallen_captain:    { idle: A('sprites/echoes/enemies/fallen_captain_idle.png'),    attack: A('sprites/echoes/enemies/fallen_captain_idle.png'), skill: A('sprites/echoes/enemies/fallen_captain_idle.png'), hit: A('sprites/echoes/enemies/fallen_captain_idle.png'), death: A('sprites/echoes/enemies/fallen_captain_idle.png'),    cols: 1, rows: 1 },
  skeletal_warhorse: { idle: A('sprites/echoes/enemies/skeletal_warhorse_idle.png'), attack: A('sprites/echoes/enemies/skeletal_warhorse_idle.png'), skill: A('sprites/echoes/enemies/skeletal_warhorse_idle.png'), hit: A('sprites/echoes/enemies/skeletal_warhorse_idle.png'), death: A('sprites/echoes/enemies/skeletal_warhorse_idle.png'), cols: 1, rows: 1 },
  carrion_spider:    { idle: A('sprites/echoes/enemies/carrion_spider_idle.png'),    attack: A('sprites/echoes/enemies/carrion_spider_idle.png'), skill: A('sprites/echoes/enemies/carrion_spider_idle.png'), hit: A('sprites/echoes/enemies/carrion_spider_idle.png'), death: A('sprites/echoes/enemies/carrion_spider_idle.png'),    cols: 1, rows: 1 },
  phantom_knight:    { idle: A('sprites/echoes/enemies/phantom_knight_idle.png'),    attack: A('sprites/echoes/enemies/phantom_knight_idle.png'), skill: A('sprites/echoes/enemies/phantom_knight_idle.png'), hit: A('sprites/echoes/enemies/phantom_knight_idle.png'), death: A('sprites/echoes/enemies/phantom_knight_idle.png'),    cols: 1, rows: 1 },
  wailing_wraith:    { idle: A('sprites/echoes/enemies/wailing_wraith_idle.png'),    attack: A('sprites/echoes/enemies/wailing_wraith_idle.png'), skill: A('sprites/echoes/enemies/wailing_wraith_idle.png'), hit: A('sprites/echoes/enemies/wailing_wraith_idle.png'), death: A('sprites/echoes/enemies/wailing_wraith_idle.png'),    cols: 1, rows: 1 },
  // Chapter 8 — Zombie Legion + Necromancer's Court
  zombie_knight:     { idle: A('sprites/echoes/enemies/zombie_knight_idle.png'),     attack: A('sprites/echoes/enemies/zombie_knight_idle.png'), skill: A('sprites/echoes/enemies/zombie_knight_idle.png'), hit: A('sprites/echoes/enemies/zombie_knight_idle.png'), death: A('sprites/echoes/enemies/zombie_knight_idle.png'),     cols: 1, rows: 1 },
  zombie_berserker:  { idle: A('sprites/echoes/enemies/zombie_berserker_idle.png'),  attack: A('sprites/echoes/enemies/zombie_berserker_idle.png'), skill: A('sprites/echoes/enemies/zombie_berserker_idle.png'), hit: A('sprites/echoes/enemies/zombie_berserker_idle.png'), death: A('sprites/echoes/enemies/zombie_berserker_idle.png'),  cols: 1, rows: 1 },
  shield_bearer:     { idle: A('sprites/echoes/enemies/shield_bearer_idle.png'),     attack: A('sprites/echoes/enemies/shield_bearer_idle.png'), skill: A('sprites/echoes/enemies/shield_bearer_idle.png'), hit: A('sprites/echoes/enemies/shield_bearer_idle.png'), death: A('sprites/echoes/enemies/shield_bearer_idle.png'),     cols: 1, rows: 1 },
  zombie_mage:       { idle: A('sprites/echoes/enemies/zombie_mage_idle.png'),       attack: A('sprites/echoes/enemies/zombie_mage_idle.png'), skill: A('sprites/echoes/enemies/zombie_mage_idle.png'), hit: A('sprites/echoes/enemies/zombie_mage_idle.png'), death: A('sprites/echoes/enemies/zombie_mage_idle.png'),       cols: 1, rows: 1 },
  grave_channeler:   { idle: A('sprites/echoes/enemies/grave_channeler_idle.png'),   attack: A('sprites/echoes/enemies/grave_channeler_idle.png'), skill: A('sprites/echoes/enemies/grave_channeler_idle.png'), hit: A('sprites/echoes/enemies/grave_channeler_idle.png'), death: A('sprites/echoes/enemies/grave_channeler_idle.png'),   cols: 1, rows: 1 },
  soul_leech:        { idle: A('sprites/echoes/enemies/soul_leech_idle.png'),        attack: A('sprites/echoes/enemies/soul_leech_idle.png'), skill: A('sprites/echoes/enemies/soul_leech_idle.png'), hit: A('sprites/echoes/enemies/soul_leech_idle.png'), death: A('sprites/echoes/enemies/soul_leech_idle.png'),        cols: 1, rows: 1 },
  rotwolf:           { idle: A('sprites/echoes/enemies/rotwolf_idle.png'),           attack: A('sprites/echoes/enemies/rotwolf_idle.png'), skill: A('sprites/echoes/enemies/rotwolf_idle.png'), hit: A('sprites/echoes/enemies/rotwolf_idle.png'), death: A('sprites/echoes/enemies/rotwolf_idle.png'),           cols: 1, rows: 1 },
  bone_bear:         { idle: A('sprites/echoes/enemies/bone_bear_idle.png'),         attack: A('sprites/echoes/enemies/bone_bear_idle.png'), skill: A('sprites/echoes/enemies/bone_bear_idle.png'), hit: A('sprites/echoes/enemies/bone_bear_idle.png'), death: A('sprites/echoes/enemies/bone_bear_idle.png'),         cols: 1, rows: 1 },
  // Chapter 9 — Necromancer's Court
  possessed_corpse:  { idle: A('sprites/echoes/enemies/possessed_corpse_idle.png'),  attack: A('sprites/echoes/enemies/possessed_corpse_idle.png'), skill: A('sprites/echoes/enemies/possessed_corpse_idle.png'), hit: A('sprites/echoes/enemies/possessed_corpse_idle.png'), death: A('sprites/echoes/enemies/possessed_corpse_idle.png'),  cols: 1, rows: 1 },
  grave_digger:      { idle: A('sprites/echoes/enemies/grave_digger_idle.png'),      attack: A('sprites/echoes/enemies/grave_digger_idle.png'), skill: A('sprites/echoes/enemies/grave_digger_idle.png'), hit: A('sprites/echoes/enemies/grave_digger_idle.png'), death: A('sprites/echoes/enemies/grave_digger_idle.png'),      cols: 1, rows: 1 },
  plague_monk:       { idle: A('sprites/echoes/enemies/plague_monk_idle.png'),       attack: A('sprites/echoes/enemies/plague_monk_idle.png'), skill: A('sprites/echoes/enemies/plague_monk_idle.png'), hit: A('sprites/echoes/enemies/plague_monk_idle.png'), death: A('sprites/echoes/enemies/plague_monk_idle.png'),       cols: 1, rows: 1 },
  necromancer:       { idle: A('sprites/echoes/enemies/necromancer_idle.png'),       attack: A('sprites/echoes/enemies/necromancer_idle.png'), skill: A('sprites/echoes/enemies/necromancer_idle.png'), hit: A('sprites/echoes/enemies/necromancer_idle.png'), death: A('sprites/echoes/enemies/necromancer_idle.png'),       cols: 1, rows: 1 },
  // ============ CH 10-29 LATE-GAME — static single-frame for now.
  // Same sprite used for every action slot until per-pose animations exist.
  // Ch 10-14 Necropolis Royalty
  royal_lich:        { idle: A('sprites/echoes/enemies/royal_lich_idle.png'),        attack: A('sprites/echoes/enemies/royal_lich_idle.png'),        skill: A('sprites/echoes/enemies/royal_lich_idle.png'),        hit: A('sprites/echoes/enemies/royal_lich_idle.png'),        death: A('sprites/echoes/enemies/royal_lich_idle.png'),        cols: 1, rows: 1 },
  bone_executioner:  { idle: A('sprites/echoes/enemies/bone_executioner_idle.png'),  attack: A('sprites/echoes/enemies/bone_executioner_idle.png'),  skill: A('sprites/echoes/enemies/bone_executioner_idle.png'),  hit: A('sprites/echoes/enemies/bone_executioner_idle.png'),  death: A('sprites/echoes/enemies/bone_executioner_idle.png'),  cols: 1, rows: 1 },
  gilded_revenant:   { idle: A('sprites/echoes/enemies/gilded_revenant_idle.png'),   attack: A('sprites/echoes/enemies/gilded_revenant_idle.png'),   skill: A('sprites/echoes/enemies/gilded_revenant_idle.png'),   hit: A('sprites/echoes/enemies/gilded_revenant_idle.png'),   death: A('sprites/echoes/enemies/gilded_revenant_idle.png'),   cols: 1, rows: 1 },
  crypt_assassin:    { idle: A('sprites/echoes/enemies/crypt_assassin_idle.png'),    attack: A('sprites/echoes/enemies/crypt_assassin_idle.png'),    skill: A('sprites/echoes/enemies/crypt_assassin_idle.png'),    hit: A('sprites/echoes/enemies/crypt_assassin_idle.png'),    death: A('sprites/echoes/enemies/crypt_assassin_idle.png'),    cols: 1, rows: 1 },
  plague_priest:     { idle: A('sprites/echoes/enemies/plague_priest_idle.png'),     attack: A('sprites/echoes/enemies/plague_priest_idle.png'),     skill: A('sprites/echoes/enemies/plague_priest_idle.png'),     hit: A('sprites/echoes/enemies/plague_priest_idle.png'),     death: A('sprites/echoes/enemies/plague_priest_idle.png'),     cols: 1, rows: 1 },
  // Ch 15-19 Abyssal Crypts
  void_zombie:       { idle: A('sprites/echoes/enemies/void_zombie_idle.png'),       attack: A('sprites/echoes/enemies/void_zombie_idle.png'),       skill: A('sprites/echoes/enemies/void_zombie_idle.png'),       hit: A('sprites/echoes/enemies/void_zombie_idle.png'),       death: A('sprites/echoes/enemies/void_zombie_idle.png'),       cols: 1, rows: 1 },
  abyssal_warden:    { idle: A('sprites/echoes/enemies/abyssal_warden_idle.png'),    attack: A('sprites/echoes/enemies/abyssal_warden_idle.png'),    skill: A('sprites/echoes/enemies/abyssal_warden_idle.png'),    hit: A('sprites/echoes/enemies/abyssal_warden_idle.png'),    death: A('sprites/echoes/enemies/abyssal_warden_idle.png'),    cols: 1, rows: 1 },
  shade_caller:      { idle: A('sprites/echoes/enemies/shade_caller_idle.png'),      attack: A('sprites/echoes/enemies/shade_caller_idle.png'),      skill: A('sprites/echoes/enemies/shade_caller_idle.png'),      hit: A('sprites/echoes/enemies/shade_caller_idle.png'),      death: A('sprites/echoes/enemies/shade_caller_idle.png'),      cols: 1, rows: 1 },
  dread_knight:      { idle: A('sprites/echoes/enemies/dread_knight_idle.png'),      attack: A('sprites/echoes/enemies/dread_knight_idle.png'),      skill: A('sprites/echoes/enemies/dread_knight_idle.png'),      hit: A('sprites/echoes/enemies/dread_knight_idle.png'),      death: A('sprites/echoes/enemies/dread_knight_idle.png'),      cols: 1, rows: 1 },
  corpse_hound:      { idle: A('sprites/echoes/enemies/corpse_hound_idle.png'),      attack: A('sprites/echoes/enemies/corpse_hound_idle.png'),      skill: A('sprites/echoes/enemies/corpse_hound_idle.png'),      hit: A('sprites/echoes/enemies/corpse_hound_idle.png'),      death: A('sprites/echoes/enemies/corpse_hound_idle.png'),      cols: 1, rows: 1 },
  // Ch 20-24 Cosmic Corruption
  starfall_lich:     { idle: A('sprites/echoes/enemies/starfall_lich_idle.png'),     attack: A('sprites/echoes/enemies/starfall_lich_idle.png'),     skill: A('sprites/echoes/enemies/starfall_lich_idle.png'),     hit: A('sprites/echoes/enemies/starfall_lich_idle.png'),     death: A('sprites/echoes/enemies/starfall_lich_idle.png'),     cols: 1, rows: 1 },
  void_juggernaut:   { idle: A('sprites/echoes/enemies/void_juggernaut_idle.png'),   attack: A('sprites/echoes/enemies/void_juggernaut_idle.png'),   skill: A('sprites/echoes/enemies/void_juggernaut_idle.png'),   hit: A('sprites/echoes/enemies/void_juggernaut_idle.png'),   death: A('sprites/echoes/enemies/void_juggernaut_idle.png'),   cols: 1, rows: 1 },
  astral_archer:     { idle: A('sprites/echoes/enemies/astral_archer_idle.png'),     attack: A('sprites/echoes/enemies/astral_archer_idle.png'),     skill: A('sprites/echoes/enemies/astral_archer_idle.png'),     hit: A('sprites/echoes/enemies/astral_archer_idle.png'),     death: A('sprites/echoes/enemies/astral_archer_idle.png'),     cols: 1, rows: 1 },
  orb_caster:        { idle: A('sprites/echoes/enemies/orb_caster_idle.png'),        attack: A('sprites/echoes/enemies/orb_caster_idle.png'),        skill: A('sprites/echoes/enemies/orb_caster_idle.png'),        hit: A('sprites/echoes/enemies/orb_caster_idle.png'),        death: A('sprites/echoes/enemies/orb_caster_idle.png'),        cols: 1, rows: 1 },
  soul_devourer:     { idle: A('sprites/echoes/enemies/soul_devourer_idle.png'),     attack: A('sprites/echoes/enemies/soul_devourer_idle.png'),     skill: A('sprites/echoes/enemies/soul_devourer_idle.png'),     hit: A('sprites/echoes/enemies/soul_devourer_idle.png'),     death: A('sprites/echoes/enemies/soul_devourer_idle.png'),     cols: 1, rows: 1 },
  // Ch 25-29 Final Apocalypse
  apocalypse_horror: { idle: A('sprites/echoes/enemies/apocalypse_horror_idle.png'), attack: A('sprites/echoes/enemies/apocalypse_horror_idle.png'), skill: A('sprites/echoes/enemies/apocalypse_horror_idle.png'), hit: A('sprites/echoes/enemies/apocalypse_horror_idle.png'), death: A('sprites/echoes/enemies/apocalypse_horror_idle.png'), cols: 1, rows: 1 },
  world_eater_husk:  { idle: A('sprites/echoes/enemies/world_eater_husk_idle.png'),  attack: A('sprites/echoes/enemies/world_eater_husk_idle.png'),  skill: A('sprites/echoes/enemies/world_eater_husk_idle.png'),  hit: A('sprites/echoes/enemies/world_eater_husk_idle.png'),  death: A('sprites/echoes/enemies/world_eater_husk_idle.png'),  cols: 1, rows: 1 },
  blood_titan:       { idle: A('sprites/echoes/enemies/blood_titan_idle.png'),       attack: A('sprites/echoes/enemies/blood_titan_idle.png'),       skill: A('sprites/echoes/enemies/blood_titan_idle.png'),       hit: A('sprites/echoes/enemies/blood_titan_idle.png'),       death: A('sprites/echoes/enemies/blood_titan_idle.png'),       cols: 1, rows: 1 },
  ash_lord:          { idle: A('sprites/echoes/enemies/ash_lord_idle.png'),          attack: A('sprites/echoes/enemies/ash_lord_idle.png'),          skill: A('sprites/echoes/enemies/ash_lord_idle.png'),          hit: A('sprites/echoes/enemies/ash_lord_idle.png'),          death: A('sprites/echoes/enemies/ash_lord_idle.png'),          cols: 1, rows: 1 },
  final_revenant:    { idle: A('sprites/echoes/enemies/final_revenant_idle.png'),    attack: A('sprites/echoes/enemies/final_revenant_idle.png'),    skill: A('sprites/echoes/enemies/final_revenant_idle.png'),    hit: A('sprites/echoes/enemies/final_revenant_idle.png'),    death: A('sprites/echoes/enemies/final_revenant_idle.png'),    cols: 1, rows: 1 },
};
