import { db } from './db';
import type { Rarity } from '../types';

export const fragmentItemId = (heroTemplateId: string) => `frag_${heroTemplateId}`;

// How many fragments a duplicate is worth (bumped so S-tier dupes give
// a meaningful chunk toward promotion now that the SSS pull rate is harsher).
export const DUP_FRAGMENT_VALUE: Record<Rarity, number> = {
  3: 10,
  4: 35,
  5: 100,
};

// Fragments required to advance a hero from N stars to N+1 stars.
// S → SS at 2 dupes, SS → SSS at ~5 dupes — a real path to SSS via play.
export const STAR_UP_COST: Record<number, number> = {
  3: 20,   // 3★ → 4★ (S → SS)
  4: 50,   // 4★ → 5★ (SS → SSS)
  5: 200,  // 5★ → 6★ (SSS+ end-game)
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
