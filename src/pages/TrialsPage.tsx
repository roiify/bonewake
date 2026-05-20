import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../store/profile';
import { useHeroes } from '../store/heroes';
import { TRIALS, buildTrialEnemyTeam, type TrialDef } from '../data/trials';
import { resolveBattle } from '../lib/combat';
import { toCombatUnit } from '../lib/stats';
import { HERO_BY_ID, HERO_PORTRAITS } from '../data/heroes';
import { StaticSprite } from '../components/SpriteAnimator';
import { recordEvent } from '../lib/lifetime';
import { addMaterial } from '../lib/crafting';
import { MAT_SOULSHARD } from '../data/ultimateGear';
import { logBattle } from '../lib/battleLog';
import { db } from '../lib/db';

const SQUAD_KEY = 'pf_squad';
function loadSquad(): string[] {
  try { return JSON.parse(localStorage.getItem(SQUAD_KEY) ?? '[]'); } catch { return []; }
}
const todayStr = () => new Date().toISOString().slice(0, 10);

const TRIAL_USED_KEY = (id: string, day: string) => `trial_used_${id}_${day}`;

export default function TrialsPage() {
  const navigate = useNavigate();
  const profile = useProfile(s => s.profile);
  const heroes = useHeroes(s => s.heroes);
  const equipment = useHeroes(s => s.equipment);
  const [busy, setBusy] = useState(false);
  const [usedToday, setUsedToday] = useState<Record<string, number>>({});
  const [result, setResult] = useState<{ trial: TrialDef; won: boolean } | null>(null);

  async function refreshUsed() {
    const day = todayStr();
    const map: Record<string, number> = {};
    for (const t of TRIALS) {
      const r = await db.items.get(TRIAL_USED_KEY(t.id, day));
      map[t.id] = r?.count ?? 0;
    }
    setUsedToday(map);
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
    const squad = loadSquad().map(id => heroes.find(h => h.id === id)).filter((h): h is NonNullable<typeof h> => !!h);
    const equipForCombat = def.restrict.noEquipment ? [] : equipment;
    const playerUnits = squad
      .map((h, i, arr) => toCombatUnit(h, equipForCombat, 'player', `p${i}`, arr.map(x => x.templateId)))
      .filter((u): u is NonNullable<typeof u> => !!u);
    const enemies = buildTrialEnemyTeam(def);
    const battle = resolveBattle(playerUnits, enemies);
    const won = battle.winner === 'player';
    if (won) {
      await useProfile.getState().addGold(def.rewards.gold);
      await useProfile.getState().addGems(def.rewards.gems);
      if (def.rewards.soulshard) await addMaterial(MAT_SOULSHARD, def.rewards.soulshard);
      await recordEvent({ kind: 'battleWon' });
      await recordEvent({ kind: 'goldEarned', amount: def.rewards.gold });
    } else {
      await recordEvent({ kind: 'battleLost' });
    }
    // Mark used
    const day = todayStr();
    await db.items.put({ templateId: TRIAL_USED_KEY(def.id, day), count: (usedToday[def.id] ?? 0) + 1 });
    await refreshUsed();
    await logBattle({
      source: 'trial',
      sourceId: def.id,
      won,
      damageDealt: battle.log.filter(a => a.dst.startsWith('trial_')).reduce((s, a) => s + a.dmg, 0),
      squadIds: squad.map(h => h.templateId),
      enemyTemplates: def.enemyTeam.map(e => e.templateId),
      durationTicks: battle.log.length,
    });
    setResult({ trial: def, won });
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
                <button
                  className={`btn-pixel ${!exhausted && check.ok ? 'primary' : ''} shrink-0 self-center`}
                  disabled={exhausted || !check.ok || busy}
                  onClick={() => run(def)}
                >
                  {exhausted ? '✓' : `⚡${def.energyCost}`}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Squad preview */}
      <div className="rounded-md border border-emerald-900/50 bg-emerald-950/20 p-3">
        <div className="font-pixel text-[10px] text-emerald-300 mb-2">Your Squad</div>
        <div className="grid grid-cols-3 gap-2">
          {loadSquad().map(id => {
            const h = heroes.find(x => x.id === id);
            if (!h) return null;
            const tpl = HERO_BY_ID[h.templateId];
            return (
              <div key={id} className="rounded border bg-zinc-950 p-1.5 text-center" style={{ borderColor: tpl.color }}>
                <div className="aspect-square flex items-center justify-center overflow-hidden">
                  {HERO_PORTRAITS[tpl.id] ? <StaticSprite src={HERO_PORTRAITS[tpl.id]} size={50} /> : <div className="text-2xl">{tpl.emoji}</div>}
                </div>
                <div className="text-[9px] truncate" style={{ color: tpl.color }}>{tpl.name}</div>
                <div className="text-[8px] text-zinc-500">{tpl.element} · {tpl.archetype}</div>
              </div>
            );
          })}
          {loadSquad().length === 0 && (
            <div className="col-span-3 text-[10px] text-zinc-500 text-center">No squad set.</div>
          )}
        </div>
      </div>

      {result && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setResult(null)}>
          <div className="bg-zinc-900 border-2 rounded-lg p-6 text-center max-w-xs"
            style={{ borderColor: result.won ? '#22c55e' : '#ef4444' }}>
            <div className="text-3xl mb-2">{result.won ? '🏆' : '💀'}</div>
            <div className="font-pixel text-lg mb-2" style={{ color: result.won ? '#86efac' : '#f87171' }}>
              {result.won ? 'CLEARED' : 'DEFEATED'}
            </div>
            {result.won && (
              <div className="text-xs text-zinc-300 space-y-1 mb-3">
                <div>+{result.trial.rewards.gold} 🪙</div>
                <div>+{result.trial.rewards.gems} 💎</div>
                {result.trial.rewards.soulshard && <div>+{result.trial.rewards.soulshard} 💠</div>}
              </div>
            )}
            <button className="btn-pixel primary w-full" onClick={() => setResult(null)}>OK</button>
          </div>
        </div>
      )}
    </div>
  );
}
