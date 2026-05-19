// Rolling backup safety net. Snapshots all game tables into a `backups` table
// inside IndexedDB. Survives page reloads but lives on the same browser/device,
// so it protects against:
//   - schema-rename data prunes (the orphan-cleanup logic)
//   - accidental /reset
//   - bugs that corrupt live tables
//
// It does NOT protect against:
//   - iOS / browser purging all IndexedDB (cache eviction)
//   - phone wipe
// → those still require the manual download (offered here too).

import { db, type SaveBackup } from './db';
import { useProfile } from '../store/profile';
import { useHeroes } from '../store/heroes';
import { useItems } from '../store/items';

const MAX_AUTO_BACKUPS = 7;            // keep the last 7 daily auto-backups
const AUTO_INTERVAL_MS = 22 * 60 * 60 * 1000; // run again at least 22h after the last auto-backup

async function gatherSnapshot(): Promise<Omit<SaveBackup, 'id' | 'createdAt' | 'source' | 'label'>> {
  const profile = await db.profile.toArray();
  const heroes = await db.heroes.toArray();
  const equipment = await db.equipment.toArray();
  const items = await db.items.toArray();
  const stageClears = await db.stageClears.toArray();
  const pullLogs = await db.pullLogs.toArray();
  const tasks = await db.tasks.toArray();
  const mail = await db.mail.toArray();
  const payload = JSON.stringify({
    version: 4,
    profile,
    heroes,
    equipment,
    items,
    stageClears,
    pullLogs,
    tasks,
    mail,
  });
  const p = profile[0];
  return {
    payload,
    level: p?.level ?? 1,
    heroCount: heroes.length,
    gold: p?.gold ?? 0,
    gems: p?.gems ?? 0,
  };
}

export async function createBackup(source: SaveBackup['source'] = 'manual', label?: string): Promise<number> {
  const snap = await gatherSnapshot();
  const date = new Date().toISOString().slice(0, 10);
  const id = await db.backups.add({
    createdAt: Date.now(),
    source,
    label: label ?? (source === 'auto' ? `auto-${date}` : source === 'pre-restore' ? `pre-restore-${date}` : `manual-${date}`),
    ...snap,
  });
  return id as number;
}

export async function listBackups(): Promise<SaveBackup[]> {
  const all = await db.backups.toArray();
  return all.sort((a, b) => b.createdAt - a.createdAt);
}

export async function getBackup(id: number): Promise<SaveBackup | undefined> {
  return db.backups.get(id);
}

export async function deleteBackup(id: number) {
  await db.backups.delete(id);
}

// Restore the game state from a backup. Wipes current data first, then writes
// the snapshot. A "pre-restore" auto-backup is created so the user can undo.
export async function restoreBackup(id: number): Promise<{ ok: boolean; error?: string }> {
  const b = await db.backups.get(id);
  if (!b) return { ok: false, error: 'Backup not found' };

  // Save the current state as a safety net
  try {
    await createBackup('pre-restore', `pre-restore-${new Date().toISOString().slice(0, 16)}`);
  } catch {
    // non-fatal — proceed
  }

  let data: any;
  try {
    data = JSON.parse(b.payload);
  } catch {
    return { ok: false, error: 'Backup data is corrupt' };
  }

  await db.transaction('rw', [db.profile, db.heroes, db.equipment, db.items, db.stageClears, db.pullLogs, db.tasks, db.mail], async () => {
    await db.profile.clear();
    await db.heroes.clear();
    await db.equipment.clear();
    await db.items.clear();
    await db.stageClears.clear();
    await db.pullLogs.clear();
    await db.tasks.clear();
    await db.mail.clear();
    if (data.profile?.length) await db.profile.bulkAdd(data.profile);
    if (data.heroes?.length) await db.heroes.bulkAdd(data.heroes);
    if (data.equipment?.length) await db.equipment.bulkAdd(data.equipment);
    if (data.items?.length) await db.items.bulkAdd(data.items);
    if (data.stageClears?.length) await db.stageClears.bulkAdd(data.stageClears);
    if (data.pullLogs?.length) await db.pullLogs.bulkAdd(data.pullLogs);
    if (data.tasks?.length) await db.tasks.bulkAdd(data.tasks);
    if (data.mail?.length) await db.mail.bulkAdd(data.mail);
  });

  // Reload in-memory stores
  await useProfile.getState().load();
  await useHeroes.getState().load();
  await useItems.getState().load();
  return { ok: true };
}

// Called at app boot. If the last auto-backup is older than 22h, take a new one,
// then prune to keep only the last 7 auto-backups (plus any manual or pre-restore ones).
export async function maybeAutoBackup() {
  try {
    const all = await db.backups.toArray();
    const autos = all.filter(b => b.source === 'auto');
    const last = autos.length > 0 ? Math.max(...autos.map(b => b.createdAt)) : 0;
    if (Date.now() - last < AUTO_INTERVAL_MS) return; // recent enough, nothing to do

    // Only auto-backup if there's actually a profile (skip brand-new installs)
    const profile = await db.profile.get('me');
    if (!profile) return;

    await createBackup('auto');

    // Prune old autos
    const fresh = await db.backups.toArray();
    const autosNew = fresh.filter(b => b.source === 'auto').sort((a, b) => b.createdAt - a.createdAt);
    const excess = autosNew.slice(MAX_AUTO_BACKUPS);
    for (const old of excess) if (old.id != null) await db.backups.delete(old.id);
  } catch (e) {
    // never fatal
    console.warn('auto-backup failed', e);
  }
}

// Download a backup as a JSON file the user can save off-device
export function downloadBackup(b: SaveBackup) {
  const blob = new Blob([b.payload], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `pixel-fighter-${b.label || new Date(b.createdAt).toISOString().slice(0, 10)}.json`;
  a.click();
}

export function formatBackupTime(t: number): string {
  const diff = Date.now() - t;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(t).toISOString().slice(0, 10);
}
