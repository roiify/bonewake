import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../components/ui/Card';
import { SUMMON_POOLS } from '../data/summonPools';
import { HERO_BY_ID, HERO_PORTRAITS, HERO_TEMPLATES, HIDDEN_HERO_IDS } from '../data/heroes';
import { pullOnce, pullTen } from '../lib/summon';
import { useProfile } from '../store/profile';
import { useHeroes } from '../store/heroes';
import { useItems } from '../store/items';
import { db } from '../lib/db';
import { incrementTask } from '../lib/tasks';
import type { HeroTemplate, Rarity, SummonPool } from '../types';
import { uid } from '../lib/id';
import { addFragments, DUP_FRAGMENT_VALUE, MAX_STAR } from '../lib/fragments';
import { sfx, haptic } from '../lib/sfx';
import { recordEvent } from '../lib/lifetime';
import { tierLabel, tierColor } from '../lib/tier';
import { HeroBadges } from '../components/ui/HeroBadges';
import { genLoot } from '../lib/loot';
import { GEMS, GEM_TIER_NAME, GEM_TIER_COLOR } from '../data/gems';
import { addGemToInventory } from '../lib/gems';
import { addMaterial } from '../lib/crafting';
import { MAT_SOULSHARD, MAT_SCRAP, MAT_ARCANE_DUST, MAT_RELIC_SHARD, MATERIAL_META, essenceItemId } from '../data/ultimateGear';
import { useHeroes as useHeroesStore } from '../store/heroes';

// Generic reveal item — every pool kind boils down to one of these so
// the capsule + reveal grid stays uniform.
type RevealItem =
  | { kind: 'hero'; hero: HeroTemplate; rarity: Rarity; star: number; isDup: boolean; fragCount: number; promotedTo?: number }
  | { kind: 'equipment'; name: string; emoji: string; rarity: number; color: string; sub: string }
  | { kind: 'socket'; name: string; emoji: string; tier: number; color: string; sub: string }
  | { kind: 'material'; name: string; emoji: string; color: string; sub: string };

function rarityGlow(star: number) {
  return star >= 5 ? '#f59e0b' : star >= 4 ? '#a855f7' : '#a1a1aa';
}

// Pick the "best" item in a reveal to color the spinning capsule.
function capsuleGlow(items: RevealItem[]): string {
  // Prefer hero star → equipment rarity → socket tier → fallback
  let best = '#a1a1aa';
  for (const r of items) {
    if (r.kind === 'hero') {
      const c = rarityGlow(r.star);
      if (r.star >= 5) return c;
      if (r.star >= 4) best = c;
    } else if (r.kind === 'equipment') {
      if (r.rarity >= 5) return '#f59e0b';
      if (r.rarity >= 4) best = '#a855f7';
    } else if (r.kind === 'socket') {
      if (r.tier >= 4) return '#f59e0b';
      if (r.tier >= 3) best = '#a855f7';
    }
  }
  return best;
}

const RARITY_COLOR: Record<number, string> = {
  1: '#9ca3af', 2: '#22c55e', 3: '#3b82f6', 4: '#a855f7', 5: '#f59e0b', 6: '#fb7185',
};
const RARITY_NAME: Record<number, string> = {
  1: 'Common', 2: 'Uncommon', 3: 'Rare', 4: 'Epic', 5: 'Legendary', 6: 'Mythic',
};
const SLOT_EMOJI: Record<string, string> = {
  weapon: '⚔️', armor: '🦺', helm: '🪖', boots: '🥾', accessory: '💎',
};
function formatStatVal(stat: string, v: number): string {
  if (stat === 'crit') return `${(v * 100).toFixed(1)}%`;
  return String(Math.round(v));
}

// Pool-kind glyph shown when the pool has no featured-hero banner.
const KIND_BADGE: Record<string, { glyph: string; tint: string }> = {
  hero:       { glyph: '✨', tint: '#fbbf24' },
  equipment:  { glyph: '⚔️', tint: '#a78bfa' },
  socket:     { glyph: '💎', tint: '#f472b6' },
  material:   { glyph: '💠', tint: '#38bdf8' },
};

