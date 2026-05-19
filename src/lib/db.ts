import Dexie, { type Table } from 'dexie';

export interface Profile {
  id: 'me';
  displayName: string;
  level: number;
  exp: number;
  energy: number;
  lastEnergyTick: number;
  gold: number;
  gems: number;
  friendPoints: number;
  pityCounter: number;
  tutorialDone: boolean;
  lastDailyClaim: string;
  signinStreak: number;
  lastClosedAt: number;
  createdAt: number;
  energyBuysToday?: number;
  energyBuysDate?: string;
  // Lifetime stat counters (persistent, never reset). Read by Achievements.
  lifetime?: LifetimeStats;
  // Tower
  towerHighestFloor?: number;
  towerWeekStart?: string;
  towerAttemptsDate?: string;
  towerAttemptsToday?: number;
  // Training Chamber
  trainingHeroId?: string | null;
  trainingStartedAt?: number | null;
  // World Boss
  worldBossWeek?: string;
  worldBossAttemptsUsed?: number;
  worldBossBestDamage?: number;
  worldBossClaimedTier?: number;
  // Settings
  settings?: GameSettings;
  // Tutorial
  tutorialStep?: number;
  welcomeMailSent?: boolean;
}

export interface GameSettings {
  audioMaster: number;
  audioBgm: number;
  audioSfx: number;
  audioMuted: boolean;
  defaultBattleSpeed: 1 | 2 | 4 | 8;
  showScanlines: boolean;
  reduceMotion: boolean;
}

export const DEFAULT_SETTINGS: GameSettings = {
  audioMaster: 0.6,
  audioBgm: 0.5,
  audioSfx: 0.8,
  audioMuted: false,
  defaultBattleSpeed: 2,
  showScanlines: false,
  reduceMotion: false,
};

export interface LifetimeStats {
  battlesWon: number;
  battlesLost: number;
  stagesCleared: number;
  threeStarClears: number;
  summons: number;
  ssspulls: number;          // SSS (5★) pulls landed
  mythicsCrafted: number;
  heroesOwned: number;
  legendariesDropped: number;
  towerMaxFloor: number;
  goldEarned: number;
}

export interface OwnedHero {
  id: string;
  templateId: string;
  level: number;
  exp: number;
  star: number;
  equipped: Partial<Record<string, string>>;
  obtainedAt: number;
  talents?: string[];          // unlocked talent node IDs
}

export interface OwnedEquipment {
  id: string;
  // New ARPG-style fields
  baseType?: string;
  rarity?: 1 | 2 | 3 | 4 | 5 | 6; // 6 = Mythic (crafted)
  itemLevel?: number;
  name?: string;
  primary?: { stat: string; value: number };
  affixes?: { stat: string; value: number }[];
  upgradeLevel?: number;
  obtainedAt?: number;
  // Crafted set-piece markers
  craftedPieceId?: string;
  setId?: string;
  setRestrictedTo?: string; // heroId — only that hero can equip this piece
  isUltimateWeapon?: boolean;
  emoji?: string;
  slot?: string;
  // Gem sockets — array length = available sockets, value = gemId or null
  sockets?: (string | null)[];
  // Legacy fields (kept for back-compat with older saves)
  templateId?: string;
  level?: number;
  // Common
  equippedTo: string | null;
}

export interface OwnedItem {
  templateId: string;
  count: number;
}

export interface StageClear {
  stageId: string;
  stars: number;
  clears: number;
  lastClearedAt: number;
}

export interface PullLog {
  id?: number;
  poolId: string;
  heroTemplateId: string;
  pulledAt: number;
}

export interface TaskProgress {
  taskId: string;
  progress: number;
  claimed: boolean;
  cycleStart: string;
}

export interface MailMessage {
  id?: number;
  subject: string;
  body: string;
  rewards: { gold?: number; gems?: number; friendPoints?: number; soulshard?: number; energy?: number };
  read?: boolean;
  claimed?: boolean;
  sentAt: number;
}

export class GameDB extends Dexie {
  profile!: Table<Profile, 'id'>;
  heroes!: Table<OwnedHero, 'id'>;
  equipment!: Table<OwnedEquipment, 'id'>;
  items!: Table<OwnedItem, 'templateId'>;
  stageClears!: Table<StageClear, 'stageId'>;
  pullLogs!: Table<PullLog, 'id'>;
  tasks!: Table<TaskProgress, 'taskId'>;
  mail!: Table<MailMessage, 'id'>;

  constructor() {
    super('pixel-fighter-save');
    this.version(1).stores({
      profile: 'id',
      heroes: 'id, templateId, level, star',
      equipment: 'id, templateId, level, equippedTo',
      items: 'templateId',
      stageClears: 'stageId, lastClearedAt',
      pullLogs: '++id, poolId, pulledAt',
      tasks: 'taskId',
    });
    this.version(2).stores({
      equipment: 'id, baseType, rarity, equippedTo',
    });
    this.version(3).stores({
      mail: '++id, sentAt, read',
    });
  }
}

export const db = new GameDB();

