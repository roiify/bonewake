import { db, type OwnedEquipment, type OwnedHero } from './db';
import { GEM_BY_ID, SOCKETS_BY_RARITY, gemInventoryKey, type GemDef } from '../data/gems';
import { useItems } from '../store/items';

// Hero-bound socket count. Gems live on the hero, not the equipment, so
// they persist across gear swaps. Bumped from 4 → 8 after feedback that
// 4 slots felt like too big a nerf vs the old 15-socket gear ceiling.
export const HERO_GEM_SLOTS = 8;

// Resize a hero's gem array to the current slot count while preserving
// whatever gems are already slotted. Adding slots = pads with nulls;
// shrinking would truncate (we only ever grow today, so excess gems
// staying in storage is fine — they're just inert).
export function ensureHeroGems(hero: OwnedHero): (string | null)[] {
  const g = hero.gems ?? [];
  if (g.length === HERO_GEM_SLOTS) return g;
  const out: (string | null)[] = Array(HERO_GEM_SLOTS).fill(null);
  for (let i = 0; i < Math.min(g.length, HERO_GEM_SLOTS); i++) out[i] = g[i];
  return out;
}

// Aggregate gem stat contribution for a hero's slotted gems.
export function heroGemStats(hero: OwnedHero): Partial<Record<string, number>> {
  const out: Record<string, number> = {};
  const slots = hero.gems ?? [];
  for (const gemId of slots) {
    if (!gemId) continue;
    const g = GEM_BY_ID[gemId];
    if (!g) continue;
    out[g.stat] = (out[g.stat] ?? 0) + g.value;
    if (g.bonusStats) {
      for (const [s, v] of Object.entries(g.bonusStats)) {
        out[s] = (out[s] ?? 0) + (v as number);
      }
    }
  }
  return out;
}

export async function socketGemOnHero(
  heroId: string,
  slotIndex: number,
  gemId: string,
  updateHero: (id: string, patch: Partial<OwnedHero>) => Promise<void>,
): Promise<{ ok: boolean; reason?: string }> {
  const hero = await db.heroes.get(heroId);
  if (!hero) return { ok: false, reason: 'hero not found' };
  const def = GEM_BY_ID[gemId];
  if (!def) return { ok: false, reason: 'unknown gem' };
  // Ult gems (tier 5) are bound to a specific hero — enforce here.
  if (def.heroId && def.heroId !== hero.templateId) {
    return { ok: false, reason: `bound to ${def.heroId}` };
  }
  if (slotIndex < 0 || slotIndex >= HERO_GEM_SLOTS) return { ok: false, reason: 'invalid slot' };
  const gems = [...ensureHeroGems(hero)];
  const existing = gems[slotIndex];
  if (existing) await addGemToInventory(existing, 1);
  const removed = await removeGemFromInventory(gemId, 1);
  if (!removed) {
    if (existing) await removeGemFromInventory(existing, 1).catch(() => undefined);
    return { ok: false, reason: 'not in inventory' };
  }
  gems[slotIndex] = gemId;
  await updateHero(heroId, { gems });
  await useItems.getState().refresh();
  return { ok: true };
}

export async function unsocketGemFromHero(
  heroId: string,
  slotIndex: number,
  updateHero: (id: string, patch: Partial<OwnedHero>) => Promise<void>,
): Promise<boolean> {
  const hero = await db.heroes.get(heroId);
  if (!hero || !hero.gems) return false;
  const gemId = hero.gems[slotIndex];
  if (!gemId) return false;
  await addGemToInventory(gemId, 1);
  const gems = [...hero.gems];
  gems[slotIndex] = null;
  await updateHero(heroId, { gems });
  await useItems.getState().refresh();
  return true;
}

// One-time migration: walk all owned equipment, push any socketed gems
// back to the player's inventory, and wipe equipment.sockets. Idempotent.
export async function migrateEquipmentSocketsToInventory(): Promise<{ moved: number }> {
  const all = await db.equipment.toArray();
  let moved = 0;
  for (const eq of all) {
    if (!eq.sockets || eq.sockets.every(g => !g)) continue;
    for (const gid of eq.sockets) {
      if (gid) { await addGemToInventory(gid, 1); moved++; }
    }
    await db.equipment.put({ ...eq, sockets: [] });
  }
  if (moved > 0) await useItems.getState().refresh();
  return { moved };
}

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

// Aggregate gem stat contribution for an equipment instance.
// Tier-5 (Ultimate) gems may carry bonusStats — fold those in too so a
// single socket of an ult gem grants multiple stats at once.
export function gemStats(eq: OwnedEquipment): Partial<Record<string, number>> {
  const out: Record<string, number> = {};
  if (!eq.sockets) return out;
  for (const gemId of eq.sockets) {
    if (!gemId) continue;
    const g = GEM_BY_ID[gemId];
    if (!g) continue;
    out[g.stat] = (out[g.stat] ?? 0) + g.value;
    if (g.bonusStats) {
      for (const [s, v] of Object.entries(g.bonusStats)) {
        out[s] = (out[s] ?? 0) + (v as number);
      }
    }
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
