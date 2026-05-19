import { Howl, Howler } from 'howler';

export type BgmTrack = 'main' | 'battle' | 'tower' | 'boss';
export type SfxName = 'click' | 'hit' | 'ult' | 'victory' | 'defeat' | 'levelup' | 'pull';

interface SoundManagerSettings {
  master: number; // 0..1
  bgm: number;
  sfx: number;
  muted: boolean;
}

class SoundManager {
  private bgmHowls: Partial<Record<BgmTrack, Howl>> = {};
  private sfxHowls: Partial<Record<SfxName, Howl>> = {};
  private current: BgmTrack | null = null;
  settings: SoundManagerSettings = { master: 0.6, bgm: 0.5, sfx: 0.8, muted: false };

  init() {
    // BGM (looping)
    (['main', 'battle', 'tower', 'boss'] as BgmTrack[]).forEach(t => {
      this.bgmHowls[t] = new Howl({
        src: [`/audio/bgm_${t}.mp3`],
        loop: true,
        volume: this.bgmVolume(),
        html5: true, // streaming for longer files
      });
    });
    // SFX (one-shot)
    const sfxFiles: Record<SfxName, string> = {
      click:    '/audio/sfx_click.wav',
      hit:      '/audio/sfx_hit.wav',
      ult:      '/audio/sfx_ult.mp3',
      victory:  '/audio/sfx_victory.mp3',
      defeat:   '/audio/sfx_defeat.mp3',
      levelup:  '/audio/sfx_levelup.mp3',
      pull:     '/audio/sfx_pull.mp3',
    };
    for (const [name, src] of Object.entries(sfxFiles)) {
      this.sfxHowls[name as SfxName] = new Howl({ src: [src], volume: this.sfxVolume() });
    }
  }

  applySettings(s: Partial<SoundManagerSettings>) {
    this.settings = { ...this.settings, ...s };
    Howler.mute(this.settings.muted);
    for (const t of Object.keys(this.bgmHowls) as BgmTrack[]) {
      this.bgmHowls[t]!.volume(this.bgmVolume());
    }
    for (const n of Object.keys(this.sfxHowls) as SfxName[]) {
      this.sfxHowls[n]!.volume(this.sfxVolume());
    }
  }

  private bgmVolume() { return this.settings.master * this.settings.bgm; }
  private sfxVolume() { return this.settings.master * this.settings.sfx; }

  playBgm(track: BgmTrack) {
    if (this.current === track) return;
    // Fade out current
    if (this.current) {
      const cur = this.bgmHowls[this.current];
      if (cur) cur.fade(cur.volume(), 0, 400).once('fade', () => cur.stop());
    }
    this.current = track;
    const h = this.bgmHowls[track];
    if (!h) return;
    h.volume(0);
    h.play();
    h.fade(0, this.bgmVolume(), 400);
  }
  stopBgm() {
    if (this.current) {
      const cur = this.bgmHowls[this.current];
      if (cur) cur.fade(cur.volume(), 0, 400).once('fade', () => cur.stop());
    }
    this.current = null;
  }

  playSfx(name: SfxName) {
    const h = this.sfxHowls[name];
    if (!h) return;
    h.play();
  }

  unlock() {
    // Howler auto-unlocks on first user gesture in modern browsers, but we
    // expose this to force-init audio context after a click.
    Howler.ctx?.resume();
  }
}

export const sound = new SoundManager();
let inited = false;
export function ensureAudioInit() {
  if (inited) return;
  inited = true;
  sound.init();
}
