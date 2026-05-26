import seedrandom from 'seedrandom';
import { SKILL_BY_ID } from '../data/skills';
import { skillsForHero } from '../data/heroSkills';
import { ultLevelMultiplier } from './ultLeveling';
import type { CombatUnit, BattleAction, BattleResult, Element } from '../types';

interface DamageMods {
  damageMultiplier: number;  // applied to outgoing damage
  critBonus: number;          // added to crit chance
}

// Classic RPG damage mitigation: dmg = raw * 100 / (100 + def).
// Replaces the old `max(1, atk - def)` formula that floored tanks (low
// atk) at 1 damage against high-def bosses. Min damage is 5% of the
// raw figure so no attack ever feels completely useless.
function mitigatedDamage(raw: number, def: number): number {
  const mitigated = raw * 100 / (100 + Math.max(0, def));
  return Math.max(Math.floor(raw * 0.05), mitigated);
}

function getDamageMods(unit: CombatUnit): DamageMods {
  let damageMultiplier = 1.0;
  let critBonus = 0;
  const skills = skillsForHero(unit.templateId);
  for (const sk of skills) {
    if (sk.trigger === 'on_attack' && sk.effect.kind === 'damage_mult') damageMultiplier *= sk.effect.value;
    if (sk.trigger === 'on_attack' && sk.effect.kind === 'crit_chance') critBonus += sk.effect.value;
    if (sk.trigger === 'on_low_hp' && unit.hp / unit.maxHp < 0.3) {
      if (sk.effect.kind === 'damage_mult') damageMultiplier *= sk.effect.value;
    }
  }
  return { damageMultiplier, critBonus };
}

// Modify incoming damage based on target's on_hit passives. Returns the dmg actually dealt
// and (optionally) reflected damage back to the attacker.
function applyOnHit(target: CombatUnit, dmg: number, rng: () => number): { dmg: number; reflect: number } {
  let actual = dmg;
  let reflect = 0;
  const skills = skillsForHero(target.templateId);
  for (const sk of skills) {
    if (sk.trigger !== 'on_hit') continue;
    if (sk.effect.kind === 'dodge' && rng() < sk.effect.value) {
      actual = Math.floor(actual * 0.5);  // dodge halves damage
    }
    if (sk.effect.kind === 'reflect' && rng() < 0.30) {
      reflect = Math.floor(dmg * sk.effect.value);
    }
  }
  return { dmg: actual, reflect };
}

// On kill — attacker gets lifesteal if they have that passive.
function applyOnKill(attacker: CombatUnit) {
  const skills = skillsForHero(attacker.templateId);
  for (const sk of skills) {
    if (sk.trigger === 'on_kill' && sk.effect.kind === 'lifesteal') {
      const heal = Math.floor(attacker.maxHp * sk.effect.value);
      attacker.hp = Math.min(attacker.maxHp, attacker.hp + heal);
    }
  }
}

// First turn — apply once. Returns log entries to push (e.g. team_heal events).
function applyFirstTurn(unit: CombatUnit, allies: CombatUnit[]): { healLogs: { dst: string; heal: number }[]; ranTeamHeal: boolean } {
  const out: { dst: string; heal: number }[] = [];
  let ranTeamHeal = false;
  const skills = skillsForHero(unit.templateId);
  for (const sk of skills) {
    if (sk.trigger !== 'first_turn') continue;
    if (sk.effect.kind === 'team_heal') {
      // Skip entirely if nobody actually needs healing — no log entries
      // emitted so the playback doesn't show "+0" green floaters.
      if (!allies.some(a => a.alive && a.hp < a.maxHp)) continue;
      for (const a of allies) {
        if (!a.alive) continue;
        const before = a.hp;
        a.hp = Math.min(a.maxHp, a.hp + sk.effect.value);
        const gained = a.hp - before;
        if (gained > 0) out.push({ dst: a.id, heal: gained });
      }
      ranTeamHeal = true;
    }
    if (sk.effect.kind === 'self_def_buff') {
      (unit.effects as any) ??= [];
      (unit.effects as any).push({ kind: 'shield', value: sk.effect.value, remaining: sk.effect.duration });
    }
  }
  return { healLogs: out, ranTeamHeal };
}

