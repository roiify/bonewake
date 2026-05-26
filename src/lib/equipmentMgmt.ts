import { db, type OwnedEquipment } from './db';
import { useProfile } from '../store/profile';
import { useHeroes } from '../store/heroes';
import { equipPower } from './loot';
import { MAT_SOULSHARD } from '../data/ultimateGear';
import { getMaterialCount, spendMaterial } from './crafting';
import { useItems } from '../store/items';

// Upgrade cost scales with current upgrade level and rarity
export function upgradeCost(eq: OwnedEquipment): { gold: number; gems: number } {
  const rarity = (eq.rarity ?? 1) as number;
  const lvl = eq.upgradeLevel ?? 0;
  const base = 200 * Math.pow(1.6, lvl);
  const rarityMult = rarity; // 1x..6x
  return {
    gold: Math.round(base * rarityMult),
    gems: rarity >= 4 ? Math.ceil(lvl / 3) : 0,
  };
}

export const MAX_UPGRADE_LEVEL = 10;

// === Ult Gear Enchantment ===
// Crafted Mythic ult pieces use a separate soulshard-driven enchant curve
// rather than the gold/gem upgrade for chapter loot. This gives endgame
// soulshard farming a real sink AFTER you've crafted your set.
//
// Cost ramps quadratically — full +10 on one piece costs ~1600 shards,
// full +10 on a 5-piece set ≈ 8000 shards (~2 weeks of post-rebalance
// farming for a single hero's full ult enchant). +12% stat per level
// (already baked into loot.equipStats) caps at +120% piece power at +10.
export const MAX_ENCHANT_LEVEL = 10;

export function enchantCost(eq: OwnedEquipment): { soulshard: number; gold: number } {
  const lvl = eq.upgradeLevel ?? 0;
  // Quadratic-ish curve: 20, 32, 47, 65, 87, 112, 140, 172, 207, 245
  // Totals to ~1127 shards for a full +1→+10 sweep on one piece.
  const shards = Math.round(20 + 12 * lvl + 1.5 * lvl * lvl);
  const gold = 5000 + 2000 * lvl;
  return { soulshard: shards, gold };
}

export async function enchantUltGear(eqId: string): Promise<{ ok: boolean; error?: string }> {
  const eq = await db.equipment.get(eqId);
  if (!eq) return { ok: false, error: 'Not found' };
  if (!eq.craftedPieceId) return { ok: false, error: 'Only crafted ult gear can be enchanted' };
  if ((eq.upgradeLevel ?? 0) >= MAX_ENCHANT_LEVEL) return { ok: false, error: 'Already at max enchant' };
  const cost = enchantCost(eq);
  // Check materials + currency
  const shards = await getMaterialCount(MAT_SOULSHARD);
  if (shards < cost.soulshard) return { ok: false, error: `Need ${cost.soulshard} soulshards (have ${shards})` };
  const profile = useProfile.getState();
  if (cost.gold > 0 && profile.profile.gold < cost.gold) {
    return { ok: false, error: `Need ${cost.gold.toLocaleString()} gold` };
  }
  // Spend
  await spendMaterial(MAT_SOULSHARD, cost.soulshard);
  if (cost.gold > 0) await profile.spendGold(cost.gold);
  await db.equipment.update(eqId, { upgradeLevel: (eq.upgradeLevel ?? 0) + 1 });
  await useHeroes.getState().load();
  await useItems.getState().refresh();
  return { ok: true };
}

export async function upgradeEquipment(eqId: string): Promise<{ ok: boolean; error?: string }> {
  const eq = await db.equipment.get(eqId);
  if (!eq) return { ok: false, error: 'Not found' };
  if ((eq.upgradeLevel ?? 0) >= MAX_UPGRADE_LEVEL) return { ok: false, error: 'Already maxed' };
  // Crafted Mythic items have fixed stats — disable upgrade for them
  if (eq.craftedPieceId) return { ok: false, error: 'Mythic items are already perfect' };

  const cost = upgradeCost(eq);
  const profile = useProfile.getState();
  if (cost.gold > 0) {
    const ok = await profile.spendGold(cost.gold);
    if (!ok) return { ok: false, error: 'Not enough gold' };
  }
  if (cost.gems > 0) {
    const ok = await profile.spendGems(cost.gems);
    if (!ok) return { ok: false, error: 'Not enough gems' };
  }
  await db.equipment.update(eqId, { upgradeLevel: (eq.upgradeLevel ?? 0) + 1 });
  await useHeroes.getState().load();
  return { ok: true };
}

// Salvage value scales with rarity and current power.
export function salvageValue(eq: OwnedEquipment): { gold: number; gems: number } {
  const rarity = (eq.rarity ?? 1) as number;
  const power = equipPower(eq);
  return {
    gold: Math.round(power * 0.4 + rarity * 50),
    gems: rarity >= 4 ? rarity - 3 : 0,
  };
}

export async function salvageEquipment(eqId: string): Promise<{ ok: boolean; granted?: { gold: number; gems: number } }> {
  const eq = await db.equipment.get(eqId);
  if (!eq) return { ok: false };
  // Don't allow salvaging Mythic crafted gear or items equipped right now
  if (eq.craftedPieceId) return { ok: false };
  if (eq.equippedTo) return { ok: false };
  const value = salvageValue(eq);
  await useProfile.getState().addGold(value.gold);
  if (value.gems > 0) await useProfile.getState().addGems(value.gems);
  await db.equipment.delete(eqId);
  await useHeroes.getState().load();
  return { ok: true, granted: value };
}

// Bulk salvage: scrap all unequipped items of given max rarity
export async function bulkSalvageBelow(maxRarity: number): Promise<{ count: number; granted: { gold: number; gems: number } }> {
  const all = await db.equipment.toArray();
  const targets = all.filter(eq =>
    !eq.equippedTo &&
    !eq.craftedPieceId &&
    ((eq.rarity ?? 1) as number) <= maxRarity
  );
  let totalGold = 0, totalGems = 0;
  for (const eq of targets) {
    const v = salvageValue(eq);
    totalGold += v.gold;
    totalGems += v.gems;
    await db.equipment.delete(eq.id);
  }
  if (totalGold > 0) await useProfile.getState().addGold(totalGold);
  if (totalGems > 0) await useProfile.getState().addGems(totalGems);
  await useHeroes.getState().load();
  return { count: targets.length, granted: { gold: totalGold, gems: totalGems } };
}
