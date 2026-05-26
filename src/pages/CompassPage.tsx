import { useNavigate } from 'react-router-dom';
import { useProfile } from '../store/profile';
import { STAGES } from '../data/stages';
import { pickHotStages, compassHints, COMPASS_REWARD } from '../data/compass';
import { isoWeek } from '../data/tower';
import PageHeader from '../components/ui/PageHeader';

const CHAPTER_NAME: Record<number, string> = {
  1: 'Forsaken Fields', 2: 'Ashen Wastes', 3: 'Dread Court',
  4: 'Whispering Crypts', 5: 'Pale Cathedral', 6: "World's Edge",
};

export default function CompassPage() {
  const navigate = useNavigate();
  const profile = useProfile(s => s.profile);

  const week = isoWeek();
  const hot = pickHotStages(week);
  const hints = compassHints(week);
  const found = profile.compassWeek === week ? (profile.compassFound ?? []) : [];

  return (
    <div className="p-3 space-y-3 pb-5">
      <button onClick={() => navigate(-1)} className="text-xs text-zinc-400">← Back</button>
      <PageHeader
        title="🧭 Soul Compass"
        tagline="5 hot stages weekly · 3-star each for a hidden cache"
        glow="#fbbf24"
      />
      <p className="text-[10px] text-zinc-400 px-2 leading-snug">
        The compass only hints at <span className="text-amber-300">which chapters</span> contain
        hot stages — figure out the exact ones by scouting.
      </p>

      <div className="rounded-lg border-2 border-amber-700 bg-amber-900/15 p-3">
        <div className="font-pixel text-xs text-amber-300 mb-2">This Week's Hints</div>
        {hints.map(h => (
          <div key={h.chapter} className="flex items-center justify-between text-[11px] py-1 border-b border-amber-900/40 last:border-b-0">
            <span>Chapter {h.chapter} — {CHAPTER_NAME[h.chapter]}</span>
            <span className="font-pixel text-amber-300">{h.count} hot</span>
          </div>
        ))}
      </div>

      <div className="rounded-md border border-zinc-800 bg-zinc-900 p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="font-pixel text-xs">Caches Found</div>
          <div className="text-[10px] text-emerald-400 font-pixel">{found.length} / 5</div>
        </div>
        <div className="h-2 bg-zinc-800 rounded overflow-hidden mb-2">
          <div className="h-full bg-emerald-400 transition-all" style={{ width: `${(found.length / 5) * 100}%` }} />
        </div>
        <div className="text-[10px] text-zinc-500">
          Each cache rewards: {COMPASS_REWARD.gold} 🪙 · {COMPASS_REWARD.gems} 💎 · {COMPASS_REWARD.soulshard} 💠
        </div>
      </div>

      {/* Spoilers section (collapsible-ish — just shows after found) */}
      <details className="rounded-md border border-zinc-800 bg-zinc-900 p-2">
        <summary className="text-[10px] text-zinc-400 cursor-pointer">Show spoiler: exact hot stages</summary>
        <div className="mt-2 space-y-1">
          {hot.map(id => {
            const s = STAGES.find(s => s.id === id);
            const isFound = found.includes(id);
            return (
              <div key={id} className="text-[10px] flex items-center justify-between">
                <span className={isFound ? 'text-zinc-500 line-through' : 'text-zinc-300'}>
                  {s ? `${s.id} — ${s.name}` : id}
                </span>
                {isFound && <span className="text-emerald-400">✓</span>}
              </div>
            );
          })}
        </div>
      </details>
    </div>
  );
}
