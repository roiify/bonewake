import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { STAGE_BY_ID, STAGES } from '../data/stages';
import { TRIAL_BY_ID } from '../data/trials';
import type { TrialDef } from '../data/trials';
import { DUNGEON_BY_ID, buildDungeonTeam, markDungeonCleared } from '../data/dungeons';
import type { DungeonDef, DungeonTier } from '../data/dungeons';
import { generateFloor, TOWER_MAX_FLOOR, isoWeek } from '../data/tower';
import { currentBoss, buildBossTeam } from '../data/worldBoss';
import { currentSpiritBoss, buildSpiritBossUnit } from '../data/spiritBomb';
import { ECHO_BY_BOSS, FIRST_KILL_DROP_RATE, REPEAT_DROP_RATE } from '../data/echoes';
import type { Stage } from '../types';
import { useHeroes } from '../store/heroes';
import { useProfile } from '../store/profile';
import { buildEnemyUnit, toCombatUnit, xpForLevel, effectiveMaxLevel } from '../lib/stats';
import { resolveBattle } from '../lib/combat';
import { db } from '../lib/db';
import { incrementTask } from '../lib/tasks';
import type { CombatUnit, BattleResult } from '../types';
import type { OwnedEquipment } from '../lib/db';
import { CHAPTER_BG } from '../data/auraMap';
import { HERO_SPRITES, ENEMY_SPRITES, PAINTED_BOSS_IDS } from '../data/heroes';
import SpriteAnimator from '../components/SpriteAnimator';
import { genLoot } from '../lib/loot';
import { LOOT_RARITY_COLOR, LOOT_RARITY_NAME, type LootRarity } from '../data/loot';
import { rollClearDrops, addMaterial } from '../lib/crafting';
import { MAT_SOULSHARD, essenceItemId, MATERIAL_META, essenceMeta, ULTIMATE_SETS } from '../data/ultimateGear';
import { useItems } from '../store/items';
import { logBattle } from '../lib/battleLog';
import { pickHotStages, COMPASS_REWARD } from '../data/compass';
import { awardPassXp, PASS_XP_PER_WIN, PASS_XP_PER_3STAR, PASS_XP_PER_BOSS } from '../lib/missionPass';
import { recordEvent } from '../lib/lifetime';
import { maybeRollGem, addGemToInventory } from '../lib/gems';
import { GEM_TIER_COLOR, GEM_TIER_NAME } from '../data/gems';
import type { GemDef } from '../data/gems';

const SQUAD_KEY = 'bonewake_squad';

function loadSquad(): string[] {
  try { return JSON.parse(localStorage.getItem(SQUAD_KEY) ?? '[]'); } catch { return []; }
}

interface FloatingNumber {
  id: number; x: number; y: number; value: string; color: string;
  // Owner unit id — used to render the float over the unit it actually
  // belongs to. Without this, every UnitCard with hit===u.id was rendering
  // the same global float list, so a slow-decaying float from tick N
  // could appear over tick N+1's victim.
  dstId: string;
}

// Trial mode: BattlePlayPage receives a stageId like "trial-light_brigade".
// We treat the trial as a virtual stage so the rest of the page (animations,
// damage floaters, end-screen) doesn't need a second code path. Rewards
// in endBattle() branch off `trialSource` instead of stage.rewards.
function makeTrialVirtualStage(trial: TrialDef): Stage {
  return {
    id: `trial-${trial.id}`,
    chapter: 99,                  // outside the chapter ladder
    num: 99,
    name: `Trial: ${trial.name}`,
    energyCost: trial.energyCost,
    enemyTeam: trial.enemyTeam,
    rewards: { gold: trial.rewards.gold, exp: 0 },
    firstClearBonus: { gems: trial.rewards.gems },
  };
}

// Dungeon mode: BattlePlayPage receives a stageId like "dungeon-gold-2".
// The same virtual-stage trick used for trials — but rewards (gold/exp/
// gems/equipment) come from the DungeonTier, and on win we mark the tier
// as first-cleared so DungeonsPage unlocks its instant-skip button.
function parseDungeonId(raw: string): { def: DungeonDef; tier: DungeonTier } | null {
  if (!raw.startsWith('dungeon-')) return null;
  const rest = raw.slice('dungeon-'.length);
  const m = rest.match(/^(.+)-(\d+)$/);
  if (!m) return null;
  const def = DUNGEON_BY_ID[m[1]];
  if (!def) return null;
  const tier = def.tiers.find(t => t.tier === Number(m[2]));
  if (!tier) return null;
  return { def, tier };
}
function makeDungeonVirtualStage(def: DungeonDef, tier: DungeonTier): Stage {
  return {
    id: `dungeon-${def.id}-${tier.tier}`,
    chapter: 98,
    num: tier.tier,
    name: `${def.name} — ${tier.name}`,
    energyCost: tier.energyCost,
    // enemyTeam is unused for dungeons — we build the squad via
    // buildDungeonTeam() directly so each enemy carries its dungeon-tuned
    // level/star without going through STAGE_BY_ID's stat synthesis.
    enemyTeam: [],
    rewards: { gold: tier.rewards.gold ?? 0, exp: tier.rewards.exp ?? 0 },
    firstClearBonus: { gems: 0 },
  };
}

// Tower / World Boss / Spirit Bomb — same virtual-stage trick. enemyTeam
// stays empty because we hand BattlePlayPage a pre-built CombatUnit list
// directly (the data-layer helpers already produce CombatUnits, not
// templates, so we'd lose stat data going through buildEnemyUnit).
function parseTowerId(raw: string): { floor: number } | null {
  if (!raw.startsWith('tower-')) return null;
  const n = parseInt(raw.slice('tower-'.length), 10);
  if (!Number.isFinite(n) || n < 1) return null;
  return { floor: n };
}
function makeTowerVirtualStage(floor: number): Stage {
  return {
    id: `tower-${floor}`,
    chapter: 97,
    num: Math.min(99, floor),
    name: `Tower — Floor ${floor}`,
    energyCost: 0,            // tower spends attempts, not energy
    enemyTeam: [],
    rewards: { gold: 0, exp: 0 },
    firstClearBonus: { gems: 0 },
  };
}
function makeWorldBossVirtualStage(): Stage {
  const week = isoWeek();
  const boss = currentBoss(week);
  return {
    id: 'worldboss',
    chapter: 96,
    num: 1,
    name: `World Boss — ${boss.name}`,
    energyCost: 0,
    enemyTeam: [],
    rewards: { gold: 0, exp: 0 },
    firstClearBonus: { gems: 0 },
  };
}
function makeSpiritBombVirtualStage(): Stage {
  const week = isoWeek();
  const boss = currentSpiritBoss(week);
  return {
    id: 'spiritbomb',
    chapter: 96,
    num: 2,
    name: `Shatter — ${boss.name}`,
    energyCost: 0,
    enemyTeam: [],
    rewards: { gold: 0, exp: 0 },
    firstClearBonus: { gems: 0 },
  };
}

