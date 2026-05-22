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
    baseStats: stat(1100, 125, 75, 60, 0.12),
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
    baseStats: stat(720, 130, 45, 90, 0.28),
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
    baseStats: stat(750, 140, 45, 95, 0.32),
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
    baseStats: stat(1000, 95, 95, 60, 0.08),
    ultimateId: 'dawn_blessing',
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
    baseStats: stat(770, 165, 50, 70, 0.15),
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
    // Pure wall: highest HP + DEF, lowest ATK/SPD/CRIT
    baseStats: stat(1900, 90, 150, 40, 0.05),
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
    baseStats: stat(720, 170, 45, 75, 0.16),
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
    baseStats: stat(1050, 135, 70, 65, 0.18),
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
    baseStats: stat(1200, 120, 85, 60, 0.10),
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
    baseStats: stat(820, 160, 55, 65, 0.14),
    ultimateId: 'army_of_the_dead',
    emoji: '💀',
    color: '#7c3aed',
    flavor: 'Death Caller. Battles alone — his minions are his party.',
    pullWeight: 3,
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
};

export const HERO_SPRITES: Record<string, {
  idle: string;
  attack: string;
  skill: string;     // mid-power skill (fires at 50 energy)
  ult: string;       // full cinematic (fires at 100 energy)
  hit: string;
  death: string;
  cols: number;
  rows: number;
}> = {
  // New PixelLab mature-fantasy sprites. Static for now (all 5 poses point to the
  // same base) — multi-frame animation strips will replace these per-pose as the
  // animate-with-text pipeline produces them.
  luna:   { idle: A('sprites/pixellab/heroes/luna_idle.png'), attack: A('sprites/pixellab/heroes/luna_attack.png'), skill: A('sprites/pixellab/heroes/luna_skill.png'), ult: A('sprites/pixellab/heroes/luna_ult.png'), hit: A('sprites/pixellab/heroes/luna_idle.png'), death: A('sprites/pixellab/heroes/luna_death.png'), cols: 43, rows: 1 },
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
  bone_king:      { idle: A('sprites/pixellab/heroes/bone_king_idle.png'),      attack: A('sprites/pixellab/heroes/bone_king_attack.png'),      skill: A('sprites/pixellab/heroes/bone_king_skill.png'),      ult: A('sprites/pixellab/heroes/bone_king_ult.png'),      hit: A('sprites/pixellab/heroes/bone_king_idle.png'),      death: A('sprites/pixellab/heroes/bone_king_death.png'),      cols: 43, rows: 1 },
  lich_sovereign: { idle: A('sprites/pixellab/heroes/lich_sovereign_idle.png'), attack: A('sprites/pixellab/heroes/lich_sovereign_attack.png'), skill: A('sprites/pixellab/heroes/lich_sovereign_skill.png'), ult: A('sprites/pixellab/heroes/lich_sovereign_ult.png'), hit: A('sprites/pixellab/heroes/lich_sovereign_idle.png'), death: A('sprites/pixellab/heroes/lich_sovereign_death.png'), cols: 43, rows: 1 },
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
  worldboss_1:   { idle: A('sprites/echoes/enemies/worldboss_1_idle.png'),    attack: A('sprites/echoes/enemies/worldboss_1_attack.png'),   skill: A('sprites/echoes/enemies/worldboss_1_skill.png'),   hit: A('sprites/echoes/enemies/worldboss_1_hit.png'),   death: A('sprites/echoes/enemies/worldboss_1_death.png'),   cols: 43, rows: 1 },
  shambler:      { idle: A('sprites/echoes/enemies/shambler_idle.png'),      attack: A('sprites/echoes/enemies/shambler_attack.png'),      skill: A('sprites/echoes/enemies/shambler_skill.png'),      hit: A('sprites/echoes/enemies/shambler_hit.png'),      death: A('sprites/echoes/enemies/shambler_death.png'),      cols: 1, rows: 1 },
  boneknight:    { idle: A('sprites/echoes/enemies/boneknight_idle.png'),    attack: A('sprites/echoes/enemies/boneknight_attack.png'),    skill: A('sprites/echoes/enemies/boneknight_skill.png'),    hit: A('sprites/echoes/enemies/boneknight_hit.png'),    death: A('sprites/echoes/enemies/boneknight_death.png'),    cols: 1, rows: 1 },
  fastghoul:     { idle: A('sprites/echoes/enemies/fastghoul_idle.png'),     attack: A('sprites/echoes/enemies/fastghoul_attack.png'),     skill: A('sprites/echoes/enemies/fastghoul_skill.png'),     hit: A('sprites/echoes/enemies/fastghoul_hit.png'),     death: A('sprites/echoes/enemies/fastghoul_death.png'),     cols: 1, rows: 1 },
  graveyardlich: { idle: A('sprites/echoes/enemies/graveyardlich_idle.png'), attack: A('sprites/echoes/enemies/graveyardlich_attack.png'), skill: A('sprites/echoes/enemies/graveyardlich_skill.png'), hit: A('sprites/echoes/enemies/graveyardlich_hit.png'), death: A('sprites/echoes/enemies/graveyardlich_death.png'), cols: 1, rows: 1 },
  // Chapter 7 enemies are single-frame portraits (cols:1 rows:1) — each pose
  // is one full 1024x1024 image, not a 4x4 atlas like the original cast.
  undead_archer:     { idle: A('sprites/echoes/enemies/undead_archer_idle.png'),     attack: A('sprites/echoes/enemies/undead_archer_attack.png'),     skill: A('sprites/echoes/enemies/undead_archer_skill.png'),     hit: A('sprites/echoes/enemies/undead_archer_hit.png'),     death: A('sprites/echoes/enemies/undead_archer_death.png'),     cols: 1, rows: 1 },
  plague_caster:     { idle: A('sprites/echoes/enemies/plague_caster_idle.png'),     attack: A('sprites/echoes/enemies/plague_caster_attack.png'),     skill: A('sprites/echoes/enemies/plague_caster_skill.png'),     hit: A('sprites/echoes/enemies/plague_caster_hit.png'),     death: A('sprites/echoes/enemies/plague_caster_death.png'),     cols: 1, rows: 1 },
  fallen_captain:    { idle: A('sprites/echoes/enemies/fallen_captain_idle.png'),    attack: A('sprites/echoes/enemies/fallen_captain_attack.png'),    skill: A('sprites/echoes/enemies/fallen_captain_skill.png'),    hit: A('sprites/echoes/enemies/fallen_captain_hit.png'),    death: A('sprites/echoes/enemies/fallen_captain_death.png'),    cols: 1, rows: 1 },
  skeletal_warhorse: { idle: A('sprites/echoes/enemies/skeletal_warhorse_idle.png'), attack: A('sprites/echoes/enemies/skeletal_warhorse_attack.png'), skill: A('sprites/echoes/enemies/skeletal_warhorse_skill.png'), hit: A('sprites/echoes/enemies/skeletal_warhorse_hit.png'), death: A('sprites/echoes/enemies/skeletal_warhorse_death.png'), cols: 1, rows: 1 },
  carrion_spider:    { idle: A('sprites/echoes/enemies/carrion_spider_idle.png'),    attack: A('sprites/echoes/enemies/carrion_spider_attack.png'),    skill: A('sprites/echoes/enemies/carrion_spider_skill.png'),    hit: A('sprites/echoes/enemies/carrion_spider_hit.png'),    death: A('sprites/echoes/enemies/carrion_spider_death.png'),    cols: 1, rows: 1 },
  phantom_knight:    { idle: A('sprites/echoes/enemies/phantom_knight_idle.png'),    attack: A('sprites/echoes/enemies/phantom_knight_attack.png'),    skill: A('sprites/echoes/enemies/phantom_knight_skill.png'),    hit: A('sprites/echoes/enemies/phantom_knight_hit.png'),    death: A('sprites/echoes/enemies/phantom_knight_death.png'),    cols: 1, rows: 1 },
  wailing_wraith:    { idle: A('sprites/echoes/enemies/wailing_wraith_idle.png'),    attack: A('sprites/echoes/enemies/wailing_wraith_attack.png'),    skill: A('sprites/echoes/enemies/wailing_wraith_skill.png'),    hit: A('sprites/echoes/enemies/wailing_wraith_hit.png'),    death: A('sprites/echoes/enemies/wailing_wraith_death.png'),    cols: 1, rows: 1 },
  // Chapter 8 — Zombie Legion + Necromancer's Court
  zombie_knight:     { idle: A('sprites/echoes/enemies/zombie_knight_idle.png'),     attack: A('sprites/echoes/enemies/zombie_knight_attack.png'),     skill: A('sprites/echoes/enemies/zombie_knight_skill.png'),     hit: A('sprites/echoes/enemies/zombie_knight_hit.png'),     death: A('sprites/echoes/enemies/zombie_knight_death.png'),     cols: 1, rows: 1 },
  zombie_berserker:  { idle: A('sprites/echoes/enemies/zombie_berserker_idle.png'),  attack: A('sprites/echoes/enemies/zombie_berserker_attack.png'),  skill: A('sprites/echoes/enemies/zombie_berserker_skill.png'),  hit: A('sprites/echoes/enemies/zombie_berserker_hit.png'),  death: A('sprites/echoes/enemies/zombie_berserker_death.png'),  cols: 1, rows: 1 },
  shield_bearer:     { idle: A('sprites/echoes/enemies/shield_bearer_idle.png'),     attack: A('sprites/echoes/enemies/shield_bearer_attack.png'),     skill: A('sprites/echoes/enemies/shield_bearer_skill.png'),     hit: A('sprites/echoes/enemies/shield_bearer_hit.png'),     death: A('sprites/echoes/enemies/shield_bearer_death.png'),     cols: 1, rows: 1 },
  zombie_mage:       { idle: A('sprites/echoes/enemies/zombie_mage_idle.png'),       attack: A('sprites/echoes/enemies/zombie_mage_attack.png'),       skill: A('sprites/echoes/enemies/zombie_mage_skill.png'),       hit: A('sprites/echoes/enemies/zombie_mage_hit.png'),       death: A('sprites/echoes/enemies/zombie_mage_death.png'),       cols: 1, rows: 1 },
  grave_channeler:   { idle: A('sprites/echoes/enemies/grave_channeler_idle.png'),   attack: A('sprites/echoes/enemies/grave_channeler_attack.png'),   skill: A('sprites/echoes/enemies/grave_channeler_skill.png'),   hit: A('sprites/echoes/enemies/grave_channeler_hit.png'),   death: A('sprites/echoes/enemies/grave_channeler_death.png'),   cols: 1, rows: 1 },
  soul_leech:        { idle: A('sprites/echoes/enemies/soul_leech_idle.png'),        attack: A('sprites/echoes/enemies/soul_leech_attack.png'),        skill: A('sprites/echoes/enemies/soul_leech_skill.png'),        hit: A('sprites/echoes/enemies/soul_leech_hit.png'),        death: A('sprites/echoes/enemies/soul_leech_death.png'),        cols: 1, rows: 1 },
  rotwolf:           { idle: A('sprites/echoes/enemies/rotwolf_idle.png'),           attack: A('sprites/echoes/enemies/rotwolf_attack.png'),           skill: A('sprites/echoes/enemies/rotwolf_skill.png'),           hit: A('sprites/echoes/enemies/rotwolf_hit.png'),           death: A('sprites/echoes/enemies/rotwolf_death.png'),           cols: 1, rows: 1 },
  bone_bear:         { idle: A('sprites/echoes/enemies/bone_bear_idle.png'),         attack: A('sprites/echoes/enemies/bone_bear_attack.png'),         skill: A('sprites/echoes/enemies/bone_bear_skill.png'),         hit: A('sprites/echoes/enemies/bone_bear_hit.png'),         death: A('sprites/echoes/enemies/bone_bear_death.png'),         cols: 1, rows: 1 },
  // Chapter 9 — Necromancer's Court
  possessed_corpse:  { idle: A('sprites/echoes/enemies/possessed_corpse_idle.png'),  attack: A('sprites/echoes/enemies/possessed_corpse_attack.png'),  skill: A('sprites/echoes/enemies/possessed_corpse_skill.png'),  hit: A('sprites/echoes/enemies/possessed_corpse_hit.png'),  death: A('sprites/echoes/enemies/possessed_corpse_death.png'),  cols: 1, rows: 1 },
  grave_digger:      { idle: A('sprites/echoes/enemies/grave_digger_idle.png'),      attack: A('sprites/echoes/enemies/grave_digger_attack.png'),      skill: A('sprites/echoes/enemies/grave_digger_skill.png'),      hit: A('sprites/echoes/enemies/grave_digger_hit.png'),      death: A('sprites/echoes/enemies/grave_digger_death.png'),      cols: 1, rows: 1 },
  plague_monk:       { idle: A('sprites/echoes/enemies/plague_monk_idle.png'),       attack: A('sprites/echoes/enemies/plague_monk_attack.png'),       skill: A('sprites/echoes/enemies/plague_monk_skill.png'),       hit: A('sprites/echoes/enemies/plague_monk_hit.png'),       death: A('sprites/echoes/enemies/plague_monk_death.png'),       cols: 1, rows: 1 },
  necromancer:       { idle: A('sprites/echoes/enemies/necromancer_idle.png'),       attack: A('sprites/echoes/enemies/necromancer_attack.png'),       skill: A('sprites/echoes/enemies/necromancer_skill.png'),       hit: A('sprites/echoes/enemies/necromancer_hit.png'),       death: A('sprites/echoes/enemies/necromancer_death.png'),       cols: 1, rows: 1 },
};
