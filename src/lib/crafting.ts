import { db, type OwnedEquipment } from './db';
import type { LootStat } from '../data/loot';
import { uid } from './id';
import { PIECE_BY_ID, MAT_SOULSHARD, essenceItemId, SET_BY_HERO, ULTIMATE_SETS } from '../data/ultimateGear';

// === Essence cross-conversion ===
// Burn N essence of any hero → 1 essence of the chosen target hero.
// Solves the "I have lots of Aelia essence but want Kengo essence" bottleneck
// from random-hero drops without adding new material types.
export const ESSENCE_CONVERT_RATE = 5;  // 5 source → 1 target

export async function convertEssence(
  sourceHeroId: string,
  targetHeroId: string,
  sourceAmount: number,
): Promise<{ ok: boolean; gained?: number; error?: string }> {
  if (sourceHeroId === targetHeroId) {
    return { ok: false, error: 'Pick a different target hero' };
  }
  if (sourceAmount <= 0) {
    return { ok: false, error: 'Amount must be positive' };
  }
  if (sourceAmount % ESSENCE_CONVERT_RATE !== 0) {
    return { ok: false, error: `Must convert in multiples of ${ESSENCE_CONVERT_RATE}` };
  }
  const have = await getMaterialCount(essenceItemId(sourceHeroId));
  if (have < sourceAmount) {
    return { ok: false, error: `Only have ${have} source essence` };
  }
  const gained = Math.floor(sourceAmount / ESSENCE_CONVERT_RATE);
  await spendMaterial(essenceItemId(sourceHeroId), sourceAmount);
  await addMaterial(essenceItemId(targetHeroId), gained);
  return { ok: true, gained };
}
import { ULT_GEM_BY_HERO, ULT_GEM_COST_BY_HERO } from '../data/gems';
import { addGemToInventory } from './gems';
import { useProfile } from '../store/profile';
import { useHeroes } from '../store/heroes';
import { useItems } from '../store/items';
import { recordEvent } from './lifetime';

export async function getMaterialCount(itemId: string): Promise<number> {
  const r = await db.items.get(itemId);
  return r?.count ?? 0;
}

export async function addMaterial(itemId: string, count: number) {
  if (count <= 0) return;
  const r = await db.items.get(itemId);
  if (r) {
    await db.items.put({ templateId: itemId, count: r.count + count });
  } else {
    await db.items.put({ templateId: itemId, count });
  }
}

export async function spendMaterial(itemId: string, count: number): Promise<boolean> {
  const r = await db.items.get(itemId);
  if (!r || r.count < count) return false;
  await db.items.put({ templateId: itemId, count: r.count - count });
  return true;
}

// Craft a set piece. Returns the new equipment instance on success, null on failure.
export async function craftSetPiece(pieceId: string): Promise<OwnedEquipment | null> {
  const piece = PIECE_BY_ID[pieceId];
  if (!piece) return null;
  const set = SET_BY_HERO[Object.values(SET_BY_HERO).find(s => s.pieces.some(p => p.id === pieceId))?.heroId ?? ''];
  const heroId = set?.heroId ?? '';

  // Verify materials
  const shards = await getMaterialCount(MAT_SOULSHARD);
  const essence = await getMaterialCount(essenceItemId(heroId));
  const profile = useProfile.getState().profile;
  if (shards < piece.cost.soulshard) return null;
  if (essence < piece.cost.essence) return null;
  if (profile.gold < piece.cost.gold) return null;

  // Verify hero owned (must own the hero to craft their set piece)
  const heroes = useHeroes.getState().heroes;
  if (!heroes.find(h => h.templateId === heroId)) return null;

  // Verify not already crafted (one per piece definition — uniqueness)
  const allEq = useHeroes.getState().equipment;
  if (allEq.find(e => e.craftedPieceId === pieceId)) return null;

  // Deduct
  await spendMaterial(MAT_SOULSHARD, piece.cost.soulshard);
  await spendMaterial(essenceItemId(heroId), piece.cost.essence);
  await useProfile.getState().patch({ gold: profile.gold - piece.cost.gold });

  // Build the OwnedEquipment instance (Mythic rarity — 6, above Legendary)
  const eq: OwnedEquipment = {
    id: uid(),
    baseType: undefined,
    rarity: 6 as any, // Mythic, beyond LootRarity 1-5
    itemLevel: 99,
    name: piece.name,
    primary: { stat: dominantStat(piece.stats), value: piece.stats[dominantStat(piece.stats)] ?? 0 },
    affixes: Object.entries(piece.stats)
      .filter(([s]) => s !== dominantStat(piece.stats))
      .map(([stat, value]) => ({ stat, value: value as number })),
    upgradeLevel: 0,
    equippedTo: null,
    obtainedAt: Date.now(),
    // crafted markers
    craftedPieceId: pieceId,
    setId: piece.setId,
    setRestrictedTo: heroId,
    isUltimateWeapon: piece.isUltimateWeapon ?? false,
    emoji: piece.emoji,
    slot: piece.slot,
  };

  await useHeroes.getState().addEquipment(eq);
  await useItems.getState().refresh();
  await recordEvent({ kind: 'mythicCrafted' });
  return eq;
}

