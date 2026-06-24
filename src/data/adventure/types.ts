// Minimal Adventure-mode types for the M0 canvas spike. These are a forward-
// compatible subset of the full tilemap format described in docs/RPG_DESIGN.md
// (§3.2) — M1 will extend this with warps, NPCs, encounter zones, etc.

export type Dir = 'south' | 'east' | 'west' | 'north';

export interface AdventureMap {
  id: string;
  name: string;
  /** Map dimensions in tiles. */
  w: number;
  h: number;
  /** Logical tile size in pixels. */
  tile: number;
  /** Row-major (length w*h) floor-variant ids — purely cosmetic in M0. */
  ground: number[];
  /** Row-major (length w*h) collision: 1 = blocked, 0 = walkable. */
  solid: number[];
  /** Tile the player starts on. */
  spawn: { x: number; y: number; facing: Dir };
}
