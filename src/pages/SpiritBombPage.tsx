import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../store/profile';
import { useHeroes } from '../store/heroes';
import {
  SPIRIT_BOMB_ATTEMPTS_PER_WEEK,
  SPIRIT_TIERS,
  currentSpiritBoss,
  buildSpiritBossUnit,
  spiritTierFor,
} from '../data/spiritBomb';
import { isoWeek } from '../data/tower';
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

export default function SpiritBombPage() {
  const navigate = useNavigate();
  const profile = useProfile(s => s.profile);
  const patch = useProfile(s => s.patch);
  const heroes = useHeroes(s => s.heroes);
  const equipment = useHeroes(s => s.equipment);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ damage: number; killed: boolean; pct: number } | null>(null);

  const week = isoWeek();
  const boss = currentSpiritBoss(week);
  const weekChanged = profile.spiritBossWeek !== week;
  useEffect(() => {
    if (weekChanged) {
      patch({
        spiritBossWeek: week,
        spiritBossDamage: 0,
        spiritBossAttemptsUsed: 0,
        spiritBossClaimedTier: -1,
      });
    }
  }, [weekChanged, week]);

  const damage = weekChanged ? 0 : (profile.spiritBossDamage ?? 0);
  const remainingHp = Math.max(0, boss.hp - damage);
  const attemptsUsed = weekChanged ? 0 : (profile.spiritBossAttemptsUsed ?? 0);
  const attemptsLeft = SPIRIT_BOMB_ATTEMPTS_PER_WEEK - attemptsUsed;
  const pct = damage / boss.hp;
  const bestTier = spiritTierFor(pct);
  const bestTierIdx = bestTier ? SPIRIT_TIERS.indexOf(bestTier) : -1;
  const claimedTierIdx = weekChanged ? -1 : (profile.spiritBossClaimedTier ?? -1);
  const killed = remainingHp <= 0;

  async function attack() {
    if (busy || attemptsLeft <= 0 || killed) return;
    setBusy(true);
    const squad = loadSquad()
      .map(id => heroes.find(h => h.id === id))
      .filter((h): h is NonNullable<typeof h> => !!h);
    if (squad.length === 0) {
      alert('Set a squad first.');
      setBusy(false);
      return;
    }
    const playerUnits = squad
      .map((h, i, arr) => toCombatUnit(h, equipment, 'player', `p${i}`, arr.map(x => x.templateId)))
      .filter((u): u is NonNullable<typeof u> => !!u);
    const bossUnit = buildSpiritBossUnit(boss, remainingHp);
    const battle = resolveBattle(playerUnits, [bossUnit]);
    let dealt = 0;
    for (const a of battle.log) {
      if (a.dst === 'spirit_boss' && a.dmg > 0) dealt += a.dmg;
    }
    dealt = Math.min(dealt, remainingHp);
    const newDamage = damage + dealt;
    await patch({
      spiritBossDamage: newDamage,
      spiritBossAttemptsUsed: attemptsUsed + 1,
      spiritBossWeek: week,
    });
    await recordEvent({ kind: 'battleWon' });
    setResult({ damage: dealt, killed: newDamage >= boss.hp, pct: newDamage / boss.hp });
    setBusy(false);
  }

  async function claimRewards() {
    if (bestTierIdx <= claimedTierIdx) return;
    let gold = 0, gems = 0, shards = 0;
    for (let i = claimedTierIdx + 1; i <= bestTierIdx; i++) {
      gold += SPIRIT_TIERS[i].rewards.gold;
      gems += SPIRIT_TIERS[i].rewards.gems;
      shards += SPIRIT_TIERS[i].rewards.soulshard;
    }
    if (gold) await useProfile.getState().addGold(gold);
    if (gems) await useProfile.getState().addGems(gems);
    if (shards) await addMaterial(MAT_SOULSHARD, shards);
    await patch({ spiritBossClaimedTier: bestTierIdx });
  }

  return (
    <div className="p-3 space-y-3 pb-5">
      <button onClick={() => navigate(-1)} className="text-xs text-zinc-400">← Back</button>

      <PageHeader
        title="💥 Shatter"
        tagline="Weekly · damage carries between attempts"
        glow="#fbbf24"
      />
      <p className="text-[10px] text-zinc-400 px-2 leading-snug">
        Chip away at one massive boss across the week.
        Every hit <span className="text-amber-300">stacks toward the same HP pool</span> —
        consistent damage wins over single big swings.
      </p>

      {/* Boss */}
      <div className="rounded-lg border-2 border-rose-700 bg-gradient-to-b from-rose-950/40 to-zinc-900 p-4">
        <div className="flex items-center gap-3">
          {ENEMY_SPRITES[boss.templateId as keyof typeof ENEMY_SPRITES] ? (
            <StaticSprite src={ENEMY_SPRITES[boss.templateId as keyof typeof ENEMY_SPRITES]!.idle} size={80} />
          ) : <div className="text-5xl">{boss.emoji}</div>}
          <div className="flex-1 min-w-0">
            <div className="font-pixel text-sm text-rose-200">{boss.name}</div>
            <div className="text-[10px] text-zinc-400 italic mt-0.5">"{boss.description}"</div>
            <div className="text-[10px] text-zinc-500 mt-1">LVL:{boss.level} · {boss.hp.toLocaleString()} HP max</div>
          </div>
        </div>
        <div className="mt-3">
          <div className="text-[10px] text-zinc-400 mb-1 flex justify-between">
            <span>{remainingHp.toLocaleString()} HP left</span>
            <span>{(pct * 100).toFixed(1)}% broken</span>
          </div>
          <div className="h-3 bg-zinc-800 rounded overflow-hidden relative">
            <div className="h-full bg-emerald-500 transition-all" style={{ width: `${100 - pct * 100}%` }} />
            {killed && (
              <div className="absolute inset-0 flex items-center justify-center font-pixel text-[11px] text-amber-300">SHATTERED</div>
            )}
          </div>
        </div>
      </div>

      {/* Reward tiers */}
      <div className="rounded-md border border-zinc-800 bg-zinc-900 p-3">
        <div className="font-pixel text-xs mb-2">Reward Tiers</div>
        <div className="space-y-1">
          {SPIRIT_TIERS.map((t, i) => {
            const reached = pct >= t.pct;
            const claimed = i <= claimedTierIdx;
            return (
              <div key={t.name} className="flex items-center gap-2 text-[10px]">
                <span className="w-12 font-pixel" style={{ color: reached ? '#86efac' : '#71717a' }}>{(t.pct * 100).toFixed(0)}%</span>
                <span className="w-20 font-pixel" style={{ color: reached ? '#fafafa' : '#71717a' }}>{t.name}</span>
                <span className="flex-1 text-zinc-400">
                  {t.rewards.gold} 🪙 · {t.rewards.gems} 💎 · {t.rewards.soulshard} 💠
                </span>
                {reached && claimed && <span className="text-emerald-400">✓</span>}
              </div>
            );
          })}
        </div>
        {bestTierIdx > claimedTierIdx && (
          <button className="btn-pixel success w-full mt-3" onClick={claimRewards}>
            Claim up to {SPIRIT_TIERS[bestTierIdx].name}
          </button>
        )}
      </div>

      <SquadPicker />


      {/* Strike — Play (animated) + Skip (instant). Skip is always
          available; cumulative damage accumulates regardless of path. */}
      {killed ? (
        <button className="btn-pixel w-full" disabled>Boss already shattered</button>
      ) : attemptsLeft <= 0 ? (
        <button className="btn-pixel w-full" disabled>Out of strikes — back Monday</button>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <button
            className="btn-pixel danger"
            disabled={busy}
            onClick={() => navigate(`/battle/play/spiritbomb`)}
            title="Play through the strike"
          >
            {busy ? '…' : `▶ Play (${attemptsLeft}/${SPIRIT_BOMB_ATTEMPTS_PER_WEEK})`}
          </button>
          <button
            className="btn-pixel"
            disabled={busy}
            onClick={attack}
            title="Instant strike (auto-resolve)"
          >
            ⏩ Skip
          </button>
        </div>
      )}

      {result && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setResult(null)}>
          <div className="bg-zinc-900 border-2 border-rose-700 rounded-lg p-6 text-center max-w-xs">
            <div className="text-3xl mb-2">{result.killed ? '💥' : '⚔️'}</div>
            <div className="font-pixel text-lg mb-2 text-rose-300">DAMAGE</div>
            <div className="font-pixel text-2xl text-amber-300">{result.damage.toLocaleString()}</div>
            <div className="text-[11px] text-zinc-400 mt-1">{(result.pct * 100).toFixed(2)}% total broken</div>
            {result.killed && <div className="text-[11px] text-emerald-400 font-pixel mt-2">🏆 SHATTERED!</div>}
            <button className="btn-pixel primary w-full mt-4" onClick={() => setResult(null)}>OK</button>
          </div>
        </div>
      )}
    </div>
  );
}
