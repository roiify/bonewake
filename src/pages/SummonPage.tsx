import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../components/ui/Card';
import { SUMMON_POOLS } from '../data/summonPools';
import { HERO_BY_ID, HERO_PORTRAITS } from '../data/heroes';
import { pullOnce, pullTen } from '../lib/summon';
import { useProfile } from '../store/profile';
import { useHeroes } from '../store/heroes';
import { useItems } from '../store/items';
import { db } from '../lib/db';
import { incrementTask } from '../lib/tasks';
import type { HeroTemplate, Rarity, SummonPool } from '../types';
import { uid } from '../lib/id';
import { addFragments, DUP_FRAGMENT_VALUE } from '../lib/fragments';
import { recordEvent } from '../lib/lifetime';
import { tierLabel, tierColor } from '../lib/tier';

function rarityGlow(star: number) {
  return star >= 5 ? '#f59e0b' : star >= 4 ? '#a855f7' : '#a1a1aa';
}

export default function SummonPage() {
  const profile = useProfile(s => s.profile);
  const patch = useProfile(s => s.patch);
  const addHero = useHeroes(s => s.addHero);
  const heroes = useHeroes(s => s.heroes);
  const refreshItems = useItems(s => s.refresh);
  const [reveal, setReveal] = useState<{ hero: HeroTemplate; rarity: Rarity; star: number; isDup: boolean; fragCount: number }[] | null>(null);
  const [stage, setStage] = useState<'capsule' | 'reveal'>('capsule');

  async function doPull(pool: SummonPool, count: 1 | 10) {
    const cost = pool.cost.amount * (count === 10 ? 9 : 1);
    let ok = false;
    if (pool.cost.currency === 'gold') ok = await useProfile.getState().spendGold(cost);
    if (pool.cost.currency === 'gems') ok = await useProfile.getState().spendGems(cost);
    if (pool.cost.currency === 'friendPoints') ok = await useProfile.getState().spendFriendPoints(cost);
    if (!ok) { alert(`Not enough ${pool.cost.currency}`); return; }

    let results: { hero: HeroTemplate; rarity: Rarity; star: number }[];
    let newPity = profile.pityCounter;
    if (count === 10) {
      const r = pullTen(pool.id, profile.pityCounter);
      results = r.results;
      newPity = r.pityCounterAfter;
    } else {
      const r = pullOnce(pool.id, profile.pityCounter);
      results = [{ hero: r.hero, rarity: r.rarity, star: r.star }];
      newPity = r.pityCounterAfter;
    }
    if (pool.id === 'premium') {
      await patch({ pityCounter: newPity });
    }

    // Grant heroes. Behavior:
    // - First time pulling this template → add hero at the rolled star tier
    // - Already own this template → convert to fragments. If the pulled star tier
    //   is higher than your current instance, also promote the existing one
    //   (the duplicate "merges" upward).
    const enriched: { hero: HeroTemplate; rarity: Rarity; star: number; isDup: boolean; fragCount: number }[] = [];
    const grantedThisPull = new Set<string>();
    for (const r of results) {
      const existing = heroes.find(h => h.templateId === r.hero.id);
      const alreadyOwned = !!existing || grantedThisPull.has(r.hero.id);
      // Fragment value scales with rolled tier — pulling a higher tier dup is more valuable
      const fragCount = DUP_FRAGMENT_VALUE[Math.min(5, Math.max(3, r.star)) as Rarity];

      if (alreadyOwned) {
        await addFragments(r.hero.id, fragCount);
        // Auto-promote existing hero up to the rolled star (but never lower)
        if (existing && r.star > existing.star) {
          await useHeroes.getState().updateHero(existing.id, { star: r.star });
        }
      } else {
        const newHero = {
          id: uid(),
          templateId: r.hero.id,
          level: 1,
          exp: 0,
          star: r.star,
          equipped: {},
          obtainedAt: Date.now(),
        };
        await addHero(newHero);
        grantedThisPull.add(r.hero.id);
      }
      await db.pullLogs.add({ poolId: pool.id, heroTemplateId: r.hero.id, pulledAt: Date.now() });
      enriched.push({ ...r, isDup: alreadyOwned, fragCount });
    }
    await refreshItems();
    await incrementTask('daily_summon', count);
    for (const r of enriched) {
      await recordEvent({ kind: 'summon', landedSSS: r.star >= 5 });
    }

    setStage('capsule');
    setReveal(enriched);
    setTimeout(() => setStage('reveal'), 900);
  }

  return (
    <div className="p-3 space-y-4">
      <div>
        <h2 className="font-fantasy text-2xl tracking-widest text-amber-200" style={{ textShadow: '0 2px 0 rgba(0,0,0,0.95), 0 0 14px rgba(167,139,250,0.5)' }}>Summon</h2>
        <p className="text-[10px] text-zinc-400 leading-snug mt-1">
          Pull heroes from the void · pull rates per banner shown below.
        </p>
      </div>

      {SUMMON_POOLS.map(pool => {
        const featured = pool.featuredHeroId ? HERO_BY_ID[pool.featuredHeroId] : null;
        const currIcon = pool.cost.currency === 'gold' ? '🪙' : pool.cost.currency === 'gems' ? '💎' : '🤝';
        const isPremium = pool.id === 'premium';
        const tenX = pool.cost.amount * 10; // 10-pull cost (no longer 9× — true cost shown)
        const featuredPortrait = featured && HERO_PORTRAITS[featured.id];
        // Raw fractions (0-1) — RateChip multiplies to percent itself
        const sssRate = pool.rates[5] ?? 0;
        const ssRate  = pool.rates[4] ?? 0;
        const sRate   = pool.rates[3] ?? 0;
        return (
          <Card key={pool.id} tint={featured?.color ?? (isPremium ? '#fbbf24' : undefined)} goldFrame={isPremium}>
            {/* Featured-hero hero banner (Stellar only — much bigger) */}
            {isPremium && featuredPortrait && (
              <div className="relative h-40 overflow-hidden"
                style={{
                  background: `radial-gradient(ellipse at center, ${featured.color}33 0%, transparent 65%), linear-gradient(180deg, #1a0807 0%, #0a0303 100%)`,
                }}
              >
                {/* Featured hero portrait, large + glowing */}
                <img
                  src={featuredPortrait}
                  alt={featured.name}
                  className="absolute right-2 bottom-0 h-40 w-auto object-contain"
                  style={{
                    imageRendering: 'pixelated',
                    filter: `drop-shadow(0 4px 12px ${featured.color}88) drop-shadow(0 0 24px ${featured.color}55)`,
                  }}
                />
                {/* Banner title */}
                <div className="relative z-10 p-3">
                  <div className="font-fantasy text-lg tracking-widest text-amber-200"
                    style={{ textShadow: `0 2px 0 rgba(0,0,0,0.9), 0 0 12px ${featured.color}88` }}>
                    {pool.name}
                  </div>
                  <div className="text-[10px] text-zinc-300 mt-0.5 max-w-[60%]">
                    Featured: <span style={{ color: featured.color }}>{featured.name}</span>
                  </div>
                  <div className="text-[9px] text-zinc-400 mt-1 italic max-w-[60%]">
                    "{featured.flavor}"
                  </div>
                </div>
              </div>
            )}
            <div className="p-3">
              {!isPremium && (
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className="w-14 h-14 rounded-lg flex items-center justify-center text-3xl border-2 shrink-0"
                    style={{
                      borderColor: pool.cost.currency === 'gold' ? '#fbbf24' : '#fb7185',
                      background: '#0c0a09',
                    }}
                  >
                    {currIcon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-pixel text-xs text-zinc-100 text-shadow-soft">{pool.name}</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5 leading-snug">{pool.description}</div>
                  </div>
                </div>
              )}

              {/* Pity bar — only Stellar has pity */}
              {pool.pityFive && (
                <div className="mb-3">
                  <div className="flex items-center justify-between text-[10px] font-pixel mb-1">
                    <span className="text-amber-300">SSS PITY</span>
                    <span className="text-zinc-400">{profile.pityCounter}/{pool.pityFive}</span>
                  </div>
                  <div className="h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${Math.min(100, (profile.pityCounter / pool.pityFive) * 100)}%`,
                        background: 'linear-gradient(90deg, #fbbf24, #fde68a)',
                        boxShadow: '0 0 8px rgba(251,191,36,0.55)',
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Per-pull rates — exposed so the player can compare banners */}
              <div className="grid grid-cols-3 gap-1.5 mb-3 text-[10px] font-pixel">
                <RateChip label="SSS" pct={sssRate} color="#fbbf24" />
                <RateChip label="SS"  pct={ssRate}  color="#a78bfa" />
                <RateChip label="S"   pct={sRate}   color="#a3a3a3" />
              </div>

              {/* Pull buttons */}
              <div className="flex gap-2">
                <button className="btn-pixel flex-1" onClick={() => doPull(pool, 1)}>
                  Pull ×1<br />
                  <span className="text-[9px] text-zinc-400">{pool.cost.amount} {currIcon}</span>
                </button>
                <button className="btn-pixel primary flex-1" onClick={() => doPull(pool, 10)}>
                  Pull ×10<br />
                  <span className="text-[9px]">{tenX} {currIcon}</span>
                </button>
              </div>
            </div>
          </Card>
        );
      })}

      {/* Reveal overlay */}
      <AnimatePresence>
        {reveal && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4"
            onClick={() => stage === 'reveal' && setReveal(null)}
          >
            {stage === 'capsule' && (
              <motion.div
                initial={{ scale: 0.4 }}
                animate={{ scale: [1, 1.1, 0.9, 1.2, 0], rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 0.85, times: [0, 0.3, 0.5, 0.75, 1] }}
                className="w-32 h-32 rounded-full flex items-center justify-center text-7xl"
                style={{
                  background: `radial-gradient(circle, ${rarityGlow(Math.max(...reveal.map(r => r.star)))}, transparent 70%)`,
                  boxShadow: `0 0 80px ${rarityGlow(Math.max(...reveal.map(r => r.star)))}`,
                }}
              >
                ✨
              </motion.div>
            )}
            {stage === 'reveal' && (
              <>
                <div className="font-pixel text-amber-400 text-lg mb-4">You Got!</div>
                <div className={`grid gap-2 ${reveal.length === 1 ? 'grid-cols-1' : 'grid-cols-5'}`}>
                  {reveal.map((r, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: i * 0.08, type: 'spring', stiffness: 250 }}
                      className="rounded-md border-2 p-2 bg-zinc-900 text-center"
                      style={{
                        borderColor: r.hero.color,
                        boxShadow: r.star >= 5 ? `0 0 18px ${r.hero.color}` : 'none',
                      }}
                    >
                      <div className="relative">
                        <div className={`relative ${reveal.length === 1 ? 'text-6xl' : 'text-2xl'} drop-shadow-[0_2px_3px_rgba(0,0,0,0.7)]`}>{r.hero.emoji}</div>
                      </div>
                      <div className="text-[9px] mt-1 truncate" style={{ color: r.hero.color }}>{r.hero.name}</div>
                      <div className="text-[9px] font-pixel" style={{ color: tierColor(r.star) }}>{tierLabel(r.star)}</div>
                      {r.isDup ? (
                        <div className="text-[8px] text-cyan-300 mt-0.5 font-pixel">+{r.fragCount}f</div>
                      ) : (
                        <div className="text-[8px] text-emerald-400 mt-0.5 font-pixel">NEW</div>
                      )}
                    </motion.div>
                  ))}
                </div>
                <button className="btn-pixel primary mt-6" onClick={() => setReveal(null)}>Tap to Close</button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RateChip({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div
      className="px-1.5 py-0.5 rounded text-[8px] font-pixel"
      style={{
        background: `${color}22`,
        border: `1px solid ${color}55`,
        color,
      }}
    >
      {label} {(pct * 100).toFixed(2)}%
    </div>
  );
}
