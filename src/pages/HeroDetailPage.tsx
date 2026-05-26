import { useParams, useNavigate, Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useHeroes } from '../store/heroes';
import { useProfile } from '../store/profile';
import { HERO_BY_ID, HERO_PORTRAITS } from '../data/heroes';
import { SKILL_BY_ID } from '../data/skills';
import { EQUIP_BY_ID } from '../data/equipment';
import { BASE_BY_ID, LOOT_RARITY_COLOR, LOOT_RARITY_NAME, type LootRarity } from '../data/loot';
import { equipPower, equipQuality, affixTier, tierColor as affixTierColor } from '../lib/loot';
import { db, type OwnedEquipment } from '../lib/db';
import { MYTHIC_COLOR, SET_BY_HERO } from '../data/ultimateGear';
import { GEMS, GEM_BY_ID, GEM_TIER_COLOR, ULT_GEM_BY_HERO, gemInventoryKey } from '../data/gems';
import { addGemToInventory, getGemInventoryMap, removeGemFromInventory, socketGem, unsocketGem, socketUltGem, unsocketUltGem, socketsAvailableFor, hasUltSocket, ensureSockets, transferSockets } from '../lib/gems';
import { calcHeroStats, goldToLevelUp, effectiveMaxLevel, promotionLevelThreshold, xpForLevel } from '../lib/stats';
import type { EquipSlot } from '../types';
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
  const playerLevel = useProfile(s => s.profile.level);
  const items = useItems(s => s.items);
  const refreshItems = useItems(s => s.refresh);
  const [equipSlot, setEquipSlot] = useState<EquipSlot | null>(null);
  // Socket target now references an equipment id + either a normal slot
  // index or the dedicated ult socket. Gems live on the gear again.
  const [socketTarget, setSocketTarget] = useState<{ equipmentId: string; slotIndex: number } | { equipmentId: string; ult: true } | null>(null);

  const hero = heroes.find(h => h.id === id);
  if (!hero) return <div className="p-6 text-center text-zinc-500">Hero not found. <Link className="text-amber-400 underline" to="/heroes">Back</Link></div>;
  const tpl = HERO_BY_ID[hero.templateId];
  const stats = useMemo(() => calcHeroStats(hero, equipment), [hero, equipment]);
  const ult = SKILL_BY_ID[tpl.ultimateId];
  const maxLevel = effectiveMaxLevel(hero.star, playerLevel);
  const promotionGate = promotionLevelThreshold(hero.star);
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
  // Promotion is gated by the legacy "star × 10" threshold so players don't
  // have to grind a hero to player level just to promote — the per-star cap
  // for leveling itself is much higher (see effectiveMaxLevel).
  const canStarUp = hero.star < MAX_STAR && starUpCost !== null && fragOwned >= starUpCost && hero.level >= promotionGate;

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
    const oldEq = current ? equipment.find(e => e.id === current) : undefined;
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

    // Auto-transfer sockets from the old piece (if any) to the new one
    // so gems follow the hero across upgrades. Anything that doesn't fit
    // (fewer sockets, no ult socket on new piece) returns to inventory.
    if (oldEq && eq) {
      const { newPatch, oldPatch, overflowGems } = transferSockets(oldEq, eq);
      if (Object.keys(newPatch).length > 0) await updateEquipment(eqId, newPatch);
      if (Object.keys(oldPatch).length > 0) await updateEquipment(oldEq.id, oldPatch);
      for (const gid of overflowGems) await addGemToInventory(gid, 1);
      if (overflowGems.length > 0) await refreshItems();
    }
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

  // Auto-equip: pick the highest-power item for each slot from EVERY item
  // in the inventory. If the best piece is currently equipped to another
  // hero, transfer it (strip it from the previous owner's equipped map
  // so two heroes never list the same item). Set-restricted Mythic
  // pieces are filtered out unless their setRestrictedTo === this hero.
  const autoEquip = async () => {
    const slots: EquipSlot[] = ['weapon', 'armor', 'helm', 'boots', 'accessory'];
    const newEquipped: Partial<Record<string, string>> = { ...hero.equipped };
    const itemsToReassign: { eqId: string; fromHeroId: string | null }[] = [];
    let changed = 0;
    for (const slot of slots) {
      const candidates = equipment.filter(eq => {
        if (itemSlot(eq) !== slot) return false;
        // Mythic set pieces are bound to a specific hero — never let
        // another hero equip them.
        if (eq.setRestrictedTo && eq.setRestrictedTo !== hero.templateId) return false;
        return true;
      });
      if (candidates.length === 0) continue;
      const best = [...candidates].sort((a, b) => equipPower(b) - equipPower(a))[0];
      const current = newEquipped[slot];
      if (current === best.id) continue;
      if (current) itemsToReassign.push({ eqId: current, fromHeroId: hero.id });
      // If best piece was equipped to ANOTHER hero, strip it from them first
      if (best.equippedTo && best.equippedTo !== hero.id) {
        const prevOwner = heroes.find(h => h.id === best.equippedTo);
        if (prevOwner) {
          const prevEquipped = { ...prevOwner.equipped };
          for (const k of Object.keys(prevEquipped)) {
            if (prevEquipped[k] === best.id) delete prevEquipped[k];
          }
          await updateHero(prevOwner.id, { equipped: prevEquipped });
        }
      }
      itemsToReassign.push({ eqId: best.id, fromHeroId: null });
      newEquipped[slot] = best.id;
      changed++;
    }
    if (changed > 0) {
      // Free old items first (set them to unequipped)
      for (const { eqId } of itemsToReassign.filter(x => x.fromHeroId)) {
        await updateEquipment(eqId, { equippedTo: null });
      }
      // Then attach new items to this hero
      for (const slot of slots) {
        const eqId = newEquipped[slot];
        if (eqId) await updateEquipment(eqId, { equippedTo: hero.id });
      }
      await updateHero(hero.id, { equipped: newEquipped });
    }

    // Auto-fill empty sockets on currently equipped items + the ult socket
    // on the ult weapon (with this hero's ult gem) from inventory.
    const gemInv = await getGemInventoryMap();
    for (const slot of slots) {
      const eqId = newEquipped[slot];
      if (!eqId) continue;
      const eq = await db.equipment.get(eqId);
      if (!eq) continue;
      const withSockets = ensureSockets(eq);
      const sockets = [...(withSockets.sockets ?? [])];
      let ult = withSockets.ultSocket ?? null;
      let mutated = false;
      // Fill normal sockets with highest-tier non-ult gems
      for (let i = 0; i < sockets.length; i++) {
        if (sockets[i]) continue;
        const primaryStat = eq.primary?.stat;
        const available = Object.entries(gemInv).filter(([gid, c]) => {
          const g = GEM_BY_ID[gid];
          if (!g || c <= 0) return false;
          if (g.heroId) return false; // ult gems go in the ult socket only
          return true;
        });
        if (available.length === 0) break;
        available.sort((a, b) => {
          const ga = GEM_BY_ID[a[0]], gb = GEM_BY_ID[b[0]];
          const aMatch = primaryStat && ga.stat === primaryStat ? 1 : 0;
          const bMatch = primaryStat && gb.stat === primaryStat ? 1 : 0;
          if (aMatch !== bMatch) return bMatch - aMatch;
          return gb.tier - ga.tier;
        });
        const [pickedId] = available[0];
        gemInv[pickedId] = (gemInv[pickedId] ?? 0) - 1;
        await removeGemFromInventory(pickedId, 1);
        sockets[i] = pickedId;
        mutated = true;
      }
      // Fill ult socket on the ult weapon with this hero's ult gem if owned
      if (hasUltSocket(withSockets) && !ult) {
        const ultGemId = `gem_ult_${hero.templateId}`;
        if ((gemInv[ultGemId] ?? 0) > 0) {
          gemInv[ultGemId] -= 1;
          await removeGemFromInventory(ultGemId, 1);
          ult = ultGemId;
          mutated = true;
        }
      }
      if (mutated) await updateEquipment(eqId, { sockets, ultSocket: ult ?? null });
    }
  };

  return (
    <div className="p-3 space-y-3">
      <button onClick={() => navigate(-1)} className="text-xs text-zinc-400 hover:text-zinc-200">← Back</button>

      {/* Portrait card */}
      <div className="rounded-lg border-2 bg-zinc-900 p-4 text-center" style={{ borderColor: tpl.color }}>
        <div className="relative aspect-square w-40 mx-auto rounded-lg flex items-center justify-center mb-2 overflow-hidden"
          style={{ background: `radial-gradient(circle, ${tpl.color}40, transparent)` }}
        >
          {HERO_PORTRAITS[tpl.id] ? (
            <img src={HERO_PORTRAITS[tpl.id]} alt={tpl.name} className="relative w-[90%] h-[90%] object-contain drop-shadow-[0_3px_5px_rgba(0,0,0,0.8)]" style={{ imageRendering: 'pixelated' }} />
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
              {hero.level < promotionGate && <span className="text-amber-400 ml-2">(reach LVL:{promotionGate} first)</span>}
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
        {/* Per-equipment sockets — gems live on the gear. The hero's ult
            weapon also has a dedicated ult-gem socket. Gems auto-transfer
            when you swap gear for a slot so the hero never "loses" them. */}
        {SLOTS.some(slot => {
          const eqId = hero.equipped[slot];
          const eq = equipment.find(e => e.id === eqId);
          return eq && (socketsAvailableFor(eq) > 0 || hasUltSocket(eq));
        }) && (
          <div className="mt-3 pt-2 border-t border-zinc-800 space-y-1.5">
            <div className="text-[10px] font-pixel text-cyan-300">SOCKETS</div>
            {SLOTS.map(slot => {
              const eqId = hero.equipped[slot];
              const eq = equipment.find(e => e.id === eqId);
              if (!eq) return null;
              const nSockets = socketsAvailableFor(eq);
              const ultSlot = hasUltSocket(eq);
              if (nSockets === 0 && !ultSlot) return null;
              const eqWithSockets = ensureSockets(eq);
              const sockets = eqWithSockets.sockets ?? [];
              const ultGemId = eqWithSockets.ultSocket ?? null;
              const ultGem = ultGemId ? GEM_BY_ID[ultGemId] : null;
              return (
                <div key={slot} className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-400 w-16 capitalize truncate">{slot}</span>
                  <div className="flex gap-1 flex-1 flex-wrap">
                    {sockets.map((gemId, i) => {
                      const gem = gemId ? GEM_BY_ID[gemId] : null;
                      return (
                        <button
                          key={i}
                          onClick={() => setSocketTarget({ equipmentId: eq.id, slotIndex: i })}
                          className="w-8 h-8 rounded border flex items-center justify-center text-xs"
                          style={{ borderColor: gem ? GEM_TIER_COLOR[gem.tier] : '#3f3f46', background: gem ? '#0c0c0e' : '#18181b' }}
                          title={gem?.name ?? 'Empty socket'}
                        >{gem ? gem.emoji : '⚪'}</button>
                      );
                    })}
                    {ultSlot && (
                      <button
                        onClick={() => setSocketTarget({ equipmentId: eq.id, ult: true })}
                        className="w-8 h-8 rounded border-2 flex items-center justify-center text-xs"
                        style={{ borderColor: ultGem ? GEM_TIER_COLOR[5] : '#a21caf', background: ultGem ? '#1a0822' : '#18181b' }}
                        title={ultGem?.name ?? `Ult gem socket (${tpl.name} only)`}
                      >{ultGem ? ultGem.emoji : '★'}</button>
                    )}
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

      {/* Socket modal — per-equipment. Handles both normal sockets and
          the dedicated ult socket on the ult weapon. */}
      {socketTarget && (() => {
        const targetEq = equipment.find(e => e.id === socketTarget.equipmentId);
        if (!targetEq) return null;
        const isUlt = 'ult' in socketTarget;
        const currentGemId = isUlt ? (targetEq.ultSocket ?? null) : (targetEq.sockets?.[socketTarget.slotIndex] ?? null);
        const heroUltGem = ULT_GEM_BY_HERO[hero.templateId];
        // Eligible gems: ult socket = just this hero's ult gem; normal
        // socket = every non-bound gem.
        const eligible = isUlt
          ? (heroUltGem ? [heroUltGem] : [])
          : GEMS;
        return (
          <div className="fixed inset-0 bg-black/80 flex items-end justify-center z-50" onClick={() => setSocketTarget(null)}>
            <div className="bg-zinc-900 w-full max-w-[420px] rounded-t-2xl border-t border-zinc-700 p-4 max-h-[70vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="font-pixel text-xs mb-3">
                {isUlt ? `Ult socket — ${tpl.name} only` : 'Socket a gem'}
              </div>
              {currentGemId && (
                <button
                  className="btn-pixel danger w-full mb-3"
                  onClick={async () => {
                    if (isUlt) await unsocketUltGem(targetEq.id, updateEquipment);
                    else await unsocketGem(targetEq.id, socketTarget.slotIndex, updateEquipment);
                    setSocketTarget(null);
                  }}
                >
                  Unsocket {GEM_BY_ID[currentGemId]?.name ?? 'gem'}
                </button>
              )}
              <div className="grid grid-cols-4 gap-2">
                {eligible.map(gem => {
                  const inv = items.find(i => i.templateId === gemInventoryKey(gem.id))?.count ?? 0;
                  if (inv <= 0) return null;
                  return (
                    <button
                      key={gem.id}
                      onClick={async () => {
                        const r = isUlt
                          ? await socketUltGem(targetEq.id, gem.id, updateEquipment)
                          : await socketGem(targetEq.id, socketTarget.slotIndex, gem.id, updateEquipment);
                        if (r.ok) setSocketTarget(null);
                        else alert(`Cannot socket: ${r.reason}`);
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
              {eligible.every(g => (items.find(i => i.templateId === gemInventoryKey(g.id))?.count ?? 0) === 0) && (
                <div className="text-xs text-zinc-500 text-center py-6">
                  {isUlt ? `Craft ${tpl.name}'s ult gem in the Craft menu to fill this socket.` : 'No gems. Win battles to find them.'}
                </div>
              )}
            </div>
          </div>
        );
      })()}
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
                  const q = equipQuality(eq);
                  const qColor = q >= 80 ? '#fbbf24' : q >= 60 ? '#a855f7' : q >= 40 ? '#3b82f6' : q >= 20 ? '#9ca3af' : '#52525b';
                  const hasRolls = !!(eq.primary || (eq.affixes && eq.affixes.length > 0));
                  return (
                    <button
                      key={eq.id}
                      onClick={() => equipItem(equipSlot, eq.id)}
                      className={`w-full text-left rounded border-2 p-2 flex items-start gap-2 transition-colors ${
                        isEquipped ? 'ring-2 ring-amber-400' : ''
                      }`}
                      style={{ borderColor: color, background: isEquipped ? '#1f1d12' : '#09090b' }}
                    >
                      <span className="text-2xl shrink-0">{itemEmoji(eq)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <div className="text-xs truncate font-pixel" style={{ color }}>{itemName(eq)}{eq.isUltimateWeapon && ' ★'}</div>
                          <span className="text-[9px] font-pixel shrink-0" style={{ color: qColor }}>Q{q}</span>
                        </div>
                        <div className="text-[9px] text-zinc-500">{itemRarityName(r)}{eq.itemLevel ? ` · iL${eq.itemLevel}` : ''} · ⚔{equipPower(eq)}</div>
                        {hasRolls ? (
                          <div className="text-[10px] mt-0.5 space-y-0.5">
                            {eq.primary && (() => {
                              const t = affixTier(eq.primary.q); const tc = affixTierColor(t);
                              return <div className="flex items-center gap-1"><span className="font-pixel text-[8px] px-1 rounded" style={{ background: `${tc}33`, color: tc, border: `1px solid ${tc}55` }}>T{t}</span><span className="text-zinc-300">{eq.primary.stat === 'crit' ? `+${(eq.primary.value*100).toFixed(1)}% crit` : `+${eq.primary.value} ${eq.primary.stat.toUpperCase()}`}</span></div>;
                            })()}
                            {(eq.affixes ?? []).map((a, i) => {
                              const t = affixTier(a.q); const tc = affixTierColor(t);
                              return <div key={i} className="flex items-center gap-1"><span className="font-pixel text-[8px] px-1 rounded" style={{ background: `${tc}33`, color: tc, border: `1px solid ${tc}55` }}>T{t}</span><span className="text-zinc-400">{a.stat === 'crit' ? `+${(a.value*100).toFixed(1)}% crit` : `+${a.value} ${a.stat.toUpperCase()}`}</span></div>;
                            })}
                          </div>
                        ) : (
                          <div className="text-[10px] text-zinc-400 mt-0.5">
                            {Object.entries(EQUIP_BY_ID[eq.templateId!]?.stats ?? {}).map(([k, v]) => `${k.toUpperCase()}+${v}`).join(' · ')}
                          </div>
                        )}
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
