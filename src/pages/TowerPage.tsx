import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../store/profile';
import { useHeroes } from '../store/heroes';
import { useItems } from '../store/items';
import {
  TOWER_MAX_FLOOR,
  TOWER_DAILY_ATTEMPTS,
  TOWER_REFILL_GEM_COST,
  TOWER_REFILL_MAX_PER_DAY,
  generateFloor,
  isBossFloor,
  isMegaBossFloor,
  isEndless,
  isoWeek,
} from '../data/tower';
import { resolveBattle } from '../lib/combat';
import { toCombatUnit } from '../lib/stats';
import { recordEvent } from '../lib/lifetime';
import { addMaterial } from '../lib/crafting';
import { MAT_SOULSHARD } from '../data/ultimateGear';
import { ENEMY_SPRITES } from '../data/heroes';
import { StaticSprite } from '../components/SpriteAnimator';
import SquadPicker from '../components/SquadPicker';
import PageHeader from '../components/ui/PageHeader';

const SQUAD_KEY = 'bonewake_squad';
function loadSquad(): string[] {
  try { return JSON.parse(localStorage.getItem(SQUAD_KEY) ?? '[]'); } catch { return []; }
}

function todayStr() { return new Date().toISOString().slice(0, 10); }

const TOWER_HISTORY_KEY = 'bonewake_tower_weekly_history_v1';
type WeekRecord = { week: string; highest: number };
function loadTowerHistory(): WeekRecord[] {
  try { return JSON.parse(localStorage.getItem(TOWER_HISTORY_KEY) ?? '[]'); } catch { return []; }
}
function recordWeeklyTowerHigh(week: string, highest: number) {
  try {
    const list = loadTowerHistory();
    const i = list.findIndex(r => r.week === week);
    if (i >= 0) {
      if (highest > list[i].highest) list[i].highest = highest;
    } else {
      list.unshift({ week, highest });
    }
    localStorage.setItem(TOWER_HISTORY_KEY, JSON.stringify(list.slice(0, 12)));
  } catch {}
}

