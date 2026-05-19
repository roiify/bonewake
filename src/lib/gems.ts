import { db, type OwnedEquipment } from './db';
import { GEM_BY_ID, SOCKETS_BY_RARITY, gemInventoryKey, type GemDef } from '../data/gems';
import { useItems } from '../store/items';

export function socketsAvailableFor(eq: OwnedEquipment): number {
  const rarity = (eq.rarity ?? 1) as number;
  return SOCKETS_BY_RARITY[rarity] ?? 0;
}

export function ensureSockets(eq: OwnedEquipment): OwnedEquipment {
  const n = socketsAvailableFor(eq);
  if (n === 0) return eq;
  if (!eq.sockets || eq.sockets.length !== n) {
    return { ...eq, sockets: Array(n).fill(null) };
  }
  return eq;
}

export async function addGemToInventory(gemId: string, count = 1) {
  const k = gemInventoryKey(gemId);
  const r = await db.items.get(k);
  await db.items.put({ templateId: k, count: (r?.count ?? 0) + count });
}

export async function removeGemFromInventory(gemId: string, count = 1): Promise<boolean> {
  const k = gemInventoryKey(gemId);
  const r = await db.items.get(k);
  if (!r || r.count < count) return false;
  await db.items.put({ templateId: k, count: r.count - count });
  return true;
}

export async function getGemInventoryMap(): Promise<Record<string, number>> {
  const all = await db.items.toArray();
  const out: Record<string, number> = {};
  for (const row of all) {
    if (row.templateId.startsWith('inv_gem_') && row.count > 0) {
      const gemId = row.templateId.slice(4); // remove 'inv_' prefix
      out[gemId] = row.count;
    }
  }
  return out;
}

// Aggregate gem stat contribution for an equipment instance
export function gemStats(eq: OwnedEquipment): Partial<Record<string, number>> {
  const out: Record<string, number> = {};
  if (!eq.sockets) return out;
  for (const gemId of eq.sockets) {
    if (!gemId) continue;
    const g = GEM_BY_ID[gemId];
    if (!g) continue;
    out[g.stat] = (out[g.stat] ?? 0) + g.value;
  }
  return out;
}

// Socket a gem into the given slot. Returns true on success.
export async function socketGem(equipmentId: string, slotIndex: number, gemId: string, updateEquipment: (id: string, patch: Partial<OwnedEquipment>) => Promise<void>): Promise<boolean> {
  const eq = await db.equipment.get(equipmentId);
  if (!eq) return false;
  const sockets = ensureSockets(eq).sockets ?? [];
  if (slotIndex < 0 || slotIndex >= sockets.length) return false;
  // Remove any gem currently in that slot back to inventory
  const existing = sockets[slotIndex];
  if (existing) await addGemToInventory(existing, 1);
  // Consume new gem from inventory
  const ok = await removeGemFromInventory(gemId, 1);
  if (!ok) return false;
  sockets[slotIndex] = gemId;
  await updateEquipment(equipmentId, { sockets });
  await useItems.getState().refresh();
  return true;
}

export async function unsocketGem(equipmentId: string, slotIndex: number, updateEquipment: (id: string, patch: Partial<OwnedEquipment>) => Promise<void>): Promise<boolean> {
  const eq = await db.equipment.get(equipmentId);
  if (!eq || !eq.sockets) return false;
  const gemId = eq.sockets[slotIndex];
  if (!gemId) return false;
  await addGemToInventory(gemId, 1);
  const sockets = [...eq.sockets];
  sockets[slotIndex] = null;
  await updateEquipment(equipmentId, { sockets });
  await useItems.getState().refresh();
  return true;
}

// Roll for a gem drop from a battle (~10% chance for any drop, scaled by chapter)
export function maybeRollGem(itemLevel: number, isBoss: boolean): GemDef | null {
  const chance = isBoss ? 0.5 : 0.1 + itemLevel * 0.005;
  if (Math.random() > chance) return null;
  const r = Math.random();
  const tier = (isBoss && r < 0.10) ? 4 : (r < 0.25) ? 3 : (r < 0.55) ? 2 : 1;
  const stats = ['hp', 'atk', 'def', 'spd', 'crit'] as const;
  const stat = stats[Math.floor(Math.random() * stats.length)];
  return GEM_BY_ID[`gem_${stat}_${tier}`];
}
