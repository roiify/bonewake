import { db, type OwnedEquipment } from './db';
import { uid } from './id';
import { PIECE_BY_ID, MAT_SOULSHARD, essenceItemId, SET_BY_HERO, ULTIMATE_SETS } from '../data/ultimateGear';
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

function dominantStat(stats: Record<string, number>): string {
  // Prefer atk > hp > def > spd > crit for primary display
  const order = ['atk', 'hp', 'def', 'spd', 'crit'];
  for (const s of order) if (stats[s] != null) return s;
  return Object.keys(stats)[0] ?? 'hp';
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
  const shards = isBoss
    ? 5 + Math.floor(Math.random() * 6) + stageChapter * 2 // 5-10 + chapter bonus
    : 1 + Math.floor(Math.random() * 3); // 1-3
  const essences: { heroId: string; count: number }[] = [];
  // Essence chance: 100% on boss 3-star, ~25% on regular 3-star
  const rollEssence = isBoss ? 1.0 : 0.25;
  if (Math.random() < rollEssence) {
    const allSets = ULTIMATE_SETS;
    const set = allSets[Math.floor(Math.random() * allSets.length)];
    const count = isBoss ? 2 + Math.floor(Math.random() * 3) : 1;
    essences.push({ heroId: set.heroId, count });
  }
  return { soulshards: shards, essences };
}