// Craft a hero's Ultimate Socket Gem. Uses the same materials as a
// set piece. Adds the gem to the inventory on success.
export async function craftUltimateGem(heroId: string): Promise<boolean> {
  const gem = ULT_GEM_BY_HERO[heroId];
  const cost = ULT_GEM_COST_BY_HERO[heroId];
  if (!gem || !cost) return false;

  const shards = await getMaterialCount(MAT_SOULSHARD);
  const essence = await getMaterialCount(essenceItemId(heroId));
  const profile = useProfile.getState().profile;
  if (shards < cost.soulshard) return false;
  if (essence < cost.essence) return false;
  if (profile.gold < cost.gold) return false;

  // Verify hero owned
  const heroes = useHeroes.getState().heroes;
  if (!heroes.find(h => h.templateId === heroId)) return false;

  await spendMaterial(MAT_SOULSHARD, cost.soulshard);
  await spendMaterial(essenceItemId(heroId), cost.essence);
  await useProfile.getState().patch({ gold: profile.gold - cost.gold });

  await addGemToInventory(gem.id, 1);
  await useItems.getState().refresh();
  return true;
}

function dominantStat(stats: Record<string, number>): LootStat {
  const order: LootStat[] = ['atk', 'hp', 'def', 'spd', 'crit'];
  for (const s of order) if (stats[s] != null) return s;
  return (Object.keys(stats)[0] as LootStat | undefined) ?? 'hp';
}

// Check if a piece is already crafted (for UI)
export async function isPieceCrafted(pieceId: string): Promise<boolean> {
  const all = await db.equipment.toArray();
  return all.some(e => e.craftedPieceId === pieceId);
}

// Get list of crafted-piece IDs from current equipment store
export function craftedPieceIds(equipment: OwnedEquipment[]): Set<string> {
  return new Set(equipment.map(e => e.craftedPieceId).filter(Boolean) as string[]);
}

// For a hero, count how many of their set pieces are EQUIPPED on that hero.
export function setPiecesEquippedFor(
  heroId: string,
  heroInstanceId: string,
  equipment: OwnedEquipment[]
): number {
  const set = SET_BY_HERO[heroId];
  if (!set) return 0;
  const setPieceIds = new Set(set.pieces.map(p => p.id));
  let count = 0;
  for (const eq of equipment) {
    if (eq.equippedTo === heroInstanceId && eq.craftedPieceId && setPieceIds.has(eq.craftedPieceId)) {
      count++;
    }
  }
  return count;
}

// Material drop logic — called after a 3-star clear in BattlePlayPage
export interface ClearDrop {
  soulshards: number;
  essences: { heroId: string; count: number }[];
}

export function rollClearDrops(stageChapter: number, isBoss: boolean): ClearDrop {
  // Economy alignment (post-cost-bump): ~+50% shards, ~+30% essence
  // chance, +1 essence count on bosses. Compensates for the 2.5× ult
  // gear cost without making farming feel infinite.
  const shards = isBoss
    ? 8 + Math.floor(Math.random() * 8) + stageChapter * 2  // 8-15 + chapter bonus (was 5-10)
    : 1 + Math.floor(Math.random() * 4);                    // 1-4 (was 1-3)
  const essences: { heroId: string; count: number }[] = [];
  // Essence chance: 100% on boss 3-star, ~35% on regular 3-star (was 25%)
  const rollEssence = isBoss ? 1.0 : 0.35;
  if (Math.random() < rollEssence) {
    const allSets = ULTIMATE_SETS;
    const set = allSets[Math.floor(Math.random() * allSets.length)];
    const count = isBoss ? 3 + Math.floor(Math.random() * 3) : 1;  // boss 3-5 (was 2-4)
    essences.push({ heroId: set.heroId, count });
  }
  return { soulshards: shards, essences };
}
