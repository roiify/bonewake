import seedrandom from 'seedrandom';
import { SKILL_BY_ID } from '../data/skills';
import type { CombatUnit, BattleAction, BattleResult, Element } from '../types';

function elementAdvantage(a: Element, b: Element): number {
  const triangle: Record<Element, Element> = {
    fire: 'earth',
    earth: 'water',
    water: 'fire',
    light: 'dark',
    dark: 'light',
  };
  if (triangle[a] === b) return 1.5;
  if (triangle[b] === a) return 0.75;
  return 1.0;
}

function pickEnemyTarget(enemies: CombatUnit[], rng: () => number): CombatUnit | undefined {
  const alive = enemies.filter(e => e.alive);
  if (!alive.length) return undefined;
  // 70% lowest HP, 30% random
  if (rng() < 0.7) {
    return [...alive].sort((a, b) => a.hp - b.hp)[0];
  }
  return alive[Math.floor(rng() * alive.length)];
}

function pickAllyHealTarget(allies: CombatUnit[]): CombatUnit | undefined {
  const alive = allies.filter(a => a.alive);
  if (!alive.length) return undefined;
  return [...alive].sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
}

export function resolveBattle(
  player: CombatUnit[],
  enemy: CombatUnit[],
  seed?: string
): BattleResult {
  const s = seed ?? Date.now().toString();
  const rng = seedrandom(s);
  // deep clone
  const p = player.map(u => ({ ...u, hp: u.maxHp, energy: 0, alive: true, effects: [] as any[] }));
  const e = enemy.map(u => ({ ...u, hp: u.maxHp, energy: 0, alive: true, effects: [] as any[] }));
  const initial = {
    player: p.map(u => ({ ...u, effects: [] })),
    enemy: e.map(u => ({ ...u, effects: [] })),
  };
  const log: BattleAction[] = [];
  let tick = 0;
  let round = 0;

  while (p.some(u => u.alive) && e.some(u => u.alive) && round < 30) {
    const order = [...p, ...e].filter(u => u.alive).sort((a, b) => b.spd - a.spd);
    for (const unit of order) {
      if (!unit.alive) continue;
      if (!p.some(u => u.alive) || !e.some(u => u.alive)) break;
      const isPlayer = unit.side === 'player';
      const allies = isPlayer ? p : e;
      const enemies = isPlayer ? e : p;
      const isUlt = unit.energy >= 100;
      const skill = isUlt ? SKILL_BY_ID[unit.ultimateId] : undefined;

      if (isUlt && skill) {
        // Handle ultimate — apply skill effects to target as ActiveEffect
        // (burns/shields/buffs are tracked but their tick application is simplified
        // for the resolver — we just attach them so the UI can show icons).
        if (skill.targeting === 'self' && skill.effect?.type === 'heal') {
          // AoE heal allies (treat 'self' here as team-heal)
          const healValue = skill.effect.value + Math.floor(unit.atk * 0.5);
          for (const ally of allies) {
            if (!ally.alive) continue;
            const before = ally.hp;
            ally.hp = Math.min(ally.maxHp, ally.hp + healValue);
            log.push({ tick: ++tick, src: unit.id, dst: ally.id, dmg: 0, crit: false, ult: true, heal: ally.hp - before });
          }
        } else if (skill.targeting === 'all') {
          for (const target of enemies) {
            if (!target.alive) continue;
            const eAdv = elementAdvantage(unit.element, target.element);
            const isCrit = rng() < unit.crit;
            let dmg = Math.max(1, unit.atk * skill.damageMultiplier - target.def);
            dmg = Math.floor(dmg * (isCrit ? 1.5 : 1) * eAdv);
            target.hp = Math.max(0, target.hp - dmg);
            log.push({ tick: ++tick, src: unit.id, dst: target.id, dmg, crit: isCrit, ult: true });
            // Apply skill side-effects to target
            if (skill.effect && (target.effects as any)) {
              (target.effects as any).push({ kind: skill.effect.type, value: skill.effect.value, remaining: skill.effect.duration ?? 2 });
            }
            if (target.hp <= 0) target.alive = false;
          }
        } else {
          // single / lowest
          const target = skill.targeting === 'lowest'
            ? [...enemies].filter(x => x.alive).sort((a, b) => a.hp - b.hp)[0]
            : pickEnemyTarget(enemies, rng);
          if (target) {
            const eAdv = elementAdvantage(unit.element, target.element);
            const isCrit = rng() < unit.crit;
            let dmg = Math.max(1, unit.atk * skill.damageMultiplier - target.def);
            dmg = Math.floor(dmg * (isCrit ? 1.5 : 1) * eAdv);
            target.hp = Math.max(0, target.hp - dmg);
            log.push({ tick: ++tick, src: unit.id, dst: target.id, dmg, crit: isCrit, ult: true });
            if (skill.effect && (target.effects as any)) {
              (target.effects as any).push({ kind: skill.effect.type, value: skill.effect.value, remaining: skill.effect.duration ?? 2 });
            }
            if (target.hp <= 0) target.alive = false;
          }
        }
        // Self-target effects also attach to the caster (e.g., buff_atk)
        if (skill.effect && (skill.targeting === 'self' && skill.effect.type !== 'heal') && (unit.effects as any)) {
          (unit.effects as any).push({ kind: skill.effect.type, value: skill.effect.value, remaining: skill.effect.duration ?? 2 });
        }
        unit.energy = 0;
      } else {
        // Basic attack
        if (unit.archetype === 'healer' && allies.some(a => a.alive && a.hp / a.maxHp < 0.6)) {
          const ally = pickAllyHealTarget(allies);
          if (ally && ally !== unit) {
            const healValue = Math.floor(unit.atk * 1.2);
            const before = ally.hp;
            ally.hp = Math.min(ally.maxHp, ally.hp + healValue);
            log.push({ tick: ++tick, src: unit.id, dst: ally.id, dmg: 0, crit: false, ult: false, heal: ally.hp - before });
            unit.energy = Math.min(100, unit.energy + 20);
            continue;
          }
        }
        const target = pickEnemyTarget(enemies, rng);
        if (!target) continue;
        const eAdv = elementAdvantage(unit.element, target.element);
        const isCrit = rng() < unit.crit;
        let dmg = Math.max(1, unit.atk - target.def);
        dmg = Math.floor(dmg * (isCrit ? 1.5 : 1) * eAdv);
        target.hp = Math.max(0, target.hp - dmg);
        log.push({ tick: ++tick, src: unit.id, dst: target.id, dmg, crit: isCrit, ult: false });
        if (target.hp <= 0) target.alive = false;
        unit.energy = Math.min(100, unit.energy + 20);
        target.energy = Math.min(100, target.energy + 30);
      }
    }
    round++;
  }

  const winner = p.some(u => u.alive) ? 'player' : 'enemy';
  return { seed: s, winner, log, initial };
}
