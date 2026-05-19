import { useState, useMemo } from 'react';
import { useHeroes } from '../store/heroes';
import { EQUIP_BY_ID } from '../data/equipment';
import { HERO_BY_ID } from '../data/heroes';
import { BASE_BY_ID, LOOT_RARITY_COLOR, LOOT_RARITY_NAME, type LootRarity } from '../data/loot';
import { MYTHIC_COLOR } from '../data/ultimateGear';
import { equipPower, equipStats } from '../lib/loot';
import type { OwnedEquipment } from '../lib/db';
import { salvageEquipment, bulkSalvageBelow, upgradeCost, upgradeEquipment, MAX_UPGRADE_LEVEL, salvageValue } from '../lib/equipmentMgmt';

function itemDisplayName(eq: OwnedEquipment): string {
  if (eq.name) return eq.name;
  if (eq.templateId) {
    const et = EQUIP_BY_ID[eq.templateId];
    return et?.name ?? eq.templateId;
  }
  return 'Unknown';
}

function itemRarity(eq: OwnedEquipment): number {
  if (eq.rarity) return eq.rarity;
  if (eq.templateId) return ((EQUIP_BY_ID[eq.templateId]?.rarity ?? 3) - 2);
  return 1;
}
function itemEmojiFor(eq: OwnedEquipment): string {
  if (eq.emoji) return eq.emoji;
  if (eq.baseType) return BASE_BY_ID[eq.baseType]?.emoji ?? '❓';
  if (eq.templateId) return EQUIP_BY_ID[eq.templateId]?.emoji ?? '❓';
  return '❓';
}
function colorFor(rarity: number): string {
  if (rarity === 6) return MYTHIC_COLOR;
  return LOOT_RARITY_COLOR[rarity as LootRarity];
}
function rarityNameFor(rarity: number): string {
  if (rarity === 6) return 'Mythic';
  return LOOT_RARITY_NAME[rarity as LootRarity];
}

function statLabel(stat: string, value: number): string {
  if (stat === 'crit') return `+${(value * 100).toFixed(1)}% crit`;
  return `+${value} ${stat.toUpperCase()}`;
}

