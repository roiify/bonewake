import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../store/profile';
import { PASS_TIERS, PASS_SEASON_DAYS } from '../data/missionPass';
import { claimPassTier, ensurePassSeason, passStatus } from '../lib/missionPass';

function rewardLabel(r: any): string {
  const bits: string[] = [];
  if (r.gold) bits.push(`${r.gold} 🪙`);
  if (r.gems) bits.push(`${r.gems} 💎`);
  if (r.friendPoints) bits.push(`${r.friendPoints} 🤝`);
  if (r.soulshard) bits.push(`${r.soulshard} 💠`);
  if (r.energy) bits.push(`${r.energy} ⚡`);
  if (r.equipmentMinRarity) bits.push(`★${r.equipmentMinRarity}+ gear`);
  return bits.join(' · ');
}

export default function MissionPassPage() {
  const navigate = useNavigate();
  useProfile(s => s.profile); // subscribe for re-render when pass state changes
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => { ensurePassSeason(); }, []);

  const status = passStatus();
  const xp = status.xp;
  const daysLeft = Math.max(0, PASS_SEASON_DAYS - status.day);

  async function claim(tier: number) {
    const r = await claimPassTier(tier);
    if (r.ok) setToast(`✓ Claimed tier ${tier}`);
    else setToast(r.error ?? 'Failed');
    setTimeout(() => setToast(null), 1800);
  }

  // Max XP to display = top tier's threshold
  const maxXp = PASS_TIERS[PASS_TIERS.length - 1].xpRequired;
  const progressPct = Math.min(100, (xp / maxXp) * 100);

  return (
    <div className="p-3 space-y-3 pb-5">
      <button onClick={() => navigate(-1)} className="text-xs text-zinc-400">← Back</button>

      <div className="rounded-lg border-2 border-amber-700 bg-gradient-to-b from-amber-950/30 to-zinc-900 p-3">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="font-pixel text-sm text-amber-300">📜 Mission Pass</h2>
            <div className="text-[10px] text-zinc-400">
              Season day {status.day}/{PASS_SEASON_DAYS} · {daysLeft}d remaining
            </div>
          </div>
          <div className="text-right">
            <div className="font-pixel text-base text-amber-300">{xp.toLocaleString()}</div>
            <div className="text-[9px] text-zinc-500">Pass XP</div>
          </div>
        </div>
        <div className="h-2 bg-zinc-800 rounded overflow-hidden">
          <div className="h-full bg-amber-400 transition-all" style={{ width: `${progressPct}%` }} />
        </div>
        <div className="text-[9px] text-zinc-500 mt-1">
          Earn Pass XP: 10/win, 30 per 3★ clear, 50 per boss, 25 per tower floor
        </div>
      </div>

      <div className="space-y-1.5">
        {PASS_TIERS.map(t => {
          const reached = xp >= t.xpRequired;
          const claimed = status.claimed.has(t.tier);
          const canClaim = reached && !claimed;
          return (
            <div
              key={t.tier}
              className={`rounded-md border-2 p-2 flex items-center gap-3 ${claimed ? 'opacity-50' : ''} ${t.feature ? 'border-amber-600 bg-amber-950/20' : 'border-zinc-800 bg-zinc-900'}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-pixel text-xs shrink-0 ${reached ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-800 text-zinc-500'}`}>
                {t.tier}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-pixel" style={{ color: t.feature ? '#fbbf24' : '#fafafa' }}>
                  Tier {t.tier} {t.feature && '★'}
                </div>
                <div className="text-[9px] text-zinc-500">{t.xpRequired.toLocaleString()} XP</div>
                <div className="text-[10px] text-zinc-300 truncate">{rewardLabel(t.reward)}</div>
              </div>
              <button
                className={`btn-pixel ${canClaim ? 'success' : ''} shrink-0`}
                disabled={!canClaim}
                onClick={() => claim(t.tier)}
              >
                {claimed ? '✓' : canClaim ? 'Claim' : 'Locked'}
              </button>
            </div>
          );
        })}
      </div>

      {toast && (
        <div className="fixed bottom-20 left-0 right-0 max-w-[420px] mx-auto px-3 z-50">
          <div className="rounded-md border border-emerald-700 bg-emerald-900/80 text-emerald-100 text-[11px] font-pixel p-2 text-center">{toast}</div>
        </div>
      )}
    </div>
  );
}