// On attack lifesteal (heal lowest-HP ally proportional to damage dealt)
function applyOnAttackHeal(attacker: CombatUnit, allies: CombatUnit[], dmg: number): { dst: string; heal: number } | null {
  const skills = skillsForHero(attacker.templateId);
  for (const sk of skills) {
    if (sk.trigger === 'on_attack' && sk.effect.kind === 'lifesteal') {
      const target = [...allies].filter(a => a.alive && a.hp < a.maxHp)
        .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
      if (!target) return null;  // no ally needs healing — skip the lifesteal
      const before = target.hp;
      const amount = Math.floor(dmg * sk.effect.value);
      target.hp = Math.min(target.maxHp, target.hp + amount);
      const gained = target.hp - before;
      if (gained <= 0) return null;
      return { dst: target.id, heal: gained };
    }
  }
  return null;
}

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
  // Taunt: tanks (Kaius and any future tank archetype) pull aggro 80% of
  // the time when alive, so they actually function as the front line.
  const tanks = alive.filter(e => e.archetype === 'tank');
  if (tanks.length && rng() < 0.8) {
    // Pick the lowest-HP tank (so multiple tanks share aggro proportionally
    // to who's wounded).
    return [...tanks].sort((a, b) => a.hp - b.hp)[0];
  }
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
  const firstTurnDone = new Set<string>();

  // Apply first-turn passives at round 0 for everyone
  for (const unit of [...p, ...e]) {
    if (!firstTurnDone.has(unit.id)) {
      firstTurnDone.add(unit.id);
      const allies = unit.side === 'player' ? p : e;
      const ft = applyFirstTurn(unit, allies);
      for (const h of ft.healLogs) {
        log.push({ tick: ++tick, src: unit.id, dst: h.dst, dmg: 0, crit: false, ult: false, heal: h.heal });
      }
    }
  }

  // Round cap bumped from 30 → 60. With ults disabled, basic attacks need
  // more turns to grind through high-HP bosses; 30 rounds was timing out
  // mid-fight, which used to silently mark a player "win" even though
  // enemies were alive.
  while (p.some(u => u.alive) && e.some(u => u.alive) && round < 60) {
    const order = [...p, ...e].filter(u => u.alive).sort((a, b) => b.spd - a.spd);
    for (const unit of order) {
      if (!unit.alive) continue;
      if (!p.some(u => u.alive) || !e.some(u => u.alive)) break;
      const isPlayer = unit.side === 'player';
      const allies = isPlayer ? p : e;
      const enemies = isPlayer ? e : p;
      // Heal/revive ults are "wasted" if no ally needs them — keep energy
      // pegged at 100 and fall through to the basic-attack block.
      const rawIsUlt = unit.energy >= 100;
      const rawSkill = rawIsUlt ? SKILL_BY_ID[unit.ultimateId] : undefined;
      const isHealUlt = rawSkill?.targeting === 'self' && rawSkill.effect?.type === 'heal';
      const isReviveUlt = rawSkill?.targeting === 'self' && rawSkill.effect?.type === 'revive';
      const wastedHeal = isHealUlt && !allies.some(a => a.alive && a.hp < a.maxHp);
      // Revive is wasted only if no one is dead AND nobody needs healing.
      const wastedRevive = isReviveUlt
        && !allies.some(a => !a.alive)
        && !allies.some(a => a.alive && a.hp < a.maxHp);
      const isUlt = rawIsUlt && !wastedHeal && !wastedRevive;
      const skill = (wastedHeal || wastedRevive) ? undefined : rawSkill;

      // Skill trigger — fires once per battle at 50+ energy, between
      // basic attacks and the ult. Single-target nuke (200% ATK — trimmed
      // from 250% so fights don't get steamrolled by a free pre-ult hit).
      // Drains 50 energy, so unit keeps building toward ult after.
      const canSkill = !isUlt && unit.energy >= 50 && !(unit as any).skillUsed;
      if (canSkill) {
        (unit as any).skillUsed = true;
        const target = pickEnemyTarget(enemies, rng);
        if (target) {
          const eAdv = elementAdvantage(unit.element, target.element);
          const isCrit = rng() < unit.crit;
          let dmg = mitigatedDamage(unit.atk * 2.0, target.def);
          dmg = Math.floor(dmg * (isCrit ? 1.5 : 1) * eAdv);
          target.hp = Math.max(0, target.hp - dmg);
          log.push({ tick: ++tick, src: unit.id, dst: target.id, dmg, crit: isCrit, ult: false, skill: true });
          if (target.hp <= 0) {
            target.alive = false;
            applyOnKill(unit);
          }
        }
        unit.energy = Math.max(0, unit.energy - 50);
        continue;
      }

      if (isUlt && skill) {
        // Ult-level bonus from per-hero skill leveling
        const ultMult = ultLevelMultiplier(unit.ultLevel ?? 0);
        if (skill.targeting === 'self' && skill.effect?.type === 'heal') {
          const healValue = Math.floor((skill.effect.value + Math.floor(unit.atk * 0.5)) * ultMult);
          let isFirst = true;
          for (const ally of allies) {
            if (!ally.alive) continue;
            const before = ally.hp;
            ally.hp = Math.min(ally.maxHp, ally.hp + healValue);
            log.push({ tick: ++tick, src: unit.id, dst: ally.id, dmg: 0, crit: false, ult: true, heal: ally.hp - before, cont: !isFirst });
            isFirst = false;
          }
          unit.energy = 0;
          continue;
        } else if (skill.targeting === 'self' && skill.effect?.type === 'revive') {
          // Revive one dead ally to value% of maxHp (NOT full health),
          // then top up living allies by a flat amount. If no one is dead,
          // the spell falls back to a pure team heal so the ult is never
          // a complete waste.
          const revivePct = Math.max(1, skill.effect.value) / 100;
          const livingHeal = Math.floor((700 + Math.floor(unit.atk * 0.4)) * ultMult);
          let isFirst = true;

          // Pick the first dead ally (preserves squad order — the front-
          // line picks the front-line first). Only one ally revives per
          // cast so the skill stays meaningful, not infinite respawn.
          const deadAlly = allies.find(a => !a.alive);
          if (deadAlly) {
            const reviveHp = Math.max(1, Math.floor(deadAlly.maxHp * revivePct * ultMult));
            deadAlly.alive = true;
            deadAlly.hp = Math.min(deadAlly.maxHp, reviveHp);
            // skillUsed reset so the revived ally can use their skill again
            (deadAlly as any).skillUsed = false;
            // log as a "heal" event so the UI shows the green floater + revive sparkle
            log.push({ tick: ++tick, src: unit.id, dst: deadAlly.id, dmg: 0, crit: false, ult: true, heal: deadAlly.hp });
            isFirst = false;
          }
          // Top up living allies
          for (const ally of allies) {
            if (!ally.alive) continue;
            if (ally.hp >= ally.maxHp) continue;
            const before = ally.hp;
            ally.hp = Math.min(ally.maxHp, ally.hp + livingHeal);
            log.push({ tick: ++tick, src: unit.id, dst: ally.id, dmg: 0, crit: false, ult: true, heal: ally.hp - before, cont: !isFirst });
            isFirst = false;
          }
          unit.energy = 0;
          continue;
        } else if (skill.targeting === 'all') {
          let isFirst = true;
          for (const target of enemies) {
            if (!target.alive) continue;
            const eAdv = elementAdvantage(unit.element, target.element);
            const isCrit = rng() < unit.crit;
            let dmg = mitigatedDamage(unit.atk * skill.damageMultiplier, target.def);
            dmg = Math.floor(dmg * (isCrit ? 1.5 : 1) * eAdv * ultMult);
            target.hp = Math.max(0, target.hp - dmg);
            log.push({ tick: ++tick, src: unit.id, dst: target.id, dmg, crit: isCrit, ult: true, cont: !isFirst });
            isFirst = false;
            if (skill.effect && (target.effects as any)) {
              (target.effects as any).push({ kind: skill.effect.type, value: skill.effect.value, remaining: skill.effect.duration ?? 2 });
            }
            if (target.hp <= 0) target.alive = false;
          }
        } else {
          const target = skill.targeting === 'lowest'
            ? [...enemies].filter(x => x.alive).sort((a, b) => a.hp - b.hp)[0]
            : pickEnemyTarget(enemies, rng);
          if (target) {
            const eAdv = elementAdvantage(unit.element, target.element);
            const isCrit = rng() < unit.crit;
            let dmg = mitigatedDamage(unit.atk * skill.damageMultiplier, target.def);
            dmg = Math.floor(dmg * (isCrit ? 1.5 : 1) * eAdv * ultMult);
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
        const mods = getDamageMods(unit);
        const isCrit = rng() < (unit.crit + mods.critBonus);
        let dmg = mitigatedDamage(unit.atk, target.def);
        dmg = Math.floor(dmg * (isCrit ? 1.5 : 1) * eAdv * mods.damageMultiplier);
        // on_hit dodge/reflect
        const hit = applyOnHit(target, dmg, rng);
        dmg = hit.dmg;
        target.hp = Math.max(0, target.hp - dmg);
        if (target.hp <= 0) target.alive = false;
        log.push({ tick: ++tick, src: unit.id, dst: target.id, dmg, crit: isCrit, ult: false });
        // Reflect damage back — only triggers if target survived the swing.
        // Otherwise we'd log a dead target "attacking" which renders the
        // dead-unit attack animation in the UI.
        if (hit.reflect > 0 && target.alive) {
          unit.hp = Math.max(0, unit.hp - hit.reflect);
          log.push({ tick: ++tick, src: target.id, dst: unit.id, dmg: hit.reflect, crit: false, ult: false });
          if (unit.hp <= 0) unit.alive = false;
        }
        // On-attack lifesteal — same rule: dead units can't heal post-mortem.
        if (unit.alive) {
          const lifesteal = applyOnAttackHeal(unit, allies, dmg);
          if (lifesteal) log.push({ tick: ++tick, src: unit.id, dst: lifesteal.dst, dmg: 0, crit: false, ult: false, heal: lifesteal.heal });
        }
        // Lifesteal-on-kill only fires if the attacker is also still alive.
        if (!target.alive && unit.alive) applyOnKill(unit);
        unit.energy = Math.min(100, unit.energy + 20);
        target.energy = Math.min(100, target.energy + 30);
      }
    }
    round++;
  }

  // Player only wins if every enemy is dead. If the round cap hits and
  // both sides still have units alive, the run counts as a loss (enemies
  // survived). The old logic granted a fake 3-star win on timeout because
  // it only checked whether the player side had survivors.
  const enemyAlive = e.some(u => u.alive);
  const playerAlive = p.some(u => u.alive);
  const winner = !enemyAlive ? 'player' : !playerAlive ? 'enemy' : 'enemy';
  return { seed: s, winner, log, initial };
}
