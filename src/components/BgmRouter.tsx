import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { sound, type BgmTrack } from '../lib/audio';

// Picks an appropriate BGM track based on the current route.
export function BgmRouter() {
  const loc = useLocation();
  useEffect(() => {
    const path = loc.pathname;
    let track: BgmTrack = 'main';
    if (path.startsWith('/battle/play')) track = 'battle';
    else if (path.startsWith('/worldboss')) track = 'boss';
    else if (path.startsWith('/tower')) track = 'tower';
    sound.playBgm(track);
  }, [loc.pathname]);
  return null;
}
