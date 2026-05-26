import { Outlet, NavLink, Link } from 'react-router-dom';
import { useState } from 'react';
import { useProfile } from '../store/profile';
import { Home, Swords, Users, Sparkles, Flame, Menu } from 'lucide-react';
import EnergyModal from './EnergyModal';
import { TITLE_BY_ID } from '../data/titles';
import Pill from './ui/Pill';
import { asset } from '../lib/assetPath';

const UI = {
  gold:   asset('sprites/ui/currency_gold.png'),
  gem:    asset('sprites/ui/currency_gem.png'),
  friend: asset('sprites/ui/currency_friend.png'),
  energy: asset('sprites/ui/currency_energy.png'),
};

export function Shell() {
  const profile = useProfile(s => s.profile);
  const [energyOpen, setEnergyOpen] = useState(false);

  return (
    <div className="h-full flex flex-col max-w-[420px] mx-auto relative" style={{ background: 'linear-gradient(180deg, #14100f 0%, #0a0708 100%)' }}>
      {/* Ambient ash particle layer — drifts behind everything via CSS */}
      <div className="ash-overlay" />

      {/* Top bar */}
      <header className="px-3 py-2.5 border-b border-zinc-800/80 bg-zinc-950/85 backdrop-blur z-20 sticky top-0">
        <Link to="/profile" className="flex items-center gap-2.5 hover:bg-zinc-900/40 rounded -m-1 p-1 transition-colors">
          {/* Level badge — beveled gold disc */}
          <div
            className={`relative w-10 h-10 rounded-lg flex items-center justify-center font-pixel level-badge-halo ${
              profile.level >= 100 ? 'text-[11px]' : 'text-base'
            }`}
            style={{
              background: 'linear-gradient(180deg, #fde68a 0%, #d97706 60%, #92400e 100%)',
              color: '#1a0f06',
              border: '1px solid #fde68a',
              boxShadow:
                '0 1px 0 rgba(255,255,255,0.35) inset, 0 -2px 0 rgba(0,0,0,0.45) inset, 0 2px 5px rgba(0,0,0,0.6), 0 0 14px rgba(251, 191, 36, 0.35)',
              textShadow: '0 1px 0 rgba(255,248,220,0.65)',
            }}
          >
            {profile.level}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-pixel text-zinc-100 truncate text-shadow-soft">{profile.displayName}</div>
            {profile.activeTitle && TITLE_BY_ID[profile.activeTitle] && (
              <div className="text-[9px] font-pixel truncate text-shadow-soft" style={{ color: TITLE_BY_ID[profile.activeTitle].color }}>
                {TITLE_BY_ID[profile.activeTitle].label}
              </div>
            )}
            <div className="h-1 bg-zinc-900 rounded mt-1 overflow-hidden border border-zinc-800">
              <div
                className="h-full"
                style={{
                  width: `${Math.min(100, (profile.exp / Math.max(1, 50 * Math.pow(1.18, profile.level - 1))) * 100)}%`,
                  background: 'linear-gradient(90deg, #fbbf24, #fde68a)',
                  boxShadow: '0 0 6px rgba(251, 191, 36, 0.6)',
                }}
              />
            </div>
          </div>
        </Link>
        <div className="grid grid-cols-4 gap-1.5 mt-2.5">
          <Pill icon="🪙" iconSrc={UI.gold}   value={profile.gold}         color="#fbbf24" variant="gold"   />
          <Pill icon="💎" iconSrc={UI.gem}    value={profile.gems}         color="#a78bfa" variant="gem"    />
          <Pill icon="🤝" iconSrc={UI.friend} value={profile.friendPoints} color="#fb7185" variant="rose"   />
          <Pill icon="⚡" iconSrc={UI.energy} value={profile.energy}       color="#22d3ee" variant="energy" onClick={() => setEnergyOpen(true)} plus />
        </div>
      </header>

      <EnergyModal open={energyOpen} onClose={() => setEnergyOpen(false)} />

      {/* Content — must NOT create its own stacking context, otherwise
          fixed-position modals (z-50) inside pages can't escape it and
          end up trapped beneath the bottom nav (z-20). Paint order keeps
          main above the ash overlay since it's the later sibling. */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden pb-[max(12px,env(safe-area-inset-bottom))]">
        <Outlet />
      </main>

      {/* Bottom nav */}
      <nav className="grid grid-cols-6 border-t border-zinc-800/80 bg-zinc-950/85 backdrop-blur z-20 sticky bottom-0 pb-[max(0px,env(safe-area-inset-bottom))]">
        <TabLink to="/" icon={<Home size={18} />} label="Home" />
        <TabLink to="/battle" icon={<Swords size={18} />} label="Story" />
        <TabLink to="/modes" icon={<Flame size={18} />} label="Modes" />
        <TabLink to="/heroes" icon={<Users size={18} />} label="Heroes" />
        <TabLink to="/summon" icon={<Sparkles size={18} />} label="Summon" />
        <TabLink to="/more" icon={<Menu size={18} />} label="More" />
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
        `relative flex flex-col items-center justify-center py-2.5 gap-1 transition-colors ${
          isActive ? 'nav-tab--active' : 'text-zinc-500 hover:text-zinc-300'
        }`
      }
    >
      {icon}
      <span className="text-[9px] font-pixel uppercase">{label}</span>
    </NavLink>
  );
}
