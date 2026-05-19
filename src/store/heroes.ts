import { create } from 'zustand';
import { db, type OwnedHero, type OwnedEquipment } from '../lib/db';

interface HeroesState {
  heroes: OwnedHero[];
  equipment: OwnedEquipment[];
  loaded: boolean;
  load: () => Promise<void>;
  addHero: (h: OwnedHero) => Promise<void>;
  updateHero: (id: string, patch: Partial<OwnedHero>) => Promise<void>;
  addEquipment: (e: OwnedEquipment) => Promise<void>;
  updateEquipment: (id: string, patch: Partial<OwnedEquipment>) => Promise<void>;
}

export const useHeroes = create<HeroesState>((set, get) => ({
  heroes: [],
  equipment: [],
  loaded: false,
  load: async () => {
    const heroes = await db.heroes.toArray();
    const equipment = await db.equipment.toArray();
    set({ heroes, equipment, loaded: true });
  },
  addHero: async (h) => {
    await db.heroes.add(h);
    set({ heroes: [...get().heroes, h] });
  },
  updateHero: async (id, patch) => {
    await db.heroes.update(id, patch);
    set({ heroes: get().heroes.map(h => h.id === id ? { ...h, ...patch } : h) });
  },
  addEquipment: async (e) => {
    await db.equipment.add(e);
    set({ equipment: [...get().equipment, e] });
  },
  updateEquipment: async (id, patch) => {
    await db.equipment.update(id, patch);
    set({ equipment: get().equipment.map(e => e.id === id ? { ...e, ...patch } : e) });
  },
}));
