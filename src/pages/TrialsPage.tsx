import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../store/profile';
import { useHeroes } from '../store/heroes';
import { TRIALS, type TrialDef } from '../data/trials';
import { HERO_BY_ID, HERO_PORTRAITS, HIDDEN_HERO_IDS } from '../data/heroes';
import SquadPicker from '../components/SquadPicker';
import { MANNY_TPL, ensureMannySummons } from '../lib/mannySummons';
import { HeroBadges } from '../components/ui/HeroBadges';
import PageHeader from '../components/ui/PageHeader';
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
  // Trial-scoped squad picker: when non-null, opens a modal that ONLY
  // lists heroes legal for this specific trial (matching elementsAllowed
  // / archetypesAllowed) so the player can't accidentally lock themselves
  // out of the run by including an ineligible hero.
  const [squadFor, setSquadFor] = useState<TrialDef | null>(null);
  // Local squad state for the modal — synced back to bonewake_squad on Save.
  const [pickerSquad, setPickerSquad] = useState<string[]>([]);

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

  function openSquadFor(def: TrialDef) {
    // Pre-populate the modal with the heroes from the current global squad
    // that are ALREADY legal for this trial — keeps the player's existing
    // picks where possible while filtering out anyone who'd block entry.
    const current = loadSquad();
    const legal = current.filter(id => {
      const h = heroes.find(x => x.id === id);
      if (!h) return false;
      const tpl = HERO_BY_ID[h.templateId];
      if (!tpl) return false;
      const r = def.restrict;
      if (r.elementsAllowed && !r.elementsAllowed.includes(tpl.element)) return false;
      if (r.archetypesAllowed && !r.archetypesAllowed.includes(tpl.archetype)) return false;
      return true;
    });
    const cap = def.restrict.maxSquadSize ?? 3;
    setPickerSquad(legal.slice(0, cap));
    setSquadFor(def);
  }

  async function togglePickerHero(hid: string, def: TrialDef) {
    const h = heroes.find(x => x.id === hid);
    const isManny = h?.templateId === MANNY_TPL;
    const mannyInSquad = pickerSquad.some(id => heroes.find(x => x.id === id)?.templateId === MANNY_TPL);
    const cap = def.restrict.maxSquadSize ?? 3;
    if (pickerSquad.includes(hid)) {
      if (isManny) setPickerSquad([]);
      else setPickerSquad(pickerSquad.filter(id => id !== hid));
      return;
    }
    if (isManny) {
      // Manny brings his two summons — only fits if cap allows all 3
      if (cap < 3) return;
      const summonIds = await ensureMannySummons();
      setPickerSquad([hid, ...summonIds]);
      return;
    }
    if (mannyInSquad) return;
    if (pickerSquad.length < cap) setPickerSquad([...pickerSquad, hid]);
  }

  function saveTrialSquad() {
    localStorage.setItem(SQUAD_KEY, JSON.stringify(pickerSquad));
    setSquadFor(null);
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
      <button onClick={() => navigate('/modes')} className="text-xs text-zinc-400">← Back</button>
      <PageHeader
        title="Hero Trials"
        tagline="Themed daily runs with squad restrictions"
        glow="#fb7185"
      />
      <p className="text-[10px] text-zinc-400 px-2 leading-snug">
        Tests <span className="text-amber-300">team flexibility</span> — you'll need to build
        element- or class-specific squads to enter. Bonus gems + soulshards.
      </p>

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
                    className="btn-pixel"
                    disabled={exhausted || busy}
                    onClick={() => openSquadFor(def)}
                    title="Pick a squad from heroes eligible for this trial only"
                  >
                    👥 Squad
                  </button>
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

      {squadFor && (() => {
        const def = squadFor;
        const cap = def.restrict.maxSquadSize ?? 3;
        const eligible = heroes
          .filter(h => !HIDDEN_HERO_IDS.has(h.templateId))
          .filter(h => {
            const tpl = HERO_BY_ID[h.templateId];
            if (!tpl) return false;
            const r = def.restrict;
            if (r.elementsAllowed && !r.elementsAllowed.includes(tpl.element)) return false;
            if (r.archetypesAllowed && !r.archetypesAllowed.includes(tpl.archetype)) return false;
            return true;
          });
        const restrictBlurb: string[] = [];
        if (def.restrict.elementsAllowed) restrictBlurb.push(`Element: ${def.restrict.elementsAllowed.join('/')}`);
        if (def.restrict.archetypesAllowed) restrictBlurb.push(`Class: ${def.restrict.archetypesAllowed.join('/')}`);
        if (def.restrict.maxSquadSize) restrictBlurb.push(`Max squad ${def.restrict.maxSquadSize}`);
        if (def.restrict.noEquipment) restrictBlurb.push('No equipment');
        return (
          <div
            className="fixed inset-0 z-50 bg-black/80 flex items-end pb-[72px]"
            onClick={() => setSquadFor(null)}
          >
            <div
              className="w-full max-w-[420px] mx-auto bg-zinc-900 border-t-2 border-rose-700 rounded-t-2xl p-3 max-h-[calc(80vh-72px)] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="font-pixel text-xs text-rose-300">{def.emoji} {def.name}</div>
                <div className="text-[10px] text-zinc-400">{pickerSquad.length}/{cap}</div>
              </div>
              <div className="text-[10px] text-zinc-400 mb-3">{restrictBlurb.join(' · ') || 'No restrictions.'}</div>
              {eligible.length === 0 ? (
                <div className="text-center text-rose-300 text-xs py-6">
                  No heroes in your roster match this trial's restrictions.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {eligible.map(h => {
                    const tpl = HERO_BY_ID[h.templateId];
                    const picked = pickerSquad.includes(h.id);
                    const mannyInSquad = pickerSquad.some(sid => heroes.find(x => x.id === sid)?.templateId === MANNY_TPL);
                    const locked = (mannyInSquad && h.templateId !== MANNY_TPL) || (h.templateId === MANNY_TPL && cap < 3);
                    return (
                      <button
                        key={h.id}
                        onClick={() => togglePickerHero(h.id, def)}
                        disabled={locked}
                        className={`relative rounded p-1.5 text-center transition-all ${picked ? 'scale-105 ring-4 ring-amber-300' : ''} ${locked ? 'opacity-30 grayscale' : ''}`}
                        style={{
                          borderWidth: picked ? 3 : 2,
                          borderStyle: 'solid',
                          borderColor: picked ? '#fbbf24' : tpl.color,
                          background: picked ? `${tpl.color}33` : '#09090b',
                          boxShadow: picked ? `0 0 18px ${tpl.color}, 0 0 8px #fbbf24` : undefined,
                        }}
                      >
                        {picked && (
                          <div className="absolute -top-2 -left-2 z-10 w-6 h-6 rounded-full bg-amber-400 border-2 border-zinc-950 flex items-center justify-center text-zinc-950 font-pixel text-xs">
                            ✓
                          </div>
                        )}
                        <div className="absolute top-0.5 right-0.5 z-10">
                          <HeroBadges archetype={tpl.archetype} element={tpl.element} size={18} />
                        </div>
                        <div className="aspect-square flex items-center justify-center overflow-hidden">
                          {HERO_PORTRAITS[tpl.id]
                            ? <img src={HERO_PORTRAITS[tpl.id]} alt={tpl.name} className="w-[90%] h-[90%] object-contain" style={{ imageRendering: 'pixelated' }} />
                            : <div className="text-2xl">{tpl.emoji}</div>}
                        </div>
                        <div className="text-[9px] truncate font-pixel" style={{ color: picked ? '#fde68a' : tpl.color }}>{tpl.name}</div>
                        <div className="text-[8px] text-zinc-500">LVL:{h.level}</div>
                      </button>
                    );
                  })}
                </div>
              )}
              <div className="flex gap-2 mt-3">
                <button className="btn-pixel flex-1" onClick={() => setPickerSquad([])} disabled={pickerSquad.length === 0}>Clear</button>
                <button className="btn-pixel flex-1" onClick={() => setSquadFor(null)}>Cancel</button>
                <button className="btn-pixel primary flex-1" onClick={saveTrialSquad}>Save</button>
              </div>
            </div>
          </div>
        );
      })()}

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
