import { useNavigate } from 'react-router-dom';
import { useProfile } from '../store/profile';
import { DEFAULT_SETTINGS, type GameSettings } from '../lib/db';
import { sound } from '../lib/audio';
import { useEffect, useState } from 'react';

function Slider({ label, value, onChange, suffix }: { label: string; value: number; onChange: (n: number) => void; suffix?: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-zinc-300">{label}</span>
        <span className="font-pixel text-amber-300">{Math.round(value * 100)}{suffix ?? '%'}</span>
      </div>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-amber-400"
      />
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between cursor-pointer text-[11px] text-zinc-300 py-1.5">
      <span>{label}</span>
      <span className={`relative w-10 h-5 rounded-full transition-colors ${value ? 'bg-amber-500' : 'bg-zinc-700'}`}>
        <span className={`absolute top-0.5 ${value ? 'left-5' : 'left-0.5'} w-4 h-4 bg-zinc-950 rounded-full transition-all`} />
        <input type="checkbox" className="sr-only" checked={value} onChange={e => onChange(e.target.checked)} />
      </span>
    </label>
  );
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const profile = useProfile(s => s.profile);
  const patch = useProfile(s => s.patch);
  const [s, setS] = useState<GameSettings>(profile.settings ?? DEFAULT_SETTINGS);

  // Persist + apply on change
  useEffect(() => {
    const t = setTimeout(() => {
      patch({ settings: s });
      sound.applySettings({
        master: s.audioMaster,
        bgm: s.audioBgm,
        sfx: s.audioSfx,
        muted: s.audioMuted,
      });
    }, 200);
    return () => clearTimeout(t);
  }, [s]);

  function update<K extends keyof GameSettings>(key: K, value: GameSettings[K]) {
    setS(prev => ({ ...prev, [key]: value }));
  }

  return (
    <div className="p-3 space-y-3">
      <button onClick={() => navigate(-1)} className="text-xs text-zinc-400">← Back</button>
      <h2 className="font-pixel text-sm">⚙️ Settings</h2>

      {/* Audio */}
      <div className="rounded-md border border-zinc-800 bg-zinc-900 p-3 space-y-3">
        <div className="font-pixel text-xs text-amber-300">Audio</div>
        <Toggle label="Mute all audio" value={s.audioMuted} onChange={v => update('audioMuted', v)} />
        <Slider label="Master Volume"   value={s.audioMaster} onChange={v => update('audioMaster', v)} />
        <Slider label="Music"           value={s.audioBgm}    onChange={v => update('audioBgm', v)} />
        <Slider label="Sound Effects"   value={s.audioSfx}    onChange={v => update('audioSfx', v)} />
        <button className="btn-pixel w-full" onClick={() => sound.playSfx('click')}>Test SFX</button>
      </div>

      {/* Battle */}
      <div className="rounded-md border border-zinc-800 bg-zinc-900 p-3 space-y-3">
        <div className="font-pixel text-xs text-amber-300">Battle</div>
        <div>
          <div className="text-[11px] text-zinc-300 mb-1">Default battle speed</div>
          <div className="flex gap-1">
            {([1, 2, 4, 8] as const).map(spd => (
              <button
                key={spd}
                onClick={() => update('defaultBattleSpeed', spd)}
                className={`flex-1 text-[10px] font-pixel py-2 rounded border ${s.defaultBattleSpeed === spd ? 'border-amber-400 bg-amber-400/20 text-amber-300' : 'border-zinc-700 text-zinc-400'}`}
              >×{spd}</button>
            ))}
          </div>
        </div>
        <Toggle label="Reduced motion (less animation)" value={s.reduceMotion} onChange={v => update('reduceMotion', v)} />
      </div>

      {/* Display */}
      <div className="rounded-md border border-zinc-800 bg-zinc-900 p-3 space-y-3">
        <div className="font-pixel text-xs text-amber-300">Display</div>
        <Toggle label="CRT scanlines overlay" value={s.showScanlines} onChange={v => update('showScanlines', v)} />
      </div>

      <button
        className="btn-pixel danger w-full"
        onClick={() => setS({ ...DEFAULT_SETTINGS })}
      >Reset to defaults</button>

      <div className="text-[9px] text-zinc-600 text-center pt-2">
        Settings save automatically. Audio unlocks after first tap.
      </div>
    </div>
  );
}
