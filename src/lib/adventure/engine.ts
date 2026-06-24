// AdventureEngine — the M0 walkable-overworld spike.
//
// A plain class (NOT a React component) that owns a single requestAnimationFrame
// loop drawing a tile map + a walkable hero onto one <canvas>. React never
// re-renders during walking; the engine only calls back on discrete events
// (here: position changes, for the HUD readout). This is the architecture from
// docs/RPG_DESIGN.md §7.1/§7.3, proven small before the M1 vertical slice.

import { asset } from '../assetPath';
import { loadImage } from './sprites';
import type { AdventureMap, Dir } from '../../data/adventure/types';

const VIEW_W = 15; // visible tiles wide  (Slice Canon §0)
const VIEW_H = 11; // visible tiles tall
const STEP_MS = 140; // ms per tile step

export interface EngineCallbacks {
  onPos?: (info: { x: number; y: number; facing: Dir }) => void;
}

const KEY_DIR: Record<string, Dir> = {
  ArrowUp: 'north', KeyW: 'north',
  ArrowDown: 'south', KeyS: 'south',
  ArrowLeft: 'west', KeyA: 'west',
  ArrowRight: 'east', KeyD: 'east',
};

const DELTA: Record<Dir, { dx: number; dy: number }> = {
  north: { dx: 0, dy: -1 },
  south: { dx: 0, dy: 1 },
  west: { dx: -1, dy: 0 },
  east: { dx: 1, dy: 0 },
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const smooth = (t: number) => t * t * (3 - 2 * t);

export class AdventureEngine {
  private ctx: CanvasRenderingContext2D;
  private map: AdventureMap;
  private tile: number;
  private heroId: string;
  private cb: EngineCallbacks;

  private raf = 0;
  private running = false;

  // pressed direction keys, in press order (last = highest priority)
  private held: Dir[] = [];

  // player state
  private tx: number;
  private ty: number;
  private px: number; // pixel pos = top-left of the occupied tile
  private py: number;
  private facing: Dir;
  private moving = false;
  private fromX = 0;
  private fromY = 0;
  private toX = 0;
  private toY = 0;
  private moveStart = 0;

  private sprites: Partial<Record<Dir, HTMLImageElement>> = {};

  constructor(canvas: HTMLCanvasElement, map: AdventureMap, heroId: string, cb: EngineCallbacks = {}) {
    this.map = map;
    this.tile = map.tile;
    this.heroId = heroId;
    this.cb = cb;

    canvas.width = VIEW_W * this.tile;
    canvas.height = VIEW_H * this.tile;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('2d canvas context unavailable');
    this.ctx = ctx;
    this.ctx.imageSmoothingEnabled = false;

    this.tx = map.spawn.x;
    this.ty = map.spawn.y;
    this.px = this.tx * this.tile;
    this.py = this.ty * this.tile;
    this.facing = map.spawn.facing;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    void this.loadSprites();
    this.cb.onPos?.({ x: this.tx, y: this.ty, facing: this.facing });
    this.raf = requestAnimationFrame(this.loop);
  }

  destroy(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.held = [];
  }

  // --- virtual d-pad (touch) ---------------------------------------------
  setVirtualDir(dir: Dir, down: boolean): void {
    if (down) this.pressDir(dir);
    else this.releaseDir(dir);
  }

  // --- input -------------------------------------------------------------
  private onKeyDown = (e: KeyboardEvent): void => {
    const dir = KEY_DIR[e.code];
    if (!dir) return;
    e.preventDefault();
    if (!e.repeat) this.pressDir(dir);
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    const dir = KEY_DIR[e.code];
    if (!dir) return;
    this.releaseDir(dir);
  };

  private pressDir(dir: Dir): void {
    if (!this.held.includes(dir)) this.held.push(dir);
  }

  private releaseDir(dir: Dir): void {
    this.held = this.held.filter((d) => d !== dir);
  }

  // --- map helpers -------------------------------------------------------
  private isSolid(x: number, y: number): boolean {
    if (x < 0 || y < 0 || x >= this.map.w || y >= this.map.h) return true;
    return this.map.solid[y * this.map.w + x] === 1;
  }

  private tryStep(now: number): void {
    const dir = this.held[this.held.length - 1];
    if (!dir) return;
    this.facing = dir; // face the way you try, even into a wall
    const { dx, dy } = DELTA[dir];
    const nx = this.tx + dx;
    const ny = this.ty + dy;
    if (this.isSolid(nx, ny)) {
      this.cb.onPos?.({ x: this.tx, y: this.ty, facing: this.facing });
      return;
    }
    this.fromX = this.tx;
    this.fromY = this.ty;
    this.toX = nx;
    this.toY = ny;
    this.moveStart = now;
    this.moving = true;
  }

  // --- loop --------------------------------------------------------------
  private loop = (now: number): void => {
    if (!this.running) return;

    if (this.moving) {
      const t = clamp((now - this.moveStart) / STEP_MS, 0, 1);
      const e = smooth(t);
      this.px = lerp(this.fromX * this.tile, this.toX * this.tile, e);
      this.py = lerp(this.fromY * this.tile, this.toY * this.tile, e);
      if (t >= 1) {
        this.moving = false;
        this.tx = this.toX;
        this.ty = this.toY;
        this.px = this.tx * this.tile;
        this.py = this.ty * this.tile;
        this.cb.onPos?.({ x: this.tx, y: this.ty, facing: this.facing });
      }
    } else {
      this.tryStep(now); // chains held keys into continuous walking
    }

    this.render();
    this.raf = requestAnimationFrame(this.loop);
  };

  // --- sprites -----------------------------------------------------------
  private async loadSprites(): Promise<void> {
    const dirs: Dir[] = ['south', 'east', 'west'];
    await Promise.all(
      dirs.map(async (d) => {
        try {
          this.sprites[d] = await loadImage(asset(`sprites/pixellab/heroes/pro/${this.heroId}_${d}.png`));
        } catch {
          /* placeholder rect is drawn until/if this resolves */
        }
      }),
    );
    // North has no art yet — Slice Canon stopgap: face the camera (south).
    this.sprites.north = this.sprites.south;
  }

  // --- render ------------------------------------------------------------
  private render(): void {
    const { ctx, tile } = this;
    const viewPxW = VIEW_W * tile;
    const viewPxH = VIEW_H * tile;
    const mapPxW = this.map.w * tile;
    const mapPxH = this.map.h * tile;

    // camera centered on player, clamped to map bounds
    const camX = clamp(this.px + tile / 2 - viewPxW / 2, 0, Math.max(0, mapPxW - viewPxW));
    const camY = clamp(this.py + tile / 2 - viewPxH / 2, 0, Math.max(0, mapPxH - viewPxH));

    ctx.fillStyle = '#0b0809';
    ctx.fillRect(0, 0, viewPxW, viewPxH);

    const x0 = Math.floor(camX / tile);
    const y0 = Math.floor(camY / tile);
    const x1 = Math.min(this.map.w - 1, x0 + VIEW_W);
    const y1 = Math.min(this.map.h - 1, y0 + VIEW_H);

    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const i = y * this.map.w + x;
        const sx = Math.round(x * tile - camX);
        const sy = Math.round(y * tile - camY);
        if (this.map.solid[i] === 1) {
          // wall block with a lit top edge + dark base, reads as crypt stone
          ctx.fillStyle = '#241c19';
          ctx.fillRect(sx, sy, tile, tile);
          ctx.fillStyle = '#3a2d27';
          ctx.fillRect(sx, sy, tile, 4);
          ctx.fillStyle = '#0e0a09';
          ctx.fillRect(sx, sy + tile - 3, tile, 3);
          ctx.strokeStyle = '#0b0809';
          ctx.strokeRect(sx + 0.5, sy + 0.5, tile - 1, tile - 1);
        } else {
          ctx.fillStyle = this.map.ground[i] === 1 ? '#15110f' : '#191411';
          ctx.fillRect(sx, sy, tile, tile);
          // faint grid seam
          ctx.fillStyle = 'rgba(0,0,0,0.18)';
          ctx.fillRect(sx, sy, tile, 1);
          ctx.fillRect(sx, sy, 1, tile);
        }
      }
    }

    // --- player ---
    const drawX = this.px - camX;
    const drawY = this.py - camY;

    // contact shadow
    ctx.fillStyle = 'rgba(0,0,0,0.38)';
    ctx.beginPath();
    ctx.ellipse(drawX + tile / 2, drawY + tile - 3, tile * 0.34, tile * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();

    const spr = this.sprites[this.facing];
    if (spr && spr.naturalWidth > 0) {
      const targetH = tile * 1.9;
      const scale = targetH / spr.naturalHeight;
      const w = spr.naturalWidth * scale;
      const h = targetH;
      const dx = Math.round(drawX + tile / 2 - w / 2);
      const dy = Math.round(drawY + tile - h + 2); // feet near tile bottom
      ctx.drawImage(spr, dx, dy, Math.round(w), Math.round(h));
    } else {
      // placeholder until the sprite resolves — keeps movement visible
      ctx.fillStyle = '#c0392b';
      ctx.fillRect(Math.round(drawX + tile * 0.25), Math.round(drawY + tile * 0.1), Math.round(tile * 0.5), Math.round(tile * 0.8));
    }
  }
}
