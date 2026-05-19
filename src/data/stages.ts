import type { Stage } from '../types';

// Stages now use Echoes of the Grave enemies (Shambler, BoneKnight, FastGhoul, GraveyardLich)
// Enemies share the same template/stat structure as heroes. We define enemy "templates" via
// the ENEMY_BASE_STATS map below; the stage resolver will look these up.

export const ENEMY_TEMPLATES = {
  shambler:      { name: 'Shambler',       element: 'dark' as const,  archetype: 'tank' as const,    baseStats: { hp: 1400, atk: 90,  def: 70,  spd: 30, crit: 0.05 }, color: '#65a30d', ultimateId: 'enemy_basic' },
  fastghoul:     { name: 'Fast Ghoul',     element: 'dark' as const,  archetype: 'assassin' as const, baseStats: { hp: 800,  atk: 130, def: 40,  spd: 90, crit: 0.20 }, color: '#a3a3a3', ultimateId: 'enemy_basic' },
  boneknight:    { name: 'Bone Knight',    element: 'dark' as const,  archetype: 'warrior' as const, baseStats: { hp: 1600, atk: 140, def: 100, spd: 55, crit: 0.10 }, color: '#e7e5e4', ultimateId: 'enemy_basic' },
  graveyardlich: { name: 'Graveyard Lich', element: 'dark' as const,  archetype: 'mage' as const,    baseStats: { hp: 2000, atk: 180, def: 80,  spd: 65, crit: 0.15 }, color: '#7c3aed', ultimateId: 'enemy_basic' },
};
export type EnemyTemplateId = keyof typeof ENEMY_TEMPLATES;

const E = (templateId: EnemyTemplateId, level: number, star = 3) => ({ templateId: templateId as string, level, star });

