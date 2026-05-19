import { create } from 'zustand';
import { db, type Profile, DEFAULT_PROFILE } from '../lib/db';
import { xpForLevel } from '../lib/stats';
import { sound } from '../lib/audio';

interface ProfileState {
  profile: Profile;
  loaded: boolean;
  load: () => Promise<void>;
  patch: (p: Partial<Profile>) => Promise<void>;
  addGold: (n: number) => Promise<void>;
  spendGold: (n: number) => Promise<boolean>;
  addGems: (n: number) => Promise<void>;
  spendGems: (n: number) => Promise<boolean>;
  addFriendPoints: (n: number) => Promise<void>;
  spendFriendPoints: (n: number) => Promise<boolean>;
  spendEnergy: (n: number) => Promise<boolean>;
  gainExp: (n: number) => Promise<void>;
}

export const useProfile = create<ProfileState>((set, get) => ({
  profile: { ...DEFAULT_PROFILE },
  loaded: false,
  load: async () => {
    const p = await db.profile.get({ id: 'me' });
    if (p) set({ profile: p, loaded: true });
    else set({ loaded: true });
  },
  patch: async (p) => {
    const current = get().profile;
    const merged = { ...current, ...p };
    await db.profile.put(merged);
    set({ profile: merged });
  },
  addGold: async (n) => {
    const p = get().profile;
    await get().patch({ gold: p.gold + n });
  },
  spendGold: async (n) => {
    const p = get().profile;
    if (p.gold < n) return false;
    await get().patch({ gold: p.gold - n });
    return true;
  },
  addGems: async (n) => {
    const p = get().profile;
    await get().patch({ gems: p.gems + n });
  },
  spendGems: async (n) => {
    const p = get().profile;
    if (p.gems < n) return false;
    await get().patch({ gems: p.gems - n });
    return true;
  },
  addFriendPoints: async (n) => {
    const p = get().profile;
    await get().patch({ friendPoints: p.friendPoints + n });
  },
  spendFriendPoints: async (n) => {
    const p = get().profile;
    if (p.friendPoints < n) return false;
    await get().patch({ friendPoints: p.friendPoints - n });
    return true;
  },
  spendEnergy: async (n) => {
    const p = get().profile;
    if (p.energy < n) return false;
    await get().patch({ energy: p.energy - n, lastEnergyTick: Date.now() });
    return true;
  },
  gainExp: async (n) => {
    let p = get().profile;
    const startLevel = p.level;
    let level = p.level;
    let exp = p.exp + n;
    while (exp >= xpForLevel(level)) {
      exp -= xpForLevel(level);
      level++;
    }
    // On level-up, refill energy to cap (common gacha pattern, keeps players playing)
    const leveledUp = level > startLevel;
    if (leveledUp) sound.playSfx('levelup');
    await get().patch({
      level,
      exp,
      ...(leveledUp ? { energy: 100, lastEnergyTick: Date.now() } : {}),
    });
  },
}));