export const DEFAULT_LIFETIME: LifetimeStats = {
  battlesWon: 0, battlesLost: 0, stagesCleared: 0, threeStarClears: 0,
  summons: 0, ssspulls: 0, mythicsCrafted: 0, heroesOwned: 0,
  legendariesDropped: 0, towerMaxFloor: 0, goldEarned: 0,
};

export const DEFAULT_PROFILE: Profile = {
  id: 'me',
  displayName: 'Hero',
  level: 1,
  exp: 0,
  energy: 100,
  lastEnergyTick: Date.now(),
  gold: 1000,
  gems: 100,
  friendPoints: 20,
  pityCounter: 0,
  tutorialDone: false,
  lastDailyClaim: '',
  signinStreak: 0,
  lastClosedAt: Date.now(),
  createdAt: Date.now(),
  energyBuysToday: 0,
  energyBuysDate: '',
  lifetime: { ...DEFAULT_LIFETIME },
  towerHighestFloor: 0,
  towerWeekStart: '',
  towerAttemptsDate: '',
  towerAttemptsToday: 0,
  trainingHeroId: null,
  trainingStartedAt: null,
  settings: { ...DEFAULT_SETTINGS },
  tutorialStep: 0,
  welcomeMailSent: false,
};

// Energy regenerates 1 unit every 3 minutes, capped at 100.
export const ENERGY_REGEN_INTERVAL_MS = 3 * 60 * 1000;
export const ENERGY_CAP = 100;

let initPromise: Promise<void> | null = null;
export async function initSave() {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    await db.transaction('rw', db.profile, async () => {
      const existing = await db.profile.get('me');
      if (!existing) await db.profile.add({ ...DEFAULT_PROFILE });
    });
    const p = (await db.profile.get('me'))!;
    const elapsed = Date.now() - p.lastEnergyTick;
    const regen = Math.floor(elapsed / ENERGY_REGEN_INTERVAL_MS);
    if (regen > 0 && p.energy < ENERGY_CAP) {
      const newEnergy = Math.min(ENERGY_CAP, p.energy + regen);
      // Advance lastEnergyTick by the energy we actually credited (not by full elapsed)
      // so leftover fractional time carries over to the next tick.
      const consumed = regen * ENERGY_REGEN_INTERVAL_MS;
      await db.profile.update('me', { energy: newEnergy, lastEnergyTick: p.lastEnergyTick + consumed });
    }
    await pruneOrphanedSaveData();
  })();
  return initPromise;
}

// Remove owned heroes whose template no longer exists in HERO_BY_ID (after a roster change).
// Also clear stale squad selection in localStorage.
async function pruneOrphanedSaveData() {
  const HERO_BY_ID = (await import('../data/heroes')).HERO_BY_ID;
  const heroes = await db.heroes.toArray();
  const orphans = heroes.filter(h => !HERO_BY_ID[h.templateId]);
  if (orphans.length > 0) {
    console.log(`[init] pruning ${orphans.length} orphaned hero(es) from older roster`);
    for (const h of orphans) {
      // Free up any equipment attached to the orphan
      for (const eqId of Object.values(h.equipped)) {
        if (eqId) await db.equipment.update(eqId, { equippedTo: null });
      }
      await db.heroes.delete(h.id);
    }
  }
  // Clean stale squad selection
  try {
    const raw = localStorage.getItem('pf_squad');
    if (raw) {
      const ids: string[] = JSON.parse(raw);
      const validIds = ids.filter(id => heroes.some(h => h.id === id && HERO_BY_ID[h.templateId]));
      if (validIds.length !== ids.length) {
        localStorage.setItem('pf_squad', JSON.stringify(validIds));
      }
    }
  } catch { /* ignore */ }
}

export async function wipeSave() {
  await db.delete();
  await db.open();
  await db.profile.add({ ...DEFAULT_PROFILE });
}

export async function exportSave(): Promise<string> {
  const data = {
    profile: await db.profile.toArray(),
    heroes: await db.heroes.toArray(),
    equipment: await db.equipment.toArray(),
    items: await db.items.toArray(),
    stageClears: await db.stageClears.toArray(),
    tasks: await db.tasks.toArray(),
    exportedAt: new Date().toISOString(),
  };
  return JSON.stringify(data, null, 2);
}

export async function importSave(json: string) {
  const data = JSON.parse(json);
  await db.transaction('rw', db.profile, db.heroes, db.equipment, db.items, db.stageClears, db.tasks, async () => {
    await db.profile.clear();
    await db.heroes.clear();
    await db.equipment.clear();
    await db.items.clear();
    await db.stageClears.clear();
    await db.tasks.clear();
    if (data.profile?.length) await db.profile.bulkAdd(data.profile);
    if (data.heroes?.length) await db.heroes.bulkAdd(data.heroes);
    if (data.equipment?.length) await db.equipment.bulkAdd(data.equipment);
    if (data.items?.length) await db.items.bulkAdd(data.items);
    if (data.stageClears?.length) await db.stageClears.bulkAdd(data.stageClears);
    if (data.tasks?.length) await db.tasks.bulkAdd(data.tasks);
  });
}