// 15 stages: 3 chapters × 5 stages, using new enemy roster
export const STAGES: Stage[] = [
  // Chapter 1 — Forsaken Fields
  { id: '1-1', chapter: 1, num: 1, name: 'The Risen Path', energyCost: 6,
    enemyTeam: [E('shambler', 1), E('shambler', 1), E('shambler', 1)],
    rewards: { gold: 80, exp: 30 }, firstClearBonus: { gems: 20 } },
  { id: '1-2', chapter: 1, num: 2, name: 'Wailing Hollow', energyCost: 6,
    enemyTeam: [E('shambler', 3), E('fastghoul', 2), E('shambler', 3)],
    rewards: { gold: 100, exp: 40 }, firstClearBonus: { gems: 20 } },
  { id: '1-3', chapter: 1, num: 3, name: 'Old Burial Ground', energyCost: 6,
    enemyTeam: [E('fastghoul', 4), E('shambler', 4), E('fastghoul', 4)],
    rewards: { gold: 120, exp: 50 }, firstClearBonus: { gems: 30 } },
  { id: '1-4', chapter: 1, num: 4, name: 'Cracked Earth', energyCost: 8,
    enemyTeam: [E('shambler', 6), E('boneknight', 5), E('fastghoul', 6)],
    rewards: { gold: 150, exp: 60 }, firstClearBonus: { gems: 30 } },
  { id: '1-5', chapter: 1, num: 5, name: 'Fields Boss: First Knight', energyCost: 10,
    enemyTeam: [E('boneknight', 8, 4), E('shambler', 7), E('shambler', 7)],
    rewards: { gold: 250, exp: 100, items: { sword_4: 1 } }, firstClearBonus: { gems: 80 } },

  // Chapter 2 — Ashen Wastes
  { id: '2-1', chapter: 2, num: 1, name: 'Scorched March', energyCost: 8,
    enemyTeam: [E('boneknight', 10), E('fastghoul', 10), E('fastghoul', 10)],
    rewards: { gold: 200, exp: 100 }, firstClearBonus: { gems: 40 } },
  { id: '2-2', chapter: 2, num: 2, name: 'Lich-Haunted Mire', energyCost: 8,
    enemyTeam: [E('graveyardlich', 11, 4), E('shambler', 12), E('shambler', 12)],
    rewards: { gold: 220, exp: 110 }, firstClearBonus: { gems: 40 } },
  { id: '2-3', chapter: 2, num: 3, name: 'Bone Garden', energyCost: 10,
    enemyTeam: [E('boneknight', 13, 4), E('boneknight', 13, 4), E('fastghoul', 12)],
    rewards: { gold: 260, exp: 130 }, firstClearBonus: { gems: 60 } },
  { id: '2-4', chapter: 2, num: 4, name: 'Charred Sanctum', energyCost: 10,
    enemyTeam: [E('graveyardlich', 14), E('fastghoul', 15), E('boneknight', 14, 4)],
    rewards: { gold: 300, exp: 150 }, firstClearBonus: { gems: 60 } },
  { id: '2-5', chapter: 2, num: 5, name: 'Wastes Boss: Hollow Lich', energyCost: 12,
    enemyTeam: [E('graveyardlich', 16, 5), E('boneknight', 16, 4), E('fastghoul', 16, 4)],
    rewards: { gold: 500, exp: 220, items: { armor_4: 1 } }, firstClearBonus: { gems: 120 } },

  // Chapter 3 — Dread Court
  { id: '3-1', chapter: 3, num: 1, name: 'Throne of Bone', energyCost: 12,
    enemyTeam: [E('boneknight', 18, 4), E('boneknight', 19, 4), E('graveyardlich', 18, 4)],
    rewards: { gold: 380, exp: 200 }, firstClearBonus: { gems: 80 } },
  { id: '3-2', chapter: 3, num: 2, name: 'Lich Conclave', energyCost: 12,
    enemyTeam: [E('graveyardlich', 19, 5), E('graveyardlich', 20, 4), E('fastghoul', 20)],
    rewards: { gold: 420, exp: 220 }, firstClearBonus: { gems: 80 } },
  { id: '3-3', chapter: 3, num: 3, name: 'Necropolis Gate', energyCost: 14,
    enemyTeam: [E('boneknight', 21, 5), E('graveyardlich', 22, 4), E('graveyardlich', 21, 4)],
    rewards: { gold: 480, exp: 240 }, firstClearBonus: { gems: 100 } },
  { id: '3-4', chapter: 3, num: 4, name: 'Royal Vault', energyCost: 14,
    enemyTeam: [E('boneknight', 22, 5), E('graveyardlich', 22, 5), E('fastghoul', 22, 4)],
    rewards: { gold: 520, exp: 260 }, firstClearBonus: { gems: 100 } },
  { id: '3-5', chapter: 3, num: 5, name: 'Court Boss: The Crowned Lich', energyCost: 18,
    enemyTeam: [E('graveyardlich', 25, 5), E('boneknight', 25, 5), E('graveyardlich', 24, 5)],
    rewards: { gold: 1000, exp: 500, items: { sword_5: 1 } }, firstClearBonus: { gems: 250 } },

  // Chapter 4 — Whispering Crypts (post-game, harder)
  { id: '4-1', chapter: 4, num: 1, name: 'Crypt of Cinders', energyCost: 16,
    enemyTeam: [E('boneknight', 30, 5), E('graveyardlich', 28, 5), E('fastghoul', 30, 5)],
    rewards: { gold: 600, exp: 300 }, firstClearBonus: { gems: 100 } },
  { id: '4-2', chapter: 4, num: 2, name: 'Sunken Reliquary', energyCost: 16,
    enemyTeam: [E('graveyardlich', 32, 5), E('graveyardlich', 32, 5), E('boneknight', 30, 5)],
    rewards: { gold: 640, exp: 320 }, firstClearBonus: { gems: 110 } },
  { id: '4-3', chapter: 4, num: 3, name: 'Hall of Echoes', energyCost: 18,
    enemyTeam: [E('boneknight', 34, 5), E('boneknight', 34, 5), E('graveyardlich', 33, 5)],
    rewards: { gold: 720, exp: 360 }, firstClearBonus: { gems: 120 } },
  { id: '4-4', chapter: 4, num: 4, name: 'The Singing Bones', energyCost: 18,
    enemyTeam: [E('graveyardlich', 35, 5), E('boneknight', 35, 5), E('fastghoul', 35, 5)],
    rewards: { gold: 800, exp: 400 }, firstClearBonus: { gems: 130 } },
  { id: '4-5', chapter: 4, num: 5, name: 'Crypts Boss: The Worm of Names', energyCost: 22,
    enemyTeam: [E('graveyardlich', 40, 5), E('graveyardlich', 40, 5), E('boneknight', 38, 5)],
    rewards: { gold: 1500, exp: 700, items: { armor_5: 1 } }, firstClearBonus: { gems: 300 } },

  // Chapter 5 — Pale Cathedral
  { id: '5-1', chapter: 5, num: 1, name: 'Frostbroken Nave', energyCost: 20,
    enemyTeam: [E('graveyardlich', 42, 5), E('boneknight', 42, 5), E('fastghoul', 42, 5)],
    rewards: { gold: 900, exp: 450 }, firstClearBonus: { gems: 150 } },
  { id: '5-2', chapter: 5, num: 2, name: 'Pale Choir', energyCost: 20,
    enemyTeam: [E('graveyardlich', 45, 5), E('graveyardlich', 45, 5), E('graveyardlich', 45, 5)],
    rewards: { gold: 960, exp: 480 }, firstClearBonus: { gems: 160 } },
  { id: '5-3', chapter: 5, num: 3, name: 'Cracked Altar', energyCost: 22,
    enemyTeam: [E('boneknight', 48, 5), E('boneknight', 48, 5), E('graveyardlich', 46, 5)],
    rewards: { gold: 1050, exp: 525 }, firstClearBonus: { gems: 175 } },
  { id: '5-4', chapter: 5, num: 4, name: 'Bone Pulpit', energyCost: 22,
    enemyTeam: [E('graveyardlich', 50, 5), E('boneknight', 50, 5), E('boneknight', 50, 5)],
    rewards: { gold: 1140, exp: 570 }, firstClearBonus: { gems: 185 } },
  { id: '5-5', chapter: 5, num: 5, name: 'Cathedral Boss: The Silent Pontiff', energyCost: 26,
    enemyTeam: [E('graveyardlich', 55, 5), E('graveyardlich', 55, 5), E('graveyardlich', 55, 5)],
    rewards: { gold: 2100, exp: 1000, items: { helm_5: 1 } }, firstClearBonus: { gems: 400 } },

  // Chapter 6 — World's Edge
  { id: '6-1', chapter: 6, num: 1, name: 'Cliffs of Forgetting', energyCost: 24,
    enemyTeam: [E('boneknight', 58, 5), E('graveyardlich', 58, 5), E('fastghoul', 60, 5)],
    rewards: { gold: 1300, exp: 650 }, firstClearBonus: { gems: 200 } },
  { id: '6-2', chapter: 6, num: 2, name: 'Tideless Sea', energyCost: 24,
    enemyTeam: [E('graveyardlich', 62, 5), E('graveyardlich', 62, 5), E('boneknight', 60, 5)],
    rewards: { gold: 1400, exp: 700 }, firstClearBonus: { gems: 215 } },
  { id: '6-3', chapter: 6, num: 3, name: 'Last Light', energyCost: 26,
    enemyTeam: [E('boneknight', 65, 5), E('graveyardlich', 65, 5), E('graveyardlich', 65, 5)],
    rewards: { gold: 1550, exp: 775 }, firstClearBonus: { gems: 230 } },
  { id: '6-4', chapter: 6, num: 4, name: 'The Cold Beyond', energyCost: 26,
    enemyTeam: [E('graveyardlich', 68, 5), E('boneknight', 68, 5), E('graveyardlich', 68, 5)],
    rewards: { gold: 1700, exp: 850 }, firstClearBonus: { gems: 250 } },
  { id: '6-5', chapter: 6, num: 5, name: 'World End: The Quiet Crown', energyCost: 32,
    enemyTeam: [E('graveyardlich', 75, 5), E('graveyardlich', 75, 5), E('graveyardlich', 75, 5)],
    rewards: { gold: 3500, exp: 1500, items: { amulet_5: 1 } }, firstClearBonus: { gems: 600 } },
];

export const STAGE_BY_ID = Object.fromEntries(STAGES.map(s => [s.id, s]));
