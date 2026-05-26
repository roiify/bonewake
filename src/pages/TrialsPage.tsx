import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../store/profile';
import { useHeroes } from '../store/heroes';
import { TRIALS, type TrialDef } from '../data/trials';
import { HERO_BY_ID } from '../data/heroes';
import SquadPicker from '../components/SquadPicker';
import { db } from '../lib/db';
import { resolveBattle } from '../lib/combat';
import { toCombatUnit, buildEnemyUnit } from '../lib/stats';
import { addMaterial } from '../lib/crafting';
import { MAT_SOULSHARD } from '../data/ultimateGear';
import { useItems } from '../store/items';
import { recordEvent } from '../lib/lifetime';

const SQUAD_KEY = 'bonewake_squad';
function loadSquad(): string[] {
  try { return JSON.parse(localStorage.getItem(SQUAD_KEY) ?? '[]'); } catch { return []; }
}
const todayStr = () => new Date().toISOString().slice(0, 10);

const TRIAL_USED_KEY = (id: string, day: string) => `trial_used_${id}_${day}`;

const TRIAL_CLEARED_KEY = (id: string) => `trial_cleared_${id}`;

export default function TrialsPage() {
  const navigate = useNavigate();
  const profile = useProfile(s => s.profile);
  const heroes = useHeroes(s => s.heroes);
  const equipment = useHeroes(s => s.equipment);
  const [busy, setBusy] = useState(false);
  const [usedToday, setUsedToday] = useState<Record<string, number>>({});
  const [cleared, setCleared] = useState<Record<string, boolean>>({});
  const [skipResult, setSkipResult] = useState<{ name: string; won: boolean } | null>(null);

  async function refreshUsed() {
    const day = todayStr();
    const map: Record<string, number> = {};
    const clearedMap: Record<string, boolean> = {};
    for (const t of TRIALS) {
      const r = await db.items.get(TRIAL_USED_KEY(t.id, day));
      map[t.id] = r?.count ?? 0;
      const c = await db.items.get(TRIAL_CLEARED_KEY(t.id));
      clearedMap[t.id] = (c?.count ?? 0) > 0;
    }
    setUsedToday(map);
    setCleared(clearedMap);
  }
  useEffect(() => { refreshUsed(); }, []);

  function squadMeetsRestrictions(def: TrialDef): { ok: boolean; reason?: string } {
    const squad = loadSquad().map(id => heroes.find(h => h.id === id)).filter((h): h is NonNullable<typeof h> => !!h);
    if (squad.length === 0) return { ok: false, reason: 'Set a squad first.' };
    const r = def.restrict;
    if (r.maxSquadSize && squad.length > r.maxSquadSize) {
      return { ok: false, reason: `Squad too big — max ${r.maxSquadSize}.` };
    }
    for (const h of squad) {
      const tpl = HERO_BY_ID[h.templateId];
      if (r.elementsAllowed && !r.elementsAllowed.includes(tpl.element)) {
        return { ok: false, reason: `${tpl.name} (${tpl.element}) breaks element restriction.` };
      }
      if (r.archetypesAllowed && !r.archetypesAllowed.includes(tpl.archetype)) {
        return { ok: false, reason: `${tpl.name} (${tpl.archetype}) breaks class restriction.` };
      }
    }
    return { ok: true };
  }

  async function run(def: TrialDef) {
    if (busy) return;
    if (profile.energy < def.energyCost) { alert('Not enough energy'); return; }
    if ((usedToday[def.id] ?? 0) >= def.dailyLimit) { alert('Already done today'); return; }
    const check = squadMeetsRestrictions(def);
    if (!check.ok) { alert(check.reason); return; }
    setBusy(true);
    await useProfile.getState().spendEnergy(def.energyCost);
    // Trials now play through the regular BattlePlayPage with animations.
    // BattlePlayPage detects the `trial-` prefix, builds a virtual stage
    // from the TrialDef, grants the trial rewards on win, and marks the
    // daily-limit ledger using the same key TrialsPage reads from.
    // The noEquipment / squad restrictions were already validated above,
    // but the gear-strip itself happens inside BattlePlayPage's combat
    // unit build — see the trial branch there.
    navigate(`/battle/play/trial-${def.id}`);
    setBusy(false);
  }

  // Skip path — only callable after the first manual clear. Mirrors the
  // trial branch of BattlePlayPage.endBattle: resolves the battle instantly,
  // grants the same rewards, marks today's daily-limit ledger.
  async function skip(def: TrialDef) {
    if (busy) return;
    if (profile.energy < def.energyCost) { alert('Not enough energy'); return; }
    if ((usedToday[def.id] ?? 0) >= def.dailyLimit) { alert('Already done today'); return; }
    const check = squadMeetsRestrictions(def);
    if (!check.ok) { alert(check.reason); return; }
    setBusy(true);
    await useProfile.getState().spendEnergy(def.energyCost);
    const squad = loadSquad()
      .map(id => heroes.find(h => h.id === id))
      .filter((h): h is NonNullable<typeof h> => !!h);
    const equipForCombat = def.restrict.noEquipment ? [] : equipment;
    const playerUnits = squad
      .map((h, i) => toCombatUnit(h, equipForCombat, 'player', `p${i}`))
      .filter((u): u is NonNullable<typeof u> => !!u);
    const enemyTpls = def.enemyTeam.map(e => e.templateId);
    const enemyUnits = def.enemyTeam.map((e, i) =>
      buildEnemyUnit(e.templateId, e.level, e.star, `e${i}`, enemyTpls)
    );
    const battle = resolveBattle(playerUnits, enemyUnits);
    const won = battle.winner === 'player';
    if (won) {
      await useProfile.getState().addGold(def.rewards.gold);
      await useProfile.getState().addGems(def.rewards.gems);
      if (def.rewards.soulshard) {
        await addMaterial(MAT_SOULSHARD, def.rewards.soulshard);
        await useItems.getState().refresh();
      }
      const day = todayStr();
      const usedKey = TRIAL_USED_KEY(def.id, day);
      const prev = await db.items.get(usedKey);
      await db.items.put({ templateId: usedKey, count: (prev?.count ?? 0) + 1 });
      await recordEvent({ kind: 'battleWon' });
      await recordEvent({ kind: 'goldEarned', amount: def.rewards.gold });
    } else {
      await recordEvent({ kind: 'battleLost' });
    }
    setSkipResult({ name: def.name, won });
    await refreshUsed();
    setBusy(false);
  }

  return (
    <div className="p-3 space-y-3 pb-5">
      <button onClick={() => navigate(-1)} className="text-xs text-zinc-400">← Back</button>
      <div>
        <h2 className="font-pixel text-sm">🎯 Hero Trials</h2>
        <p className="text-[10px] text-zinc-500 mt-1">
          Themed runs with squad restrictions. Each trial gives bonus rewards once per day.
        </p>
      </div>

      <div className="space-y-2">
        {TRIALS.map(def => {
          const used = (usedToday[def.id] ?? 0);
          const exhausted = used >= def.dailyLimit;
          const check = squadMeetsRestrictions(def);
          return (
            <div
              key={def.id}
              className={`rounded-md border-2 p-3 ${exhausted ? 'border-zinc-800 bg-zinc-900/40 opacity-60' : 'border-zinc-700 bg-zinc-900'}`}
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded bg-zinc-950 flex items-center justify-center text-3xl shrink-0">{def.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-pixel">{def.name}</div>
                  <div className="text-[10px] text-zinc-400">{def.description}</div>
                  <div className="text-[10px] text-emerald-400 mt-1">
                    {def.rewards.gold} 🪙 · {def.rewards.gems} 💎{def.rewards.soulshard ? ` · ${def.rewards.soulshard} 💠` : ''}
                  </div>
                  {!check.ok && !exhausted && <div className="text-[9px] text-rose-400 mt-0.5">⚠ {check.reason}</div>}
                </div>
                <div className="flex flex-col gap-1 shrink-0 self-center">
                  <button
                    className={`btn-pixel ${!exhausted && check.ok ? 'primary' : ''}`}
                    disabled={exhausted || !check.ok || busy}
                    onClick={() => run(def)}
                    title="Play through the battle"
                  >
                    {exhausted ? '✓' : `▶ Play ⚡${def.energyCost}`}
                  </button>
                  {cleared[def.id] ? (
                    <button
                      className="btn-pixel"
                      disabled={exhausted || !check.ok || busy}
                      onClick={() => skip(def)}
                      title="Instant clear (auto-resolve)"
                    >
                      ⏩ Skip
                    </button>
                  ) : (
                    <div className="text-[8px] text-zinc-600 text-center px-1" title="Win this trial once to unlock instant-skip">
                      skip locked
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <SquadPicker />

      {skipResult && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setSkipResult(null)}>
          <div
            className="bg-zinc-900 border-2 rounded-lg p-6 text-center max-w-xs"
            style={{ borderColor: skipResult.won ? '#22c55e' : '#ef4444' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="text-3xl mb-2">{skipResult.won ? '🎯' : '💀'}</div>
            <div className="font-pixel text-lg mb-2" style={{ color: skipResult.won ? '#86efac' : '#f87171' }}>
              {skipResult.won ? `${skipResult.name} — Cleared` : `${skipResult.name} — Defeated`}
            </div>
            <button className="btn-pixel primary w-full mt-2" onClick={() => setSkipResult(null)}>OK</button>
          </div>
        </div>
      )}
    </div>
  );
}
