import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useProfile } from '../store/profile';
import { GATE_BY_PATH } from '../data/gating';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import { asset } from '../lib/assetPath';

const ICON = {
  tower:    asset('sprites/ui/mode_tower.png'),
  worldboss: asset('sprites/ui/mode_boss.png'),
  shatter:  asset('sprites/ui/mode_boss.png'),
  trials:   asset('sprites/ui/mode_story.png'),
  dungeons: asset('sprites/ui/mode_tasks.png'),
  echoes:   asset('sprites/ui/mode_summon.png'),
  training: asset('sprites/ui/mode_heroes.png'),
};

const MODES = [
  { to: '/tower',    label: 'Tower of Trials',  icon: ICON.tower,     tint: '#fb7185',
    desc: 'Climb endless floors. Daily attempts; floors 1-100 reset weekly.' },
  { to: '/worldboss', label: 'World Boss',      icon: ICON.worldboss, tint: '#dc2626',
    desc: 'Daily boss · BEST single-attempt damage sets the tier.' },
  { to: '/spirit',   label: 'Shatter',          icon: ICON.shatter,   tint: '#fbbf24',
    desc: 'Daily · cumulative damage stacks across attempts toward one HP pool.' },
  { to: '/trials',   label: 'Hero Trials',      icon: ICON.trials,    tint: '#fb7185',
    desc: 'Themed runs with squad restrictions. Bonus gems + soulshards.' },
  { to: '/dungeons', label: 'Material Dungeons', icon: ICON.dungeons, tint: '#34d399',
    desc: 'Themed farming, open daily; guaranteed gold / XP / gear / gems.' },
  { to: '/echoes',   label: 'Boss Echoes',      icon: ICON.echoes,    tint: '#a78bfa',
    desc: 'Collect Echoes from defeated bosses. Equip up to 5 for account-wide passives.' },
  { to: '/training', label: 'Training Chamber', icon: ICON.training,  tint: '#22d3ee',
    desc: 'Idle XP + gold while away. Pick one hero; caps at 24h accrual.' },
];

export default function ModesPage() {
  const profile = useProfile(s => s.profile);
  return (
    <div className="p-3 space-y-3 pb-5">
      <PageHeader
        title="Modes"
        tagline="Every battle mode beyond Story · daily, endless, and idle"
        glow="#dc2626"
      />
      {MODES.map(m => {
        const gate = GATE_BY_PATH[m.to];
        const locked = !!gate && profile.level < gate.unlockLevel;
        return (
          <Link
            key={m.to}
            to={locked ? '#' : m.to}
            onClick={e => locked && e.preventDefault()}
            className={`block ${locked ? 'pointer-events-none' : ''}`}
          >
            <Card interactive={!locked} tint={locked ? undefined : m.tint}>
              <div className="p-3 flex items-center gap-3">
                <img
                  src={m.icon}
                  alt=""
                  className="w-12 h-12 object-contain shrink-0 drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)]"
                  style={{ imageRendering: 'pixelated', filter: locked ? 'grayscale(1) brightness(0.4)' : undefined }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-pixel text-zinc-100 text-shadow-soft">
                    {locked ? '🔒 ' : ''}{m.label}
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-0.5 leading-snug">
                    {locked ? `Unlocks at player level ${gate!.unlockLevel}` : m.desc}
                  </div>
                </div>
                {!locked && <ChevronRight size={16} className="text-zinc-500 shrink-0" />}
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