export default function SummonPage() {
  const profile = useProfile(s => s.profile);
  const patch = useProfile(s => s.patch);
  const addHero = useHeroes(s => s.addHero);
  const updateHero = useHeroes(s => s.updateHero);
  const heroes = useHeroes(s => s.heroes);
  const refreshItems = useItems(s => s.refresh);
  const [reveal, setReveal] = useState<RevealItem[] | null>(null);
  const [stage, setStage] = useState<'capsule' | 'reveal'>('capsule');

  async function doPull(pool: SummonPool, count: 1 | 10) {
    // 10-pull is true 10× cost (no bulk discount — matches the "tenX" label).
    const cost = pool.cost.amount * count;
    let ok = false;
    if (pool.cost.currency === 'gold') ok = await useProfile.getState().spendGold(cost);
    if (pool.cost.currency === 'gems') ok = await useProfile.getState().spendGems(cost);
    if (pool.cost.currency === 'friendPoints') ok = await useProfile.getState().spendFriendPoints(cost);
    if (!ok) { alert(`Not enough ${pool.cost.currency}`); return; }

    const kind = pool.kind ?? 'hero';
    let enriched: RevealItem[] = [];

    if (kind === 'hero') {
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

      // First-time templateId → add hero at its pulled star.
      // Duplicate → fragments, AND if the pull's tier is higher than the hero
      // you own, promote that hero ONE star toward it (e.g. an SSS dup bumps a
      // 3★ hero to 4★, not straight to 5★). This keeps high pulls meaningful
      // once your roster is complete without trivializing the fragment star-up
      // grind — going 3★→5★ still needs multiple high-tier pulls of that hero.
      const grantedThisPull = new Set<string>();
      // Effective star per template within this pull, so repeated dupes promote
      // progressively instead of every result reading the stale render snapshot.
      const liveStar = new Map<string, number>();
      for (const h of heroes) liveStar.set(h.templateId, h.star);
      for (const r of results) {
        const existing = heroes.find(h => h.templateId === r.hero.id);
        const alreadyOwned = !!existing || grantedThisPull.has(r.hero.id);
        const fragCount = DUP_FRAGMENT_VALUE[Math.min(5, Math.max(3, r.star)) as Rarity];
        let promotedTo: number | undefined;

        if (alreadyOwned) {
          await addFragments(r.hero.id, fragCount);
          if (existing) {
            const cur = liveStar.get(r.hero.id) ?? existing.star;
            if (r.star > cur && cur < MAX_STAR) {
              const next = Math.min(cur + 1, r.star, MAX_STAR);
              await updateHero(existing.id, { star: next });
              liveStar.set(r.hero.id, next);
              promotedTo = next;
            }
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
          liveStar.set(r.hero.id, r.star);
        }
        await db.pullLogs.add({ poolId: pool.id, heroTemplateId: r.hero.id, pulledAt: Date.now() });
        enriched.push({ kind: 'hero', hero: r.hero, rarity: r.rarity, star: r.star, isDup: alreadyOwned, fragCount, promotedTo });
      }
      for (const r of enriched) {
        if (r.kind === 'hero') await recordEvent({ kind: 'summon', landedSSS: r.star >= 5 });
      }
    } else if (kind === 'equipment') {
      const ilvl = pool.equipmentItemLevel ?? 50;
      const minR = (pool.equipmentMinRarity ?? 3) as 1 | 2 | 3 | 4 | 5;
      for (let i = 0; i < count; i++) {
        const eq = genLoot({ itemLevel: ilvl, minRarity: minR, luckBoost: 0.05 });
        await useHeroesStore.getState().addEquipment(eq);
        const rarityColor = RARITY_COLOR[eq.rarity ?? 1] ?? '#a3a3a3';
        const primary = eq.primary
          ? `${eq.primary.stat.toUpperCase()} ${formatStatVal(eq.primary.stat, eq.primary.value)}`
          : '';
        enriched.push({
          kind: 'equipment',
          name: eq.name ?? 'Unknown',
          emoji: SLOT_EMOJI[eq.slot ?? ''] ?? '⚒️',
          rarity: eq.rarity ?? 1,
          color: rarityColor,
          sub: primary,
        });
      }
    } else if (kind === 'socket') {
      const maxTier = pool.socketMaxTier ?? 3;
      const pool_gems = GEMS.filter(g => g.tier <= maxTier);
      for (let i = 0; i < count; i++) {
        // Higher tiers get progressively rarer using simple inverse weights
        const weights = pool_gems.map(g => Math.pow(0.4, g.tier - 1));
        const total = weights.reduce((s, w) => s + w, 0);
        let r = Math.random() * total;
        let picked = pool_gems[0];
        for (let j = 0; j < pool_gems.length; j++) {
          r -= weights[j];
          if (r <= 0) { picked = pool_gems[j]; break; }
        }
        await addGemToInventory(picked.id, 1);
        enriched.push({
          kind: 'socket',
          name: picked.name,
          emoji: picked.emoji,
          tier: picked.tier,
          color: GEM_TIER_COLOR[picked.tier],
          sub: `${picked.stat.toUpperCase()} +${picked.stat === 'crit' ? `${(picked.value * 100).toFixed(0)}%` : picked.value}`,
        });
      }
    } else if (kind === 'material') {
      const lo = pool.materialSoulshardMin ?? 5;
      const hi = pool.materialSoulshardMax ?? 15;
      const essenceChance = pool.materialEssenceChance ?? 0;
      // Forge-mat drop chances — rolled BEFORE essence so they don't compete
      // with the essence chance. Scrap 25% / Arcane Dust 10% / Relic Shard 3%.
      // Independent rolls — a pull can land both a Scrap pile AND essence.
      for (let i = 0; i < count; i++) {
        // Forge mat (independent roll)
        const matRoll = Math.random();
        if (matRoll < 0.03) {
          await addMaterial(MAT_RELIC_SHARD, 1);
          enriched.push({ kind: 'material', name: MATERIAL_META[MAT_RELIC_SHARD].name, emoji: MATERIAL_META[MAT_RELIC_SHARD].emoji, color: '#fb7185', sub: '+1' });
          continue;
        } else if (matRoll < 0.13) {
          const n = 1 + Math.floor(Math.random() * 2);
          await addMaterial(MAT_ARCANE_DUST, n);
          enriched.push({ kind: 'material', name: MATERIAL_META[MAT_ARCANE_DUST].name, emoji: MATERIAL_META[MAT_ARCANE_DUST].emoji, color: '#a855f7', sub: `+${n}` });
          continue;
        } else if (matRoll < 0.38) {
          const n = 3 + Math.floor(Math.random() * 4);
          await addMaterial(MAT_SCRAP, n);
          enriched.push({ kind: 'material', name: MATERIAL_META[MAT_SCRAP].name, emoji: MATERIAL_META[MAT_SCRAP].emoji, color: '#9ca3af', sub: `+${n}` });
          continue;
        }
        // Existing essence vs soulshard branches
        if (essenceChance > 0 && Math.random() < essenceChance) {
          const candidates = HERO_TEMPLATES.filter(h => !HIDDEN_HERO_IDS.has(h.id));
          const hero = candidates[Math.floor(Math.random() * candidates.length)];
          await addMaterial(essenceItemId(hero.id), 1);
          enriched.push({
            kind: 'material',
            name: `${hero.name} Essence`,
            emoji: '🔮',
            color: hero.color,
            sub: '+1',
          });
        } else {
          const amount = lo + Math.floor(Math.random() * (hi - lo + 1));
          await addMaterial(MAT_SOULSHARD, amount);
          enriched.push({
            kind: 'material',
            name: 'Soulshards',
            emoji: '💠',
            color: '#a78bfa',
            sub: `+${amount}`,
          });
        }
      }
    }

    await refreshItems();
    await incrementTask('daily_summon', count);

    setStage('capsule');
    setReveal(enriched);
    // Reveal sting — bigger arpeggio when the pull contains a 5★ / high-rarity.
    const gotRare = enriched.some(r =>
      (r.kind === 'hero' && r.star >= 5) ||
      (r.kind === 'equipment' && r.rarity >= 5) ||
      (r.kind === 'socket' && r.tier >= 4));
    setTimeout(() => { setStage('reveal'); sfx(gotRare ? 'reveal_rare' : 'reveal'); haptic(gotRare ? [30, 50, 30] : 15); }, 900);
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
        const kind = pool.kind ?? 'hero';
        const isHero = kind === 'hero';
        const featured = pool.featuredHeroId ? HERO_BY_ID[pool.featuredHeroId] : null;
        const currIcon = pool.cost.currency === 'gold' ? '🪙' : pool.cost.currency === 'gems' ? '💎' : '🤝';
        const isPremium = pool.id === 'premium';
        const tenX = pool.cost.amount * 10;
        const featuredPortrait = featured && HERO_PORTRAITS[featured.id];
        const sssRate = pool.rates[5] ?? 0;
        const ssRate  = pool.rates[4] ?? 0;
        const sRate   = pool.rates[3] ?? 0;
        const badge = KIND_BADGE[kind] ?? KIND_BADGE.hero;
        return (
          <Card key={pool.id} tint={featured?.color ?? (isPremium ? '#fbbf24' : badge.tint)} goldFrame={isPremium}>
            {/* Featured-hero banner — Stellar only */}
            {isPremium && featuredPortrait && (
              <div className="relative h-40 overflow-hidden"
                style={{
                  background: `radial-gradient(ellipse at center, ${featured.color}33 0%, transparent 65%), linear-gradient(180deg, #1a0807 0%, #0a0303 100%)`,
                }}
              >
                <img
                  src={featuredPortrait}
                  alt={featured.name}
                  className="absolute right-2 bottom-0 h-40 w-auto object-contain"
                  style={{
                    imageRendering: 'pixelated',
                    filter: `drop-shadow(0 4px 12px ${featured.color}88) drop-shadow(0 0 24px ${featured.color}55)`,
                  }}
                />
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
                      borderColor: badge.tint,
                      background: '#0c0a09',
                      boxShadow: `0 0 12px ${badge.tint}55 inset`,
                    }}
                  >
                    {badge.glyph}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-pixel text-xs text-zinc-100 text-shadow-soft">{pool.name}</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5 leading-snug">{pool.description}</div>
                  </div>
                </div>
              )}

              {/* Pity bar — only hero pools with pityFive set */}
              {isHero && pool.pityFive && (
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

              {/* Rate chips — heroes only */}
              {isHero && (
                <div className="grid grid-cols-3 gap-1.5 mb-3 text-[10px] font-pixel">
                  <RateChip label="SSS" pct={sssRate} color="#fbbf24" />
                  <RateChip label="SS"  pct={ssRate}  color="#a78bfa" />
                  <RateChip label="S"   pct={sRate}   color="#a3a3a3" />
                </div>
              )}

              {/* Non-hero reward hint — replaces rate chips */}
              {!isHero && (
                <div className="mb-3 text-[10px] text-zinc-400 px-1">
                  {kind === 'equipment' && `Item-Lv ${pool.equipmentItemLevel ?? 50} · ≥${RARITY_NAME[pool.equipmentMinRarity ?? 3]} guaranteed`}
                  {kind === 'socket' && `Up to ${GEM_TIER_NAME[pool.socketMaxTier ?? 3]} tier · stat is random`}
                  {kind === 'material' && `${pool.materialSoulshardMin}-${pool.materialSoulshardMax} 💠 per pull · ${Math.round((pool.materialEssenceChance ?? 0) * 100)}% essence chance`}
                </div>
              )}

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

      {/* Reveal overlay — cinematic: drifting particles + rarity-color
          radial wash + spring capsule + halo burst on SSS pulls. */}
      <AnimatePresence>
        {reveal && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 overflow-hidden"
            onClick={() => stage === 'reveal' && setReveal(null)}
            style={{
              // Radial wash tinted to the rarity glow — pulses subtly via
              // the inline animation in CSS. Lets the background tell the
              // player the tier before any card lands.
              background: `
                radial-gradient(circle at center, ${capsuleGlow(reveal)}22 0%, rgba(0,0,0,0.97) 60%),
                #000`,
            }}
          >
            {/* Drifting particle motes — pure CSS, ~20 floaters across
                the overlay so the whole screen feels alive without
                heavy assets. */}
            <div className="absolute inset-0 pointer-events-none opacity-60">
              {Array.from({ length: 24 }).map((_, k) => (
                <div
                  key={k}
                  className="absolute rounded-full"
                  style={{
                    left: `${(k * 37) % 100}%`,
                    top: `${(k * 53) % 100}%`,
                    width: 3 + (k % 3),
                    height: 3 + (k % 3),
                    background: capsuleGlow(reveal),
                    boxShadow: `0 0 8px ${capsuleGlow(reveal)}`,
                    animation: `mote-drift ${6 + (k % 5)}s ease-in-out infinite`,
                    animationDelay: `${(k * 0.3) % 4}s`,
                  }}
                />
              ))}
            </div>
            {stage === 'capsule' && (
              <motion.div
                initial={{ scale: 0.4, rotate: 0 }}
                animate={{ scale: [1, 1.15, 0.92, 1.25, 0], rotate: [0, -12, 12, -12, 0] }}
                transition={{ duration: 1.0, times: [0, 0.3, 0.55, 0.8, 1], ease: [0.4, 0, 0.2, 1] }}
                className="relative w-36 h-36 rounded-full flex items-center justify-center text-8xl"
                style={{
                  background: `radial-gradient(circle, ${capsuleGlow(reveal)}, transparent 70%)`,
                  boxShadow: `0 0 80px ${capsuleGlow(reveal)}, 0 0 160px ${capsuleGlow(reveal)}88`,
                }}
              >
                ✨
              </motion.div>
            )}
            {stage === 'reveal' && (
              <>
                <div className="font-pixel text-amber-400 text-lg mb-4">You Got!</div>
                <div className={`grid gap-2 ${reveal.length === 1 ? 'grid-cols-1' : 'grid-cols-5'}`}>
                  {reveal.map((r, i) => {
                    const itemColor = r.kind === 'hero' ? r.hero.color : r.color;
                    const itemEmoji = r.kind === 'hero' ? r.hero.emoji : r.emoji;
                    const itemName  = r.kind === 'hero' ? r.hero.name : r.name;
                    const isMax = r.kind === 'hero' ? r.star >= 5
                      : r.kind === 'equipment' ? r.rarity >= 5
                      : r.kind === 'socket' ? r.tier >= 4
                      : false;
                    // Card-flip reveal: each card waits face-down as a pulsing
                    // skull, then flips over (rotateY 90→0 spring) with a
                    // rarity-colored flare that washes out as the card lands.
                    const flipDelay = 0.15 + i * 0.12;
                    return (
                      <div key={i} className="relative" style={{ perspective: 600 }}>
                        {/* Face-down back — flips away at this card's reveal time */}
                        <motion.div
                          initial={{ rotateY: 0, opacity: 1 }}
                          animate={{ rotateY: -90, opacity: 0 }}
                          transition={{ delay: flipDelay, duration: 0.16, ease: 'easeIn' }}
                          className="absolute inset-0 z-20 rounded-md border-2 border-zinc-700 bg-zinc-950 flex items-center justify-center"
                        >
                          <span className={`animate-pulse ${reveal.length === 1 ? 'text-5xl' : 'text-2xl'}`}>💀</span>
                        </motion.div>
                      <motion.div
                        initial={{ rotateY: 90, opacity: 0 }}
                        animate={{ rotateY: 0, opacity: 1 }}
                        transition={{ delay: flipDelay + 0.12, type: 'spring', damping: 14, stiffness: 220 }}
                        className="relative rounded-md border-2 p-2 bg-zinc-900 text-center"
                        style={{
                          borderColor: itemColor,
                          boxShadow: isMax ? `0 0 18px ${itemColor}` : 'none',
                        }}
                      >
                        {/* Rarity flare — bright wash that fades as the card settles */}
                        <motion.div
                          initial={{ opacity: 0.9 }}
                          animate={{ opacity: 0 }}
                          transition={{ delay: flipDelay + 0.16, duration: 0.9, ease: 'easeOut' }}
                          className="absolute inset-0 rounded-sm pointer-events-none z-10"
                          style={{ background: `radial-gradient(circle, ${itemColor}dd 0%, transparent 72%)` }}
                        />
                        {r.kind === 'hero' && (
                          <div className="absolute top-0.5 right-0.5 z-10">
                            <HeroBadges archetype={r.hero.archetype} element={r.hero.element} size={16} />
                          </div>
                        )}
                        <div className="relative">
                          {r.kind === 'hero' && HERO_PORTRAITS[r.hero.id] ? (
                            // Painted portrait for the gacha money-moment instead of
                            // an OS emoji. Falls back to the emoji if no portrait exists.
                            <img
                              src={HERO_PORTRAITS[r.hero.id]}
                              alt={r.hero.name}
                              className={`mx-auto object-contain drop-shadow-[0_3px_6px_rgba(0,0,0,0.8)] ${reveal.length === 1 ? 'w-40 h-40' : 'w-full aspect-square'}`}
                              style={{ imageRendering: 'pixelated' }}
                            />
                          ) : (
                            <div className={`relative ${reveal.length === 1 ? 'text-6xl' : 'text-2xl'} drop-shadow-[0_2px_3px_rgba(0,0,0,0.7)]`}>{itemEmoji}</div>
                          )}
                        </div>
                        <div className="text-[9px] mt-1 truncate" style={{ color: itemColor }}>{itemName}</div>
                        {r.kind === 'hero' && (
                          <>
                            <div className="text-[9px] font-pixel" style={{ color: tierColor(r.star) }}>{tierLabel(r.star)}</div>
                            {!r.isDup
                              ? <div className="text-[8px] text-emerald-400 mt-0.5 font-pixel">NEW</div>
                              : r.promotedTo
                                ? <div className="text-[8px] mt-0.5 font-pixel" style={{ color: tierColor(r.promotedTo) }}>★ {tierLabel(r.promotedTo)} · +{r.fragCount}f</div>
                                : <div className="text-[8px] text-cyan-300 mt-0.5 font-pixel">+{r.fragCount}f</div>}
                          </>
                        )}
                        {r.kind === 'equipment' && (
                          <>
                            <div className="text-[9px] font-pixel" style={{ color: itemColor }}>{RARITY_NAME[r.rarity]}</div>
                            <div className="text-[8px] text-zinc-400 truncate mt-0.5">{r.sub}</div>
                          </>
                        )}
                        {r.kind === 'socket' && (
                          <>
                            <div className="text-[9px] font-pixel" style={{ color: itemColor }}>{GEM_TIER_NAME[r.tier as 1|2|3|4|5]}</div>
                            <div className="text-[8px] text-zinc-400 truncate mt-0.5">{r.sub}</div>
                          </>
                        )}
                        {r.kind === 'material' && (
                          <div className="text-[10px] font-pixel mt-0.5" style={{ color: itemColor }}>{r.sub}</div>
                        )}
                      </motion.div>
                      </div>
                    );
                  })}
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
