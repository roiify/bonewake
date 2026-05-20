import type { Skill } from '../types';

export const SKILLS: Skill[] = [
  { id: 'arrow_volley', name: 'Arrow Volley', description: 'Hail of arrows on all enemies.', damageMultiplier: 1.8, targeting: 'all' },
  { id: 'iron_palm', name: 'Iron Palm', description: 'Devastating single strike.', damageMultiplier: 3.2, targeting: 'single' },
  { id: 'shadow_dance', name: 'Shadow Dance', description: 'Multi-hit on lowest-HP target.', damageMultiplier: 4.0, targeting: 'lowest' },
  { id: 'dawn_blessing', name: 'Dawn Blessing', description: 'Heals all allies for 800.', damageMultiplier: 0, targeting: 'self', effect: { type: 'heal', value: 800 } },
  { id: 'frost_crystal', name: 'Frost Crystal', description: 'Crystalline blast on all enemies.', damageMultiplier: 2.2, targeting: 'all' },
  { id: 'aegis_judgment', name: 'Aegis Judgment', description: 'Massive single hit + ally shield.', damageMultiplier: 3.6, targeting: 'single', effect: { type: 'shield', value: 400, duration: 2 } },
  { id: 'phantom_charge', name: 'Phantom Charge', description: 'Spectral lance impales a single foe + self shield.', damageMultiplier: 3.4, targeting: 'single', effect: { type: 'shield', value: 350, duration: 2 } },
  { id: 'wraiths_scream', name: "Wraith's Scream", description: 'Ear-splitting wail hits all enemies.', damageMultiplier: 2.0, targeting: 'all' },
];

export const SKILL_BY_ID = Object.fromEntries(SKILLS.map(s => [s.id, s]));
