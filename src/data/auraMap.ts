import type { Element } from '../types';

// Map element → aura sprite path (from extracted assets)
export const ELEMENT_AURA: Record<Element, string> = {
  fire: '/sprites/aura/yellow.png',
  water: '/sprites/aura/blue.png',
  earth: '/sprites/aura/yellow.png',
  light: '/sprites/aura/yellow.png',
  dark: '/sprites/aura/purple.png',
};

// VFX assets for ultimates
export const ULT_VFX = {
  beam: '/sprites/vfx/beam_yellow.png',
  orbs: '/sprites/vfx/energy_orbs.png',
  swirl: '/sprites/vfx/pink_swirl.png',
};

// Chapter battle backgrounds
export const CHAPTER_BG: Record<number, string> = {
  1: '/sprites/bg/sky_cliffs.jpg',
  2: '/sprites/bg/mountain_lake.jpg',
  3: '/sprites/bg/cosmic_fire.jpg',
};

// Chapter biome card emblems
export const CHAPTER_BIOME: Record<number, string> = {
  1: '/sprites/biome/snow.png',       // alt: snow as Chapter 1 plains
  2: '/sprites/biome/desert.png',
  3: '/sprites/biome/snow_tower.png',
};
