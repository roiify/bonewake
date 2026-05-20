import { useState, useMemo } from 'react';
import { useHeroes } from '../store/heroes';
import { HERO_BY_ID, HERO_SPRITES } from '../data/heroes';
import { calcHeroStats } from '../lib/stats';
import { Link } from 'react-router-dom';
import type { Rarity } from '../types';
import { ELEMENT_AURA } from '../data/auraMap';
import { StaticSprite } from '../components/SpriteAnimator';
import { tierLabel, tierColor } from '../lib/tier';
import { useItems } from '../store/items';
import { fragmentItemId, STAR_UP_COST } from '../lib/fragments';
import { maxLevelForStar } from '../lib/stats';
import { equipPower } from '../lib/loot';
import { BASE_BY_ID } from '../data/loot';
import { EQUIP_BY_ID } from '../data/equipment';
import type { OwnedEquipment } from '../lib/db';
import type { EquipSlot } from '../types';

export default function HeroesPage() {
  const heroes = useHeroes(s => s.heroes);
  const equipment = useHeroes(s => s.equipment);
  const updateHero = useHeroes(s => s.updateHero);
  const updateEquipment = useHeroes(s => s.updateEquipment);
  const items = useItems(s => s.items);
  const [filterRarity, setFilterRarity] = useState<Rarity | null>(null);
  const [autoEquipMsg, setAutoEquipMsg] = useState<string | null>(null);

  function itemSlot(eq: OwnedEquipment): EquipSlot | null {
    if (eq.baseType) return BASE_BY_ID[eq.baseType]?.slot ?? null;
    if (eq.templateId) return EQUIP_BY_ID[eq.templateId]?.slot ?? null;
    return null;
  }

  async function autoEquipAll() {
    // Strategy: clear every assignment, then redistribute in priority order.
    // Priority = highest star, then highest level (strongest heroes get first pick).
    const allHeroes = [...heroes];
    const order = [...allHeroes].sort((a, b) => b.star - a.star || b.level - a.level);
    // Unequip everything first
    for (const eq of equipment) {
      if (eq.equippedTo) await updateEquipment(eq.id, { equippedTo: null });
    }
    for (const h of allHeroes) {
      if (Object.keys(h.equipped).length > 0) await updateHero(h.id, { equipped: {} });
    }
    // Now assign from a shared pool
    const claimed = new Set<string>();
    const slots: EquipSlot[] = ['weapon', 'armor', 'helm', 'boots', 'accessory'];
    let totalEquipped = 0;
    for (const hero of order) {
      const newEquipped: Partial<Record<string, string>> = {};
      for (const slot of slots) {
        const candidates = equipment.filter(e => !claimed.has(e.id) && itemSlot(e) === slot);
        if (candidates.length === 0) continue;
        const best = [...candidates].sort((a, b) => equipPower(b) - equipPower(a))[0];
        claimed.add(best.id);
        newEquipped[slot] = best.id;
        await updateEquipment(best.id, { equippedTo: hero.id });
        totalEquipped++;
      }
      await updateHero(hero.id, { equipped: newEquipped });
    }
    setAutoEquipMsg(`Equipped ${totalEquipped} items across ${order.length} heroes`);
    setTimeout(() => setAutoEquipMsg(null), 2500);
  }

  function fragmentsFor(templateId: string): number {
    return items.find(i => i.templateId === fragmentItemId(templateId))?.count ?? 0;
  }
  function canPromote(h: typeof heroes[0]): boolean {
    const cost = STAR_UP_COST[h.star];
    if (cost == null) return false;
    if (h.level < maxLevelForStar(h.star)) return false;
    return fragmentsFor(h.templateId) >= cost;
  }

  const sorted = useMemo(() => {
    const list = heroes
      .map(h => ({ h, tpl: HERO_BY_ID[h.templateId], stats: calcHeroStats(h, equipment) }))
      .filter(x => !!x.tpl)
      .filter(x => filterRarity == null || x.h.star === filterRarity)
      .sort((a, b) => b.stats.power - a.stats.power);
    return list;
  }, [heroes, equipment, filterRarity]);

  return (
    <div className="p-3 space-y-3">
      <div
        className="relative rounded-md overflow-hidden h-20 border border-zinc-800 -mx-3 -mt-3 mb-3"
        style={{ backgroundImage: `url(${import.meta.env.BASE_URL}sprites/bg/mountain_lake.jpg)`, backgroundSize: 'cover', backgroundPosition: 'center 40%' }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent" />
        <div className="relative h-full flex items-end p-3">
          <h2 className="font-pixel text-sm text-amber-300 drop-shadow">Heroes Roster</h2>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <h2 className="font-pixel text-sm text-zinc-200">Owned ({heroes.length})</h2>
        <div className="flex gap-1">
          {[null, 3, 4, 5].map(r => (
            <button
              key={String(r)}
              className={`text-[10px] font-pixel px-2 py-1 rounded border ${
                filterRarity === r ? 'border-amber-400 bg-amber-400/20 text-amber-300' : 'border-zinc-700 text-zinc-400'
              }`}
              onClick={() => setFilterRarity(r as Rarity | null)}
            >
              {r == null ? 'All' : tierLabel(r)}
            </button>
          ))}
        </div>
      </div>

      {heroes.length > 0 && equipment.length > 0 && (
        <div className="flex items-center gap-2">
          <button className="btn-pixel" onClick={autoEquipAll}>
            ⚙️ Auto Equip All
          </button>
          <div className="text-[9px] text-zinc-500 flex-1">
            Redistributes all loot. Highest tier+level heroes pick first.
          </div>
        </div>
      )}

      {autoEquipMsg && (
        <div className="rounded-md border border-emerald-700 bg-emerald-900/30 text-emerald-300 text-[11px] font-pixel p-2 text-center">
          ✓ {autoEquipMsg}
        </div>
      )}

      {sorted.length === 0 ? (
        <div className="text-center text-zinc-500 text-xs py-12">
          {heroes.length === 0 ? (
            <>No heroes yet. <Link to="/summon" className="text-amber-400 underline">Summon some!</Link></>
          ) : 'No heroes match this filter.'}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {sorted.map(({ h, tpl, stats }) => {
            const fragCount = fragmentsFor(h.templateId);
            const promoteReady = canPromote(h);
            return (
              <Link
                key={h.id}
                to={`/heroes/${h.id}`}
                className="relative rounded-md border-2 p-2 bg-zinc-900 hover:scale-105 transition-transform"
                style={{ borderColor: tpl.color }}
              >
                {promoteReady && (
                  <div className="absolute -top-1 -right-1 z-10 bg-cyan-500 text-zinc-950 text-[8px] font-pixel px-1.5 py-0.5 rounded-full animate-pulse shadow-[0_0_8px_#22d3ee]">
                    🧩 PROMOTE
                  </div>
                )}
                <div className="relative aspect-square rounded flex items-center justify-center mb-1 overflow-hidden"
                  style={{ background: `linear-gradient(135deg, ${tpl.color}30, transparent)` }}
                >
                  <img src={ELEMENT_AURA[tpl.element]} alt="" className="absolute inset-0 w-full h-full object-contain opacity-40 mix-blend-screen pointer-events-none" />
                  {HERO_SPRITES[tpl.id] ? (
                    <StaticSprite src={HERO_SPRITES[tpl.id].idle} size={86} className="relative drop-shadow-[0_2px_3px_rgba(0,0,0,0.7)]" />
                  ) : (
                    <div className="relative text-4xl drop-shadow-[0_2px_3px_rgba(0,0,0,0.7)]">{tpl.emoji}</div>
                  )}
                </div>
                <div className="text-[10px] font-pixel text-zinc-200 truncate">{tpl.name}</div>
                <div className="flex items-center justify-between mt-0.5">
                  <div className="text-[10px] font-pixel" style={{ color: tierColor(h.star) }}>{tierLabel(h.star)}</div>
                  <div className="text-[8px] text-zinc-500">LVL:{h.level}</div>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <div className="text-[8px] text-zinc-600">⚔ {stats.power}</div>
                  {fragCount > 0 && (
                    <div className="text-[8px] text-cyan-400">🧩{fragCount}</div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
