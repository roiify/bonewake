import { useProfile } from '../store/profile';
import type { LifetimeStats } from './db';
import { DEFAULT_LIFETIME } from './db';

// Persistent counters. Any in-game event that should contribute toward achievements
// or long-term tracking funnels through here.
export type LifetimeEvent =
  | { kind: 'battleWon' }
  | { kind: 'battleLost' }
  | { kind: 'stageCleared'; stars: number }
  | { kind: 'summon'; landedSSS: boolean }
  | { kind: 'mythicCrafted' }
  | { kind: 'legendaryDropped' }
  | { kind: 'goldEarned'; amount: number }
  | { kind: 'towerFloor'; floor: number };

export async function recordEvent(event: LifetimeEvent) {
  const profile = useProfile.getState().profile;
  const cur: LifetimeStats = { ...DEFAULT_LIFETIME, ...(profile.lifetime ?? {}) };
  switch (event.kind) {
    case 'battleWon': cur.battlesWon += 1; break;
    case 'battleLost': cur.battlesLost += 1; break;
    case 'stageCleared':
      cur.stagesCleared += 1;
      if (event.stars >= 3) cur.threeStarClears += 1;
      break;
    case 'summon':
      cur.summons += 1;
      if (event.landedSSS) cur.ssspulls += 1;
      break;
    case 'mythicCrafted': cur.mythicsCrafted += 1; break;
    case 'legendaryDropped': cur.legendariesDropped += 1; break;
    case 'goldEarned': cur.goldEarned += event.amount; break;
    case 'towerFloor':
      if (event.floor > cur.towerMaxFloor) cur.towerMaxFloor = event.floor;
      break;
  }
  await useProfile.getState().patch({ lifetime: cur });
}

export function getLifetime(): LifetimeStats {
  const p = useProfile.getState().profile;
  return { ...DEFAULT_LIFETIME, ...(p.lifetime ?? {}) };
}
