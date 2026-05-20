// Audio disabled — the borrowed Dragon Ball BGM/SFX didn't match the dark-fantasy
// aesthetic, so all sound playback is stubbed out. Surface API kept so existing
// callers (BattlePlayPage, SettingsPage, etc.) continue to compile.
// To re-enable later: restore the Howler-backed implementation.

export type BgmTrack = 'main' | 'battle' | 'tower' | 'boss';
export type SfxName = 'click' | 'hit' | 'ult' | 'victory' | 'defeat' | 'levelup' | 'pull';

export interface SoundManagerSettings {
  master: number;
  bgm: number;
  sfx: number;
  muted: boolean;
}

class SoundManager {
  settings: SoundManagerSettings = { master: 0, bgm: 0, sfx: 0, muted: true };
  init() {}
  applySettings(_s: Partial<SoundManagerSettings>) {}
  playBgm(_track: BgmTrack) {}
  stopBgm() {}
  playSfx(_name: SfxName) {}
  unlock() {}
}

export const sound = new SoundManager();
export function ensureAudioInit() {}
