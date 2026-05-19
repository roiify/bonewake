import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { recentBattles } from '../lib/battleLog';
import type { BattleLogEntry } from '../lib/db';
import { HERO_BY_ID, HERO_SPRITES, ENEMY_SPRITES } from '../data/heroes';
import { StaticSprite } from '../components/SpriteAnimator';

function timeAgo(ms: number): string {
  const diff = Date.now() - ms;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

const SOURCE_LABEL: Record<BattleLogEntry['source'], { name: string; color: string }> = {
  stage:     { name: 'Story',       color: '#fbbf24' },
  tower:     { name: 'Tower',       color: '#06b6d4' },
  worldboss: { name: 'World Boss',  color: '#f97316' },
  spirit:    { name: 'Spirit Bomb', color: '#a855f7' },
  dungeon:   { name: 'Dungeon',     color: '#84cc16' },
  trial:     { name: 'Trial',       color: '#fb7185' },
};

export default function BattleLogPage() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<BattleLogEntry[]>([]);

  useEffect(() => { recentBattles(50).then(setLogs); }, []);

  return (
    <div className="p-3 space-y-3 pb-5">
      <button onClick={() => navigate(-1)} className="text-xs text-zinc-400">← Back</button>
      <h2 className="font-pixel text-sm">📊 Battle Log</h2>

      {logs.length === 0 ? (
        <div className="text-center text-xs text-zinc-500 py-10">No battles logged yet.</div>
      ) : (
        <div className="space-y-2">
          {logs.map(l => {
            const sl = SOURCE_LABEL[l.source];
            return (
              <div
                key={l.id}
                className="rounded-md border-2 p-2.5 bg-zinc-900"
                style={{ borderColor: l.won ? '#22c55e40' : '#ef444440' }}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-pixel" style={{ color: sl.color }}>{sl.name}</span>
                    {l.sourceId && <span className="text-[10px] text-zinc-400">{l.sourceId}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    {l.won ? (
                      <span className="text-[10px] font-pixel text-emerald-400">WIN</span>
                    ) : (
                      <span className="text-[10px] font-pixel text-rose-400">LOSS</span>
                    )}
                    {l.stars != null && <span className="text-[10px] text-amber-400">{'★'.repeat(l.stars)}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mb-1">
                  {l.squadIds.map((tid, i) => {
                    const tpl = HERO_BY_ID[tid];
                    if (!tpl) return null;
                    return (
                      <div key={i} className="w-7 h-7 rounded bg-zinc-950 flex items-center justify-center overflow-hidden">
                        {HERO_SPRITES[tid] ? <StaticSprite src={HERO_SPRITES[tid].idle} size={28} /> : <span className="text-sm">{tpl.emoji}</span>}
                      </div>
                    );
                  })}
                  <span className="text-zinc-500 text-[10px] mx-1">vs</span>
                  {l.enemyTemplates.slice(0, 4).map((tid, i) => {
                    const sprite = ENEMY_SPRITES[tid as keyof typeof ENEMY_SPRITES];
                    return (
                      <div key={i} className="w-7 h-7 rounded bg-zinc-950 flex items-center justify-center overflow-hidden">
                        {sprite ? <StaticSprite src={sprite.idle} size={28} className="scale-x-[-1]" /> : <span className="text-sm">💀</span>}
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between text-[9px] text-zinc-500">
                  <span>{timeAgo(l.finishedAt)}</span>
                  {l.damageDealt != null && <span>{l.damageDealt.toLocaleString()} dmg dealt</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
