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

// Per-chapter apocalyptic backgrounds, themed to the chapter narrative.
export const CHAPTER_BG: Record<number, string> = {
  1: asset('sprites/bg/ch1_forsaken_fields.jpg'),     // Forsaken Fields — tombstones, fog, dead grass
  2: asset('sprites/bg/ch2_scorched_wastes.jpg'),     // Scorched Wastes — ash, cracked earth, swamp
  3: asset('sprites/bg/ch3_necropolis.jpg'),          // Necropolis Court — bone-stacked city, purple
  4: asset('sprites/bg/ch4_crypts.jpg'),              // Crypts — candlelit catacombs, sarcophagi
  5: asset('sprites/bg/ch5_cathedral.jpg'),           // Cathedral — broken stained glass, ruins
  6: asset('sprites/bg/ch6_worlds_edge.jpg'),         // World's Edge — dead sea, cliffs, fraying void
  7: asset('sprites/bg/ch7_vanguard_camp.jpg'),       // Undead Vanguard — overrun military camp
  8: asset('sprites/bg/ch8_zombie_battlefield.jpg'),  // Zombie Legion — corpse-strewn battlefield
  9: asset('sprites/bg/ch9_necromancer_court.jpg'),   // Necromancer's Court — ritual grounds + open graves
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
  9: asset('sprites/biome/snow_tower.png'),
};
