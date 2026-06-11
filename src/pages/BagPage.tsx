import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useHeroes } from '../store/heroes';
import { useProfile } from '../store/profile';
import { EQUIP_BY_ID } from '../data/equipment';
import { HERO_BY_ID } from '../data/heroes';
import { BASE_BY_ID, LOOT_RARITY_COLOR, LOOT_RARITY_NAME, type LootRarity } from '../data/loot';
import { MYTHIC_COLOR, MATERIAL_META, MAT_SCRAP, MAT_ARCANE_DUST, MAT_RELIC_SHARD, MAT_LEGENDARY_ESSENCE } from '../data/ultimateGear';
import { equipPower, equipQuality, affixTier, tierColor } from '../lib/loot';
import type { OwnedEquipment } from '../lib/db';
import { salvageEquipment, bulkSalvageRarities, upgradeCost, upgradeEquipment, upgradeSuccessChance, MAX_UPGRADE_LEVEL, salvageValue } from '../lib/equipmentMgmt';
import { itemGlowTier, glowFilter, glowClass } from '../lib/glow';
import { DEFAULT_SETTINGS, normalizeSettings } from '../lib/db';
import PageHeader from '../components/ui/PageHeader';
import MaterialIcon from '../components/ui/MaterialIcon';

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
  const profile = useProfile(s => s.profile);
  const patchProfile = useProfile(s => s.patch);
  const [filterRarity, setFilterRarity] = useState<number | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [salvageModal, setSalvageModal] = useState(false);
  // Pull persisted auto-salvage state from profile settings, falling back
  // to DEFAULT_SETTINGS (Common+Magic on, rest off).
  const settings = normalizeSettings(profile.settings);
  const autoSalvage = settings.autoSalvage ?? DEFAULT_SETTINGS.autoSalvage!;
  const [rarityChecks, setRarityChecks] = useState<Record<number, boolean>>({
    1: !!autoSalvage[1], 2: !!autoSalvage[2], 3: !!autoSalvage[3], 4: !!autoSalvage[4], 5: !!autoSalvage[5],
  });

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2200); };

  async function doSalvage(id: string) {
    if (!confirm('Salvage this item permanently?')) return;
    const r = await salvageEquipment(id);
    if (r.ok && r.granted) {
      const matStr = Object.entries(r.granted.mats)
        .map(([id, n]) => `+${n} ${MATERIAL_META[id]?.emoji ?? '?'}`).join(' ');
      showToast(`+${r.granted.gold} 🪙${r.granted.gems ? ` +${r.granted.gems} 💎` : ''}${matStr ? ' · ' + matStr : ''}`);
    }
    setSelected(null);
  }
  async function doUpgrade(id: string) {
    const r = await upgradeEquipment(id);
    if (r.ok && r.failed) showToast(`💥 Enhance failed — stayed at +${r.newLevel}`);
    else if (r.ok) showToast(`✨ +${r.newLevel} upgrade!`);
    else showToast(r.error ?? 'Failed');
  }
  async function toggleLock(id: string, locked: boolean) {
    await useHeroes.getState().updateEquipment(id, { locked });
    showToast(locked ? '🔒 Locked — protected from bulk salvage' : '🔓 Unlocked');
  }
  async function doSalvageSelected() {
    // Persist the rarity check state to profile settings so it sticks
    const newAuto = { ...autoSalvage, ...rarityChecks } as Record<number, boolean>;
    await patchProfile({ settings: { ...settings, autoSalvage: newAuto } });
    const set = new Set<number>(
      Object.entries(rarityChecks).filter(([_, on]) => on).map(([r]) => Number(r))
    );
    if (set.size === 0) { showToast('Pick at least one rarity'); return; }
    const r = await bulkSalvageRarities(set);
    const matStr = Object.entries(r.granted.mats)
      .map(([id, n]) => `${MATERIAL_META[id]?.emoji ?? '?'} +${n}`).join(' · ');
    showToast(`Salvaged ${r.count} · +${r.granted.gold} 🪙${r.granted.gems ? ` +${r.granted.gems} 💎` : ''}${matStr ? ' · ' + matStr : ''}`);
    setSalvageModal(false);
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
      <PageHeader
        title="Inventory"
        tagline={`${equipment.length} items collected · tap to inspect, salvage, or upgrade`}
        glow="#a855f7"
      />
      <div className="flex items-center justify-between">
        <h3 className="font-pixel text-[11px] text-zinc-400 uppercase tracking-widest">Filter</h3>
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

      {/* Bulk salvage + crafting hub */}
      <div className="flex gap-1.5">
        <button className="btn-pixel flex-1" onClick={() => setSalvageModal(true)}>
          Salvage
        </button>
        <Link to="/forge" className="btn-pixel primary flex-1 text-center">
          Forge
        </Link>
      </div>

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
            const power = equipPower(eq);
            const isSelected = selected === eq.id;
            return (
              <div key={eq.id}
                className="relative rounded border-2 p-2.5 cursor-pointer"
                onClick={() => setSelected(isSelected ? null : eq.id)}
                style={{
                  borderColor: color,
                  // Equipped items get a tinted background so they're obvious at a glance
                  background: equippedHero ? `${eqTpl?.color}22` : 'rgba(24, 24, 27, 0.7)',
                  boxShadow: rarity >= 4 ? `0 0 12px ${color}40` : undefined,
                }}
              >
                {equippedHero && (
                  <div
                    className="absolute -top-1.5 -right-1.5 z-10 font-pixel text-[8px] px-1.5 py-0.5 rounded text-zinc-950"
                    style={{ background: eqTpl?.color ?? '#fbbf24' }}
                  >
                    EQUIPPED · {eqTpl?.name}
                  </div>
                )}
                {eq.locked && (
                  <div
                    className="absolute -top-1.5 -left-1.5 z-10 w-5 h-5 rounded-full flex items-center justify-center text-[10px] bg-zinc-950 border-2 border-amber-500"
                    title="Locked — protected from bulk salvage"
                  >
                    🔒
                  </div>
                )}
                <div className="flex gap-3">
                {(() => {
                  // Weapon-only upgrade aura on the icon — same tier scale as
                  // in-battle hero glow (5/10/15/20). Non-weapons return 0.
                  const itier = itemGlowTier(eq);
                  return (
                    <div
                      className={`w-14 h-14 rounded bg-zinc-950 flex items-center justify-center text-3xl shrink-0 relative ${glowClass(itier)}`}
                      style={itier === 1 ? { filter: glowFilter(1) } : undefined}
                    >
                      {itemEmojiFor(eq)}
                      {equippedHero && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-zinc-950 border-2 flex items-center justify-center text-[9px] font-pixel"
                          style={{ borderColor: eqTpl?.color, color: eqTpl?.color }}>
                          ✓
                        </div>
                      )}
                    </div>
                  );
                })()}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-pixel truncate" style={{ color }}>{itemDisplayName(eq)}</div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {(() => {
                        const q = equipQuality(eq);
                        // Color the quality score like the affix tier — gold-ish for
                        // high-quality items so the eye picks them out in the bag.
                        const qColor = q >= 80 ? '#fbbf24' : q >= 60 ? '#a855f7' : q >= 40 ? '#3b82f6' : q >= 20 ? '#9ca3af' : '#52525b';
                        return <span className="text-[9px] font-pixel" style={{ color: qColor }}>Q{q}</span>;
                      })()}
                      <span className="text-[10px] text-zinc-500">⚔{power}</span>
                    </div>
                  </div>
                  <div className="text-[9px] text-zinc-500 mb-1">
                    {rarityNameFor(rarity)}
                    {eq.itemLevel && <span> · iL{eq.itemLevel}</span>}
                    {eq.isUltimateWeapon && <span className="ml-1 text-amber-400">· ★ULT</span>}
                    {eq.setRestrictedTo && <span className="ml-1 text-rose-300">· Set: {eq.setRestrictedTo}</span>}
                    {eq.boundTo && !eq.setRestrictedTo && (
                      <span className="ml-1 text-cyan-300">· {HERO_BY_ID[eq.boundTo]?.name ?? eq.boundTo}'s</span>
                    )}
                  </div>
                  {/* Show individual rolls with their quality tier so you can spot
                      a god-roll affix at a glance — classic ARPG-looter affordance. */}
                  {(eq.primary || (eq.affixes && eq.affixes.length > 0)) ? (
                    <div className="text-[10px] text-zinc-300 leading-tight space-y-0.5">
                      {eq.primary && (() => {
                        const t = affixTier(eq.primary.q);
                        const tc = tierColor(t);
                        return (
                          <div className="flex items-center gap-1.5">
                            <span className="font-pixel text-[9px] px-1 rounded" style={{ background: `${tc}33`, color: tc, border: `1px solid ${tc}55` }}>T{t}</span>
                            <span>{statLabel(eq.primary.stat, eq.primary.value)}</span>
                          </div>
                        );
                      })()}
                      {eq.affixes && eq.affixes.map((a, i) => {
                        const t = affixTier(a.q);
                        const tc = tierColor(t);
                        return (
                          <div key={i} className="flex items-center gap-1.5">
                            <span className="font-pixel text-[9px] px-1 rounded" style={{ background: `${tc}33`, color: tc, border: `1px solid ${tc}55` }}>T{t}</span>
                            <span className="text-zinc-400">{statLabel(a.stat, a.value)}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : eq.templateId ? (
                    <div className="text-[10px] text-zinc-400">
                      {Object.entries(EQUIP_BY_ID[eq.templateId]?.stats ?? {}).map(([k, v]) => `${k.toUpperCase()}+${v}`).join(' · ')}
                    </div>
                  ) : null}
                  {(eq.upgradeLevel ?? 0) > 0 && (
                    <div className="text-[10px] text-amber-400 font-pixel mt-0.5">+{eq.upgradeLevel}</div>
                  )}
                  {eq.equippedTo && (() => {
                    const h = heroes.find(x => x.id === eq.equippedTo);
                    const name = h ? (HERO_BY_ID[h.templateId]?.name ?? h.templateId) : 'a hero';
                    return <div className="text-[10px] text-emerald-400 mt-0.5">Equipped to {name}</div>;
                  })()}
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
                      {(eq.upgradeLevel ?? 0) >= MAX_UPGRADE_LEVEL ? 'Maxed' : (() => {
                        const c = upgradeCost(eq);
                        const pct = Math.round(upgradeSuccessChance(eq.upgradeLevel ?? 0) * 100);
                        return `Upgrade ${pct}% · ${c.gold}🪙${c.gems ? ` ${c.gems}💎` : ''}`;
                      })()}
                    </button>
                  )}
                  {!eq.equippedTo && !eq.craftedPieceId && (
                    <>
                      <button
                        className={`btn-pixel ${eq.locked ? 'primary' : ''} min-w-[44px]`}
                        onClick={() => toggleLock(eq.id, !eq.locked)}
                        title={eq.locked ? 'Unlock — allow bulk salvage' : 'Lock — protect from bulk salvage'}
                      >
                        {eq.locked ? '🔒' : '🔓'}
                      </button>
                      <button
                        className="btn-pixel danger flex-1 min-w-[100px]"
                        onClick={() => doSalvage(eq.id)}
                      >
                        {(() => { const v = salvageValue(eq); return `Salvage +${v.gold}🪙${v.gems ? ` +${v.gems}💎` : ''}`; })()}
                      </button>
                    </>
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

      {/* Salvage modal — pick which rarities to scrap. Choice persists
          in profile.settings.autoSalvage so the modal re-opens with
          the same boxes checked. Mat preview comes from salvageValue()
          so the player sees what they'd get before committing. */}
      {salvageModal && (() => {
        const ratityRows: Array<{ r: LootRarity; label: string; color: string }> = [
          { r: 1, label: 'Common',    color: LOOT_RARITY_COLOR[1] },
          { r: 2, label: 'Magic',     color: LOOT_RARITY_COLOR[2] },
          { r: 3, label: 'Rare',      color: LOOT_RARITY_COLOR[3] },
          { r: 4, label: 'Epic',      color: LOOT_RARITY_COLOR[4] },
          { r: 5, label: 'Legendary', color: LOOT_RARITY_COLOR[5] },
        ];
        const selectedCount = equipment.filter(e =>
          !e.equippedTo && !e.craftedPieceId && !e.locked && rarityChecks[(e.rarity ?? 1) as number]
        ).length;
        // Mat preview: average mat per piece × selected count
        const matPreview: Record<string, number> = {};
        for (const eq of equipment) {
          const r = (eq.rarity ?? 1) as number;
          if (e_OK(eq) && rarityChecks[r]) {
            // Use the canonical drop curve (mid-range estimate, not random)
            if (r === 1) matPreview[MAT_SCRAP] = (matPreview[MAT_SCRAP] ?? 0) + 2;
            else if (r === 2) matPreview[MAT_SCRAP] = (matPreview[MAT_SCRAP] ?? 0) + 3;
            else if (r === 3) {
              matPreview[MAT_SCRAP] = (matPreview[MAT_SCRAP] ?? 0) + 2;
              matPreview[MAT_ARCANE_DUST] = (matPreview[MAT_ARCANE_DUST] ?? 0) + 1;
            } else if (r === 4) {
              matPreview[MAT_ARCANE_DUST] = (matPreview[MAT_ARCANE_DUST] ?? 0) + 2;
              matPreview[MAT_RELIC_SHARD] = (matPreview[MAT_RELIC_SHARD] ?? 0) + 1;
            } else if (r === 5) {
              matPreview[MAT_RELIC_SHARD] = (matPreview[MAT_RELIC_SHARD] ?? 0) + 1;
              matPreview[MAT_LEGENDARY_ESSENCE] = (matPreview[MAT_LEGENDARY_ESSENCE] ?? 0) + 1;
            }
          }
        }
        return (
          <div className="fixed inset-0 z-50 bg-black/85 flex items-end pb-[72px]" onClick={() => setSalvageModal(false)}>
            <div className="w-full max-w-[420px] mx-auto bg-zinc-900 border-t-2 border-amber-700 rounded-t-2xl p-3 max-h-[calc(85vh-72px)] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="font-pixel text-sm text-amber-300 mb-2">Salvage Equipment</div>
              <div className="text-[10px] text-zinc-400 mb-2">
                Pick which rarities to scrap. Choices persist between sessions.
              </div>
              <div className="text-[10px] text-emerald-400 mb-3 flex flex-wrap gap-x-3 gap-y-1">
                <span>✓ Equipped items skipped</span>
                <span>✓ Mythic gear protected</span>
                <span>✓ 🔒 Locked items protected</span>
              </div>
              <div className="space-y-1.5 mb-3">
                {ratityRows.map(({ r, label, color }) => {
                  const count = equipment.filter(eq => !eq.equippedTo && !eq.craftedPieceId && !eq.locked && ((eq.rarity ?? 1) as number) === r).length;
                  return (
                    <label key={r}
                      className={`flex items-center gap-2 rounded border-2 px-2 py-1.5 cursor-pointer transition-opacity ${rarityChecks[r] ? '' : 'opacity-50'}`}
                      style={{ borderColor: color, background: rarityChecks[r] ? `${color}15` : 'transparent' }}
                    >
                      <input
                        type="checkbox"
                        checked={!!rarityChecks[r]}
                        onChange={e => setRarityChecks({ ...rarityChecks, [r]: e.target.checked })}
                        className="w-4 h-4 accent-amber-500"
                      />
                      <span className="font-pixel text-xs flex-1" style={{ color }}>{label}</span>
                      <span className="text-[10px] text-zinc-400">{count} items</span>
                    </label>
                  );
                })}
              </div>
              {selectedCount > 0 && Object.keys(matPreview).length > 0 && (
                <div className="rounded bg-zinc-950 border border-zinc-800 p-2 mb-3">
                  <div className="text-[10px] text-zinc-500 mb-1">~ Expected mats:</div>
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    {Object.entries(matPreview).map(([id, n]) => (
                      <span key={id} className="font-pixel text-zinc-200 inline-flex items-center gap-1">
                        <MaterialIcon matId={id} size={20} /> {n}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <button className="btn-pixel flex-1" onClick={() => setSalvageModal(false)}>Cancel</button>
                <button
                  className="btn-pixel danger flex-1"
                  disabled={selectedCount === 0}
                  onClick={doSalvageSelected}
                >
                  Salvage {selectedCount} item{selectedCount === 1 ? '' : 's'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {toast && (
        <div className="fixed bottom-20 left-0 right-0 max-w-[420px] mx-auto px-3 z-50">
          <div className="rounded-md border border-emerald-700 bg-emerald-900/80 text-emerald-100 text-[11px] font-pixel p-2 text-center">{toast}</div>
        </div>
      )}
    </div>
  );
}

// Helper used inside the salvage modal closure
function e_OK(eq: OwnedEquipment): boolean {
  return !eq.equippedTo && !eq.craftedPieceId && !eq.locked;
}
