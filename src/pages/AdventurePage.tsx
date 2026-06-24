import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdventureEngine } from '../lib/adventure/engine';
import type { Dir } from '../data/adventure/types';
import { M0_TESTROOM } from '../data/adventure/maps/m0_testroom';

// M0 spike page: full-screen walkable canvas + HUD + touch d-pad. Lives OUTSIDE
// <Shell> (like the battle screen) so it owns the whole viewport. Proves the
// canvas tile engine, arrow-key + touch movement, collision, camera-follow,
// and the GitHub Pages base-path deep-link before the M1 vertical slice.
export default function AdventurePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<AdventureEngine | null>(null);
  const navigate = useNavigate();
  const [pos, setPos] = useState<{ x: number; y: number; facing: Dir }>(M0_TESTROOM.spawn);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = new AdventureEngine(canvas, M0_TESTROOM, 'kengo', { onPos: setPos });
    engineRef.current = engine;
    engine.start();
    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  const hold = (dir: Dir) => (e: React.PointerEvent) => {
    e.preventDefault();
    engineRef.current?.setVirtualDir(dir, true);
  };
  const release = (dir: Dir) => (e: React.PointerEvent) => {
    e.preventDefault();
    engineRef.current?.setVirtualDir(dir, false);
  };

  const padBtn = (dir: Dir, label: string, extra: string) =>
    (
      <button
        type="button"
        aria-label={dir}
        onContextMenu={(e) => e.preventDefault()}
        onPointerDown={hold(dir)}
        onPointerUp={release(dir)}
        onPointerLeave={release(dir)}
        onPointerCancel={release(dir)}
        className={`flex items-center justify-center w-14 h-14 rounded-xl bg-zinc-800/90 text-zinc-200 text-xl active:bg-red-900/70 border border-zinc-700 select-none touch-none ${extra}`}
      >
        {label}
      </button>
    );

  return (
    <div className="h-full w-full max-w-[480px] mx-auto flex flex-col bg-zinc-950 text-zinc-100 select-none">
      {/* top bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="px-3 py-1 rounded-lg bg-zinc-800 text-zinc-200 text-sm border border-zinc-700 active:bg-zinc-700"
        >
          ← Back
        </button>
        <div className="text-xs tracking-widest uppercase text-red-400/80">Adventure · M0 Spike</div>
        <div className="font-mono text-[11px] text-zinc-500 w-[92px] text-right">
          {pos.x},{pos.y} {pos.facing[0].toUpperCase()}
        </div>
      </div>

      {/* canvas */}
      <div className="flex-1 flex items-center justify-center overflow-hidden p-2">
        <canvas
          ref={canvasRef}
          style={{ imageRendering: 'pixelated' }}
          className="w-full max-w-[460px] h-auto rounded-lg border border-zinc-800 shadow-[0_0_40px_rgba(192,57,43,0.15)]"
        />
      </div>

      {/* controls */}
      <div className="px-4 pb-6 pt-2">
        <p className="text-center text-[11px] text-zinc-600 mb-3">
          Arrow keys / WASD to walk · tap the pad on touch
        </p>
        <div className="grid grid-cols-3 grid-rows-3 gap-2 w-fit mx-auto">
          <div />
          {padBtn('north', '▲', '')}
          <div />
          {padBtn('west', '◀', '')}
          <div className="w-14 h-14" />
          {padBtn('east', '▶', '')}
          <div />
          {padBtn('south', '▼', '')}
          <div />
        </div>
      </div>
    </div>
  );
}
