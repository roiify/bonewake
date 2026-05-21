import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { STAGES } from '../data/stages';
import { db, type StageClear } from '../lib/db';
import { CHAPTER_BG } from '../data/auraMap';

const CHAPTER_NAMES: Record<number, string> = {
  1: 'Forsaken Fields', 2: 'Ashen Wastes', 3: 'Dread Court',
  4: 'Whispering Crypts', 5: 'Pale Cathedral', 6: "World's Edge",
  7: 'Undead Vanguard', 8: 'Zombie Legion', 9: "Necromancer's Court",
};
const CHAPTER_EMOJI: Record<number, string> = {
  1: '🌾', 2: '🔥', 3: '🌌', 4: '🪦', 5: '⛪', 6: '🌊',
  7: '⚔️', 8: '🩸', 9: '☠️',
};

export default function ChapterMapPage() {
  const navigate = useNavigate();
  const [clears, setClears] = useState<Record<string, StageClear>>({});

  useEffect(() => {
    db.stageClears.toArray().then(arr => {
      setClears(Object.fromEntries(arr.map(c => [c.stageId, c])));
    });
  }, []);

  const byChapter = STAGES.reduce<Record<number, typeof STAGES>>((m, s) => {
    (m[s.chapter] ??= []).push(s);
    return m;
  }, {});

  function isLocked(stageId: string): boolean {
    const stage = STAGES.find(s => s.id === stageId);
    if (!stage) return true;
    if (stage.chapter === 1 && stage.num === 1) return false;
    if (stage.num > 1) {
      const prev = STAGES.find(s => s.chapter === stage.chapter && s.num === stage.num - 1);
      return prev ? !clears[prev.id] : true;
    }
    const prev = STAGES.filter(s => s.chapter === stage.chapter - 1).slice(-1)[0];
    return prev ? !clears[prev.id] : true;
  }

  return (
    <div className="p-3 space-y-4 pb-5">
      <button onClick={() => navigate(-1)} className="text-xs text-zinc-400">← Back</button>
      <h2 className="font-pixel text-sm">🗺️ World Map</h2>

      {Object.entries(byChapter).map(([chRaw, stages]) => {
        const ch = Number(chRaw);
        const clearedCount = stages.filter(s => clears[s.id]).length;
        const total = stages.length;
        const fully3 = stages.every(s => (clears[s.id]?.stars ?? 0) === 3);
        return (
          <div key={ch} className="rounded-lg border-2 border-zinc-800 overflow-hidden">
            {/* Chapter header — full-width biome image */}
            <div
              className="relative h-24 flex items-end"
              style={{ backgroundImage: `url(${CHAPTER_BG[ch] ?? CHAPTER_BG[1]})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
              <div className="relative z-10 flex items-end justify-between w-full p-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{CHAPTER_EMOJI[ch]}</span>
                  <div>
                    <div className="text-[10px] text-zinc-400 font-pixel">Chapter {ch}</div>
                    <h3 className="font-pixel text-sm text-amber-300 drop-shadow">{CHAPTER_NAMES[ch]}</h3>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-pixel text-emerald-300">{clearedCount}/{total}</div>
                  {fully3 && <div className="text-[9px] text-amber-300">★ MASTERED</div>}
                </div>
              </div>
            </div>

            {/* Stage nodes — visual horizontal trail */}
            <div className="bg-zinc-900 p-3">
              <div className="relative">
                {/* Connecting line */}
                <div className="absolute top-1/2 left-3 right-3 h-0.5 bg-zinc-700 -translate-y-1/2" />
                <div className="relative flex justify-between items-center">
                  {stages.map(s => {
                    const cleared = clears[s.id];
                    const locked = isLocked(s.id);
                    const isBoss = s.num === 5;
                    return (
                      <button
                        key={s.id}
                        onClick={() => !locked && navigate(`/battle/stage/${s.id}`)}
                        disabled={locked}
                        className={`relative z-10 rounded-full w-12 h-12 flex flex-col items-center justify-center border-2 transition-transform ${
                          locked ? 'border-zinc-700 bg-zinc-900 opacity-50 cursor-not-allowed'
                          : isBoss ? 'border-rose-500 bg-rose-900/40 hover:scale-110'
                          : 'border-amber-500 bg-amber-900/30 hover:scale-110'
                        }`}
                      >
                        <div className="text-[10px] font-pixel">
                          {locked ? '🔒' : isBoss ? '👑' : s.num}
                        </div>
                        {cleared && (
                          <div className="absolute -bottom-3 text-[8px] text-amber-400">
                            {'★'.repeat(cleared.stars)}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="text-center mt-3">
                <div className="text-[9px] text-zinc-500">Tap a node to enter</div>
              </div>
            </div>

          </div>
        );
      })}
    </div>
  );
}
