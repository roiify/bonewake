// Hero Trial themed challenges — restricted-squad runs with bonus rewards.
// Each trial has restrictions (element, archetype, solo, no-gear) and a
// scaling enemy team. Daily limit on rewards per trial.
import type { Element, Archetype } from '../types';
import { buildEnemyUnit } from '../lib/stats';
import type { CombatUnit } from '../types';

export interface TrialDef {
  id: string;
  name: string;
  description: string;
  emoji: string;
  energyCost: number;
  // Squad restrictions
  restrict: {
    elementsAllowed?: Element[];
    archetypesAllowed?: Archetype[];
    maxSquadSize?: number;     // e.g. 1 for solo
    noEquipment?: boolean;
  };
  enemyTeam: { templateId: string; level: number; star: number }[];
  rewards: { gold: number; gems: number; soulshard?: number };
  dailyLimit: number;
}

export const TRIALS: TrialDef[] = [
  {
    id: 'light_brigade',
    name: 'Light Brigade',
    description: 'Only Light-element heroes allowed. Bring the dawn.',
    emoji: '☀️',
    energyCost: 15,
    restrict: { elementsAllowed: ['light'] },
    enemyTeam: [
      { templateId: 'graveyardlich', level: 30, star: 5 },
      { templateId: 'boneknight', level: 30, star: 5 },
      { templateId: 'graveyardlich', level: 30, star: 5 },
    ],
    rewards: { gold: 3500, gems: 100, soulshard: 10 },
    dailyLimit: 1,
  },
  {
    id: 'shadow_pact',
    name: 'Shadow Pact',
    description: 'Only Dark-element heroes. Trade light for power.',
    emoji: '🌒',
    energyCost: 15,
    restrict: { elementsAllowed: ['dark'] },
    enemyTeam: [
      { templateId: 'boneknight', level: 32, star: 5 },
      { templateId: 'fastghoul', level: 32, star: 5 },
      { templateId: 'boneknight', level: 32, star: 5 },
    ],
    rewards: { gold: 3500, gems: 100, soulshard: 10 },
    dailyLimit: 1,
  },
  {
    id: 'solo_duel',
    name: 'Solo Duel',
    description: 'A single hero must conquer alone.',
    emoji: '⚔️',
    energyCost: 20,
    restrict: { maxSquadSize: 1 },
    enemyTeam: [
      { templateId: 'graveyardlich', level: 35, star: 5 },
      { templateId: 'boneknight', level: 35, star: 5 },
    ],
    rewards: { gold: 5000, gems: 150, soulshard: 15 },
    dailyLimit: 1,
  },
  {
    id: 'bare_hands',
    name: 'Bare Hands',
    description: 'No equipment may be worn. Skill alone.',
    emoji: '✋',
    energyCost: 18,
    restrict: { noEquipment: true },
    enemyTeam: [
      { templateId: 'boneknight', level: 30, star: 5 },
      { templateId: 'graveyardlich', level: 30, star: 5 },
      { templateId: 'fastghoul', level: 30, star: 5 },
    ],
    rewards: { gold: 4500, gems: 130, soulshard: 12 },
    dailyLimit: 1,
  },
  {
    id: 'monk_circle',
    name: 'Monk Circle',
    description: 'Only Warrior-archetype heroes. Fists and fury.',
    emoji: '🥋',
    energyCost: 15,
    restrict: { archetypesAllowed: ['warrior'] },
    enemyTeam: [
      { templateId: 'boneknight', level: 28, star: 5 },
      { templateId: 'boneknight', level: 28, star: 5 },
      { templateId: 'graveyardlich', level: 28, star: 5 },
    ],
    rewards: { gold: 3000, gems: 80, soulshard: 8 },
    dailyLimit: 1,
  },
];

export function buildTrialEnemyTeam(def: TrialDef): CombatUnit[] {
  return def.enemyTeam.map((e, i) => buildEnemyUnit(e.templateId, e.level, e.star, `trial_${i}`));
}
