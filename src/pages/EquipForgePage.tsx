import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useItems } from '../store/items';
import { useHeroes } from '../store/heroes';
import {
  MATERIAL_META, MAT_SCRAP, MAT_ARCANE_DUST, MAT_RELIC_SHARD, MAT_LEGENDARY_ESSENCE, MAT_GEM_DUST,
} from '../data/ultimateGear';
import { BASE_ITEMS, LOOT_RARITY_NAME, LOOT_RARITY_COLOR, type LootRarity } from '../data/loot';
import { genLoot, equipPower, equipQuality, affixTier, tierColor as affixTierColor } from '../lib/loot';
import { spendMaterial } from '../lib/crafting';
import { GEMS, GEM_TIER_NAME, GEM_TIER_COLOR, gemInventoryKey, type GemTier } from '../data/gems';
import { salvageGems, craftGem, GEM_SALVAGE_YIELD, GEM_CRAFT_COST } from '../lib/gems';
import type { EquipSlot } from '../types';
import type { LootStat } from '../data/loot';
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

  // Tabs: Equipment forge (default) | Gem forge
  const [tab, setTab] = useState<'equip' | 'gems'>('equip');

  return (
    <div className="p-3 space-y-3 pb-5">
      <button onClick={() => navigate('/bag')} className="text-xs text-zinc-400">← Bag</button>
      <PageHeader title="⚒ Forge" tagline={tab === 'equip' ? 'Spend salvage mats on a fresh piece' : 'Break gems into dust · craft a specific gem'} glow="#a78bfa" />

      {/* Tab switcher */}
      <div className="flex gap-1.5">
        <button
          onClick={() => setTab('equip')}
          className={`btn-pixel flex-1 ${tab === 'equip' ? 'primary' : ''}`}
        >
          ⚔ Equipment
        </button>
        <button
          onClick={() => setTab('gems')}
          className={`btn-pixel flex-1 ${tab === 'gems' ? 'primary' : ''}`}
        >
          💎 Gems
        </button>
      </div>

      {tab === 'gems' ? <GemForgeTab /> : (
      <>
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
      </>
      )}
    </div>
  );
}

