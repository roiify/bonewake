import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useItems } from '../store/items';
import { useHeroes } from '../store/heroes';
import {
  MATERIAL_META, MAT_SCRAP, MAT_ARCANE_DUST, MAT_RELIC_SHARD, MAT_LEGENDARY_ESSENCE,
} from '../data/ultimateGear';
import { BASE_ITEMS, LOOT_RARITY_NAME, LOOT_RARITY_COLOR, type LootRarity } from '../data/loot';
import { genLoot, equipPower, equipQuality, affixTier, tierColor as affixTierColor } from '../lib/loot';
import { spendMaterial } from '../lib/crafting';
import type { EquipSlot } from '../types';
import PageHeader from '../components/ui/PageHeader';

// Material cost per craft, indexed by target rarity. Builds on the
// salvage system — high-rarity crafts demand the higher-tier mats
// that only drop from Epic+/Legendary salvages, so the player has to
// actually farm + salvage to climb the rarity ladder.
const COST_BY_RARITY: Record<LootRarity, Record<string, number>> = {
  1: { [MAT_SCRAP]: 1 },                                // throwaway
  2: { [MAT_SCRAP]: 5 },
  3: { [MAT_SCRAP]: 12, [MAT_ARCANE_DUST]: 1 },
  4: { [MAT_ARCANE_DUST]: 5, [MAT_RELIC_SHARD]: 1 },
  5: { [MAT_RELIC_SHARD]: 3, [MAT_LEGENDARY_ESSENCE]: 1 },
};

// The slot picker shows one representative emoji per slot.
const SLOT_OPTIONS: { slot: EquipSlot; name: string; emoji: string }[] = [
  { slot: 'weapon',    name: 'Weapon',    emoji: '⚔️' },
  { slot: 'armor',     name: 'Armor',     emoji: '🦺' },
  { slot: 'helm',      name: 'Helm',      emoji: '🪖' },
  { slot: 'boots',     name: 'Boots',     emoji: '🥾' },
  { slot: 'accessory', name: 'Accessory', emoji: '💎' },
];

