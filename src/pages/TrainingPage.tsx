import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../store/profile';
import { useHeroes } from '../store/heroes';
import { HERO_BY_ID, HERO_PORTRAITS } from '../data/heroes';
import { StaticSprite } from '../components/SpriteAnimator';
import { xpForLevel, effectiveMaxLevel } from '../lib/stats';
import { tierLabel, tierColor } from '../lib/tier';
import PageHeader from '../components/ui/PageHeader';

// Accrual rates
const XP_PER_MINUTE = 80;       // raw exp granted per minute
const GOLD_PER_MINUTE = 12;     // gold trickle
const MAX_ACCRUAL_HOURS = 24;   // cap so it doesn't grow forever

function formatDuration(ms: number): string {
  if (ms <= 0) return '0s';
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function TrainingPage() {
  const navigate = useNavigate();
  const profile = useProfile(s => s.profile);
  const patch = useProfile(s => s.patch);
  const heroes = useHeroes(s => s.heroes);
  const updateHero = useHeroes(s => s.updateHero);
  const [picker, setPicker] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const trainingHero = profile.trainingHeroId ? heroes.find(h => h.id === profile.trainingHeroId) : null;
  const startedAt = profile.trainingStartedAt ?? 0;
  const elapsed = trainingHero ? now - startedAt : 0;
  const cappedMs = Math.min(elapsed, MAX_ACCRUAL_HOURS * 60 * 60 * 1000);
  const minutesAccrued = Math.floor(cappedMs / 60000);
  const accruedXp = minutesAccrued * XP_PER_MINUTE;
  const accruedGold = minutesAccrued * GOLD_PER_MINUTE;
  const atCap = elapsed >= MAX_ACCRUAL_HOURS * 60 * 60 * 1000;

  async function placeHero(heroId: string) {
    await patch({ trainingHeroId: heroId, trainingStartedAt: Date.now() });
    setPicker(false);
  }

  async function withdraw() {
    if (!trainingHero) return;
    // Apply XP — level up the hero, respecting tier cap
    let lvl = trainingHero.level;
    let exp = trainingHero.exp + accruedXp;
    const cap = effectiveMaxLevel(trainingHero.star, profile.level);
    while (lvl < cap && exp >= xpForLevel(lvl)) {
      exp -= xpForLevel(lvl);
      lvl++;
    }
    if (lvl >= cap) exp = 0; // discard overflow at cap
    await updateHero(trainingHero.id, { level: lvl, exp });
    await useProfile.getState().addGold(accruedGold);
    await patch({ trainingHeroId: null, trainingStartedAt: null });
  }

  async function withdrawAndKeep() {
    // Just remove without applying — rare case if user wants to swap quickly
    await patch({ trainingHeroId: null, trainingStartedAt: null });
  }

  // Eligible heroes — anything not currently training, sorted by power
  const eligibleHeroes = heroes
    .filter(h => h.id !== profile.trainingHeroId)
    .sort((a, b) => b.level - a.level);

  return (
    <div className="p-3 space-y-3">
      <button onClick={() => navigate(-1)} className="text-xs text-zinc-400">← Back</button>

      <PageHeader
        title="💤 Training Chamber"
        tagline={`Idle XP + gold while away · caps at ${MAX_ACCRUAL_HOURS}h`}
        glow="#a78bfa"
      />

      <div className="rounded-lg border-2 p-4 text-center"
        style={{ borderColor: trainingHero ? '#22d3ee' : '#3f3f46', background: trainingHero ? '#0d1e21' : '#18181b' }}
      >
        {!trainingHero ? (
          <>
            <div className="text-5xl mb-2 opacity-30">💤</div>
            <div className="text-xs text-zinc-500 mb-3">Empty chamber</div>
            <button className="btn-pixel primary" disabled={heroes.length === 0} onClick={() => setPicker(true)}>
              {heroes.length === 0 ? 'No heroes owned' : 'Place a hero'}
            </button>
          </>
        ) : (
          <>
            {(() => {
              const tpl = HERO_BY_ID[trainingHero.templateId];
              return (
                <>
                  <div className="relative mx-auto w-24 h-24 mb-2">
                    {HERO_PORTRAITS[tpl.id] ? (
                      <StaticSprite src={HERO_PORTRAITS[tpl.id]} size={96} />
                    ) : (
                      <div className="text-5xl">{tpl.emoji}</div>
                    )}
                    {/* Z-letters wafting up */}
                    <div className="absolute -top-2 right-0 text-xs text-cyan-300 animate-pulse">💤</div>
                  </div>
                  <div className="font-pixel text-sm" style={{ color: tpl.color }}>{tpl.name}</div>
                  <div className="text-[10px] font-pixel" style={{ color: tierColor(trainingHero.star) }}>
                    {tierLabel(trainingHero.star)} · LVL:{trainingHero.level}
                  </div>
                </>
              );
            })()}
            <div className="mt-3 text-[11px] text-zinc-300">
              Training for <span className="font-pixel text-cyan-300">{formatDuration(cappedMs)}</span>
              {atCap && <span className="text-amber-400 ml-1">(at cap)</span>}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
              <div className="rounded bg-zinc-950 p-2 border border-zinc-800">
                <div className="text-zinc-500 text-[9px]">XP earned</div>
                <div className="font-pixel text-amber-400">{accruedXp.toLocaleString()}</div>
              </div>
              <div className="rounded bg-zinc-950 p-2 border border-zinc-800">
                <div className="text-zinc-500 text-[9px]">Gold earned</div>
                <div className="font-pixel text-amber-400">{accruedGold.toLocaleString()}</div>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button className="btn-pixel flex-1" onClick={withdrawAndKeep}>Cancel</button>
              <button className="btn-pixel success flex-1" onClick={withdraw} disabled={minutesAccrued === 0}>
                Withdraw + Claim
              </button>
            </div>
            <div className="text-[9px] text-zinc-500 mt-2">
              Rate: {XP_PER_MINUTE} xp · {GOLD_PER_MINUTE} 🪙 per minute
            </div>
          </>
        )}
      </div>

      {picker && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end" onClick={() => setPicker(false)}>
          <div className="w-full max-w-[420px] mx-auto bg-zinc-900 border-t border-zinc-700 rounded-t-2xl p-3 max-h-[70vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="font-pixel text-xs mb-3">Pick hero to train</div>
            <div className="grid grid-cols-3 gap-2">
              {eligibleHeroes.map(h => {
                const tpl = HERO_BY_ID[h.templateId];
                if (!tpl) return null;
                const cap = effectiveMaxLevel(h.star, profile.level);
                const atLvlCap = h.level >= cap;
                return (
                  <button
                    key={h.id}
                    onClick={() => placeHero(h.id)}
                    className={`rounded border-2 p-2 bg-zinc-950 text-center ${atLvlCap ? 'opacity-40' : ''}`}
                    style={{ borderColor: tpl.color }}
                    disabled={atLvlCap}
                    title={atLvlCap ? `Maxed at ${tierLabel(h.star)} cap` : undefined}
                  >
                    <div className="aspect-square flex items-center justify-center overflow-hidden">
                      {HERO_PORTRAITS[tpl.id] ? <StaticSprite src={HERO_PORTRAITS[tpl.id]} size={56} /> : <div className="text-3xl">{tpl.emoji}</div>}
                    </div>
                    <div className="text-[10px] truncate" style={{ color: tpl.color }}>{tpl.name}</div>
                    <div className="text-[9px] text-zinc-400">LVL:{h.level}/{cap}</div>
                    {atLvlCap && <div className="text-[8px] text-amber-400">MAX</div>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
