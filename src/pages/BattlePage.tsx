import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { STAGES } from '../data/stages';
import { db, type StageClear } from '../lib/db';

export default function BattlePage() {
  const [clears, setClears] = useState<Record<string, StageClear>>({});
  const [clearsLoaded, setClearsLoaded] = useState(false);
  const nextStageRef = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    db.stageClears.toArray().then(arr => {
      setClears(Object.fromEntries(arr.map(c => [c.stageId, c])));
      setClearsLoaded(true);
    });
  }, []);

  // Snap the next-stage into the middle of the viewport as soon as it renders,
  // so the page appears to LOAD at the right scroll position (no visible scroll
  // animation). Use behavior: 'instant' and run synchronously after first paint.
  useEffect(() => {
    if (!clearsLoaded) return;
    requestAnimationFrame(() => {
      nextStageRef.current?.scrollIntoView({ behavior: 'instant' as ScrollBehavior, block: 'center' });
    });
  }, [clearsLoaded]);

  // Where to scroll the user back to:
  //   1. If they cleared the last stage they played, scroll to the NEXT stage
  //      (progression UX — "what's next" instead of "where was I")
  //   2. If they failed the last stage, scroll to the same stage (retry)
  //   3. Fallback: first uncleared stage
  //   4. Fallback: last cleared stage
  const lastPlayedStageId = typeof window !== 'undefined' ? localStorage.getItem('bonewake_last_stage') : null;
  let nextStageId: string | null = null;
  if (lastPlayedStageId) {
    if (clears[lastPlayedStageId]) {
      // Last stage was cleared — point to the NEXT stage in the list
      const idx = STAGES.findIndex(s => s.id === lastPlayedStageId);
      nextStageId = STAGES[idx + 1]?.id ?? lastPlayedStageId;
    } else {
      nextStageId = lastPlayedStageId;  // Retry the failed stage
    }
  }
  if (!nextStageId) {
    nextStageId = STAGES.find(s => !clears[s.id])?.id
               || [...STAGES].reverse().find(s => clears[s.id])?.id
               || null;
  }

  const byChapter = STAGES.reduce<Record<number, typeof STAGES>>((m, s) => {
    (m[s.chapter] ??= []).push(s);
    return m;
  }, {});

  const chapterNames: Record<number, string> = {
    1: 'Forsaken Fields', 2: 'Ashen Wastes', 3: 'Dread Court',
    4: 'Whispering Crypts', 5: 'Pale Cathedral', 6: "World's Edge",
    7: 'Undead Vanguard', 8: 'Zombie Legion', 9: "Necromancer's Court",
    10: 'The Abyssal Maw', 11: 'Tidewreck', 12: 'Iron Famine',
    13: 'Plaguespire', 14: 'Hollowed Sun', 15: 'Crown of Ash',
    16: 'Whisper March', 17: 'Boneharbor', 18: 'Salt Wastes',
    19: 'Frostforge', 20: 'Glass Desert', 21: 'Hungry Sky',
    22: 'Long Twilight', 23: 'Veined Earth', 24: 'Cinder Choir',
    25: 'Iron Veil', 26: 'Bleeding Throne', 27: 'Wormwood',
    28: 'Black Tide', 29: 'The Last Wake',
  };
  const chapterEmoji: Record<number, string> = {
    1: '🌾', 2: '🔥', 3: '🌌', 4: '🪦', 5: '⛪', 6: '🌊',
    7: '⚔️', 8: '🩸', 9: '☠️',
    10: '🕳️', 11: '🌊', 12: '🏯', 13: '🦠', 14: '🌑', 15: '🔥',
    16: '🌲', 17: '⚓', 18: '🏜️', 19: '🧊', 20: '💎', 21: '🦇',
    22: '🌆', 23: '🩸', 24: '🕯️', 25: '🚪', 26: '🩸', 27: '🪱',
    28: '🌊', 29: '💀',
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
      <p className="text-[10px] text-zinc-400 leading-snug -mt-2">
        Main progression. Beat each stage for <span className="text-amber-300">stars, gear drops, and chapter unlocks</span> —
        clear three stars to unlock instant-skip on that stage.
      </p>
      {Object.entries(byChapter).map(([ch, stages]) => (
        <div key={ch}>
          <div className="relative rounded-md overflow-hidden mb-2 h-20 border border-zinc-800">
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-900/60 to-zinc-800" />
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
                  ref={s.id === nextStageId ? nextStageRef : undefined}
                  className={`block rounded-md border p-3 transition-all ${
                    locked
                      ? 'border-zinc-800 bg-zinc-900/40 opacity-50 cursor-not-allowed'
                      : s.id === nextStageId
                        ? 'border-amber-500 bg-amber-950/30 ring-2 ring-amber-500/40'
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