export default function EquipForgePage() {
  const navigate = useNavigate();
  const items = useItems(s => s.items);
  const refreshItems = useItems(s => s.refresh);
  const addEquipment = useHeroes(s => s.addEquipment);
  const [slot, setSlot] = useState<EquipSlot>('weapon');
  const [rarity, setRarity] = useState<LootRarity>(3);
  const [lastCraft, setLastCraft] = useState<Awaited<ReturnType<typeof genLoot>> | null>(null);
  const [crafting, setCrafting] = useState(false);

  const have = (id: string) => items.find(i => i.templateId === id)?.count ?? 0;
  const cost = COST_BY_RARITY[rarity];
  const canAfford = Object.entries(cost).every(([m, n]) => have(m) >= n);

  async function craft() {
    if (!canAfford || crafting) return;
    setCrafting(true);
    try {
      // Spend mats
      for (const [m, n] of Object.entries(cost)) {
        const ok = await spendMaterial(m, n);
        if (!ok) { alert(`Out of ${MATERIAL_META[m]?.name}`); setCrafting(false); return; }
      }
      // Force the base item id matching the chosen slot so the player
      // gets what they asked for (genLoot would otherwise pick randomly
      // from BASE_ITEMS).
      const slotBases = BASE_ITEMS.filter(b => b.slot === slot);
      const forcedBase = slotBases[Math.floor(Math.random() * slotBases.length)];
      const eq = genLoot({
        itemLevel: 60,
        minRarity: rarity,
        forcedBaseId: forcedBase.id,
        // Lock to the chosen rarity by also setting luckBoost high enough
        // that minRarity is effectively the floor — genLoot may still
        // roll higher, which is a fun bonus.
        luckBoost: 0.5,
      });
      // genLoot uses minRarity as floor — clamp to the target so the
      // player gets at least what they paid for. Higher rolls allowed.
      if ((eq.rarity ?? 1) < rarity) eq.rarity = rarity;
      await addEquipment(eq);
      await refreshItems();
      setLastCraft(eq);
    } finally {
      setCrafting(false);
    }
  }

  return (
    <div className="p-3 space-y-3 pb-5">
      <button onClick={() => navigate('/bag')} className="text-xs text-zinc-400">← Bag</button>
      <PageHeader title="⚒ Equipment Forge" tagline="Spend salvage mats on a fresh piece" glow="#a78bfa" />

      {/* Material wallet */}
      <div className="rounded-md border border-zinc-800 bg-zinc-950 p-3">
        <div className="text-[10px] font-pixel text-zinc-400 mb-2">YOUR MATERIALS</div>
        <div className="grid grid-cols-4 gap-2">
          {[MAT_SCRAP, MAT_ARCANE_DUST, MAT_RELIC_SHARD, MAT_LEGENDARY_ESSENCE].map(m => (
            <div key={m} className="text-center">
              <div className="text-2xl">{MATERIAL_META[m]?.emoji}</div>
              <div className="text-[9px] text-zinc-500">{MATERIAL_META[m]?.name}</div>
              <div className="text-xs font-pixel text-zinc-100">{have(m)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Slot picker */}
      <div className="rounded-md border border-zinc-800 bg-zinc-950 p-3">
        <div className="text-[10px] font-pixel text-zinc-400 mb-2">SLOT</div>
        <div className="grid grid-cols-5 gap-1.5">
          {SLOT_OPTIONS.map(s => (
            <button
              key={s.slot}
              onClick={() => setSlot(s.slot)}
              className={`rounded border-2 py-2 text-center ${slot === s.slot ? 'border-amber-400 bg-amber-950/30' : 'border-zinc-700'}`}
            >
              <div className="text-xl">{s.emoji}</div>
              <div className="text-[9px] text-zinc-400">{s.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Rarity picker */}
      <div className="rounded-md border border-zinc-800 bg-zinc-950 p-3">
        <div className="text-[10px] font-pixel text-zinc-400 mb-2">TARGET RARITY</div>
        <div className="space-y-1.5">
          {([2, 3, 4, 5] as LootRarity[]).map(r => {
            const c = LOOT_RARITY_COLOR[r];
            const rcost = COST_BY_RARITY[r];
            const afford = Object.entries(rcost).every(([m, n]) => have(m) >= n);
            return (
              <button
                key={r}
                onClick={() => setRarity(r)}
                disabled={!afford}
                className={`w-full text-left rounded border-2 px-2 py-1.5 transition-opacity ${rarity === r ? '' : 'opacity-60'} ${afford ? '' : 'opacity-30'}`}
                style={{
                  borderColor: c,
                  background: rarity === r ? `${c}22` : 'transparent',
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-pixel text-xs" style={{ color: c }}>{LOOT_RARITY_NAME[r]}</span>
                  <span className="flex gap-2 text-[10px]">
                    {Object.entries(rcost).map(([m, n]) => (
                      <span key={m} className={have(m) >= n ? 'text-zinc-300' : 'text-rose-400'}>
                        {MATERIAL_META[m]?.emoji} {have(m)}/{n}
                      </span>
                    ))}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <button
        className="btn-pixel primary w-full py-3"
        disabled={!canAfford || crafting}
        onClick={craft}
      >
        {crafting ? 'Forging…' : `⚒ Forge ${LOOT_RARITY_NAME[rarity]} ${SLOT_OPTIONS.find(s => s.slot === slot)?.name}`}
      </button>

      {/* Last-crafted item preview */}
      {lastCraft && (
        <div className="rounded-md border-2 p-3 bg-zinc-950 mt-2 animate-pulse-once" style={{ borderColor: LOOT_RARITY_COLOR[(lastCraft.rarity ?? 1) as LootRarity] }}>
          <div className="text-[10px] font-pixel text-zinc-400 mb-1">JUST FORGED</div>
          <div className="flex items-start gap-2">
            <div className="text-3xl shrink-0">{(BASE_ITEMS.find(b => b.id === lastCraft.baseType)?.emoji) ?? '❓'}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="font-pixel text-xs" style={{ color: LOOT_RARITY_COLOR[(lastCraft.rarity ?? 1) as LootRarity] }}>{lastCraft.name}</div>
                <span className="text-[9px] font-pixel text-amber-300">Q{equipQuality(lastCraft)}</span>
              </div>
              <div className="text-[9px] text-zinc-500">{LOOT_RARITY_NAME[(lastCraft.rarity ?? 1) as LootRarity]} · iL{lastCraft.itemLevel} · ⚔{equipPower(lastCraft)}</div>
              <div className="mt-1 space-y-0.5 text-[10px]">
                {lastCraft.primary && (() => {
                  const t = affixTier(lastCraft.primary.q); const tc = affixTierColor(t);
                  return <div className="flex items-center gap-1.5"><span className="font-pixel text-[9px] px-1 rounded" style={{ background: `${tc}33`, color: tc, border: `1px solid ${tc}55` }}>T{t}</span><span className="text-zinc-300">{lastCraft.primary.stat === 'crit' ? `+${(lastCraft.primary.value*100).toFixed(1)}% crit` : `+${lastCraft.primary.value} ${lastCraft.primary.stat.toUpperCase()}`}</span></div>;
                })()}
                {(lastCraft.affixes ?? []).map((a, i) => {
                  const t = affixTier(a.q); const tc = affixTierColor(t);
                  return <div key={i} className="flex items-center gap-1.5"><span className="font-pixel text-[9px] px-1 rounded" style={{ background: `${tc}33`, color: tc, border: `1px solid ${tc}55` }}>T{t}</span><span className="text-zinc-400">{a.stat === 'crit' ? `+${(a.value*100).toFixed(1)}% crit` : `+${a.value} ${a.stat.toUpperCase()}`}</span></div>;
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
