import { Outlet, NavLink } from 'react-router-dom';
import { useState } from 'react';
import { useProfile } from '../store/profile';
import { Home, Swords, Users, Sparkles, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import EnergyModal from './EnergyModal';

function CurrencyChip({ icon, value, color, onClick }: { icon: string; value: number; color: string; onClick?: () => void }) {
  const inner = (
    <>
      <span className="text-sm" style={{ color }}>{icon}</span>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={value}
          initial={{ y: -8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 8, opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="text-xs font-pixel text-zinc-200"
        >
          {value.toLocaleString()}
        </motion.span>
      </AnimatePresence>
    </>
  );
  if (onClick) {
    return (
      <button onClick={onClick} className="flex items-center gap-1.5 bg-zinc-900/80 border border-zinc-800 rounded-full px-2.5 py-1 hover:border-cyan-400 transition-colors cursor-pointer">
        {inner}
        <span className="text-[8px] text-zinc-500">+</span>
      </button>
    );
  }
  return (
    <div className="flex items-center gap-1.5 bg-zinc-900/80 border border-zinc-800 rounded-full px-2.5 py-1">{inner}</div>
  );
}

export function Shell() {
  const profile = useProfile(s => s.profile);
  const [energyOpen, setEnergyOpen] = useState(false);

  return (
    <div className="h-full flex flex-col max-w-[420px] mx-auto bg-zinc-950 relative">
      {/* Top bar */}
      <header className="px-2.5 py-2 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur z-10 sticky top-0">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-base font-pixel text-zinc-900">
            {profile.level}
          </div>
          <div className="flex-1">
            <div className="text-xs font-pixel text-zinc-100 truncate">{profile.displayName}</div>
            <div className="h-1 bg-zinc-800 rounded mt-0.5 overflow-hidden">
              <div
                className="h-full bg-amber-400"
                style={{ width: `${Math.min(100, (profile.exp / Math.max(1, 50 * Math.pow(1.18, profile.level - 1))) * 100)}%` }}
              />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-1.5 mt-2">
          <CurrencyChip icon="🪙" value={profile.gold} color="#fbbf24" />
          <CurrencyChip icon="💎" value={profile.gems} color="#a78bfa" />
          <CurrencyChip icon="🤝" value={profile.friendPoints} color="#fb7185" />
          <CurrencyChip icon="⚡" value={profile.energy} color="#22d3ee" onClick={() => setEnergyOpen(true)} />
        </div>
      </header>

      <EnergyModal open={energyOpen} onClose={() => setEnergyOpen(false)} />

      {/* Content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden pb-[max(12px,env(safe-area-inset-bottom))]">
        <Outlet />
      </main>

      {/* Bottom nav */}
      <nav className="grid grid-cols-5 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur z-10 sticky bottom-0 pb-[max(0px,env(safe-area-inset-bottom))]">
        <TabLink to="/" icon={<Home size={18} />} label="Home" />
        <TabLink to="/battle" icon={<Swords size={18} />} label="Battle" />
        <TabLink to="/heroes" icon={<Users size={18} />} label="Heroes" />
        <TabLink to="/summon" icon={<Sparkles size={18} />} label="Summon" />
        <TabLink to="/more" icon={<Settings size={18} />} label="More" />
      </nav>
    </div>
  );
}

function TabLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `flex flex-col items-center justify-center py-2.5 gap-1 transition-colors ${
          isActive ? 'text-amber-400' : 'text-zinc-500 hover:text-zinc-300'
        }`
      }
    >
      {icon}
      <span className="text-[9px] font-pixel uppercase">{label}</span>
    </NavLink>
  );
}
