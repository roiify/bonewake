import type { Element } from '../types';
import { asset } from '../lib/assetPath';

// Map element → aura sprite path (from extracted assets)
export const ELEMENT_AURA: Record<Element, string> = {
  fire: asset('sprites/aura/yellow.png'),
  water: asset('sprites/aura/blue.png'),
  earth: asset('sprites/aura/yellow.png'),
  light: asset('sprites/aura/yellow.png'),
  dark: asset('sprites/aura/purple.png'),
};

export const ULT_VFX = {
  beam: asset('sprites/vfx/beam_yellow.png'),
  orbs: asset('sprites/vfx/energy_orbs.png'),
  swirl: asset('sprites/vfx/pink_swirl.png'),
};

export const CHAPTER_BG: Record<number, string> = {
  1: asset('sprites/bg/sky_cliffs.jpg'),
  2: asset('sprites/bg/mountain_lake.jpg'),
  3: asset('sprites/bg/cosmic_fire.jpg'),
  4: asset('sprites/bg/cosmic_fire.jpg'),
  5: asset('sprites/bg/sky_cliffs.jpg'),
  6: asset('sprites/bg/sky_clouds.jpg'),
  7: asset('sprites/bg/cosmic_fire.jpg'),
  8: asset('sprites/bg/sky_cliffs.jpg'),
};

export const CHAPTER_BIOME: Record<number, string> = {
  1: asset('sprites/biome/snow.png'),
  2: asset('sprites/biome/desert.png'),
  3: asset('sprites/biome/snow_tower.png'),
  4: asset('sprites/biome/snow_tower.png'),
  5: asset('sprites/biome/desert.png'),
  6: asset('sprites/biome/snow.png'),
  7: asset('sprites/biome/snow_tower.png'),
  8: asset('sprites/biome/desert.png'),
};
