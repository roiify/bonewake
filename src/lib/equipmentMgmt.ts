import { db, type OwnedEquipment } from './db';
import { useProfile } from '../store/profile';
import { useHeroes } from '../store/heroes';
import { equipPower } from './loot';

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
