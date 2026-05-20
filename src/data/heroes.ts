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
    baseStats: stat(950, 110, 60, 50, 0.10),
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
    baseStats: stat(750, 135, 40, 80, 0.18),
    ultimateId: 'arrow_volley',
    emoji: '🏹',
    color: '#65a30d',
    flavor: 'Elven archer. Strikes from the treeline.',
    pullWeight: 28,
  },
  {
    id: 'len',
    name: 'Len',
    rarity: 3,
    element: 'dark',
    archetype: 'assassin',
    baseStats: stat(800, 145, 45, 85, 0.22),
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
    baseStats: stat(850, 120, 50, 65, 0.10),
    ultimateId: 'dawn_blessing',
    emoji: '✨',
    color: '#fde047',
    flavor: 'Priestess of the dawn. Mends what is broken.',
    pullWeight: 14,
  },
  {
    id: 'aelia',
    name: 'Aelia',
    rarity: 3,
    element: 'water',
    archetype: 'mage',
    baseStats: stat(780, 170, 45, 70, 0.15),
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
    baseStats: stat(1700, 100, 130, 45, 0.06),
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
    baseStats: stat(750, 175, 40, 70, 0.18),
    ultimateId: 'infernal_cataclysm',
    emoji: '🔥',
    color: '#f97316',
    flavor: 'Pyromancer of the Burning Court. Embers ride her breath.',
    pullWeight: 6,
  },
];

export const HERO_BY_ID = Object.fromEntries(HERO_TEMPLATES.map(h => [h.id, h]));

export const HERO_SPRITES: Record<string, {
  idle: string;
  attack: string;
  skill: string;
  hit: string;
  death: string;
  cols: number;
  rows: number;
}> = {
  luna:   { idle: A('sprites/echoes/heroes/luna_idle.png'),   attack: A('sprites/echoes/heroes/luna_attack.png'),   skill: A('sprites/echoes/heroes/luna_skill.png'),   hit: A('sprites/echoes/heroes/luna_hit.png'),   death: A('sprites/echoes/heroes/luna_death.png'),   cols: 1, rows: 1 },
  elara:  { idle: A('sprites/echoes/heroes/elara_idle.png'),  attack: A('sprites/echoes/heroes/elara_attack.png'),  skill: A('sprites/echoes/heroes/elara_skill.png'),  hit: A('sprites/echoes/heroes/elara_hit.png'),  death: A('sprites/echoes/heroes/elara_death.png'),  cols: 1, rows: 1 },
  aelia:  { idle: A('sprites/echoes/heroes/aelia_idle.png'),  attack: A('sprites/echoes/heroes/aelia_attack.png'),  skill: A('sprites/echoes/heroes/aelia_skill.png'),  hit: A('sprites/echoes/heroes/aelia_hit.png'),  death: A('sprites/echoes/heroes/aelia_death.png'),  cols: 1, rows: 1 },
  kengo:  { idle: A('sprites/echoes/heroes/kengo_idle.png'),  attack: A('sprites/echoes/heroes/kengo_attack.png'),  skill: A('sprites/echoes/heroes/kengo_skill.png'),  hit: A('sprites/echoes/heroes/kengo_hit.png'),  death: A('sprites/echoes/heroes/kengo_death.png'),  cols: 1, rows: 1 },
  len:    { idle: A('sprites/echoes/heroes/len_idle.png'),    attack: A('sprites/echoes/heroes/len_attack.png'),    skill: A('sprites/echoes/heroes/len_skill.png'),    hit: A('sprites/echoes/heroes/len_hit.png'),    death: A('sprites/echoes/heroes/len_death.png'),    cols: 1, rows: 1 },
  kaius:  { idle: A('sprites/echoes/heroes/kaius_idle.png'),  attack: A('sprites/echoes/heroes/kaius_attack.png'),  skill: A('sprites/echoes/heroes/kaius_skill.png'),  hit: A('sprites/echoes/heroes/kaius_hit.png'),  death: A('sprites/echoes/heroes/kaius_death.png'),  cols: 1, rows: 1 },
  pyra:   { idle: A('sprites/echoes/heroes/pyra_idle.png'),   attack: A('sprites/echoes/heroes/pyra_attack.png'),   skill: A('sprites/echoes/heroes/pyra_skill.png'),   hit: A('sprites/echoes/heroes/pyra_hit.png'),   death: A('sprites/echoes/heroes/pyra_death.png'),   cols: 1, rows: 1 },
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
