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
  luna:   { idle: A('sprites/echoes/heroes/luna_idle.png'),   attack: A('sprites/echoes/heroes/luna_attack.png'),   skill: A('sprites/echoes/heroes/luna_skill.png'),   hit: A('sprites/echoes/heroes/luna_hit.png'),   death: A('sprites/echoes/heroes/luna_death.png'),   cols: 4, rows: 4 },
  elara:  { idle: A('sprites/echoes/heroes/elara_idle.png'),  attack: A('sprites/echoes/heroes/elara_attack.png'),  skill: A('sprites/echoes/heroes/elara_skill.png'),  hit: A('sprites/echoes/heroes/elara_hit.png'),  death: A('sprites/echoes/heroes/elara_death.png'),  cols: 4, rows: 4 },
  aelia:  { idle: A('sprites/echoes/heroes/aelia_idle.png'),  attack: A('sprites/echoes/heroes/aelia_attack.png'),  skill: A('sprites/echoes/heroes/aelia_skill.png'),  hit: A('sprites/echoes/heroes/aelia_hit.png'),  death: A('sprites/echoes/heroes/aelia_death.png'),  cols: 4, rows: 4 },
  kengo:  { idle: A('sprites/echoes/heroes/kengo_idle.png'),  attack: A('sprites/echoes/heroes/kengo_attack.png'),  skill: A('sprites/echoes/heroes/kengo_skill.png'),  hit: A('sprites/echoes/heroes/kengo_hit.png'),  death: A('sprites/echoes/heroes/kengo_death.png'),  cols: 4, rows: 4 },
  len:    { idle: A('sprites/echoes/heroes/len_idle.png'),    attack: A('sprites/echoes/heroes/len_attack.png'),    skill: A('sprites/echoes/heroes/len_skill.png'),    hit: A('sprites/echoes/heroes/len_hit.png'),    death: A('sprites/echoes/heroes/len_death.png'),    cols: 4, rows: 4 },
  kaius:  { idle: A('sprites/echoes/heroes/kaius_idle.png'),  attack: A('sprites/echoes/heroes/kaius_attack.png'),  skill: A('sprites/echoes/heroes/kaius_skill.png'),  hit: A('sprites/echoes/heroes/kaius_hit.png'),  death: A('sprites/echoes/heroes/kaius_death.png'),  cols: 4, rows: 4 },
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
  shambler:      { idle: A('sprites/echoes/enemies/shambler_idle.png'),      attack: A('sprites/echoes/enemies/shambler_attack.png'),      hit: A('sprites/echoes/enemies/shambler_hit.png'),      death: A('sprites/echoes/enemies/shambler_death.png'),      cols: 4, rows: 4 },
  boneknight:    { idle: A('sprites/echoes/enemies/boneknight_idle.png'),    attack: A('sprites/echoes/enemies/boneknight_attack.png'),                                                                                                                  cols: 4, rows: 4 },
  fastghoul:     { idle: A('sprites/echoes/enemies/fastghoul_idle.png'),     attack: A('sprites/echoes/enemies/fastghoul_attack.png'),                                                                                                                  cols: 4, rows: 4 },
  graveyardlich: { idle: A('sprites/echoes/enemies/graveyardlich_idle.png'), skill:  A('sprites/echoes/enemies/graveyardlich_skill.png'), hit: A('sprites/echoes/enemies/graveyardlich_hit.png'), death: A('sprites/echoes/enemies/graveyardlich_death.png'), cols: 4, rows: 4 },
};
