import { Link, useNavigate } from 'react-router-dom';
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
import Card from '../components/ui/Card';
import PrimaryButton from '../components/ui/PrimaryButton';
import { asset } from '../lib/assetPath';

const UI_BANNER = asset('sprites/ui/banner_home.png');
const MODE_ICONS = {
  story:  asset('sprites/ui/mode_story.png'),
  summon: asset('sprites/ui/mode_summon.png'),
  heroes: asset('sprites/ui/mode_heroes.png'),
  tasks:  asset('sprites/ui/mode_tasks.png'),
};

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
      {/* Header banner — painted dark-fantasy backdrop (Nano Banana) with
          title + greeting overlay. The center of the painting has empty
          negative space reserved for the title, so the overlay reads cleanly. */}
      <div className="relative rounded-xl overflow-hidden mb-3 h-36 flex items-center justify-center"
        style={{
          backgroundImage: `url(${UI_BANNER})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 50%',
          border: '1px solid #5a2222',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        {/* Darken bottom for greeting readability */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, transparent 30%, rgba(10,3,3,0.85) 100%)',
          }}
        />
        <div className="relative z-10 text-center px-4">
          <h1 className="font-fantasy text-3xl font-bold tracking-widest" style={{
            color: '#fde68a',
            textShadow: '0 2px 0 rgba(0,0,0,0.95), 0 0 22px rgba(220,38,38,0.7), 0 0 8px rgba(0,0,0,0.9)',
          }}>BONEWAKE</h1>
          <p className="text-[11px] text-zinc-200 mt-2 text-shadow-deep tracking-wide italic">
            "Welcome back, {profile.displayName}."
          </p>
        </div>
      </div>

      {/* Daily sign-in */}
      <Card>
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="font-pixel text-xs text-zinc-200 text-shadow-soft">Daily Sign-In</div>
            <div className="text-[10px] text-zinc-500">Streak: <span className="text-amber-300">{profile.signinStreak}</span></div>
          </div>
          <div className="grid grid-cols-7 gap-1.5 mb-3">
            {DAILY_SIGNIN.map((d, i) => {
              const claimed = i < nextDay && profile.signinStreak >= i + 1;
              const today = i === nextDay && canClaim;
              return (
                <motion.div
                  key={d.day}
                  initial={false}
                  animate={today ? { y: [0, -2, 0] } : undefined}
                  transition={today ? { duration: 1.6, repeat: Infinity, ease: 'easeInOut' } : undefined}
                  className={`aspect-square rounded-md text-center flex flex-col items-center justify-center text-[10px] ${
                    today ? 'daily-pulse' : ''
                  }`}
                  style={{
                    background: claimed
                      ? 'linear-gradient(180deg, #1c1817 0%, #0e0c0b 100%)'
                      : today
                        ? 'linear-gradient(180deg, #fde68a 0%, #b45309 100%)'
                        : 'linear-gradient(180deg, #1c1817 0%, #0c0a09 100%)',
                    border: today ? '1px solid #fbbf24' : '1px solid #2a2521',
                    color: today ? '#1a0f06' : claimed ? '#52525b' : '#d4d4d8',
                    opacity: claimed ? 0.45 : 1,
                    textShadow: today ? '0 1px 0 rgba(255,248,220,0.5)' : '0 1px 0 rgba(0,0,0,0.5)',
                  }}
                >
                  <div className="text-[8px] font-pixel">D{d.day}</div>
                  <div className="text-base leading-none mt-0.5">
                    {claimed ? '✓' : today ? '🎁' : i === 6 ? '👑' : i === 5 ? '💎' : '📦'}
                  </div>
                </motion.div>
              );
            })}
          </div>
          <PrimaryButton variant="gold" fullWidth disabled={!canClaim} onClick={claimDaily}>
            {canClaim ? `▸ Claim Day ${nextDay + 1}` : 'Claimed Today ✓'}
          </PrimaryButton>
        </div>
      </Card>

      {/* Daily mystery box */}
      <Card
        interactive={mysteryAvailable}
        onClick={mysteryAvailable ? openMysteryBox : undefined}
        goldFrame={mysteryAvailable}
        tint={mysteryAvailable ? '#dc2626' : undefined}
        style={!mysteryAvailable ? { opacity: 0.5 } : undefined}
      >
        <div className="p-3 flex items-center gap-3">
          <motion.div
            animate={mysteryAvailable ? { rotate: [0, -10, 10, -4, 4, 0], y: [0, -3, 0] } : {}}
            transition={mysteryAvailable ? { duration: 1.8, repeat: Infinity, repeatDelay: 1 } : {}}
            className="text-5xl drop-shadow-[0_3px_6px_rgba(0,0,0,0.7)]"
          >
            📦
          </motion.div>
          <div className="flex-1 text-left">
            <div className="font-pixel text-xs text-amber-300 text-shadow-soft">Daily Mystery Box</div>
            <div className="text-[10px] text-zinc-400 mt-1">
              {mysteryAvailable ? 'Tap to open · 3 random rewards' : 'Already opened today — comes back tomorrow'}
            </div>
          </div>
          {mysteryAvailable && <span className="text-amber-400 text-xl">›</span>}
        </div>
      </Card>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-2.5">
        <ActionCard to="/battle" iconSrc={MODE_ICONS.story}  label="Story"   sub={`${STAGES.length} stages`}                tint="#dc2626" />
        <ActionCard to="/summon" iconSrc={MODE_ICONS.summon} label="Summon"  sub={`${SUMMON_POOLS.length} banners`}          tint="#a78bfa" />
        <ActionCard to="/heroes" iconSrc={MODE_ICONS.heroes} label="Heroes"  sub={`${heroes.length} owned`}                   tint="#fbbf24" />
        <ActionCard to="/tasks"  iconSrc={MODE_ICONS.tasks}  label="Tasks"   sub={`${taskCount.done}/${taskCount.total} done`} tint="#34d399" />
      </div>

      {heroes.length === 0 && (
        <Card tint="#fbbf24">
          <div className="p-3 text-center">
            <div className="text-xs text-amber-300 font-pixel">No heroes yet</div>
            <div className="text-[10px] text-zinc-400 mt-1 mb-2">Visit the Summon screen to recruit your first.</div>
            <Link to="/summon"><PrimaryButton variant="gold">Go to Summon →</PrimaryButton></Link>
          </div>
        </Card>
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

// === Quick-action card component ===
// Each home-screen action card. Uses a custom PixelLab-painted icon
// (or emoji fallback) + label + subtitle. Lifts on hover, scales on tap.
function ActionCard({ to, icon, iconSrc, label, sub, tint }: {
  to: string;
  icon?: string;
  iconSrc?: string;
  label: string;
  sub: string;
  tint: string;
}) {
  const navigate = useNavigate();
  return (
    <Card interactive tint={tint} onClick={() => navigate(to)}>
      <div className="p-3 min-h-[100px] flex flex-col justify-between">
        {iconSrc ? (
          <img
            src={iconSrc}
            alt=""
            className="w-12 h-12 object-contain drop-shadow-[0_3px_6px_rgba(0,0,0,0.7)]"
            style={{ imageRendering: 'pixelated' }}
          />
        ) : (
          <div className="text-3xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)]">{icon}</div>
        )}
        <div>
          <div className="font-pixel text-xs text-zinc-100 text-shadow-soft">{label}</div>
          <div className="text-[10px] text-zinc-500 mt-0.5">{sub}</div>
        </div>
      </div>
    </Card>
  );
}
