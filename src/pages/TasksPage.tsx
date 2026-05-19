import { useEffect, useState } from 'react';
import { TASKS } from '../data/tasks';
import { claimTask, getTaskList } from '../lib/tasks';
import { useProfile } from '../store/profile';

interface TaskRow {
  def: typeof TASKS[number];
  progress: number;
  claimed: boolean;
}

export default function TasksPage() {
  const [rows, setRows] = useState<TaskRow[]>([]);
  const profile = useProfile(s => s.profile);

  const refresh = async () => {
    const list = await getTaskList();
    setRows(list);
  };

  useEffect(() => { refresh(); }, [profile.gold, profile.gems]);

  async function onClaim(id: string) {
    await claimTask(id);
    await refresh();
  }

  return (
    <div className="p-3 space-y-2">
      <h2 className="font-pixel text-sm mb-2">Daily Tasks</h2>
      <p className="text-[10px] text-zinc-500 mb-3">Reset at midnight local time. Free rewards.</p>
      {rows.map(r => {
        const pct = Math.min(100, (r.progress / r.def.goal) * 100);
        const ready = r.progress >= r.def.goal && !r.claimed;
        return (
          <div key={r.def.id} className="rounded-md border border-zinc-800 bg-zinc-900 p-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="text-sm">{r.def.name}</div>
                <div className="text-[10px] text-zinc-500">
                  {Object.entries(r.def.rewards).map(([k, v]) => {
                    const icon = k === 'gold' ? '🪙' : k === 'gems' ? '💎' : '🤝';
                    return `${v} ${icon}`;
                  }).join(' · ')}
                </div>
              </div>
              <button
                disabled={!ready}
                onClick={() => onClaim(r.def.id)}
                className={`btn-pixel ${r.claimed ? '' : ready ? 'primary' : ''}`}
              >
                {r.claimed ? 'Claimed' : ready ? 'Claim' : 'Locked'}
              </button>
            </div>
            <div className="h-1.5 bg-zinc-800 rounded mt-2 overflow-hidden">
              <div className="h-full bg-amber-400" style={{ width: `${pct}%` }} />
            </div>
            <div className="text-[10px] text-zinc-500 mt-1 text-right">{r.progress}/{r.def.goal}</div>
          </div>
        );
      })}
    </div>
  );
}
