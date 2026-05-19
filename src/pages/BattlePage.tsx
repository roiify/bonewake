import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { STAGES } from '../data/stages';
import { db, type StageClear } from '../lib/db';
import { CHAPTER_BIOME } from '../data/auraMap';

export default function BattlePage() {
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

  const chapterNames: Record<number, string> = {
    1: 'Forsaken Fields', 2: 'Ashen Wastes', 3: 'Dread Court',
    4: 'Whispering Crypts', 5: 'Pale Cathedral', 6: "World's Edge",
  };
  const chapterEmoji: Record<number, string> = {
    1: '🌾', 2: '🔥', 3: '🌌', 4: '🪦', 5: '⛪', 6: '🌊',
  };

  function isLocked(stageId: string) {
    const stage = STAGES.find(s => s.id === stageId);
    if (!stage) return true;
    if (stage.chapter === 1 && stage.num === 1) return false;
    // previous stage in same chapter
    if (stage.num > 1) {
      const prev = STAGES.find(s => s.chapter === stage.chapter && s.num === stage.num - 1);
      return prev ? !clears[prev.id] : true;
    }
    // first stage of chapter — need last stage of prev chapter
    const prev = STAGES.filter(s => s.chapter === stage.chapter - 1).slice(-1)[0];
    return prev ? !clears[prev.id] : true;
  }

  return (
    <div className="p-3 space-y-4">
      <h2 className="font-pixel text-sm">Story</h2>
      {Object.entries(byChapter).map(([ch, stages]) => (
        <div key={ch}>
          <div className="relative rounded-md overflow-hidden mb-2 h-20 border border-zinc-800">
            <img src={CHAPTER_BIOME[Number(ch)]} alt="" className="absolute right-0 top-0 h-full object-cover opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/60 to-transparent" />
            <div className="relative flex items-center gap-2 h-full px-3">
              <span className="text-2xl drop-shadow">{chapterEmoji[Number(ch) as 1]}</span>
              <div>
                <div className="text-[9px] text-zinc-400 font-pixel">Chapter {ch}</div>
                <h3 className="font-pixel text-sm text-amber-300 drop-shadow">{chapterNames[Number(ch) as 1]}</h3>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            {stages.map(s => {
              const clear = clears[s.id];
              const locked = isLocked(s.id);
              const isBoss = s.num === 5;
              return (
                <Link
                  to={locked ? '#' : `/battle/stage/${s.id}`}
                  key={s.id}
                  className={`block rounded-md border p-3 transition-all ${
                    locked
                      ? 'border-zinc-800 bg-zinc-900/40 opacity-50 cursor-not-allowed'
                      : 'border-zinc-700 bg-zinc-900 hover:border-amber-500'
                  } ${isBoss && !locked ? 'border-rose-600 bg-gradient-to-r from-rose-950/30 to-zinc-900' : ''}`}
                  onClick={e => locked && e.preventDefault()}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-pixel text-[10px] text-zinc-400">Stage {s.chapter}-{s.num} {isBoss && <span className="text-rose-400">★ BOSS</span>}</div>
                      <div className="text-sm text-zinc-100 mt-0.5">{s.name}</div>
                      <div className="text-[10px] text-zinc-500 mt-1">Energy ⚡{s.energyCost} · {s.rewards.gold}🪙 · {s.rewards.exp}xp</div>
                    </div>
                    <div className="text-right">
                      {locked && <span className="text-zinc-500">🔒</span>}
                      {clear && (
                        <div className="text-amber-400 text-sm">{'★'.repeat(clear.stars)}{'☆'.repeat(3 - clear.stars)}</div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
