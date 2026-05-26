import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { STAGES } from '../data/stages';
import { db, type StageClear } from '../lib/db';
import Card from '../components/ui/Card';
import { asset } from '../lib/assetPath';

const MODE_BOSS_ICON  = asset('sprites/ui/mode_boss.png');
const MODE_STORY_ICON = asset('sprites/ui/mode_story.png');

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
    <div className="p-3 space-y-5">
      <div>
        <h2 className="font-fantasy text-2xl tracking-widest text-amber-200" style={{ textShadow: '0 2px 0 rgba(0,0,0,0.95), 0 0 14px rgba(220,38,38,0.5)' }}>Story</h2>
        <p className="text-[10px] text-zinc-400 leading-snug mt-1">
          Main progression. Beat each stage for <span className="text-amber-300">stars, gear drops, and chapter unlocks</span> —
          clear three stars to unlock instant-skip.
        </p>
      </div>

      {Object.entries(byChapter).map(([ch, stages]) => (
        <div key={ch} className="space-y-2">
          {/* Chapter header — painted gradient with Cinzel chapter name */}
          <div
            className="relative rounded-lg overflow-hidden h-20 border"
            style={{
              borderColor: '#5a2222',
              background:
                'radial-gradient(circle at 20% 50%, rgba(220,38,38,0.35) 0%, transparent 55%), ' +
                'linear-gradient(90deg, #1a0807 0%, #0a0303 100%)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div className="relative flex items-center gap-3 h-full px-4">
              <span className="text-3xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">{chapterEmoji[Number(ch) as 1]}</span>
              <div>
                <div className="text-[9px] text-zinc-400 font-pixel tracking-widest">CHAPTER {ch}</div>
                <h3 className="font-fantasy text-lg tracking-wide text-amber-200" style={{ textShadow: '0 2px 0 rgba(0,0,0,0.9), 0 0 8px rgba(220,38,38,0.5)' }}>
                  {chapterNames[Number(ch) as 1]}
                </h3>
              </div>
            </div>
          </div>

          {/* Stages — each one a premium Card */}
          <div className="space-y-2">
            {stages.map(s => {
              const clear = clears[s.id];
              const locked = isLocked(s.id);
              const isBoss = s.num === 5;
              const isNext = s.id === nextStageId;
              const tint = locked ? undefined : isBoss ? '#dc2626' : isNext ? '#fbbf24' : undefined;
              return (
                <Link
                  to={locked ? '#' : `/battle/stage/${s.id}`}
                  key={s.id}
                  ref={isNext ? nextStageRef : undefined}
                  onClick={e => locked && e.preventDefault()}
                  className={`block ${locked ? 'pointer-events-none' : ''}`}
                  style={locked ? { opacity: 0.4 } : undefined}
                >
                  <Card
                    interactive={!locked}
                    tint={tint}
                    goldFrame={isBoss && !locked}
                    style={isNext && !locked ? { boxShadow: 'var(--shadow-card-hover), 0 0 0 2px rgba(251,191,36,0.6), 0 0 18px rgba(251,191,36,0.3)' } : undefined}
                  >
                    <div className="p-3 flex items-center gap-3">
                      {/* Stage icon — boss skull or sword cluster */}
                      <img
                        src={isBoss ? MODE_BOSS_ICON : MODE_STORY_ICON}
                        alt=""
                        className="w-10 h-10 object-contain shrink-0 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                        style={{ imageRendering: 'pixelated', filter: locked ? 'grayscale(1) brightness(0.4)' : undefined }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-pixel text-[10px] text-zinc-400 flex items-center gap-2">
                          STAGE {s.chapter}-{s.num}
                          {isBoss && <span className="text-rose-400">★ BOSS</span>}
                          {isNext && <span className="text-amber-300">▶ NEXT</span>}
                        </div>
                        <div className="text-sm text-zinc-100 mt-0.5 font-pixel">{s.name}</div>
                        <div className="text-[10px] text-zinc-500 mt-1">
                          ⚡{s.energyCost} · {s.rewards.gold.toLocaleString()}🪙 · {s.rewards.exp}xp
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {locked
                          ? <span className="text-zinc-500 text-xl">🔒</span>
                          : clear
                            ? <div className="text-amber-400 text-sm">{'★'.repeat(clear.stars)}{'☆'.repeat(3 - clear.stars)}</div>
                            : <span className="text-zinc-600 text-sm">☆☆☆</span>
                        }
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
