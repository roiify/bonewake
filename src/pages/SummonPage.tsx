import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SUMMON_POOLS } from '../data/summonPools';
import { HERO_BY_ID } from '../data/heroes';
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
    <div className="p-3 space-y-3">
      <h2 className="font-pixel text-sm">Summon Heroes</h2>

      {SUMMON_POOLS.map(pool => {
        const featured = pool.featuredHeroId ? HERO_BY_ID[pool.featuredHeroId] : null;
        const currIcon = pool.cost.currency === 'gold' ? '🪙' : pool.cost.currency === 'gems' ? '💎' : '🤝';
        return (
          <div key={pool.id} className="rounded-lg border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-3">
            <div className="flex items-start gap-3 mb-3">
              <div
                className="w-16 h-16 rounded-md flex items-center justify-center text-4xl border-2"
                style={{ borderColor: featured?.color ?? '#3f3f46', background: `linear-gradient(135deg, ${featured?.color ?? '#27272a'}40, transparent)` }}
              >
                {featured?.emoji ?? '🎁'}
              </div>
              <div className="flex-1">
                <div className="font-pixel text-xs text-zinc-100">{pool.name}</div>
                <div className="text-[10px] text-zinc-400 mt-0.5">{pool.description}</div>
                {pool.pityFive && (
                  <div className="text-[10px] text-amber-400 mt-1">Pity: {profile.pityCounter}/{pool.pityFive}</div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button className="btn-pixel flex-1" onClick={() => doPull(pool, 1)}>
                Pull ×1 ({pool.cost.amount} {currIcon})
              </button>
              <button className="btn-pixel primary flex-1" onClick={() => doPull(pool, 10)}>
                Pull ×10 ({pool.cost.amount * 9} {currIcon})
              </button>
            </div>
          </div>
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
