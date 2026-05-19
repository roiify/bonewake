import { db } from './db';
import type { Rarity } from '../types';

export const fragmentItemId = (heroTemplateId: string) => `frag_${heroTemplateId}`;

// How many fragments a duplicate is worth
export const DUP_FRAGMENT_VALUE: Record<Rarity, number> = {
  3: 5,
  4: 20,
  5: 100,
};

// Fragments required to advance a hero from N stars to N+1 stars
export const STAR_UP_COST: Record<number, number> = {
  3: 30,   // 3★ → 4★ (after pulling enough dupes)
  4: 80,   // 4★ → 5★
  5: 200,  // 5★ → 6★ (post-cap)
};

export const MAX_STAR = 6;

export async function addFragments(heroTemplateId: string, count: number) {
  const id = fragmentItemId(heroTemplateId);
  const existing = await db.items.get(id);
  if (existing) {
    await db.items.put({ templateId: id, count: existing.count + count });
  } else {
    await db.items.put({ templateId: id, count });
  }
}

export async function consumeFragments(heroTemplateId: string, count: number): Promise<boolean> {
  const id = fragmentItemId(heroTemplateId);
  const existing = await db.items.get(id);
  if (!existing || existing.count < count) return false;
  await db.items.put({ templateId: id, count: existing.count - count });
  return true;
}

export async function getFragmentCount(heroTemplateId: string): Promise<number> {
  const existing = await db.items.get(fragmentItemId(heroTemplateId));
  return existing?.count ?? 0;
}
