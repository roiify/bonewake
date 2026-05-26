import { useNavigate } from 'react-router-dom';
import { useProfile } from '../store/profile';
import { DEFAULT_SETTINGS, normalizeSettings, type GameSettings } from '../lib/db';
import { useEffect, useRef, useState } from 'react';
import BackupsPanel from '../components/BackupsPanel';

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
  const [s, setS] = useState<GameSettings>(normalizeSettings(profile.settings));
  const latestRef = useRef(s);
  latestRef.current = s;

  // Flush any pending write on unmount so quick taps + navigate-away still save.
  useEffect(() => {
    return () => { patch({ settings: latestRef.current }); };
  }, []);

  function update<K extends keyof GameSettings>(key: K, value: GameSettings[K]) {
    setS(prev => {
      const next = { ...prev, [key]: value };
      patch({ settings: next });
      return next;
    });
  }

  function resetSettings() {
    setS({ ...DEFAULT_SETTINGS });
    patch({ settings: { ...DEFAULT_SETTINGS } });
  }

  return (
    <div className="p-3 space-y-3">
      <button onClick={() => navigate(-1)} className="text-xs text-zinc-400">← Back</button>
      <h2 className="font-pixel text-sm">⚙️ Settings</h2>

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
        <Toggle label="Manual ultimate trigger (tap to fire)" value={!!s.manualUltTrigger} onChange={v => update('manualUltTrigger', v)} />
      </div>

      {/* Display */}
      <div className="rounded-md border border-zinc-800 bg-zinc-900 p-3 space-y-3">
        <div className="font-pixel text-xs text-amber-300">Display</div>
        <Toggle label="CRT scanlines overlay" value={s.showScanlines} onChange={v => update('showScanlines', v)} />
      </div>

      <BackupsPanel />

      <button
        className="btn-pixel danger w-full"
        onClick={resetSettings}
      >Reset settings to defaults</button>

      <div className="text-[9px] text-zinc-600 text-center pt-2">
        Settings save automatically.
      </div>
    </div>
  );
}
