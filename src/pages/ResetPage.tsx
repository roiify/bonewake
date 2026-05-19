import { useEffect, useState } from 'react';
import { wipeSave, DEFAULT_PROFILE } from '../lib/db';
import { useProfile } from '../store/profile';
import { useHeroes } from '../store/heroes';
import { useItems } from '../store/items';

export default function ResetPage() {
  const [status, setStatus] = useState('Wiping save…');

  useEffect(() => {
    (async () => {
      try {
        // Signal to any in-flight handlers that we're resetting — they should
        // not write the stale in-memory state back to the freshly wiped DB.
        (window as any).__resetting = true;

        // Clear browser-side state
        localStorage.clear();
        sessionStorage.clear();

        // Wipe IndexedDB (drops all heroes, equipment, items, stage clears,
        // tasks, pull logs, daily streak — everything).
        await wipeSave();

        // Reset in-memory zustand stores to defaults so nothing in this tab
        // can re-save stale state during the navigation.
        useProfile.setState({ profile: { ...DEFAULT_PROFILE }, loaded: true });
        useHeroes.setState({ heroes: [], equipment: [], loaded: true });
        useItems.setState({ items: [], loaded: true });

        setStatus('Wiped. Reloading…');
        // Hard reload to '/' so the React app reinitializes from scratch.
        setTimeout(() => { window.location.replace('/'); }, 600);
      } catch (e) {
        setStatus('Error: ' + (e as Error).message);
      }
    })();
  }, []);

  return (
    <div className="h-full flex items-center justify-center bg-zinc-950">
      <div className="text-center px-6">
        <div className="font-pixel text-amber-400 text-sm animate-pulse">{status}</div>
        <div className="text-[10px] text-zinc-500 mt-3">
          Heroes • Equipment • Currency • Levels • Stage clears
        </div>
        <div className="text-[10px] text-zinc-500 mt-1">
          all reset to defaults
        </div>
      </div>
    </div>
  );
}
