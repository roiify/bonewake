import { useParams, useNavigate, Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useHeroes } from '../store/heroes';
import { useProfile } from '../store/profile';
import { HERO_BY_ID, HERO_SPRITES } from '../data/heroes';
import { StaticSprite } from '../components/SpriteAnimator';
import { SKILL_BY_ID } from '../data/skills';
import { EQUIP_BY_ID } from '../data/equipment';
import { BASE_BY_ID, LOOT_RARITY_COLOR, LOOT_RARITY_NAME, type LootRarity } from '../data/loot';
import { equipPower, equipStats } from '../lib/loot';
import type { OwnedEquipment } from '../lib/db';
import { MYTHIC_COLOR, SET_BY_HERO } from '../data/ultimateGear';
import { GEMS, GEM_BY_ID, GEM_TIER_COLOR, gemInventoryKey } from '../data/gems';
import { socketGem, unsocketGem, socketsAvailableFor, ensureSockets } from '../lib/gems';
import { calcHeroStats, goldToLevelUp, maxLevelForStar, xpForLevel } from '../lib/stats';
import type { EquipSlot } from '../types';
import { ELEMENT_AURA } from '../data/auraMap';
import { useItems } from '../store/items';
import { consumeFragments, fragmentItemId, STAR_UP_COST, MAX_STAR } from '../lib/fragments';
import { tierLabel, tierColor, nextTierLabel } from '../lib/tier';
import { MAX_ULT_LEVEL, ultLevelMultiplier, ultUpgradeCost, upgradeUltimate } from '../lib/ultLeveling';
import { ascendMythic, ascensionCost, isMythic as isMythicPiece, MAX_ASCENSION } from '../lib/mythicPlus';

const SLOTS: EquipSlot[] = ['weapon', 'armor', 'helm', 'boots', 'accessory'];

