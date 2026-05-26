import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getUnreadCount } from '../lib/mail';
import { useProfile } from '../store/profile';
import { GATE_BY_PATH } from '../data/gating';
import PageHeader from '../components/ui/PageHeader';

const sections = [
  // Game Modes link removed — that's the Modes tab in the bottom nav.
  { to: '/shop', label: 'Shop', icon: '🏪', desc: 'Spend gold/gems on essentials' },
  { to: '/mail', label: 'Mail', icon: '📬', desc: 'Reward inbox & messages' },
  { to: '/achievements', label: 'Achievements', icon: '🏆', desc: 'Milestones with reward chests' },
  { to: '/tasks', label: 'Daily Tasks', icon: '📜', desc: 'Free rewards for playing' },
  { to: '/settings', label: 'Settings', icon: '⚙️', desc: 'Audio, battle speed, display' },
  { to: '/bag', label: 'Inventory', icon: '🎒', desc: 'Equipment & loot drops' },
  { to: '/fragments', label: 'Hero Fragments', icon: '🧩', desc: 'Promote heroes through tiers' },
  { to: '/craft', label: 'Ultimate Crafting', icon: '⚒️', desc: 'Forge endgame sets from 3★ drops' },
  { to: '/debug', label: 'Debug Menu', icon: '🛠️', desc: 'Cheats, save export/import' },
];

export default function MorePage() {
  const [unread, setUnread] = useState(0);
  const profile = useProfile(s => s.profile);
  useEffect(() => { getUnreadCount().then(setUnread); }, []);
  return (
    <div className="p-3 space-y-2 pb-5">
      <PageHeader title="More" tagline="Game modes, currencies, settings" glow="#a78bfa" />
      {sections.map(s => {
        const gate = GATE_BY_PATH[s.to];
        const locked = !!gate && profile.level < gate.unlockLevel;
        return (
          <Link
            key={s.to}
            to={locked ? '#' : s.to}
            onClick={e => locked && e.preventDefault()}
            className={`block rounded-md border p-3 flex items-center gap-3 min-h-16 ${locked ? 'border-zinc-800 bg-zinc-900/40 opacity-60 cursor-not-allowed' : 'border-zinc-800 bg-zinc-900 hover:border-zinc-600'}`}
          >
            <span className="text-2xl">{locked ? '🔒' : s.icon}</span>
            <div className="flex-1">
              <div className="text-sm leading-tight flex items-center gap-1.5 flex-wrap">
                {s.label}
                {s.to === '/mail' && unread > 0 && (
                  <span className="bg-rose-500 text-zinc-950 text-[8px] font-pixel px-1.5 py-0.5 rounded-full">{unread}</span>
                )}
              </div>
              <div className="text-[10px] text-zinc-500">
                {locked ? `Unlocks at player level ${gate!.unlockLevel}` : s.desc}
              </div>
            </div>
            {!locked && <ChevronRight size={16} className="text-zinc-500" />}
          </Link>
        );
      })}
      <div className="pt-6 text-center text-[10px] text-zinc-600">
        BoneWake · all save data stored locally
      </div>
    </div>
  );
}
