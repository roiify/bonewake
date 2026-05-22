import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../store/profile';
import { useHeroes } from '../store/heroes';
import { currentBoss, buildBossTeam, WORLD_BOSS_ATTEMPTS_PER_WEEK, REWARD_TIERS, tierFor } from '../data/worldBoss';
import { isoWeek } from '../data/tower';
import { resolveBattle } from '../lib/combat';
import { toCombatUnit } from '../lib/stats';
import { recordEvent } from '../lib/lifetime';
import { ENEMY_SPRITES, HERO_BY_ID, HERO_PORTRAITS } from '../data/heroes';
import { StaticSprite } from '../components/SpriteAnimator';
import { addMaterial } from '../lib/crafting';
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
      <button onClick={() => navigate(-1)} className="text-xs text-zinc-400">← Back</button>

      {/* Header */}
      <div
        className="relative rounded-lg overflow-hidden h-32 flex items-end justify-center"
        style={{ backgroundImage: `url(${import.meta.env.BASE_URL}sprites/bg/cosmic_fire.jpg)`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-zinc-950/20" />
        <div className="relative z-10 text-center pb-3">
          <h2 className="font-pixel text-base text-rose-300">🌋 World Boss</h2>
          <p className="text-[10px] text-zinc-300 mt-1">Weekly · Resets Monday</p>
        </div>
      </div>

      {/* Boss */}
      <div className="rounded-lg border-2 border-rose-700 bg-gradient-to-b from-rose-950/40 to-zinc-900 p-4">
        <div className="flex items-center gap-3">
          {ENEMY_SPRITES[boss.templateId as keyof typeof ENEMY_SPRITES] ? (
            <StaticSprite src={ENEMY_SPRITES[boss.templateId as keyof typeof ENEMY_SPRITES]!.idle} size={72} className="scale-x-[-1]" />
          ) : <div className="text-5xl">{boss.emoji}</div>}
          <div className="flex-1 min-w-0">
            <div className="font-pixel text-sm text-rose-200">{boss.name}</div>
            <div className="text-[10px] text-zinc-400 italic mt-0.5">"{boss.description}"</div>
            <div className="text-[10px] text-zinc-500 mt-1">LVL:{boss.level} · {bossHp.toLocaleString()} HP</div>
          </div>
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
                <div className="text-[8px] text-zinc-500">LVL:{h.level}</div>
              </div>
            );
          })}
          {loadSquad().length === 0 && (
            <div className="col-span-3 text-[10px] text-zinc-500 text-center">No squad set.</div>
          )}
        </div>
      </div>

      {/* Attack */}
      <button
        className="btn-pixel danger w-full text-base"
        disabled={attemptsLeft <= 0 || busy}
        onClick={attack}
      >
        {busy ? 'Fighting…' : attemptsLeft > 0 ? `Attack (${attemptsLeft}/${WORLD_BOSS_ATTEMPTS_PER_WEEK} attempts left)` : 'No attempts — back Monday'}
      </button>

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