// ============ GEM FORGE TAB ============
// Mirror of the equipment forge but for gems. Two sections:
//   - Salvage: inventory grid where each owned gem tier shows a
//     count and a "+1" / "Salvage All" button. Each salvage yields
//     GEM_SALVAGE_YIELD[tier] dust per gem.
//   - Craft: pick stat + tier, see dust+gold cost, mint a fresh gem.
function GemForgeTab() {
  const items = useItems(s => s.items);
  const [stat, setStat] = useState<LootStat>('atk');
  const [tier, setTier] = useState<GemTier>(2);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2000); };

  const dust = items.find(i => i.templateId === MAT_GEM_DUST)?.count ?? 0;
  const cost = GEM_CRAFT_COST[tier];

  async function doSalvage(gemId: string, count: number) {
    if (busy) return;
    setBusy(true);
    try {
      const r = await salvageGems(gemId, count);
      if (r.ok) showToast(`+${r.dust} 💫 Gem Dust`);
      else showToast(r.error ?? 'Failed');
    } finally { setBusy(false); }
  }

  async function doCraft() {
    if (busy) return;
    setBusy(true);
    try {
      const r = await craftGem(stat, tier);
      if (r.ok) showToast(`Crafted ${GEM_TIER_NAME[tier]} ${stat.toUpperCase()} gem`);
      else showToast(r.error ?? 'Failed');
    } finally { setBusy(false); }
  }

  // Group inventory by tier, t1-t4 only (ult gems are non-salvageable).
  const owned = (GEMS as typeof GEMS).filter(g => g.tier >= 1 && g.tier <= 4)
    .map(g => ({
      gem: g,
      count: items.find(i => i.templateId === gemInventoryKey(g.id))?.count ?? 0,
    }))
    .filter(x => x.count > 0)
    .sort((a, b) => b.gem.tier - a.gem.tier);

  const stats: LootStat[] = ['atk', 'hp', 'def', 'spd', 'crit'];
  const statLabel = (s: LootStat) => s === 'crit' ? 'CRIT' : s.toUpperCase();

  return (
    <>
      {/* Dust wallet */}
      <div className="rounded-md border border-zinc-800 bg-zinc-950 p-3">
        <div className="text-[10px] font-pixel text-zinc-400 mb-1">YOUR GEM DUST</div>
        <div className="text-2xl font-pixel text-purple-300">{MATERIAL_META[MAT_GEM_DUST].emoji} {dust}</div>
      </div>

      {/* Salvage section */}
      <div className="rounded-md border border-zinc-800 bg-zinc-950 p-3">
        <div className="text-[10px] font-pixel text-zinc-400 mb-2">SALVAGE GEMS</div>
        {owned.length === 0 ? (
          <div className="text-[10px] text-zinc-500 text-center py-3">No gems to salvage.</div>
        ) : (
          <div className="space-y-1.5">
            {owned.map(({ gem, count }) => {
              const tc = GEM_TIER_COLOR[gem.tier];
              const dustEach = GEM_SALVAGE_YIELD[gem.tier];
              return (
                <div key={gem.id}
                  className="flex items-center gap-2 rounded border-2 px-2 py-1.5"
                  style={{ borderColor: `${tc}55`, background: `${tc}10` }}
                >
                  <span className="text-xl">{gem.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-pixel truncate" style={{ color: tc }}>{gem.name}</div>
                    <div className="text-[8px] text-zinc-500">×{count} · {dustEach} 💫 each</div>
                  </div>
                  <button className="btn-pixel text-[10px] px-2 py-1" onClick={() => doSalvage(gem.id, 1)} disabled={busy}>+1</button>
                  <button className="btn-pixel danger text-[10px] px-2 py-1" onClick={() => doSalvage(gem.id, count)} disabled={busy}>All</button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Craft section */}
      <div className="rounded-md border border-zinc-800 bg-zinc-950 p-3 space-y-2">
        <div className="text-[10px] font-pixel text-zinc-400">CRAFT GEM</div>
        <div>
          <div className="text-[9px] text-zinc-500 mb-1">Stat</div>
          <div className="grid grid-cols-5 gap-1.5">
            {stats.map(s => (
              <button key={s} onClick={() => setStat(s)}
                className={`rounded border-2 py-1.5 text-[10px] font-pixel ${stat === s ? 'border-amber-400 bg-amber-950/30' : 'border-zinc-700'}`}>
                {statLabel(s)}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="text-[9px] text-zinc-500 mb-1">Tier</div>
          <div className="space-y-1.5">
            {([1, 2, 3, 4] as GemTier[]).map(t => {
              const tc = GEM_TIER_COLOR[t];
              const c = GEM_CRAFT_COST[t];
              const afford = dust >= c.dust;
              return (
                <button key={t} onClick={() => setTier(t)} disabled={!afford}
                  className={`w-full text-left rounded border-2 px-2 py-1.5 transition-opacity ${tier === t ? '' : 'opacity-60'} ${afford ? '' : 'opacity-30'}`}
                  style={{ borderColor: tc, background: tier === t ? `${tc}22` : 'transparent' }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-pixel text-xs" style={{ color: tc }}>{GEM_TIER_NAME[t]}</span>
                    <span className="text-[10px] text-zinc-300">
                      💫 {dust}/{c.dust}{c.gold > 0 ? ` · 🪙 ${c.gold.toLocaleString()}` : ''}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        <button className="btn-pixel primary w-full py-2" disabled={dust < cost.dust || busy} onClick={doCraft}>
          {busy ? 'Forging…' : `⚒ Forge ${GEM_TIER_NAME[tier]} ${statLabel(stat)} Gem`}
        </button>
      </div>

      {toast && (
        <div className="fixed bottom-20 left-0 right-0 max-w-[420px] mx-auto px-3 z-50">
          <div className="rounded-md border border-emerald-700 bg-emerald-900/80 text-emerald-100 text-[11px] font-pixel p-2 text-center">{toast}</div>
        </div>
      )}
    </>
  );
}
