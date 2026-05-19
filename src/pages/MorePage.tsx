import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getUnreadCount } from '../lib/mail';

const sections = [
  { to: '/tower', label: 'Tower of Trials', icon: '🗼', desc: 'Climb 100 floors, weekly reset' },
  { to: '/worldboss', label: 'World Boss', icon: '🌋', desc: 'Weekly raid, 3 attempts, tiered rewards' },
  { to: '/dungeons', label: 'Material Dungeons', icon: '⛏️', desc: 'Themed farming, weekday rotation' },
  { to: '/training', label: 'Training Chamber', icon: '💤', desc: 'Idle XP + gold while away' },
  { to: '/shop', label: 'Shop', icon: '🏪', desc: 'Spend gold/gems on essentials' },
  { to: '/mail', label: 'Mail', icon: '📬', desc: 'Reward inbox & messages' },
  { to: '/achievements', label: 'Achievements', icon: '🏆', desc: 'Milestones with reward chests' },
  { to: '/tasks', label: 'Daily Tasks', icon: '📜', desc: 'Free rewards for playing' },
  { to: '/bag', label: 'Inventory', icon: '🎒', desc: 'Equipment & loot drops' },
  { to: '/fragments', label: 'Hero Fragments', icon: '🧩', desc: 'Promote heroes through tiers' },
  { to: '/craft', label: 'Ultimate Crafting', icon: '⚒️', desc: 'Forge endgame sets from 3★ drops' },
  { to: '/debug', label: 'Debug Menu', icon: '🛠️', desc: 'Cheats, save export/import' },
];

export default function MorePage() {
  const [unread, setUnread] = useState(0);
  useEffect(() => { getUnreadCount().then(setUnread); }, []);
  return (
    <div className="p-3 space-y-2">
      <h2 className="font-pixel text-sm mb-3">More</h2>
      {sections.map(s => (
        <Link key={s.to} to={s.to} className="block rounded-md border border-zinc-800 bg-zinc-900 hover:border-zinc-600 p-3 flex items-center gap-3">
          <span className="text-2xl">{s.icon}</span>
          <div className="flex-1">
            <div className="text-sm flex items-center gap-1.5">
              {s.label}
              {s.to === '/mail' && unread > 0 && (
                <span className="bg-rose-500 text-zinc-950 text-[8px] font-pixel px-1.5 py-0.5 rounded-full">{unread}</span>
              )}
            </div>
            <div className="text-[10px] text-zinc-500">{s.desc}</div>
          </div>
          <ChevronRight size={16} className="text-zinc-500" />
        </Link>
      ))}
      <div className="pt-6 text-center text-[10px] text-zinc-600">
        Pixel Fighter · all save data stored locally
      </div>
    </div>
  );
}