export default function BagPage() {
  const equipment = useHeroes(s => s.equipment);
  const heroes = useHeroes(s => s.heroes);
  const [filterRarity, setFilterRarity] = useState<number | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 1500); };

  async function doSalvage(id: string) {
    if (!confirm('Salvage this item permanently?')) return;
    const r = await salvageEquipment(id);
    if (r.ok && r.granted) showToast(`+${r.granted.gold} 🪙${r.granted.gems ? ` +${r.granted.gems} 💎` : ''}`);
    setSelected(null);
  }
  async function doUpgrade(id: string) {
    const r = await upgradeEquipment(id);
    if (r.ok) showToast('+1 upgrade');
    else showToast(r.error ?? 'Failed');
  }
  async function doBulkSalvage(maxR: number) {
    const label = ['Common','Common','Magic','Rare','Epic','Legendary'][maxR] ?? 'low';
    if (!confirm(`Salvage ALL unequipped items up to ${label}?`)) return;
    const r = await bulkSalvageBelow(maxR);
    showToast(`Salvaged ${r.count} items · +${r.granted.gold} 🪙${r.granted.gems ? ` +${r.granted.gems} 💎` : ''}`);
  }

  const sorted = useMemo(() => {
    return [...equipment]
      .filter(e => filterRarity == null || itemRarity(e) === filterRarity)
      .sort((a, b) => equipPower(b) - equipPower(a));
  }, [equipment, filterRarity]);

  const counts = useMemo(() => {
    const c: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    for (const eq of equipment) c[itemRarity(eq)] = (c[itemRarity(eq)] ?? 0) + 1;
    return c;
  }, [equipment]);

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-pixel text-sm">Inventory ({equipment.length})</h2>
        <div className="flex gap-1">
          <button
            className={`text-[10px] font-pixel px-2 py-1 rounded border ${filterRarity == null ? 'border-amber-400 bg-amber-400/20 text-amber-300' : 'border-zinc-700 text-zinc-400'}`}
            onClick={() => setFilterRarity(null)}
          >All</button>
          {([1, 2, 3, 4, 5] as const).map(r => (
            <button
              key={r}
              className={`text-[10px] font-pixel px-1.5 py-1 rounded border ${filterRarity === r ? 'bg-zinc-900' : 'opacity-50'}`}
              style={{ borderColor: LOOT_RARITY_COLOR[r], color: LOOT_RARITY_COLOR[r] }}
              onClick={() => setFilterRarity(r as any)}
            >{LOOT_RARITY_NAME[r][0]}·{counts[r] ?? 0}</button>
          ))}
          <button
            className={`text-[10px] font-pixel px-1.5 py-1 rounded border ${filterRarity === 6 ? 'bg-zinc-900' : 'opacity-50'}`}
            style={{ borderColor: MYTHIC_COLOR, color: MYTHIC_COLOR }}
            onClick={() => setFilterRarity(6 as any)}
          >M·{counts[6 as any] ?? 0}</button>
        </div>
      </div>

      {/* Bulk salvage */}
      {sorted.length > 5 && (
        <div className="flex gap-1.5">
          <button className="btn-pixel flex-1" onClick={() => doBulkSalvage(1)}>Salvage Commons</button>
          <button className="btn-pixel flex-1" onClick={() => doBulkSalvage(2)}>+ Magic</button>
          <button className="btn-pixel flex-1" onClick={() => doBulkSalvage(3)}>+ Rare</button>
        </div>
      )}

      {sorted.length === 0 ? (
        <div className="text-center text-xs text-zinc-500 py-10">
          No equipment. <br />Win battles to find loot!
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map(eq => {
            const rarity = itemRarity(eq);
            const color = colorFor(rarity);
            const equippedHero = eq.equippedTo ? heroes.find(h => h.id === eq.equippedTo) : null;
            const eqTpl = equippedHero ? HERO_BY_ID[equippedHero.templateId] : null;
            const stats = eq.primary || eq.affixes ? equipStats(eq) : null;
            const power = equipPower(eq);
            const isSelected = selected === eq.id;
            return (
              <div key={eq.id}
                className="rounded border-2 p-2.5 bg-zinc-900/70 cursor-pointer"
                onClick={() => setSelected(isSelected ? null : eq.id)}
                style={{ borderColor: color, boxShadow: rarity >= 4 ? `0 0 12px ${color}40` : undefined }}
              >
                <div className="flex gap-3">
                <div className="w-14 h-14 rounded bg-zinc-950 flex items-center justify-center text-3xl shrink-0">
                  {itemEmojiFor(eq)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-pixel truncate" style={{ color }}>{itemDisplayName(eq)}</div>
                    <div className="text-[10px] text-zinc-500 shrink-0">⚔{power}</div>
                  </div>
                  <div className="text-[9px] text-zinc-500 mb-1">
                    {rarityNameFor(rarity)}
                    {eq.itemLevel && <span> · iL{eq.itemLevel}</span>}
                    {eq.isUltimateWeapon && <span className="ml-1 text-amber-400">· ★ULT</span>}
                    {eq.setRestrictedTo && <span className="ml-1 text-rose-300">· Set: {eq.setRestrictedTo}</span>}
                    {equippedHero && <span className="ml-1" style={{ color: eqTpl?.color }}>· {eqTpl?.name}</span>}
                  </div>
                  {stats ? (
                    <div className="text-[10px] text-zinc-300 leading-tight">
                      {Object.entries(stats).map(([k, v]) => (
                        <span key={k} className="inline-block mr-2">{statLabel(k, v as number)}</span>
                      ))}
                    </div>
                  ) : eq.templateId ? (
                    <div className="text-[10px] text-zinc-400">
                      {Object.entries(EQUIP_BY_ID[eq.templateId]?.stats ?? {}).map(([k, v]) => `${k.toUpperCase()}+${v}`).join(' · ')}
                    </div>
                  ) : null}
                  {(eq.upgradeLevel ?? 0) > 0 && (
                    <div className="text-[10px] text-amber-400 font-pixel mt-0.5">+{eq.upgradeLevel}</div>
                  )}
                </div>
                </div>
              {isSelected && (
                <div className="flex gap-1.5 mt-2 pt-2 border-t border-zinc-800 flex-wrap" onClick={e => e.stopPropagation()}>
                  {!eq.craftedPieceId && (
                    <button
                      className="btn-pixel primary flex-1 min-w-[120px]"
                      disabled={(eq.upgradeLevel ?? 0) >= MAX_UPGRADE_LEVEL}
                      onClick={() => doUpgrade(eq.id)}
                    >
                      {(eq.upgradeLevel ?? 0) >= MAX_UPGRADE_LEVEL ? 'Maxed' : (() => { const c = upgradeCost(eq); return `Upgrade ${c.gold}🪙${c.gems ? ` ${c.gems}💎` : ''}`; })()}
                    </button>
                  )}
                  {!eq.equippedTo && !eq.craftedPieceId && (
                    <button
                      className="btn-pixel danger flex-1 min-w-[100px]"
                      onClick={() => doSalvage(eq.id)}
                    >
                      {(() => { const v = salvageValue(eq); return `Salvage +${v.gold}🪙${v.gems ? ` +${v.gems}💎` : ''}`; })()}
                    </button>
                  )}
                  {eq.equippedTo && (
                    <div className="text-[10px] text-zinc-500 self-center">Equipped — cannot salvage</div>
                  )}
                </div>
              )}
              </div>
            );
          })}
        </div>
      )}

      {toast && (
        <div className="fixed bottom-20 left-0 right-0 max-w-[420px] mx-auto px-3 z-50">
          <div className="rounded-md border border-emerald-700 bg-emerald-900/80 text-emerald-100 text-[11px] font-pixel p-2 text-center">{toast}</div>
        </div>
      )}
    </div>
  );
}