export default function HeroDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const heroes = useHeroes(s => s.heroes);
  const equipment = useHeroes(s => s.equipment);
  const updateHero = useHeroes(s => s.updateHero);
  const updateEquipment = useHeroes(s => s.updateEquipment);
  const spendGold = useProfile(s => s.spendGold);
  const items = useItems(s => s.items);
  const refreshItems = useItems(s => s.refresh);
  const [equipSlot, setEquipSlot] = useState<EquipSlot | null>(null);
  const [socketTarget, setSocketTarget] = useState<{ equipmentId: string; slotIndex: number } | null>(null);

  const hero = heroes.find(h => h.id === id);
  if (!hero) return <div className="p-6 text-center text-zinc-500">Hero not found. <Link className="text-amber-400 underline" to="/heroes">Back</Link></div>;
  const tpl = HERO_BY_ID[hero.templateId];
  const stats = useMemo(() => calcHeroStats(hero, equipment), [hero, equipment]);
  const ult = SKILL_BY_ID[tpl.ultimateId];
  const maxLevel = maxLevelForStar(hero.star);
  const canLevel = hero.level < maxLevel;
  const levelCost = goldToLevelUp(hero.level);

  const levelUp = async () => {
    if (!canLevel) return;
    const ok = await spendGold(levelCost);
    if (!ok) { alert('Not enough gold!'); return; }
    let newLevel = hero.level + 1;
    let newExp = hero.exp + xpForLevel(hero.level);
    await updateHero(hero.id, { level: newLevel, exp: newExp });
  };

  const fragOwned = items.find(i => i.templateId === fragmentItemId(hero.templateId))?.count ?? 0;
  const starUpCost = STAR_UP_COST[hero.star] ?? null;
  const canStarUp = hero.star < MAX_STAR && starUpCost !== null && fragOwned >= starUpCost && hero.level >= maxLevel;

  const starUp = async () => {
    if (!canStarUp || starUpCost === null) return;
    const ok = await consumeFragments(hero.templateId, starUpCost);
    if (!ok) { alert('Not enough fragments!'); return; }
    await refreshItems();
    await updateHero(hero.id, { star: hero.star + 1 });
  };

  const unequip = async (slot: EquipSlot) => {
    const eqId = hero.equipped[slot];
    if (!eqId) return;
    await updateEquipment(eqId, { equippedTo: null });
    const newEq = { ...hero.equipped };
    delete newEq[slot];
    await updateHero(hero.id, { equipped: newEq });
  };

  const equipItem = async (slot: EquipSlot, eqId: string) => {
    // unequip current
    const current = hero.equipped[slot];
    if (current) await updateEquipment(current, { equippedTo: null });
    // unequip from any other hero
    const eq = equipment.find(e => e.id === eqId);
    if (eq?.equippedTo) {
      const otherHero = heroes.find(h => h.id === eq.equippedTo);
      if (otherHero) {
        const oeq = { ...otherHero.equipped };
        for (const s of SLOTS) if (oeq[s] === eqId) delete oeq[s];
        await updateHero(otherHero.id, { equipped: oeq });
      }
    }
    await updateEquipment(eqId, { equippedTo: hero.id });
    await updateHero(hero.id, { equipped: { ...hero.equipped, [slot]: eqId } });
    setEquipSlot(null);
  };

  const itemSlot = (eq: OwnedEquipment): EquipSlot | null => {
    if (eq.slot) return eq.slot as EquipSlot;
    if (eq.baseType) return BASE_BY_ID[eq.baseType]?.slot ?? null;
    if (eq.templateId) return EQUIP_BY_ID[eq.templateId]?.slot ?? null;
    return null;
  };
  const itemRarity = (eq: OwnedEquipment): number => {
    if (eq.rarity) return eq.rarity;
    if (eq.templateId) return ((EQUIP_BY_ID[eq.templateId]?.rarity ?? 3) - 2);
    return 1;
  };
  const itemColor = (rarity: number): string =>
    rarity === 6 ? MYTHIC_COLOR : LOOT_RARITY_COLOR[rarity as LootRarity];
  const itemRarityName = (rarity: number): string =>
    rarity === 6 ? 'Mythic' : LOOT_RARITY_NAME[rarity as LootRarity];
  const itemEmoji = (eq: OwnedEquipment): string => {
    if (eq.emoji) return eq.emoji;
    if (eq.baseType) return BASE_BY_ID[eq.baseType]?.emoji ?? '❓';
    if (eq.templateId) return EQUIP_BY_ID[eq.templateId]?.emoji ?? '❓';
    return '❓';
  };
  const itemName = (eq: OwnedEquipment): string => {
    if (eq.name) return eq.name;
    if (eq.templateId) return EQUIP_BY_ID[eq.templateId]?.name ?? '?';
    return '?';
  };
  // A set piece restricted to another hero is hidden from this hero's pool.
  const heroCanWear = (eq: OwnedEquipment) =>
    !eq.setRestrictedTo || eq.setRestrictedTo === hero.templateId;
  const availableForSlot = (slot: EquipSlot) =>
    equipment.filter(e => itemSlot(e) === slot && heroCanWear(e));

  // Set-piece progress for THIS hero (used to surface set bonus state)
  const heroSet = SET_BY_HERO[hero.templateId];
  const equippedSetPieces = heroSet
    ? equipment.filter(e =>
        e.equippedTo === hero.id &&
        e.craftedPieceId &&
        heroSet.pieces.some(p => p.id === e.craftedPieceId)
      ).length
    : 0;

  // Auto-equip: pick the highest-power item for each slot from items that are
  // either unequipped or already equipped to THIS hero (won't steal from others).
  const autoEquip = async () => {
    const slots: EquipSlot[] = ['weapon', 'armor', 'helm', 'boots', 'accessory'];
    const newEquipped: Partial<Record<string, string>> = { ...hero.equipped };
    const toFree: string[] = [];
    const toAttach: string[] = [];
    let changed = 0;
    for (const slot of slots) {
      const candidates = equipment.filter(eq =>
        itemSlot(eq) === slot && (!eq.equippedTo || eq.equippedTo === hero.id)
      );
      if (candidates.length === 0) continue;
      const best = [...candidates].sort((a, b) => equipPower(b) - equipPower(a))[0];
      const current = newEquipped[slot];
      if (current === best.id) continue;
      if (current) toFree.push(current);
      toAttach.push(best.id);
      newEquipped[slot] = best.id;
      changed++;
    }
    if (changed === 0) return;
    for (const eqId of toFree) await updateEquipment(eqId, { equippedTo: null });
    for (const eqId of toAttach) await updateEquipment(eqId, { equippedTo: hero.id });
    await updateHero(hero.id, { equipped: newEquipped });
  };

  return (
    <div className="p-3 space-y-3">
      <button onClick={() => navigate(-1)} className="text-xs text-zinc-400 hover:text-zinc-200">← Back</button>

      {/* Portrait card */}
      <div className="rounded-lg border-2 bg-zinc-900 p-4 text-center" style={{ borderColor: tpl.color }}>
        <div className="relative aspect-square w-40 mx-auto rounded-lg flex items-center justify-center mb-2 overflow-hidden"
          style={{ background: `radial-gradient(circle, ${tpl.color}40, transparent)` }}
        >
          <img src={ELEMENT_AURA[tpl.element]} alt="" className="absolute inset-0 w-full h-full object-contain opacity-50 mix-blend-screen animate-pulse-slow pointer-events-none" />
          {HERO_SPRITES[tpl.id] ? (
            <StaticSprite src={HERO_SPRITES[tpl.id].idle} size={150} className="relative drop-shadow-[0_3px_5px_rgba(0,0,0,0.8)]" />
          ) : (
            <div className="relative text-6xl drop-shadow-[0_3px_5px_rgba(0,0,0,0.8)]">{tpl.emoji}</div>
          )}
        </div>
        <div className="font-pixel text-base text-zinc-100">{tpl.name}</div>
        <div className="text-sm font-pixel" style={{ color: tierColor(hero.star) }}>{tierLabel(hero.star)}</div>
        <div className="text-[10px] text-zinc-500 italic mt-1">"{tpl.flavor}"</div>
        <div className="flex justify-center gap-2 mt-2 text-[10px]">
          <span className="px-2 py-0.5 rounded bg-zinc-800 capitalize" style={{ color: tpl.color }}>{tpl.element}</span>
          <span className="px-2 py-0.5 rounded bg-zinc-800 capitalize">{tpl.archetype}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="font-pixel text-xs">Level {hero.level} / {maxLevel}</div>
          <div className="text-[10px] text-zinc-500">Power {stats.power}</div>
        </div>
        <div className="h-1 bg-zinc-800 rounded mb-2">
          <div className="h-full bg-amber-400 rounded" style={{ width: `${Math.min(100, (hero.exp / xpForLevel(hero.level)) * 100)}%` }} />
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
          <Stat label="HP" value={stats.hp} />
          <Stat label="ATK" value={stats.atk} />
          <Stat label="DEF" value={stats.def} />
          <Stat label="SPD" value={stats.spd} />
          <Stat label="CRIT" value={`${Math.round(stats.crit * 100)}%`} />
        </div>
        <button className="btn-pixel primary w-full mt-3" disabled={!canLevel} onClick={levelUp}>
          {canLevel ? `Level Up (${levelCost} 🪙)` : `Max for ${tierLabel(hero.star)}`}
        </button>
      </div>

      {/* Star-up panel */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="font-pixel text-xs">Star Up</div>
          <div className="text-[10px] text-cyan-300">{fragOwned} 🧩 fragments</div>
        </div>
        {hero.star >= MAX_STAR || starUpCost === null ? (
          <div className="text-[10px] text-zinc-500 text-center py-2">Maxed at {tierLabel(MAX_STAR)}</div>
        ) : (
          <>
            <div className="h-1.5 bg-zinc-800 rounded mb-2 overflow-hidden">
              <div className="h-full bg-cyan-400" style={{ width: `${Math.min(100, (fragOwned / starUpCost) * 100)}%` }} />
            </div>
            <div className="text-[10px] text-zinc-500 mb-2">
              {fragOwned}/{starUpCost} fragments to <span style={{ color: tierColor(hero.star + 1) }}>{nextTierLabel(hero.star)}</span>
              {hero.level < maxLevel && <span className="text-amber-400 ml-2">(reach LVL:{maxLevel} first)</span>}
            </div>
            <button className="btn-pixel success w-full" disabled={!canStarUp} onClick={starUp}>
              {canStarUp ? `Promote to ${nextTierLabel(hero.star)}` : 'Locked'}
            </button>
          </>
        )}
      </div>

      {/* Equipment */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="font-pixel text-xs">Equipment</div>
          <button className="btn-pixel" onClick={autoEquip}>Auto Equip</button>
        </div>
        <div className="grid grid-cols-5 gap-1">
          {SLOTS.map(slot => {
            const eqId = hero.equipped[slot];
            const eq = equipment.find(e => e.id === eqId);
            const r = eq ? itemRarity(eq) : null;
            return (
              <button
                key={slot}
                onClick={() => setEquipSlot(slot)}
                className="relative aspect-square rounded border-2 bg-zinc-950 hover:border-amber-500 flex items-center justify-center text-xl"
                style={{ borderColor: r ? itemColor(r) : '#3f3f46', boxShadow: r === 6 ? `0 0 10px ${MYTHIC_COLOR}` : undefined }}
                title={slot}
              >
                {eq ? itemEmoji(eq) : <span className="text-[9px] text-zinc-600 capitalize">{slot}</span>}
                {eq?.craftedPieceId && (eq.upgradeLevel ?? 0) === 0 && (
                  <span className="absolute -top-1 -right-1 text-[8px]">⚒️</span>
                )}
                {eq?.craftedPieceId && (eq.upgradeLevel ?? 0) > 0 && (
                  <span
                    className="mythic-plus-badge absolute -top-1.5 -right-1.5 text-[8px] font-pixel bg-fuchsia-900 text-fuchsia-100 rounded px-1 py-px"
                    title={`Ascended +${eq.upgradeLevel}`}
                  >+{eq.upgradeLevel}</span>
                )}
              </button>
            );
          })}
        </div>
        <div className="text-[9px] text-zinc-500 mt-2 text-center">Auto-equip uses unequipped items only — won't steal from other heroes.</div>
        {/* Gem sockets on equipped items */}
        {SLOTS.some(slot => {
          const eqId = hero.equipped[slot];
          const eq = equipment.find(e => e.id === eqId);
          return eq && socketsAvailableFor(eq) > 0;
        }) && (
          <div className="mt-3 pt-2 border-t border-zinc-800 space-y-1.5">
            <div className="text-[10px] font-pixel text-cyan-300">SOCKETS</div>
            {SLOTS.map(slot => {
              const eqId = hero.equipped[slot];
              const eq = equipment.find(e => e.id === eqId);
              if (!eq) return null;
              const nSockets = socketsAvailableFor(eq);
              if (nSockets === 0) return null;
              const eqWithSockets = ensureSockets(eq);
              const sockets = eqWithSockets.sockets ?? [];
              return (
                <div key={slot} className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-400 w-16 capitalize truncate">{slot}</span>
                  <div className="flex gap-1 flex-1">
                    {sockets.map((gemId, i) => {
                      const gem = gemId ? GEM_BY_ID[gemId] : null;
                      return (
                        <button
                          key={i}
                          onClick={() => setSocketTarget({ equipmentId: eq.id, slotIndex: i })}
                          className="w-8 h-8 rounded border flex items-center justify-center text-xs"
                          style={{ borderColor: gem ? GEM_TIER_COLOR[gem.tier] : '#3f3f46', background: gem ? '#0c0c0e' : '#18181b' }}
                          title={gem?.name ?? 'Empty socket'}
                        >
                          {gem ? gem.emoji : '⚪'}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {heroSet && (
          <div className="mt-2 border-t border-zinc-800 pt-2">
            <div className="text-[10px] font-pixel" style={{ color: MYTHIC_COLOR }}>
              {heroSet.name} · {equippedSetPieces}/5 pieces
            </div>
            <div className="text-[9px] text-zinc-500 mt-1 space-y-0.5">
              {heroSet.bonuses.map((b, i) => (
                <div key={i} className={equippedSetPieces >= b.atPieces ? 'text-emerald-400' : ''}>
                  [{b.atPieces}-pc] {b.description}
                </div>
              ))}
            </div>
            {/* Ascension panel — only shows Mythic pieces this hero has equipped */}
            {(() => {
              const equippedMythics = SLOTS
                .map(s => hero.equipped[s])
                .map(id => equipment.find(e => e.id === id))
                .filter((e): e is OwnedEquipment => !!e && isMythicPiece(e));
              if (equippedMythics.length === 0) return null;
              return (
                <div className="mt-2 pt-2 border-t border-zinc-800 space-y-1">
                  <div className="text-[10px] font-pixel" style={{ color: MYTHIC_COLOR }}>Mythic+ Ascension</div>
                  {equippedMythics.map(eq => {
                    const lvl = eq.upgradeLevel ?? 0;
                    const cost = ascensionCost(lvl, eq.setRestrictedTo ?? '');
                    const maxed = lvl >= MAX_ASCENSION;
                    return (
                      <div key={eq.id} className="flex items-center gap-2 text-[10px]">
                        <span className="font-pixel" style={{ color: MYTHIC_COLOR }}>
                          {eq.emoji} {eq.name}{lvl > 0 && <span className="text-amber-300 ml-1">+{lvl}</span>}
                        </span>
                        <div className="flex-1" />
                        {maxed ? (
                          <span className="text-amber-300 font-pixel">MAX +{MAX_ASCENSION}</span>
                        ) : (
                          <button
                            className="btn-pixel"
                            onClick={async () => {
                              const r = await ascendMythic(eq.id);
                              if (!r.ok) alert(r.error);
                            }}
                          >
                            +1 ({cost.gold}🪙 {cost.soulshard}💠 {cost.essence}🔮)
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Ultimate */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
        <div className="font-pixel text-xs mb-1">Ultimate</div>
        <div className="text-sm text-amber-300">{ult.name}</div>
        <div className="text-[11px] text-zinc-400 mt-1">{ult.description}</div>
        {(() => {
          const ultLvl = hero.ultLevel ?? 0;
          const mult = ultLevelMultiplier(ultLvl);
          const effectiveMul = (ult.damageMultiplier * mult).toFixed(2);
          const cost = ultUpgradeCost(ultLvl);
          const atMax = ultLvl >= MAX_ULT_LEVEL;
          return (
            <>
              <div className="text-[10px] text-zinc-500 mt-1">
                ×{effectiveMul} ATK · {ult.targeting}
                {ultLvl > 0 && <span className="text-amber-400 font-pixel ml-1">+{ultLvl}</span>}
              </div>
              {!atMax && (
                <button
                  className="btn-pixel primary w-full mt-2"
                  onClick={async () => {
                    const r = await upgradeUltimate(hero.id);
                    if (!r.ok) alert(r.error);
                  }}
                >
                  Upgrade Ult Lv{ultLvl + 1}/{MAX_ULT_LEVEL} ({cost.gold}🪙{cost.soulshard ? ` ${cost.soulshard}💠` : ''})
                </button>
              )}
              {atMax && (
                <div className="text-[10px] text-amber-300 font-pixel text-center mt-2">ULT MAXED</div>
              )}
            </>
          );
        })()}
      </div>

      <Link to={`/heroes/${hero.id}/talents`} className="block rounded-md border border-rose-700 bg-rose-900/15 p-3 hover:bg-rose-900/25">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌟</span>
          <div className="flex-1">
            <div className="text-xs font-pixel text-rose-300">Passive Talents</div>
            <div className="text-[10px] text-zinc-500">
              {hero.talents?.length ?? 0} / 9 unlocked · Lvl {hero.level} grants {Math.max(0, hero.level - 10)} points
            </div>
          </div>
          <span className="text-zinc-500">→</span>
        </div>
      </Link>

      {/* Socket modal */}
      {socketTarget && (
        <div className="fixed inset-0 bg-black/80 flex items-end justify-center z-50" onClick={() => setSocketTarget(null)}>
          <div className="bg-zinc-900 w-full max-w-[420px] rounded-t-2xl border-t border-zinc-700 p-4 max-h-[70vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="font-pixel text-xs mb-3">Socket a gem</div>
            {(() => {
              const eq = equipment.find(e => e.id === socketTarget.equipmentId);
              const currentGemId = eq?.sockets?.[socketTarget.slotIndex];
              return (
                <>
                  {currentGemId && (
                    <button
                      className="btn-pixel danger w-full mb-3"
                      onClick={async () => {
                        await unsocketGem(socketTarget.equipmentId, socketTarget.slotIndex, updateEquipment);
                        setSocketTarget(null);
                      }}
                    >
                      Unsocket {GEM_BY_ID[currentGemId]?.name ?? 'gem'}
                    </button>
                  )}
                  <div className="grid grid-cols-4 gap-2">
                    {GEMS.map(gem => {
                      const inv = items.find(i => i.templateId === gemInventoryKey(gem.id))?.count ?? 0;
                      if (inv <= 0) return null;
                      return (
                        <button
                          key={gem.id}
                          onClick={async () => {
                            const ok = await socketGem(socketTarget.equipmentId, socketTarget.slotIndex, gem.id, updateEquipment);
                            if (ok) setSocketTarget(null);
                          }}
                          className="rounded border-2 p-2 bg-zinc-950 text-center"
                          style={{ borderColor: GEM_TIER_COLOR[gem.tier] }}
                        >
                          <div className="text-xl">{gem.emoji}</div>
                          <div className="text-[9px] truncate" style={{ color: GEM_TIER_COLOR[gem.tier] }}>{gem.name}</div>
                          <div className="text-[9px] text-zinc-400">x{inv}</div>
                          <div className="text-[8px] text-zinc-500">+{gem.stat === 'crit' ? `${(gem.value * 100).toFixed(1)}%` : gem.value} {gem.stat.toUpperCase()}</div>
                        </button>
                      );
                    })}
                  </div>
                  {GEMS.every(g => (items.find(i => i.templateId === gemInventoryKey(g.id))?.count ?? 0) === 0) && (
                    <div className="text-xs text-zinc-500 text-center py-6">No gems. Win battles to find them.</div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}
      {/* Equip modal */}
      {equipSlot && (
        <div className="fixed inset-0 bg-black/80 flex items-end justify-center z-50" onClick={() => setEquipSlot(null)}>
          <div className="bg-zinc-900 w-full max-w-[420px] rounded-t-2xl border-t border-zinc-700 p-4 max-h-[70vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="font-pixel text-xs mb-3 capitalize">Equip {equipSlot}</div>
            {hero.equipped[equipSlot] && (
              <button className="btn-pixel danger w-full mb-2" onClick={() => { unequip(equipSlot); setEquipSlot(null); }}>
                Unequip current
              </button>
            )}
            <div className="space-y-2">
              {availableForSlot(equipSlot)
                .sort((a, b) => equipPower(b) - equipPower(a))
                .map(eq => {
                  const isEquipped = eq.equippedTo === hero.id;
                  const r = itemRarity(eq);
                  const color = itemColor(r);
                  const stats = eq.primary || eq.affixes ? equipStats(eq) : null;
                  return (
                    <button
                      key={eq.id}
                      onClick={() => equipItem(equipSlot, eq.id)}
                      className={`w-full text-left rounded border-2 p-2 flex items-center gap-2 transition-colors ${
                        isEquipped ? 'ring-2 ring-amber-400' : ''
                      }`}
                      style={{ borderColor: color, background: isEquipped ? '#1f1d12' : '#09090b' }}
                    >
                      <span className="text-2xl">{itemEmoji(eq)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs truncate font-pixel" style={{ color }}>{itemName(eq)}{eq.isUltimateWeapon && ' ★'}</div>
                        <div className="text-[9px] text-zinc-500">{itemRarityName(r)}{eq.itemLevel ? ` · iL${eq.itemLevel}` : ''} · ⚔{equipPower(eq)}</div>
                        <div className="text-[10px] text-zinc-300 mt-0.5">
                          {stats
                            ? Object.entries(stats).map(([k, v]) =>
                                k === 'crit'
                                  ? `+${((v as number) * 100).toFixed(1)}% crit`
                                  : `+${v} ${k.toUpperCase()}`
                              ).join(' · ')
                            : Object.entries(EQUIP_BY_ID[eq.templateId!]?.stats ?? {}).map(([k, v]) => `${k.toUpperCase()}+${v}`).join(' · ')}
                        </div>
                        {eq.equippedTo && eq.equippedTo !== hero.id && (
                          <div className="text-[9px] text-rose-400">Equipped by another hero</div>
                        )}
                      </div>
                    </button>
                  );
                })}
              {availableForSlot(equipSlot).length === 0 && (
                <div className="text-xs text-zinc-500 text-center py-6">No {equipSlot} owned. Win battles to find loot!</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex justify-between border-b border-zinc-800/60 py-1">
      <span className="text-zinc-500 text-[10px] font-pixel">{label}</span>
      <span className="text-zinc-200">{typeof value === 'number' ? value.toLocaleString() : value}</span>
    </div>
  );
}
