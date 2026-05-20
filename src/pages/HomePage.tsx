import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useProfile } from '../store/profile';
import { db } from '../lib/db';
import { DAILY_SIGNIN } from '../data/dailySignin';
import { TASKS } from '../data/tasks';
import { STAGES } from '../data/stages';
import { SUMMON_POOLS } from '../data/summonPools';
import { useHeroes } from '../store/heroes';
import { motion } from 'framer-motion';
import { canClaimMysteryBox, claimMysteryBox } from '../lib/mysteryBox';
import ChestOpen, { type ChestReward } from '../components/ChestOpen';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function HomePage() {
  const profile = useProfile(s => s.profile);
  const patch = useProfile(s => s.patch);
  const heroes = useHeroes(s => s.heroes);
  const [taskCount, setTaskCount] = useState({ done: 0, total: TASKS.length });
  const [chestRewards, setChestRewards] = useState<ChestReward[] | null>(null);
  const mysteryAvailable = canClaimMysteryBox(profile.mysteryBoxLastClaim);

  async function openMysteryBox() {
    const rewards = await claimMysteryBox();
    if (rewards.length > 0) setChestRewards(rewards);
  }

  useEffect(() => {
    (async () => {
      const cycle = todayStr();
      const all = await db.tasks.toArray();
      const today = all.filter(t => t.cycleStart === cycle);
      setTaskCount({ done: today.filter(t => t.claimed).length, total: TASKS.length });
    })();
  }, [profile.gold, profile.gems]);

  const canClaim = profile.lastDailyClaim !== todayStr();
  const nextDay = profile.signinStreak % 7;

  async function claimDaily() {
    if (!canClaim) return;
    const day = (profile.signinStreak % 7) + 1;
    const reward = DAILY_SIGNIN[day - 1];
    const r = reward.rewards as any;
    await patch({
      lastDailyClaim: todayStr(),
      signinStreak: profile.signinStreak + 1,
      gold: profile.gold + (r.gold ?? 0),
      gems: profile.gems + (r.gems ?? 0),
      friendPoints: profile.friendPoints + (r.friendPoints ?? 0),
    });
  }

  return (
    <div className="p-3 space-y-3 pb-5">
      <div
        className="relative rounded-lg overflow-hidden border border-zinc-800 mb-3 h-28 sm:h-32 flex items-end justify-center"
        style={{
          backgroundImage: `url(${import.meta.env.BASE_URL}sprites/bg/sky_clouds.jpg)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 30%',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
        <div className="relative z-10 text-center pb-3">
          <h1 className="font-pixel text-xl text-amber-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Pixel Fighter</h1>
          <p className="text-xs text-zinc-300 mt-1 drop-shadow">Welcome back, {profile.displayName}.</p>
        </div>
      </div>

      {/* Daily sign-in */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="font-pixel text-xs text-zinc-300">Daily Sign-In</div>
          <div className="text-[10px] text-zinc-500">Streak: {profile.signinStreak}</div>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-3">
          {DAILY_SIGNIN.map((d, i) => {
            const claimed = i < nextDay && profile.signinStreak >= i + 1;
            const today = i === nextDay && canClaim;
            return (
              <div
                key={d.day}
                className={`aspect-square rounded text-center flex flex-col items-center justify-center border ${
                  claimed ? 'bg-zinc-800 border-zinc-700 opacity-50'
                  : today ? 'bg-amber-500/20 border-amber-400 animate-pulse'
                  : 'bg-zinc-950 border-zinc-800'
                }`}
              >
                <div className="text-[8px] text-zinc-400">D{d.day}</div>
                <div className="text-[10px]">{d.label.split(' ')[0]}</div>
              </div>
            );
          })}
        </div>
        <button
          className="btn-pixel primary w-full"
          disabled={!canClaim}
          onClick={claimDaily}
        >
          {canClaim ? `Claim Day ${nextDay + 1}` : 'Claimed Today ✓'}
        </button>
      </div>

      {/* Daily mystery box */}
      <button
        disabled={!mysteryAvailable}
        onClick={openMysteryBox}
        className={`w-full rounded-lg border-2 p-3 flex items-center gap-3 transition-all ${
          mysteryAvailable
            ? 'border-amber-500 bg-gradient-to-r from-amber-900/30 to-rose-900/20 hover:scale-[1.02]'
            : 'border-zinc-800 bg-zinc-900/40 opacity-50 cursor-not-allowed'
        }`}
      >
        <motion.div
          animate={mysteryAvailable ? { rotate: [0, -8, 8, -4, 4, 0], y: [0, -2, 0] } : {}}
          transition={mysteryAvailable ? { duration: 1.8, repeat: Infinity, repeatDelay: 1 } : {}}
          className="text-4xl"
        >
          📦
        </motion.div>
        <div className="flex-1 text-left">
          <div className="font-pixel text-xs text-amber-300">Daily Mystery Box</div>
          <div className="text-[10px] text-zinc-400">
            {mysteryAvailable ? 'Tap to open today\'s box (3 random rewards)' : 'Already opened today — comes back tomorrow'}
          </div>
        </div>
      </button>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-2.5">
        <Link to="/battle" className="rounded-lg border border-zinc-800 bg-gradient-to-br from-rose-900/40 to-zinc-900 p-3 min-h-24 hover:border-rose-700 transition-colors">
          <div className="text-2xl">⚔️</div>
          <div className="font-pixel text-xs mt-2">Story</div>
          <div className="text-[10px] text-zinc-500 mt-0.5">{STAGES.length} stages</div>
        </Link>
        <Link to="/summon" className="rounded-lg border border-zinc-800 bg-gradient-to-br from-violet-900/40 to-zinc-900 p-3 min-h-24 hover:border-violet-700 transition-colors">
          <div className="text-2xl">✨</div>
          <div className="font-pixel text-xs mt-2">Summon</div>
          <div className="text-[10px] text-zinc-500 mt-0.5">{SUMMON_POOLS.length} banners</div>
        </Link>
        <Link to="/heroes" className="rounded-lg border border-zinc-800 bg-gradient-to-br from-amber-900/40 to-zinc-900 p-3 min-h-24 hover:border-amber-700 transition-colors">
          <div className="text-2xl">👥</div>
          <div className="font-pixel text-xs mt-2">Heroes</div>
          <div className="text-[10px] text-zinc-500 mt-0.5">{heroes.length} owned</div>
        </Link>
        <Link to="/tasks" className="rounded-lg border border-zinc-800 bg-gradient-to-br from-emerald-900/40 to-zinc-900 p-3 min-h-24 hover:border-emerald-700 transition-colors">
          <div className="text-2xl">📜</div>
          <div className="font-pixel text-xs mt-2">Tasks</div>
          <div className="text-[10px] text-zinc-500 mt-0.5">{taskCount.done}/{taskCount.total} done</div>
        </Link>
      </div>

      {heroes.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="rounded-lg border border-amber-700/50 bg-amber-900/20 p-3 text-center"
        >
          <div className="text-xs text-amber-300">No heroes yet! Try the Summon screen.</div>
          <Link to="/summon" className="inline-block mt-2 btn-pixel primary">Go to Summon</Link>
        </motion.div>
      )}

      <ChestOpen
        open={chestRewards !== null}
        rewards={chestRewards ?? []}
        rarity="epic"
        onClose={() => setChestRewards(null)}
      />
    </div>
  );
}