export default function BattlePlayPage() {
  const { stageId } = useParams();
  const navigate = useNavigate();
  // Stage vs trial vs dungeon vs tower vs worldboss vs spiritbomb routing
  // — id prefix decides which builder produces the virtual stage and
  // which reward branch fires in endBattle.
  const trialId = stageId?.startsWith('trial-') ? stageId.slice(6) : null;
  const trialSource: TrialDef | null = trialId ? (TRIAL_BY_ID[trialId] ?? null) : null;
  const dungeonSource = stageId?.startsWith('dungeon-')
    ? parseDungeonId(stageId)
    : null;
  const towerSource = stageId?.startsWith('tower-')
    ? parseTowerId(stageId)
    : null;
  const isWorldBoss = stageId === 'worldboss';
  const isSpiritBomb = stageId === 'spiritbomb';
  const stage: Stage | null = trialSource
    ? makeTrialVirtualStage(trialSource)
    : dungeonSource
      ? makeDungeonVirtualStage(dungeonSource.def, dungeonSource.tier)
      : towerSource
        ? makeTowerVirtualStage(towerSource.floor)
        : isWorldBoss
          ? makeWorldBossVirtualStage()
          : isSpiritBomb
            ? makeSpiritBombVirtualStage()
            : (stageId ? STAGE_BY_ID[stageId] : null);

  // Remember the last stage played so the Story page can scroll back here
  // instead of resetting to chapter 1 every time.
  useEffect(() => {
    if (stageId) localStorage.setItem('bonewake_last_stage', stageId);
  }, [stageId]);
  const heroes = useHeroes(s => s.heroes);
  const equipment = useHeroes(s => s.equipment);
  const updateHero = useHeroes(s => s.updateHero);
  const addEquipment = useHeroes(s => s.addEquipment);

  const battle: BattleResult | null = useMemo(() => {
    if (!stage) return null;
    const squad = loadSquad()
      .map(id => heroes.find(h => h.id === id))
      .filter((h): h is NonNullable<typeof h> => !!h);
    if (squad.length === 0) return null;
    // "Bare Hands" trial strips equipment so the player relies on raw stats.
    const equipForCombat = trialSource?.restrict.noEquipment ? [] : equipment;
    const playerUnits = squad
      .map((h, i, arr) => toCombatUnit(h, equipForCombat, 'player', `p${i}`, arr.map(x => x.templateId)))
      .filter((u): u is NonNullable<typeof u> => !!u);
    // Dungeons/tower/worldboss/spiritbomb build their team via their own
    // data-layer helpers (which return CombatUnits directly so we don't
    // lose enemy stats going through buildEnemyUnit).
    let enemyUnits;
    if (dungeonSource) {
      enemyUnits = buildDungeonTeam(dungeonSource.def, dungeonSource.tier);
    } else if (towerSource) {
      enemyUnits = generateFloor(towerSource.floor).enemyTeam;
    } else if (isWorldBoss) {
      enemyUnits = buildBossTeam(currentBoss(isoWeek()));
    } else if (isSpiritBomb) {
      const wk = isoWeek();
      const sb = currentSpiritBoss(wk);
      const profile = useProfile.getState().profile;
      const dmgSoFar = profile.spiritBossWeek === wk ? (profile.spiritBossDamage ?? 0) : 0;
      enemyUnits = [buildSpiritBossUnit(sb, Math.max(0, sb.hp - dmgSoFar))];
    } else {
      enemyUnits = stage.enemyTeam.map((e, i) => {
        const enemyTpls = stage.enemyTeam.map(x => x.templateId);
        return buildEnemyUnit(e.templateId, e.level, e.star, `e${i}`, enemyTpls);
      });
    }
    return resolveBattle(playerUnits, enemyUnits);
  }, [stageId]);

  const [tick, setTick] = useState(0);
  // Idempotency guard: tracks the last tick whose impact already fired.
  // If the user pauses then resumes during the impact→end window, the
  // tick effect re-runs and re-schedules timers; without this guard
  // applyImpact would mutate unit state a second time.
  const impactedTick = useRef(-1);
  const [units, setUnits] = useState<Record<string, CombatUnit>>(() => {
    if (!battle) return {};
    return Object.fromEntries([...battle.initial.player, ...battle.initial.enemy].map(u => [u.id, { ...u }]));
  });
  const [attacker, setAttacker] = useState<string | null>(null);
  const [hit, setHit] = useState<string | null>(null);
  const [skillCaster, setSkillCaster] = useState<string | null>(null);
  // True when the currently-attacking unit is performing a heal action.
  // Heals never lunge (the caster stays planted) and use the hero's
  // dedicated heal sprite when one is defined.
  const [healCaster, setHealCaster] = useState<string | null>(null);
  const [floats, setFloats] = useState<FloatingNumber[]>([]);
  const [ultFlash, setUltFlash] = useState<CombatUnit | null>(null);
  // Screen-shake pulse — set to 'soft' on basic hits, 'hard' on crits/ults.
  // Reset to null after the CSS animation completes.
  const [shake, setShake] = useState<'soft' | 'hard' | null>(null);
  const [done, setDone] = useState(false);
  const [speed, setSpeed] = useState<1 | 2 | 4 | 8>(useProfile.getState().profile.settings?.defaultBattleSpeed ?? 2);
  const [paused, setPaused] = useState(false);
  const [energyDeducted, setEnergyDeducted] = useState(false);
  const [lootDrops, setLootDrops] = useState<OwnedEquipment[]>([]);
  const [matDrops, setMatDrops] = useState<{ kind: 'soulshard' | 'essence'; heroId?: string; count: number }[]>([]);
  const [gemDrops, setGemDrops] = useState<GemDef[]>([]);
  const floatId = useRef(0);
  // Element refs keyed by unit id — used to compute the exact pixel offset
  // between an attacker and its target so the lunge animation aims at the
  // real on-screen position rather than a fixed forward translation.
  const unitRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [lungeOffset, setLungeOffset] = useState<{ dx: number; dy: number } | null>(null);

  useEffect(() => {
    if (!stage || !battle) return;
    if (energyDeducted) return;
    (async () => {
      await useProfile.getState().spendEnergy(stage.energyCost);
      setEnergyDeducted(true);
    })();
  }, [stage, battle, energyDeducted]);

  useEffect(() => {
    if (!battle || done) return;
    if (tick >= battle.log.length) {
      // finish: short pause then end. Clear caster flags so the last
      // unit's attack/heal sprite doesn't freeze on its final frame
      // while the end screen fades in over it.
      setAttacker(null);
      setHealCaster(null);
      setSkillCaster(null);
      setLungeOffset(null);
      const t = setTimeout(() => endBattle(), 600 / speed);
      return () => clearTimeout(t);
    }
    const action = battle.log[tick];
    // Continuation entries: don't re-trigger the attack/ult animation —
    // just keep current attacker so the animation we already started keeps
    // playing while the additional targets apply.
    if (action.cont) return;
    // Compute the real attacker→target offset so attacks lunge to the
    // actual enemy position. Heals stay rooted (healers don't run up to
    // their target). Ults/skills currently animate as basic attacks.
    const isHealAction = (action.heal ?? 0) > 0 && (action.dmg ?? 0) === 0;
    if (!isHealAction) {
      const a = unitRefs.current[action.src];
      const t = unitRefs.current[action.dst];
      if (a && t) {
        const aR = a.getBoundingClientRect();
        const tR = t.getBoundingClientRect();
        setLungeOffset({
          dx: (tR.left + tR.width / 2) - (aR.left + aR.width / 2),
          dy: (tR.top + tR.height / 2) - (aR.top + aR.height / 2),
        });
      } else {
        setLungeOffset(null);
      }
    } else {
      setLungeOffset(null);
    }
    setAttacker(action.src);
    // Skill (50 energy) animations still suppressed — fire as basic visually.
    setSkillCaster(null);
    setHealCaster(isHealAction ? action.src : null);
    // Ult cue: brief radial flash + "ULT!" label, then clear before the
    // next action so the battle keeps its 1s/tick cadence.
    if (action.ult) {
      const u = units[action.src];
      setUltFlash(u);
      const t = setTimeout(() => setUltFlash(null), 700 / speed);
      return () => clearTimeout(t);
    } else {
      setUltFlash(null);
    }
    return;
  }, [tick, battle, done]);

  useEffect(() => {
    if (!battle || done || paused) return;
    if (tick >= battle.log.length) return;
    const a = battle.log[tick];
    // Continuation entries (extra targets of a multi-target ult) get a
    // very short wait — the animation already played on the first entry.
    const isBasic = !a.cont;
    // Ults get an extra ~400ms so the radial flash + "ULT!" badge land
    // visibly before the next action ticks.
    const baseDuration = a.cont ? 250 : (a.ult ? 1400 : 1000);
    // For basic attacks, the impact lands while the attacker is still
    // at the target (after the dash, before the retreat) so the screen
    // shake / damage number / SFX hit in sync with the swing rather than
    // 0.5s after the visual. The remaining time covers the retreat back.
    const impactDelay = isBasic ? 600 : baseDuration;
    const tImpact = setTimeout(() => applyImpact(), impactDelay / speed);
    const tEnd = setTimeout(() => endAction(), baseDuration / speed);
    return () => { clearTimeout(tImpact); clearTimeout(tEnd); };
  }, [tick, battle, done, speed, paused]);

  // Phase 1: damage/heal lands. Shake + float number + SFX fire here.
  // Lunge animation keeps playing so the attacker holds at target during
  // the swing, then retreats during endAction's window.
  function applyImpact() {
    if (!battle) return;
    if (impactedTick.current === tick) return; // already applied — guard pause/unpause race
    impactedTick.current = tick;
    const action = battle.log[tick];
    setUnits(prev => {
      const next = { ...prev };
      const dst = { ...next[action.dst] };
      if (action.heal) dst.hp = Math.min(dst.maxHp, dst.hp + action.heal);
      if (action.dmg > 0) {
        dst.hp = Math.max(0, dst.hp - action.dmg);
        if (dst.hp <= 0) dst.alive = false;
      }
      if (action.dstEnergyAfter != null) dst.energy = action.dstEnergyAfter;
      next[action.dst] = dst;
      if (action.srcEnergyAfter != null && next[action.src]) {
        next[action.src] = { ...next[action.src], energy: action.srcEnergyAfter };
      }
      return next;
    });
    setHit(action.dst);
    if (action.dmg > 0) {
      const hard = action.crit || action.ult;
      setShake(hard ? 'hard' : 'soft');
      setTimeout(() => setShake(null), hard ? 320 : 180);
    }
    const dstUnit = units[action.dst];
    if (dstUnit) {
      const id = ++floatId.current;
      const isHeal = action.heal != null && action.heal > 0;
      setFloats(f => [...f, {
        id,
        dstId: action.dst,
        x: 0, y: 0,
        value: isHeal ? `+${action.heal}` : action.dmg.toString(),
        color: isHeal ? '#22c55e' : action.crit ? '#fde047' : action.ult ? '#fb923c' : '#fca5a5',
      }]);
      setTimeout(() => setFloats(f => f.filter(x => x.id !== id)), 900);
    }
    // Skill cue: yellow "SKILL!" tag over the caster so the player sees
    // why the energy bar just dropped 50 (mid-energy skill fired).
    if (action.skill) {
      const id = ++floatId.current;
      setFloats(f => [...f, {
        id,
        dstId: action.src,
        x: 0, y: 0,
        value: 'SKILL!',
        color: '#facc15',
      }]);
      setTimeout(() => setFloats(f => f.filter(x => x.id !== id)), 900);
    }
  }

  // Phase 2: animation finishes. Clear attacker so the lunge returns to
  // home position, clear hit + lunge offset, advance the tick.
  function endAction() {
    setAttacker(null);
    setLungeOffset(null);
    setHealCaster(null);
    setSkillCaster(null);
    setTimeout(() => setHit(null), 200 / speed);
    setTimeout(() => setTick(t => t + 1), 200 / speed);
  }

  // Boss Echo drop helper — first-ever kill of a boss is a guaranteed
  // drop; subsequent kills only roll the REPEAT rate. Already-owned echoes
  // never re-drop (no duplicate spam in the result modal).
  async function maybeDropBossEcho(bossTemplateId: string) {
    const echo = ECHO_BY_BOSS[bossTemplateId];
    if (!echo) return;
    const profile0 = useProfile.getState().profile;
    const owned = profile0.ownedEchoes ?? [];
    if (owned.includes(echo.id)) return;            // never dupe
    const isFirstKill = !owned.length || true;       // first time owning this specific echo
    const roll = Math.random();
    const dropRate = isFirstKill ? FIRST_KILL_DROP_RATE : REPEAT_DROP_RATE;
    if (roll > dropRate) return;
    await useProfile.getState().patch({ ownedEchoes: [...owned, echo.id] });
  }

  async function endBattle() {
    if (done || !battle || !stage) return;
    setDone(true);
    const won = battle.winner === 'player';

    // Trial mode short-circuit: trials don't drop chapter loot, don't track
    // stage clears, and have a daily-limit ledger keyed in IndexedDB.
    if (trialSource) {
      if (won) {
        await useProfile.getState().addGold(trialSource.rewards.gold);
        await useProfile.getState().addGems(trialSource.rewards.gems);
        if (trialSource.rewards.soulshard) {
          await addMaterial(MAT_SOULSHARD, trialSource.rewards.soulshard);
          await useItems.getState().refresh();
        }
        // Mark the trial used today (key matches TrialsPage's daily ledger)
        const day = new Date().toISOString().slice(0, 10);
        const usedKey = `trial_used_${trialSource.id}_${day}`;
        const prev = await db.items.get(usedKey);
        await db.items.put({ templateId: usedKey, count: (prev?.count ?? 0) + 1 });
        // Permanent first-clear flag — TrialsPage reads this to decide
        // whether to show the Skip button.
        const clearedKey = `trial_cleared_${trialSource.id}`;
        if (!(await db.items.get(clearedKey))) {
          await db.items.put({ templateId: clearedKey, count: 1 });
        }
        await recordEvent({ kind: 'battleWon' });
        await recordEvent({ kind: 'goldEarned', amount: trialSource.rewards.gold });
      } else {
        await recordEvent({ kind: 'battleLost' });
      }
      // Skip the rest of the stage-flavored reward pipeline.
      return;
    }

    // Tower short-circuit — apply floor rewards, bump highestFloor,
    // increment the daily-attempts counter. Same logic as TowerPage.climb()
    // but driven from the played-through battle.
    if (towerSource) {
      const floor = towerSource.floor;
      const floorDef = generateFloor(floor);
      const profile0 = useProfile.getState().profile;
      const today = new Date().toISOString().slice(0, 10);
      const attemptsToday = profile0.towerAttemptsDate === today ? (profile0.towerAttemptsToday ?? 0) : 0;
      await useProfile.getState().patch({
        towerAttemptsDate: today,
        towerAttemptsToday: attemptsToday + 1,
      });
      if (won) {
        const r = floorDef.rewards;
        if (r.gold) await useProfile.getState().addGold(r.gold);
        if (r.gems > 0) await useProfile.getState().addGems(r.gems);
        if (r.soulshards > 0) await addMaterial(MAT_SOULSHARD, r.soulshards);
        const prevHigh = profile0.towerHighestFloor ?? 0;
        const newHigh = Math.max(prevHigh, floor);
        await useProfile.getState().patch({ towerHighestFloor: Math.min(TOWER_MAX_FLOOR, newHigh) });
        await recordEvent({ kind: 'towerFloor', floor: newHigh });
        await recordEvent({ kind: 'goldEarned', amount: r.gold });
        await useItems.getState().refresh();
      } else {
        await recordEvent({ kind: 'battleLost' });
      }
      return;
    }

    // World Boss short-circuit — sum damage dealt to 'wb_boss' from the
    // log, bump bestDamage + attempts. Matches WorldBossPage.attack().
    if (isWorldBoss) {
      const wk = isoWeek();
      const boss = currentBoss(wk);
      const startingHp = boss.hpMillions * 1_000_000;
      let damage = 0;
      for (const a of battle.log) {
        if (a.dst === 'wb_boss' && a.dmg > 0) damage += a.dmg;
      }
      damage = Math.min(damage, startingHp);
      const profile0 = useProfile.getState().profile;
      const weekMatched = profile0.worldBossWeek === wk;
      const attemptsUsed = weekMatched ? (profile0.worldBossAttemptsUsed ?? 0) : 0;
      const bestDamage = weekMatched ? (profile0.worldBossBestDamage ?? 0) : 0;
      await useProfile.getState().patch({
        worldBossWeek: wk,
        worldBossAttemptsUsed: attemptsUsed + 1,
        worldBossBestDamage: Math.max(damage, bestDamage),
        // reset claimed tier on week change
        worldBossClaimedTier: weekMatched ? (profile0.worldBossClaimedTier ?? -1) : -1,
      });
      if (won) await recordEvent({ kind: 'battleWon' });
      else await recordEvent({ kind: 'battleLost' });
      // Boss Echo drop — only triggers on a kill (full HP shaved). The
      // echo id matches the World Boss templateId.
      if (won && damage >= startingHp) {
        await maybeDropBossEcho(boss.templateId);
      }
      return;
    }

    // Spirit Bomb short-circuit — sum damage to 'spirit_boss', accumulate
    // into spiritBossDamage. Matches SpiritBombPage.attack().
    if (isSpiritBomb) {
      const wk = isoWeek();
      const boss = currentSpiritBoss(wk);
      const profile0 = useProfile.getState().profile;
      const weekMatched = profile0.spiritBossWeek === wk;
      const dmgSoFar = weekMatched ? (profile0.spiritBossDamage ?? 0) : 0;
      const attemptsUsed = weekMatched ? (profile0.spiritBossAttemptsUsed ?? 0) : 0;
      const remainingHp = Math.max(0, boss.hp - dmgSoFar);
      let dealt = 0;
      for (const a of battle.log) {
        if (a.dst === 'spirit_boss' && a.dmg > 0) dealt += a.dmg;
      }
      dealt = Math.min(dealt, remainingHp);
      const newDamage = dmgSoFar + dealt;
      await useProfile.getState().patch({
        spiritBossWeek: wk,
        spiritBossDamage: newDamage,
        spiritBossAttemptsUsed: attemptsUsed + 1,
        spiritBossClaimedTier: weekMatched ? (profile0.spiritBossClaimedTier ?? -1) : -1,
      });
      if (won) await recordEvent({ kind: 'battleWon' });
      else await recordEvent({ kind: 'battleLost' });
      // Boss Echo drop on Shatter kill (shatter = cumulative damage >= max HP).
      if (newDamage >= boss.hp) {
        await maybeDropBossEcho(boss.templateId);
      }
      return;
    }

    // Dungeon mode short-circuit: themed-farming rewards (gold/exp/gems/
    // equipment) come from the tier definition, and on win we mark the
    // (dungeon, tier) cleared so DungeonsPage unlocks its instant-skip.
    if (dungeonSource) {
      if (won) {
        const { def, tier } = dungeonSource;
        const r = tier.rewards;
        if (r.gold) {
          await useProfile.getState().addGold(r.gold);
          await recordEvent({ kind: 'goldEarned', amount: r.gold });
        }
        if (r.exp) {
          const playerLevel = useProfile.getState().profile.level;
          for (const id of loadSquad()) {
            const h = heroes.find(x => x.id === id);
            if (!h) continue;
            let lvl = h.level;
            let exp = h.exp + r.exp;
            const cap = effectiveMaxLevel(h.star, playerLevel);
            while (exp >= xpForLevel(lvl) && lvl < cap) {
              exp -= xpForLevel(lvl);
              lvl++;
            }
            await updateHero(h.id, { level: lvl, exp });
          }
          await useProfile.getState().gainExp(r.exp);
        }
        if (r.gems) await useProfile.getState().addGems(r.gems);
        if (r.equipmentCount && r.equipmentMinRarity) {
          const ilvl = Math.max(10, tier.enemyLevel * 2);
          const drops: OwnedEquipment[] = [];
          for (let i = 0; i < r.equipmentCount; i++) {
            const item = genLoot({ itemLevel: ilvl, minRarity: r.equipmentMinRarity, luckBoost: 0.3 });
            await addEquipment(item);
            drops.push(item);
          }
          setLootDrops(drops);
        }
        // Tier-3 dungeon material drops (soulshard + random-hero essence).
        // Mirrors the DungeonsPage instant-clear branch so Play and Skip
        // grant the same payout.
        if (r.soulshard) await addMaterial(MAT_SOULSHARD, r.soulshard);
        if (r.essenceRandomCount && r.essenceRandomCount > 0) {
          for (let i = 0; i < r.essenceRandomCount; i++) {
            const set = ULTIMATE_SETS[Math.floor(Math.random() * ULTIMATE_SETS.length)];
            await addMaterial(essenceItemId(set.heroId), 1);
          }
        }
        markDungeonCleared(def.id, tier.tier);
        await recordEvent({ kind: 'battleWon' });
      } else {
        await recordEvent({ kind: 'battleLost' });
      }
      return;
    }

    if (won) {
      // count alive
      const alive = battle.initial.player.filter(u => units[u.id]?.alive).length;
      const stars = alive === battle.initial.player.length ? 3 : alive >= 2 ? 2 : 1;
      // grant rewards
      await useProfile.getState().addGold(stage.rewards.gold);
      // distribute exp to squad heroes
      const squad = loadSquad();
      const playerLevel = useProfile.getState().profile.level;
      for (const id of squad) {
        const h = heroes.find(x => x.id === id);
        if (!h) continue;
        let lvl = h.level;
        let exp = h.exp + stage.rewards.exp;
        const cap = effectiveMaxLevel(h.star, playerLevel);
        while (exp >= xpForLevel(lvl) && lvl < cap) {
          exp -= xpForLevel(lvl);
          lvl++;
        }
        await updateHero(h.id, { level: lvl, exp });
      }
      // stage clear record
      const existing = await db.stageClears.get(stage.id);
      const newStars = Math.max(stars, existing?.stars ?? 0);
      await db.stageClears.put({
        stageId: stage.id,
        stars: newStars,
        clears: (existing?.clears ?? 0) + 1,
        lastClearedAt: Date.now(),
      });
      // first clear bonus
      if (!existing && stage.firstClearBonus.gems) {
        await useProfile.getState().addGems(stage.firstClearBonus.gems);
      }
      // ARPG-style loot drops — every battle drops something.
      // Boss stages (every 5th) drop more items and at higher minimum rarity.
      const isBoss = stage.num === 5;
      const itemLevel = Math.max(1, (stage.chapter - 1) * 10 + stage.num * 2);
      const dropCount = isBoss ? 3 : (stars === 3 ? 2 : 1);
      const drops: OwnedEquipment[] = [];
      for (let i = 0; i < dropCount; i++) {
        const minRarity: LootRarity = isBoss
          ? (i === 0 ? 3 : 2)            // boss: first guaranteed Rare+, rest Magic+
          : (stars === 3 && i === 0 ? 2 : 1);  // perfect clear bumps first drop to Magic+
        const luckBoost = stage.chapter * 0.08; // later chapters give better rarity odds
        const item = genLoot({ itemLevel, minRarity, luckBoost });
        await addEquipment(item);
        drops.push(item);
      }
      setLootDrops(drops);

      // Gem drops: small chance per battle, higher on boss
      const gems: GemDef[] = [];
      for (let i = 0; i < (isBoss ? 2 : 1); i++) {
        const g = maybeRollGem(itemLevel, isBoss);
        if (g) {
          await addGemToInventory(g.id, 1);
          gems.push(g);
        }
      }
      if (gems.length > 0) {
        await useItems.getState().refresh();
        setGemDrops(gems);
      }

      // Crafting materials: only on a 3-star clear (perfect clear)
      if (stars === 3) {
        const mats = rollClearDrops(stage.chapter, isBoss);
        const summary: { kind: 'soulshard' | 'essence'; heroId?: string; count: number }[] = [];
        if (mats.soulshards > 0) {
          await addMaterial(MAT_SOULSHARD, mats.soulshards);
          summary.push({ kind: 'soulshard', count: mats.soulshards });
        }
        for (const ess of mats.essences) {
          await addMaterial(essenceItemId(ess.heroId), ess.count);
          summary.push({ kind: 'essence', heroId: ess.heroId, count: ess.count });
        }
        await useItems.getState().refresh();
        setMatDrops(summary);
      }
      // gain player exp
      await useProfile.getState().gainExp(stage.rewards.exp);
      await incrementTask('daily_battles', 1);
      if (newStars === 3) await incrementTask('daily_threestar', 1);
      // Lifetime tracking
      await recordEvent({ kind: 'battleWon' });
      await recordEvent({ kind: 'stageCleared', stars: newStars });
      await recordEvent({ kind: 'goldEarned', amount: stage.rewards.gold });
      // Count legendary drops
      for (const d of drops) {
        if (d.rarity === 5) await recordEvent({ kind: 'legendaryDropped' });
      }
      // Mission Pass XP
      const isBossClear = stage.num === 5;
      let passXp = PASS_XP_PER_WIN;
      if (newStars === 3) passXp += PASS_XP_PER_3STAR;
      if (isBossClear) passXp += PASS_XP_PER_BOSS;
      await awardPassXp(passXp);
      // Soul Compass — bonus chest on 3-star clear of a hot stage this week
      if (newStars === 3) {
        const week = isoWeek();
        const hot = pickHotStages(week);
        const compassFound = useProfile.getState().profile.compassFound ?? [];
        const compassWeek = useProfile.getState().profile.compassWeek;
        const freshWeek = compassWeek !== week;
        const found = freshWeek ? [] : compassFound;
        if (hot.includes(stage.id) && !found.includes(stage.id)) {
          await useProfile.getState().addGold(COMPASS_REWARD.gold);
          await useProfile.getState().addGems(COMPASS_REWARD.gems);
          await addMaterial(MAT_SOULSHARD, COMPASS_REWARD.soulshard);
          await useProfile.getState().patch({
            compassWeek: week,
            compassFound: [...found, stage.id],
          });
        }
      }
      // Battle log
      await logBattle({
        source: 'stage',
        sourceId: stage.id,
        won: true,
        stars: newStars,
        damageDealt: battle.log.filter(a => playerSlots.some(u => u.id === a.src)).reduce((s, a) => s + a.dmg, 0),
        squadIds: playerSlots.map(u => u.templateId),
        enemyTemplates: stage.enemyTeam.map(e => e.templateId),
        durationTicks: battle.log.length,
      });
    } else {
      await recordEvent({ kind: 'battleLost' });
      await logBattle({
        source: 'stage',
        sourceId: stage.id,
        won: false,
        squadIds: playerSlots.map(u => u.templateId),
        enemyTemplates: stage.enemyTeam.map(e => e.templateId),
        durationTicks: battle.log.length,
      });
    }
  }

  if (!stage) return <div className="p-6 text-center">Stage not found.</div>;
  if (!battle) return <div className="p-6 text-center">No squad! <button className="btn-pixel mt-3" onClick={() => navigate(-1)}>Back</button></div>;

  const playerSlots = battle.initial.player.map(u => units[u.id]);
  const enemySlots = battle.initial.enemy.map(u => units[u.id]);

  const bgUrl = CHAPTER_BG[stage.chapter] ?? CHAPTER_BG[1];

  return (
    <div
      className="relative h-full overflow-hidden"
      style={{
        backgroundImage: `linear-gradient(rgba(9,9,11,0.55), rgba(9,9,11,0.85)), url(${bgUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Top-left: exit + pause */}
      {!done && (
        <div className="absolute top-2 left-2 flex gap-1 z-20">
          <button
            onClick={() => {
              if (confirm('Exit battle? Progress in this run will be lost.')) navigate('/battle');
            }}
            className="text-[10px] font-pixel px-2 py-1 rounded border border-zinc-700 bg-zinc-900/80 hover:border-red-500 hover:text-red-300"
            title="Exit battle"
          >✕ Exit</button>
          <button
            onClick={() => setPaused(p => !p)}
            className={`text-[10px] font-pixel px-2 py-1 rounded border ${paused ? 'border-amber-400 bg-amber-400/20 text-amber-300' : 'border-zinc-700 bg-zinc-900/80'}`}
            title={paused ? 'Resume' : 'Pause'}
          >{paused ? '▶ Resume' : '⏸ Pause'}</button>
        </div>
      )}

      {/* Speed controls */}
      <div className="absolute top-2 right-2 flex gap-1 z-20">
        {([1, 2, 4, 8] as const).map(s => (
          <button
            key={s}
            onClick={() => setSpeed(s)}
            className={`text-[10px] font-pixel px-2 py-1 rounded border ${speed === s ? 'border-amber-400 bg-amber-400/20' : 'border-zinc-700 bg-zinc-900'}`}
          >×{s}</button>
        ))}
      </div>

      {/* Paused overlay */}
      {paused && !done && (
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
          <div className="font-pixel text-amber-300 text-2xl tracking-widest" style={{ textShadow: '0 2px 8px #000, 0 0 16px #000' }}>PAUSED</div>
        </div>
      )}

      {/* Manual ultimate trigger — appears when a player unit has 100 energy and the setting is on */}
      {useProfile.getState().profile.settings?.manualUltTrigger && (() => {
        const ready = playerSlots.filter(u => u.alive && u.energy >= 100);
        if (ready.length === 0 || done) return null;
        return (
          <div className="absolute top-12 right-2 z-20 flex flex-col gap-1 items-end">
            {ready.map(u => (
              <button
                key={u.id}
                onClick={() => {
                  // Pause the battle one tick — visual cue only; the resolver already
                  // committed all actions deterministically when battle.log was generated.
                  setPaused(p => !p);
                }}
                className="rounded border-2 px-2 py-1 text-[10px] font-pixel flex items-center gap-1.5"
                style={{ borderColor: u.color, background: u.color + '20', color: u.color }}
                title="Manual ult queued — tap to pause/resume"
              >
                ⚡ {u.name}
              </button>
            ))}
            <button
              onClick={() => setPaused(p => !p)}
              className="text-[9px] text-zinc-400 px-2 py-0.5 rounded bg-zinc-900/80"
            >{paused ? '▶ Resume' : '⏸ Pause'}</button>
          </div>
        );
      })()}

      {/* Brief ult cue: radial color flash + hero emoji + "ULT!" badge.
          Kept short (~600ms) so the battle keeps its cadence — the full
          cinematic ult animation is intentionally off. */}
      <AnimatePresence>
        {ultFlash && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 0.85 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 / speed }}
            className="absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-none"
            style={{ background: `radial-gradient(circle, ${ultFlash.color}cc 0%, ${ultFlash.color}55 30%, #00000000 70%)` }}
          >
            <motion.div
              initial={{ scale: 0.3, rotate: -15, opacity: 0 }}
              animate={{ scale: 1.2, rotate: 0, opacity: 1 }}
              exit={{ scale: 1.6, opacity: 0 }}
              transition={{ duration: 0.32 / speed, type: 'spring', stiffness: 260 }}
              className="text-7xl drop-shadow-[0_4px_10px_rgba(0,0,0,0.95)]"
            >
              {ultFlash.emoji}
            </motion.div>
            <motion.div
              initial={{ y: 18, opacity: 0, scale: 0.7 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.3 }}
              transition={{ duration: 0.32 / speed, delay: 0.08 / speed }}
              className="mt-1 px-4 py-1 rounded-md text-2xl font-black tracking-[0.25em] uppercase"
              style={{
                color: '#fff',
                background: `${ultFlash.color}`,
                boxShadow: `0 0 18px ${ultFlash.color}`,
                WebkitTextStroke: '1px rgba(0,0,0,0.6)',
              }}
            >
              {ultFlash.name} ULT!
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Battlefield: heroes on left facing right, enemies on right facing left */}
      <div className={`absolute inset-0 flex flex-row p-3 pt-24 pb-28 gap-2 ${shake === 'hard' ? 'animate-screen-shake-hard' : shake === 'soft' ? 'animate-screen-shake' : ''}`}>
        {/* Player column (left) */}
        <div className="flex-1 flex flex-col justify-around items-start">
          {playerSlots.map((u, i) => (
            <div key={u.id} style={{ marginLeft: `${i % 2 === 0 ? 0 : 18}px` }}>
              <UnitCard unit={u} attacker={attacker === u.id} hit={hit === u.id} isUlt={attacker === u.id && !!ultFlash} isSkill={skillCaster === u.id} isHealing={healCaster === u.id} side="player" floats={floats.filter(f => f.dstId === u.id)} lungeTo={attacker === u.id ? lungeOffset : null} setRef={el => { unitRefs.current[u.id] = el; }} />
            </div>
          ))}
        </div>
        {/* Enemy column (right) */}
        <div className="flex-1 flex flex-col justify-around items-end">
          {enemySlots.map((u, i) => (
            <div key={u.id} style={{ marginRight: `${i % 2 === 0 ? 0 : 18}px` }}>
              <UnitCard unit={u} attacker={attacker === u.id} hit={hit === u.id} isUlt={attacker === u.id && !!ultFlash} isSkill={skillCaster === u.id} isHealing={healCaster === u.id} side="enemy" floats={floats.filter(f => f.dstId === u.id)} lungeTo={attacker === u.id ? lungeOffset : null} setRef={el => { unitRefs.current[u.id] = el; }} />
            </div>
          ))}
        </div>
      </div>

      {/* End screen */}
      <AnimatePresence>
        {done && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/85 z-40 flex flex-col items-center p-6 pb-24 text-center overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: 'spring' }}
              className="font-pixel text-3xl mb-4"
              style={{ color: battle.winner === 'player' ? '#fbbf24' : '#f87171' }}
            >
              {battle.winner === 'player' ? 'VICTORY!' : 'DEFEAT'}
            </motion.div>
            {battle.winner === 'player' && (
              <div className="space-y-2 mb-4 w-full max-w-sm">
                <div className="text-amber-400 text-2xl text-center">{'★'.repeat(playerSlots.filter(u => u.alive).length === playerSlots.length ? 3 : playerSlots.filter(u => u.alive).length >= 2 ? 2 : 1)}</div>
                <div className="text-zinc-300 text-sm text-center">+{stage.rewards.gold} 🪙 · +{stage.rewards.exp} xp</div>
                {/* MVP / damage breakdown */}
                {(() => {
                  const damageBySrc = new Map<string, number>();
                  for (const a of battle.log) {
                    if (a.dmg > 0 && playerSlots.some(u => u.id === a.src)) {
                      damageBySrc.set(a.src, (damageBySrc.get(a.src) ?? 0) + a.dmg);
                    }
                  }
                  if (damageBySrc.size === 0) return null;
                  const sorted = [...damageBySrc.entries()].sort((a, b) => b[1] - a[1]);
                  const total = sorted.reduce((s, [, d]) => s + d, 0);
                  const mvpId = sorted[0][0];
                  return (
                    <div className="mt-3 rounded border border-amber-700 bg-amber-900/15 p-2">
                      <div className="text-[10px] font-pixel text-amber-300 text-center mb-1.5">BATTLE BREAKDOWN</div>
                      {sorted.map(([srcId, dmg]) => {
                        const unit = playerSlots.find(u => u.id === srcId);
                        if (!unit) return null;
                        const pct = total > 0 ? (dmg / total) * 100 : 0;
                        const isMvp = srcId === mvpId;
                        return (
                          <div key={srcId} className="mb-1 last:mb-0">
                            <div className="flex items-center justify-between text-[10px] mb-0.5">
                              <span className="font-pixel" style={{ color: unit.color }}>
                                {isMvp && <span className="mvp-star mr-1">⭐</span>}{unit.name}
                              </span>
                              <span className="text-zinc-300">{dmg.toLocaleString()} dmg · {pct.toFixed(0)}%</span>
                            </div>
                            <div className="h-1 bg-zinc-800 rounded overflow-hidden">
                              <div className="h-full" style={{ width: `${pct}%`, background: isMvp ? '#fbbf24' : unit.color }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
                {gemDrops.length > 0 && (
                  <div className="mt-3 space-y-1">
                    <div className="text-[10px] font-pixel text-cyan-300 text-center">GEMS</div>
                    {gemDrops.map((g, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + i * 0.08 }}
                        className="flex items-center gap-2 rounded border-2 bg-zinc-950 px-2 py-1.5 text-left"
                        style={{ borderColor: GEM_TIER_COLOR[g.tier] }}
                      >
                        <span className="text-2xl">{g.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-pixel" style={{ color: GEM_TIER_COLOR[g.tier] }}>
                            {g.name}
                          </div>
                          <div className="text-[9px] text-zinc-500">
                            {GEM_TIER_NAME[g.tier]} · +{g.stat === 'crit' ? `${(g.value * 100).toFixed(1)}%` : g.value} {g.stat.toUpperCase()}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
                {matDrops.length > 0 && (
                  <div className="mt-3 space-y-1">
                    <div className="text-[10px] font-pixel text-rose-300 text-center">3★ MATERIALS</div>
                    {matDrops.map((m, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + i * 0.08 }}
                        className="flex items-center gap-2 rounded border-2 bg-zinc-950 px-2 py-1.5 text-left"
                        style={{ borderColor: '#fb7185' }}
                      >
                        <span className="text-2xl">{m.kind === 'soulshard' ? MATERIAL_META[MAT_SOULSHARD].emoji : essenceMeta(m.heroId!).emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-pixel text-rose-300">
                            +{m.count} {m.kind === 'soulshard' ? 'Soulshard' : essenceMeta(m.heroId!).name}
                          </div>
                          <div className="text-[9px] text-zinc-500">
                            {m.kind === 'soulshard' ? 'Crafts any ultimate piece' : `Crafts ${m.heroId}'s set`}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
                {lootDrops.length > 0 && (
                  <div className="mt-3 space-y-1">
                    <div className="text-[10px] font-pixel text-zinc-400 text-center">LOOT DROPPED</div>
                    {lootDrops.map(item => {
                      const color = LOOT_RARITY_COLOR[item.rarity as LootRarity];
                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.15 }}
                          className="flex items-center gap-2 rounded border-2 bg-zinc-950 px-2 py-1.5 text-left"
                          style={{ borderColor: color, boxShadow: item.rarity && item.rarity >= 4 ? `0 0 12px ${color}` : undefined }}
                        >
                          <span className="text-2xl">{item.primary?.stat === 'crit' || item.affixes?.some(a => a.stat === 'crit') ? '✨' : '⚔️'}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-[11px] truncate font-pixel" style={{ color }}>{item.name}</div>
                            <div className="text-[9px] text-zinc-400">
                              {LOOT_RARITY_NAME[item.rarity as LootRarity]} · iL{item.itemLevel}
                              {item.affixes && item.affixes.length > 0 && <span> · {item.affixes.length} affix{item.affixes.length > 1 ? 'es' : ''}</span>}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            {(() => {
              const won = battle.winner === 'player';
              // Per-mode end-screen actions — tower goes Next Floor on win
              // (no "retry" — that floor is done); world boss / shatter go
              // back to their pages; dungeons retry the same tier; stages
              // get the classic back / retry / next-stage triad.
              if (towerSource) {
                const nextFloor = towerSource.floor + 1;
                return (
                  <div className="flex gap-2 flex-wrap justify-center">
                    <button className="btn-pixel" onClick={() => navigate('/tower')}>← Tower</button>
                    {won && (
                      <button className="btn-pixel primary" onClick={() => navigate(`/battle/play/tower-${nextFloor}`)}>
                        ▶ Next Floor ({nextFloor})
                      </button>
                    )}
                    {!won && (
                      <button className="btn-pixel" onClick={() => navigate(`/battle/play/tower-${towerSource.floor}`)}>Retry</button>
                    )}
                  </div>
                );
              }
              if (isWorldBoss || isSpiritBomb) {
                const back = isWorldBoss ? '/worldboss' : '/spirit';
                return (
                  <div className="flex gap-2 flex-wrap justify-center">
                    <button className="btn-pixel primary" onClick={() => navigate(back)}>← Back</button>
                  </div>
                );
              }
              if (dungeonSource) {
                return (
                  <div className="flex gap-2 flex-wrap justify-center">
                    <button className="btn-pixel" onClick={() => navigate('/dungeons')}>← Dungeons</button>
                    <button className="btn-pixel" onClick={() => navigate(`/battle/play/dungeon-${dungeonSource.def.id}-${dungeonSource.tier.tier}`)}>
                      {won ? '▶ Run Again' : 'Retry'}
                    </button>
                  </div>
                );
              }
              if (trialSource) {
                return (
                  <div className="flex gap-2 flex-wrap justify-center">
                    <button className="btn-pixel primary" onClick={() => navigate('/trials')}>← Trials</button>
                  </div>
                );
              }
              // Default: campaign stage
              const idx = STAGES.findIndex(s => s.id === stage.id);
              const next = idx >= 0 ? STAGES[idx + 1] : undefined;
              return (
                <div className="flex gap-2 flex-wrap justify-center">
                  <button className="btn-pixel" onClick={() => navigate('/battle')}>Back</button>
                  <button className="btn-pixel" onClick={() => navigate(`/battle/stage/${stage.id}`)}>Retry</button>
                  {won && next && (
                    <button className="btn-pixel primary" onClick={() => navigate(`/battle/stage/${next.id}`)}>
                      Next → {next.chapter}-{next.num}
                    </button>
                  )}
                  {won && !next && (
                    <div className="text-[10px] text-amber-300 font-pixel mt-2 w-full">All stages cleared!</div>
                  )}
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function UnitCard({ unit, attacker, hit, side, floats, isUlt, isSkill, isHealing, lungeTo, setRef }: {
  unit: CombatUnit; attacker: boolean; hit: boolean; side: 'player' | 'enemy'; floats: FloatingNumber[]; isUlt: boolean; isSkill: boolean;
  isHealing: boolean;
  lungeTo: { dx: number; dy: number } | null;
  setRef: (el: HTMLDivElement | null) => void;
}) {
  // Resolve sprite set
  const heroSprites = HERO_SPRITES[unit.templateId];
  const enemySprites = ENEMY_SPRITES[unit.templateId as keyof typeof ENEMY_SPRITES];
  const sprites = heroSprites ?? enemySprites;

  // Pick the right animation for current state — falls through to idle so
  // SpriteAnimator handles multi-frame strips correctly even when the unit is
  // just standing around.
  let animSrc: string | null = sprites?.idle ?? null;
  if (sprites) {
    if (!unit.alive) animSrc = (heroSprites?.death ?? enemySprites?.death) ?? animSrc;
    else if (attacker && isHealing && heroSprites?.heal) animSrc = heroSprites.heal;
    else if (attacker && isUlt && (heroSprites?.ult || enemySprites?.skill)) animSrc = heroSprites?.ult ?? heroSprites?.skill ?? enemySprites?.skill ?? animSrc;
    else if (attacker && isSkill && (heroSprites?.skill || enemySprites?.skill)) animSrc = heroSprites?.skill ?? enemySprites?.skill ?? animSrc;
    else if (attacker) animSrc = (heroSprites?.attack ?? enemySprites?.attack) ?? animSrc;
  }

  const hpPct = (unit.hp / unit.maxHp) * 100;
  const hpColor = hpPct > 50 ? '#22c55e' : hpPct > 25 ? '#f59e0b' : '#ef4444';

  // Lunge: on a basic attack the attacker pulls back slightly, dashes to the
  // target's actual on-screen position to make contact, holds the strike,
  // then snaps back. Stops at 88% so sprites overlap on contact rather than
  // the attacker fully covering the target. Skills/ults stay rooted.
  const isLunge = !!(attacker && !isUlt && !isSkill && !isHealing && lungeTo);
  const dashX = isLunge && lungeTo ? lungeTo.dx * 0.88 : 0;
  const dashY = isLunge && lungeTo ? lungeTo.dy * 0.88 : 0;
  const windUpX = isLunge && lungeTo ? -lungeTo.dx * 0.06 : 0;
  return (
    <motion.div
      ref={setRef}
      animate={{
        x: isLunge
          ? [0, windUpX, dashX, dashX, 0]
          : (attacker ? (side === 'player' ? 24 : -24) : 0),
        y: isLunge ? [0, 0, dashY, dashY, 0] : 0,
        scale: attacker ? 1.12 : 1,
      }}
      transition={
        isLunge
          // 1.0s total: wind-up → dash → hold-at-target while impact lands → retreat
          // Impact fires at 600ms (60%), retreat finishes by 1000ms.
          ? { duration: 1.0, times: [0, 0.10, 0.35, 0.65, 1] }
          : { duration: 0.18 }
      }
      style={{ zIndex: attacker ? 15 : 5 }}
      className={`relative ${hit ? 'animate-shake' : ''} ${unit.alive ? '' : 'grayscale opacity-60'}`}
    >
      {/* Floating HP bar + name above the unit */}
      <div className="absolute -top-9 left-1/2 -translate-x-1/2 w-24 z-10 pointer-events-none">
        <div className="text-[9px] font-pixel truncate text-center" style={{ color: unit.color, textShadow: '0 1px 0 #000' }}>{unit.name}</div>
        <div className="h-1.5 bg-zinc-900/80 rounded border border-zinc-700 overflow-hidden mt-0.5">
          <motion.div
            initial={false}
            animate={{ width: `${hpPct}%` }}
            transition={{ duration: 0.25 }}
            style={{ background: hpColor, height: '100%' }}
          />
        </div>
        {/* Energy bar: cyan ramp → yellow at 50 (skill ready) → orange glow at 100 (ult ready) */}
        <div
          className={`relative h-1 bg-zinc-900/80 rounded border border-zinc-700/70 overflow-hidden mt-0.5 ${unit.energy >= 100 ? 'animate-pulse' : ''}`}
          style={unit.energy >= 100 ? { boxShadow: '0 0 6px 1px #fb923c, 0 0 2px #fff inset' } : undefined}
        >
          <motion.div
            initial={false}
            animate={{ width: `${unit.energy}%` }}
            transition={{ duration: 0.25 }}
            style={{
              background: unit.energy >= 100 ? '#fb923c' : unit.energy >= 50 ? '#facc15' : '#22d3ee',
              height: '100%',
            }}
          />
          {/* 50% tick mark — the skill-ready threshold */}
          <div className="absolute top-0 bottom-0 left-1/2 w-px bg-zinc-700/80" />
        </div>
      </div>

      {/* Status effect icons floating above HP */}
      {unit.effects && unit.effects.length > 0 && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex gap-0.5 z-20 justify-center">
          {unit.effects.map((ef, i) => (
            <span key={i} className="text-[10px] leading-none" title={`${ef.kind} ${ef.value} (${ef.remaining})`}>
              {ef.kind === 'burn' ? '🔥' : ef.kind === 'shield' ? '🛡' : ef.kind === 'buff_atk' ? '⚡' : '⏱'}
            </span>
          ))}
        </div>
      )}


      {/* Character sprite — heroes face right naturally, enemies mirrored.
          Hero sprite atlases are PixelLab 124×124 frames with significant
          padding for walk/attack motion; enemy portraits are tightly cropped
          1024×1024. Painted boss-tier sprites (Bonewake Dragon, Lich King,
          etc.) render almost 2× the size to telegraph "this is a BOSS,
          not a regular enemy". */}
      {(() => {
        const isPaintedBoss = PAINTED_BOSS_IDS.has(unit.templateId);
        const containerSize = isPaintedBoss ? 'w-72 h-72' : 'w-44 h-44';
        const renderSize = isPaintedBoss ? 400 : (heroSprites ? 234 : 220);
        // Painted bosses are forward-facing card art (not side-profile
        // sprites), so mirroring just makes them look uncanny. Leave the
        // orientation alone; darken + saturation tweak so they match the
        // gloomy battlefield instead of feeling studio-lit.
        // Per-sprite orientation overrides — some PixelLab heroes shipped
        // facing the wrong way and the asset can't be flipped at source
        // without re-generation. Mirror them at render time so the squad
        // visually faces east toward the enemies. (Bigger animation
        // container reserved for boss-tier so future attack atlases can
        // grow without re-layout — see size constants above.)
        const REVERSED_HEROES = new Set<string>(['chino']);
        const flipHero = REVERSED_HEROES.has(unit.templateId);
        const baseFilter = 'brightness(0.78) contrast(1.05) saturate(1.05) drop-shadow(0 6px 8px rgba(0,0,0,0.85))';
        const wrapStyle = isPaintedBoss
          ? { filter: baseFilter }
          : flipHero
            ? { transform: 'scaleX(-1)' }
            : undefined;
        return (
          <div className={`relative ${containerSize} flex items-end justify-center`} style={wrapStyle}>
            {animSrc ? (
              <SpriteAnimator
                src={animSrc}
                cols={sprites!.cols}
                rows={sprites!.rows}
                fps={hit ? 18 : (attacker && isUlt ? 7 : (attacker && isSkill ? 10 : (attacker ? 18 : 14)))}
                loop={unit.alive && !hit}
                paused={unit.alive && !attacker && !hit}
                size={renderSize}
              />
            ) : (
              <div className="text-5xl">{unit.emoji}</div>
            )}
          </div>
        );
      })()}

      {/* Floating damage numbers */}
      <AnimatePresence>
        {floats.map(f => (
          <motion.div
            key={f.id}
            initial={{ y: 0, opacity: 1, scale: 0.6 }}
            animate={{ y: -40, opacity: 1, scale: 1.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute top-0 left-1/2 -translate-x-1/2 font-pixel text-base pointer-events-none z-20"
            style={{ color: f.color, textShadow: '0 1px 0 #000, 0 0 6px rgba(0,0,0,0.8)' }}
          >
            {f.value}
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
