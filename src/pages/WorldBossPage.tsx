import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../store/profile';
import { useHeroes } from '../store/heroes';
import { currentBoss, buildBossTeam, WORLD_BOSS_ATTEMPTS_PER_WEEK, REWARD_TIERS, tierFor } from '../data/worldBoss';
import { isoWeek } from '../data/tower';
import { resolveBattle } from '../lib/combat';
import { toCombatUnit } from '../lib/stats';
import { recordEvent } from '../lib/lifetime';
import { ENEMY_SPRITES } from '../data/heroes';
import { addMaterial } from '../lib/crafting';
import SquadPicker from '../components/SquadPicker';
import PageHeader from '../components/ui/PageHeader';
import { MAT_SOULSHARD } from '../data/ultimateGear';

const SQUAD_KEY = 'bonewake_squad';
function loadSquad(): string[] {
  try { return JSON.parse(localStorage.getItem(SQUAD_KEY) ?? '[]'); } catch { return []; }
}

export default function WorldBossPage() {
  const navigate = useNavigate();
  const profile = useProfile(s => s.profile);
  const patch = useProfile(s => s.patch);
  const heroes = useHeroes(s => s.heroes);
  const equipment = useHeroes(s => s.equipment);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ damage: number; pct: number; tier: typeof REWARD_TIERS[number]; newBest: boolean } | null>(null);

  const week = isoWeek();
  const boss = currentBoss(week);
  const weekChanged = profile.worldBossWeek !== week;
  useEffect(() => {
    if (weekChanged) {
      patch({
        worldBossWeek: week,
        worldBossAttemptsUsed: 0,
        worldBossBestDamage: 0,
        worldBossClaimedTier: -1,
      });
    }
  }, [weekChanged, week]);

  const attemptsUsed = weekChanged ? 0 : (profile.worldBossAttemptsUsed ?? 0);
  const attemptsLeft = WORLD_BOSS_ATTEMPTS_PER_WEEK - attemptsUsed;
  const bestDamage = weekChanged ? 0 : (profile.worldBossBestDamage ?? 0);
  const claimedTierIdx = weekChanged ? -1 : (profile.worldBossClaimedTier ?? -1);
  const bossHp = Math.floor(boss.hpMillions * 1_000_000);
  const bestPct = bestDamage / bossHp;
  const bestTier = bestPct > 0 ? tierFor(bestPct) : null;
  const bestTierIdx = bestTier ? REWARD_TIERS.indexOf(bestTier) : -1;

  async function attack() {
    if (busy || attemptsLeft <= 0) return;
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
      .map((h, i) => toCombatUnit(h, equipment, 'player', `p${i}`))
      .filter((u): u is NonNullable<typeof u> => !!u);
    const bossTeam = buildBossTeam(boss);
    const startingHp = bossTeam[0].maxHp;
    const battleResult = resolveBattle(playerUnits, bossTeam);
    // Calculate damage from the log
    let damage = 0;
    for (const action of battleResult.log) {
      if (action.dst === 'wb_boss' && action.dmg > 0) damage += action.dmg;
    }
    damage = Math.min(damage, startingHp);
    const pct = damage / startingHp;
    const isNewBest = damage > bestDamage;
    await patch({
      worldBossAttemptsUsed: attemptsUsed + 1,
      worldBossBestDamage: Math.max(damage, bestDamage),
      worldBossWeek: week,
    });
    await recordEvent({ kind: 'battleWon' });
    setResult({ damage, pct, tier: tierFor(pct), newBest: isNewBest });
    setBusy(false);
  }

  async function claimRewards() {
    if (bestTierIdx <= claimedTierIdx) return;
    // Grant all unclaimed tier rewards up to bestTierIdx
    let totalGold = 0, totalGems = 0, totalShards = 0;
    for (let i = claimedTierIdx + 1; i <= bestTierIdx; i++) {
      totalGold += REWARD_TIERS[i].rewards.gold;
      totalGems += REWARD_TIERS[i].rewards.gems;
      totalShards += REWARD_TIERS[i].rewards.soulshard;
    }
    if (totalGold) await useProfile.getState().addGold(totalGold);
    if (totalGems) await useProfile.getState().addGems(totalGems);
    if (totalShards) await addMaterial(MAT_SOULSHARD, totalShards);
    await patch({ worldBossClaimedTier: bestTierIdx });
  }

  return (
    <div className="p-3 space-y-3">
      <button onClick={() => navigate('/modes')} className="text-xs text-zinc-400">← Back</button>

      <PageHeader
        title="World Boss"
        tagline="Weekly · only your BEST single-attempt damage counts"
        glow="#dc2626"
      />
      <p className="text-[10px] text-zinc-400 px-2 leading-snug">
        One huge boss per week. <span className="text-amber-300">Burst comps win here</span>, not consistency.
        Multiple attempts replace your best — there's no penalty for trying again.
      </p>

      {/* Boss — big-sprite hero shot */}
      <div className="rounded-lg border-2 border-rose-700 bg-gradient-to-b from-rose-950/40 to-zinc-900 p-4">
        <div className="flex flex-col items-center text-center gap-2">
          {(() => {
            const s = ENEMY_SPRITES[boss.templateId as keyof typeof ENEMY_SPRITES];
            return s ? (
              <img
                src={s.portrait ?? s.idle}
                alt={boss.name}
                className="w-48 h-48 object-contain"
                style={{ imageRendering: 'pixelated' }}
              />
            ) : <div className="text-7xl">{boss.emoji}</div>;
          })()}
          <div className="font-pixel text-base text-rose-200">{boss.name}</div>
          <div className="text-[11px] text-zinc-400 italic">"{boss.description}"</div>
          <div className="text-[10px] text-zinc-500">LVL:{boss.level} · {bossHp.toLocaleString()} HP</div>
        </div>
        {/* Best damage progress bar */}
        <div className="mt-3">
          <div className="text-[10px] text-zinc-400 mb-1">
            Best this week: <span className="font-pixel text-amber-300">{bestDamage.toLocaleString()}</span> ({(bestPct * 100).toFixed(1)}%)
          </div>
          <div className="h-2 bg-zinc-800 rounded overflow-hidden">
            <div className="h-full bg-rose-500" style={{ width: `${Math.min(100, bestPct * 100)}%` }} />
          </div>
        </div>
      </div>

      {/* Reward tiers */}
      <div className="rounded-md border border-zinc-800 bg-zinc-900 p-3">
        <div className="font-pixel text-xs text-zinc-300 mb-2">Damage Rewards</div>
        <div className="space-y-1">
          {REWARD_TIERS.map((t, i) => {
            const reached = bestPct >= t.pct;
            const claimed = i <= claimedTierIdx;
            return (
              <div key={t.name} className="flex items-center gap-2 text-[10px]">
                <span className="w-12 font-pixel" style={{ color: reached ? '#86efac' : '#71717a' }}>{(t.pct * 100).toFixed(0)}%+</span>
                <span className="w-14 font-pixel" style={{ color: reached ? '#fafafa' : '#71717a' }}>{t.name}</span>
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
            Claim Rewards (up to {REWARD_TIERS[bestTierIdx].name})
          </button>
        )}
      </div>

      <SquadPicker />

      {/* Attack — Play (animated) + Skip (instant). Skip is always
          available because every attempt is meaningful (damage carries
          across the week); no first-clear gate applies. */}
      <div className="grid grid-cols-2 gap-2">
        <button
          className="btn-pixel danger text-base"
          disabled={attemptsLeft <= 0 || busy}
          onClick={() => navigate(`/battle/play/worldboss`)}
          title="Play through the attack"
        >
          {busy ? '…' : attemptsLeft > 0 ? `▶ Play (${attemptsLeft}/${WORLD_BOSS_ATTEMPTS_PER_WEEK})` : 'No attempts'}
        </button>
        <button
          className="btn-pixel text-base"
          disabled={attemptsLeft <= 0 || busy}
          onClick={attack}
          title="Instant attack (auto-resolve)"
        >
          ⏩ Skip
        </button>
      </div>

      {result && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setResult(null)}>
          <div className="bg-zinc-900 border-2 border-rose-700 rounded-lg p-6 text-center max-w-xs">
            <div className="text-3xl mb-2">⚔️</div>
            <div className="font-pixel text-lg mb-2 text-rose-300">DAMAGE DEALT</div>
            <div className="font-pixel text-2xl text-amber-300">{result.damage.toLocaleString()}</div>
            <div className="text-[11px] text-zinc-400 mt-1">{(result.pct * 100).toFixed(2)}% of boss HP</div>
            <div className="font-pixel text-sm mt-3" style={{ color: '#fb923c' }}>Tier: {result.tier.name}</div>
            {result.newBest && <div className="text-[11px] text-emerald-400 font-pixel mt-2">🏆 NEW BEST!</div>}
            <button className="btn-pixel primary w-full mt-4" onClick={() => setResult(null)}>OK</button>
          </div>
        </div>
      )}
    </div>
  );
}
