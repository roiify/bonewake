import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ACHIEVEMENTS, CATEGORY_LABEL, type AchievementCat, type AchievementDef } from '../data/achievements';
import { claimAchievement, getClaimedIds, isComplete, progressFor } from '../lib/achievements';
import { useProfile } from '../store/profile';
import { useItems } from '../store/items';
import PageHeader from '../components/ui/PageHeader';

function rewardsLabel(rewards: AchievementDef['rewards']) {
  const parts: string[] = [];
  if (rewards.gold) parts.push(`${rewards.gold.toLocaleString()} 🪙`);
  if (rewards.gems) parts.push(`${rewards.gems} 💎`);
  if (rewards.friendPoints) parts.push(`${rewards.friendPoints} 🤝`);
  if (rewards.soulshard) parts.push(`${rewards.soulshard} 💠`);
  return parts.join(' · ');
}

export default function AchievementsPage() {
  const navigate = useNavigate();
  const profile = useProfile(s => s.profile);
  const refreshItems = useItems(s => s.refresh);
  const [claimedIds, setClaimedIds] = useState<Set<string>>(new Set());
  const [cat, setCat] = useState<AchievementCat | 'all'>('all');
  const [toast, setToast] = useState<string | null>(null);

  const refresh = async () => setClaimedIds(await getClaimedIds());
  useEffect(() => { refresh(); }, [profile.lifetime, profile.gold, profile.gems]);

  const visible = useMemo(() => {
    return ACHIEVEMENTS.filter(a => cat === 'all' || a.category === cat);
  }, [cat]);

  const claimedCount = claimedIds.size;
  const totalCount = ACHIEVEMENTS.length;

  async function onClaim(id: string) {
    const ok = await claimAchievement(id);
    if (ok) {
      const def = ACHIEVEMENTS.find(a => a.id === id);
      setToast(`✓ ${def?.name} unlocked!`);
      setTimeout(() => setToast(null), 2200);
      await refresh();
      await refreshItems();
    }
  }

  return (
    <div className="p-3 space-y-3">
      <button onClick={() => navigate(-1)} className="text-xs text-zinc-400">← Back</button>
      <PageHeader
        title="🏆 Achievements"
        tagline="Milestones with reward chests"
        glow="#fbbf24"
        rightSlot={<div className="text-[11px] text-amber-300 font-pixel">{claimedCount} / {totalCount}</div>}
      />

      {/* Category filter */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        <button
          className={`text-[10px] font-pixel px-2 py-1 rounded border whitespace-nowrap ${cat === 'all' ? 'border-amber-400 bg-amber-400/20 text-amber-300' : 'border-zinc-700 text-zinc-400'}`}
          onClick={() => setCat('all')}
        >All</button>
        {(Object.keys(CATEGORY_LABEL) as AchievementCat[]).map(c => (
          <button
            key={c}
            className={`text-[10px] font-pixel px-2 py-1 rounded border whitespace-nowrap ${cat === c ? 'border-amber-400 bg-amber-400/20 text-amber-300' : 'border-zinc-700 text-zinc-400'}`}
            onClick={() => setCat(c)}
          >{CATEGORY_LABEL[c]}</button>
        ))}
      </div>

      <div className="space-y-2">
        {visible.map(def => {
          const prog = progressFor(def);
          const complete = isComplete(def);
          const claimed = claimedIds.has(def.id);
          const pct = Math.min(100, (prog / def.goal) * 100);
          return (
            <div
              key={def.id}
              className={`rounded-md border-2 p-3 flex gap-3 transition-colors ${claimed ? 'opacity-60' : ''}`}
              style={{
                borderColor: claimed ? '#3f3f46' : complete ? '#22c55e' : '#3f3f46',
                background: claimed ? '#09090b' : complete ? '#0d1f12' : '#18181b',
                boxShadow: complete && !claimed ? '0 0 12px #22c55e40' : undefined,
              }}
            >
              <div className="w-12 h-12 rounded bg-zinc-950 flex items-center justify-center text-3xl shrink-0">
                {def.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <div className="text-xs font-pixel truncate" style={{ color: claimed ? '#71717a' : complete ? '#86efac' : '#fafafa' }}>{def.name}</div>
                  {claimed && <span className="text-[9px] font-pixel text-zinc-500">CLAIMED</span>}
                </div>
                <div className="text-[10px] text-zinc-400">{def.description}</div>
                <div className="h-1 bg-zinc-800 rounded mt-1.5 overflow-hidden">
                  <div className="h-full bg-amber-400" style={{ width: `${pct}%` }} />
                </div>
                <div className="text-[9px] text-zinc-500 mt-1">{prog.toLocaleString()} / {def.goal.toLocaleString()} · Reward: {rewardsLabel(def.rewards)}</div>
              </div>
              {complete && !claimed && (
                <button className="btn-pixel success shrink-0 self-center" onClick={() => onClaim(def.id)}>
                  Claim
                </button>
              )}
            </div>
          );
        })}
      </div>

      {toast && (
        <div className="fixed bottom-20 left-0 right-0 max-w-[420px] mx-auto px-3 z-50">
          <div className="rounded-md border border-amber-700 bg-amber-900/80 backdrop-blur text-amber-100 text-[11px] font-pixel p-2 text-center">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