export default function TowerPage() {
  const navigate = useNavigate();
  const profile = useProfile(s => s.profile);
  const patch = useProfile(s => s.patch);
  const heroes = useHeroes(s => s.heroes);
  const equipment = useHeroes(s => s.equipment);
  const refreshItems = useItems(s => s.refresh);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ won: boolean; floor: number; rewards: any } | null>(null);

  // Weekly reset detection — only the FIRST 100 floors reset.
  // Endless mode (>100) progress persists from `lifetime.towerMaxFloor` across resets.
  const currentWeek = isoWeek();
  const weekChanged = profile.towerWeekStart !== currentWeek;
  const allTimeMax = profile.lifetime?.towerMaxFloor ?? 0;
  // Weekly highest within the 1-100 section
  const weeklyHighest = weekChanged ? 0 : Math.min(TOWER_MAX_FLOOR, profile.towerHighestFloor ?? 0);
  // If you've ever reached floor >100 and you've cleared this week's 100, jump back into endless
  const inEndless = allTimeMax > TOWER_MAX_FLOOR && weeklyHighest >= TOWER_MAX_FLOOR;
  const nextFloor = inEndless ? allTimeMax + 1 : weeklyHighest + 1;
  const highestFloor = inEndless ? allTimeMax : weeklyHighest;

  // Daily attempts
  const today = todayStr();
  const attemptsToday = profile.towerAttemptsDate === today ? (profile.towerAttemptsToday ?? 0) : 0;
  const freeAttemptsLeft = Math.max(0, TOWER_DAILY_ATTEMPTS - attemptsToday);
  const refillsToday = Math.max(0, attemptsToday - TOWER_DAILY_ATTEMPTS);
  const refillsAvailable = TOWER_REFILL_MAX_PER_DAY - refillsToday;
  const canAttempt = freeAttemptsLeft > 0 || (refillsAvailable > 0 && profile.gems >= TOWER_REFILL_GEM_COST);

  useEffect(() => {
    if (weekChanged) {
      patch({ towerWeekStart: currentWeek, towerHighestFloor: 0 });
    }
  }, [weekChanged, currentWeek]);

  const floorDef = generateFloor(nextFloor);

  async function climb() {
    if (busy || !canAttempt) return;
    setBusy(true);
    // Spend attempt or refill
    if (freeAttemptsLeft <= 0) {
      const ok = await useProfile.getState().spendGems(TOWER_REFILL_GEM_COST);
      if (!ok) { setBusy(false); return; }
    }
    await patch({
      towerAttemptsDate: today,
      towerAttemptsToday: attemptsToday + 1,
    });
    // Build player squad
    const squad = loadSquad()
      .map(id => heroes.find(h => h.id === id))
      .filter((h): h is NonNullable<typeof h> => !!h);
    if (squad.length === 0) {
      alert('Set a squad first (Battle → any stage → Auto/Edit).');
      setBusy(false);
      return;
    }
    const playerUnits = squad
      .map((h, i) => toCombatUnit(h, equipment, 'player', `p${i}`))
      .filter((u): u is NonNullable<typeof u> => !!u);
    const battle = resolveBattle(playerUnits, floorDef.enemyTeam);
    const won = battle.winner === 'player';
    if (won) {
      const r = floorDef.rewards;
      await useProfile.getState().addGold(r.gold);
      if (r.gems > 0) await useProfile.getState().addGems(r.gems);
      if (r.soulshards > 0) await addMaterial(MAT_SOULSHARD, r.soulshards);
      const newHigh = Math.max(highestFloor, nextFloor);
      // weeklyHighest is capped at MAX so endless climbing doesn't get wiped by reset
      await patch({ towerHighestFloor: Math.min(TOWER_MAX_FLOOR, newHigh) });
      recordWeeklyTowerHigh(currentWeek, newHigh);
      await recordEvent({ kind: 'towerFloor', floor: newHigh });
      await recordEvent({ kind: 'goldEarned', amount: r.gold });
      await refreshItems();
      setResult({ won: true, floor: nextFloor, rewards: r });
    } else {
      setResult({ won: false, floor: nextFloor, rewards: null });
    }
    setBusy(false);
  }

  return (
    <div className="p-3 space-y-3">
      <button onClick={() => navigate('/modes')} className="text-xs text-zinc-400">← Back</button>

      <PageHeader
        title="Tower of Trials"
        tagline="Daily attempts · floors 1-100 reset Monday · endless persists forever"
        glow="#fb7185"
      />
      <p className="text-[10px] text-zinc-400 px-2 leading-snug">
        Climb one floor at a time for <span className="text-amber-300">escalating rewards</span>.
        Only your <span className="text-amber-300">highest floor</span> counts for the weekly leaderboard.
      </p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-md border border-zinc-800 bg-zinc-900 p-2 text-center">
          <div className="text-[9px] text-zinc-500">This week</div>
          <div className="text-lg font-pixel text-amber-400">{highestFloor}</div>
        </div>
        <div className="rounded-md border border-zinc-800 bg-zinc-900 p-2 text-center">
          <div className="text-[9px] text-zinc-500">All-time</div>
          <div className="text-lg font-pixel text-emerald-400">{allTimeMax}</div>
        </div>
        <div className="rounded-md border border-zinc-800 bg-zinc-900 p-2 text-center">
          <div className="text-[9px] text-zinc-500">Attempts</div>
          <div className="text-lg font-pixel text-cyan-400">{freeAttemptsLeft}/{TOWER_DAILY_ATTEMPTS}</div>
        </div>
      </div>

      {/* Next floor preview */}
      {weeklyHighest >= TOWER_MAX_FLOOR && !inEndless ? (
        <div className="rounded-md border-2 border-amber-700 bg-amber-900/30 p-6 text-center">
          <div className="text-3xl mb-2">👑</div>
          <div className="font-pixel text-sm text-amber-300">APEX REACHED — ENDLESS UNLOCKED</div>
          <div className="text-[10px] text-zinc-400 mt-1">Press Climb to push into Floor 101+. Endless progress persists across weekly resets.</div>
        </div>
      ) : (
        <div
          className={`rounded-md border-2 p-3 ${
            isEndless(nextFloor) ? 'border-fuchsia-500 bg-gradient-to-b from-fuchsia-950/30 to-zinc-900'
              : isMegaBossFloor(nextFloor) ? 'border-rose-600 bg-gradient-to-b from-rose-950/40 to-zinc-900'
              : isBossFloor(nextFloor) ? 'border-amber-600 bg-gradient-to-b from-amber-950/30 to-zinc-900'
              : 'border-zinc-700 bg-zinc-900'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="font-pixel text-xs">
              Floor {nextFloor}
              {isEndless(nextFloor) && <span className="text-fuchsia-300 ml-2">♾ ENDLESS</span>}
              {isMegaBossFloor(nextFloor) && <span className="text-rose-400 ml-2">★ MEGA BOSS</span>}
              {!isMegaBossFloor(nextFloor) && isBossFloor(nextFloor) && !isEndless(nextFloor) && <span className="text-amber-400 ml-2">★ BOSS</span>}
            </div>
            <div className="text-[10px] text-zinc-500">+{floorDef.rewards.gold} 🪙 · +{floorDef.rewards.gems} 💎{floorDef.rewards.soulshards ? ` · +${floorDef.rewards.soulshards} 💠` : ''}</div>
          </div>
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${floorDef.enemyTeam.length}, minmax(0, 1fr))` }}>
            {floorDef.enemyTeam.map(e => {
              const sprite = ENEMY_SPRITES[e.templateId as keyof typeof ENEMY_SPRITES];
              return (
                <div key={e.id} className="rounded border bg-zinc-950 p-1.5 text-center" style={{ borderColor: e.color }}>
                  <div className="aspect-square flex items-center justify-center overflow-hidden">
                    {sprite ? <StaticSprite src={sprite.portrait ?? sprite.idle} size={50} /> : <div className="text-2xl">{e.emoji}</div>}
                  </div>
                  <div className="text-[9px] truncate" style={{ color: e.color }}>{e.name}</div>
                  <div className="text-[8px] text-zinc-500">LVL:{e.level}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <SquadPicker />

      {/* Climb buttons — Play (animated) + Skip (instant). Skip is always
          available because tower floors are one-shot per attempt; there is
          no "first 3-star clear" gate to apply here. */}
      {highestFloor < TOWER_MAX_FLOOR && (
        <div className="grid grid-cols-2 gap-2">
          <button
            className="btn-pixel primary text-base"
            disabled={!canAttempt || busy}
            onClick={() => navigate(`/battle/play/tower-${nextFloor}`)}
            title="Play through the floor"
          >
            {busy ? '…' : freeAttemptsLeft > 0 ? `▶ Play F${nextFloor}` : refillsAvailable > 0 ? `▶ Play (${TOWER_REFILL_GEM_COST}💎)` : 'No attempts'}
          </button>
          <button
            className="btn-pixel text-base"
            disabled={!canAttempt || busy}
            onClick={climb}
            title="Instant climb (auto-resolve)"
          >
            ⏩ Skip
          </button>
        </div>
      )}

      {/* Weekly history (personal leaderboard) */}
      {(() => {
        const hist = loadTowerHistory();
        if (hist.length === 0) return null;
        const max = Math.max(...hist.map(h => h.highest), 1);
        return (
          <div className="rounded-md border border-zinc-800 bg-zinc-900 p-3">
            <div className="font-pixel text-[10px] text-cyan-300 mb-2">📈 Your Weekly Bests</div>
            <div className="space-y-1.5">
              {hist.slice(0, 8).map(r => {
                const pct = (r.highest / max) * 100;
                const isCurrent = r.week === currentWeek;
                return (
                  <div key={r.week}>
                    <div className="flex items-center justify-between text-[10px] mb-0.5">
                      <span className={isCurrent ? 'text-amber-300 font-pixel' : 'text-zinc-400'}>
                        {isCurrent ? '★ ' : ''}{r.week}
                      </span>
                      <span className={isCurrent ? 'text-amber-300' : 'text-zinc-400'}>F{r.highest}</span>
                    </div>
                    <div className="h-1.5 bg-zinc-800 rounded overflow-hidden">
                      <div
                        className="h-full transition-all"
                        style={{ width: `${pct}%`, background: isCurrent ? '#fbbf24' : '#22d3ee' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Result modal */}
      {result && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setResult(null)}>
          <div className="bg-zinc-900 border-2 rounded-lg p-6 text-center max-w-xs"
            style={{ borderColor: result.won ? '#22c55e' : '#ef4444' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="text-3xl mb-2">{result.won ? '🗼' : '💀'}</div>
            <div className="font-pixel text-lg mb-2" style={{ color: result.won ? '#86efac' : '#f87171' }}>
              {result.won ? `FLOOR ${result.floor} CLEARED` : `STOPPED AT ${result.floor}`}
            </div>
            {result.won && result.rewards && (
              <div className="text-xs text-zinc-300 space-y-1 mb-3">
                <div>+{result.rewards.gold} 🪙</div>
                {result.rewards.gems > 0 && <div>+{result.rewards.gems} 💎</div>}
                {result.rewards.soulshards > 0 && <div>+{result.rewards.soulshards} 💠</div>}
              </div>
            )}
            {!result.won && (
              <div className="text-[11px] text-zinc-400 mb-3">Your squad couldn't break through. Try again with stronger gear.</div>
            )}
            <button className="btn-pixel primary w-full" onClick={() => setResult(null)}>OK</button>
          </div>
        </div>
      )}
    </div>
  );
}
