import type { ReactNode } from 'react';

/**
 * Shared page-header used across every screen so the product feels
 * coherent: Cinzel display title with depth shadow + accent glow,
 * optional tagline, optional right-aligned readout (e.g. resource
 * counters, attempt counts). Pair with a banner image when the page
 * deserves one — see HomePage / HeroesPage / BattlePage for examples.
 */
interface Props {
  title: string;
  tagline?: string;
  /** Hex accent for the glow behind the title (default: red blood). */
  glow?: string;
  /** Optional right-side readout (e.g. "ATTEMPTS 3/5"). */
  rightSlot?: ReactNode;
  /** When supplied, render as banner-style block with a background image. */
  bannerSrc?: string;
}

export default function PageHeader({ title, tagline, glow = '#dc2626', rightSlot, bannerSrc }: Props) {
  if (bannerSrc) {
    return (
      <div
        className="relative rounded-lg overflow-hidden h-24 -mx-3 -mt-3 mb-3 border"
        style={{
          backgroundImage: `url(${bannerSrc})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 55%',
          borderColor: '#5a2222',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 20%, rgba(10,3,3,0.92) 90%)' }} />
        <div className="relative h-full flex items-end justify-between p-3">
          <div>
            <h2
              className="font-fantasy text-xl tracking-widest text-amber-200"
              style={{ textShadow: `0 2px 0 rgba(0,0,0,0.95), 0 0 14px ${glow}88` }}
            >
              {title}
            </h2>
            {tagline && (
              <p className="text-[10px] text-zinc-300 mt-1 text-shadow-deep italic">
                {tagline}
              </p>
            )}
          </div>
          {rightSlot && <div className="text-right">{rightSlot}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-end justify-between gap-3">
      <div className="min-w-0">
        <h2
          className="font-fantasy text-2xl tracking-widest text-amber-200"
          style={{ textShadow: `0 2px 0 rgba(0,0,0,0.95), 0 0 14px ${glow}55` }}
        >
          {title}
        </h2>
        {tagline && (
          <p className="text-[10px] text-zinc-400 leading-snug mt-1">{tagline}</p>
        )}
      </div>
      {rightSlot && <div className="shrink-0">{rightSlot}</div>}
    </div>
  );
}
