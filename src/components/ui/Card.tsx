import { motion } from 'framer-motion';
import type { ReactNode, CSSProperties } from 'react';

/**
 * Premium card with layered shadow + top bevel + inner vignette.
 * Pure CSS via `.card-premium` (see index.css) so the same look ports
 * to any page that uses it. Pass `interactive` to add hover-lift +
 * cursor pointer; pass `goldFrame` for the gilded-corner variant.
 */
interface CardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  interactive?: boolean;
  goldFrame?: boolean;
  onClick?: () => void;
  /** Apply a tinted radial wash inside the card (e.g. rose, amber, violet). */
  tint?: string;
}

export default function Card({ children, className = '', style, interactive, goldFrame, onClick, tint }: CardProps) {
  const classes = [
    'card-premium',
    interactive ? 'card-premium--interactive' : '',
    goldFrame ? 'card-premium--gold-frame' : '',
    className,
  ].filter(Boolean).join(' ');

  const tintStyle: CSSProperties | undefined = tint ? {
    backgroundImage: `radial-gradient(ellipse at top, ${tint}22 0%, transparent 60%), linear-gradient(180deg, rgba(40, 32, 29, 0.95) 0%, rgba(20, 16, 15, 0.95) 100%)`,
  } : undefined;

  if (interactive) {
    return (
      <motion.button
        type="button"
        onClick={onClick}
        whileTap={{ scale: 0.97 }}
        whileHover={{ y: -2 }}
        className={classes}
        style={{ ...tintStyle, ...style, width: '100%', textAlign: 'left' }}
      >
        {children}
      </motion.button>
    );
  }

  return (
    <div className={classes} style={{ ...tintStyle, ...style }} onClick={onClick}>
      {children}
    </div>
  );
}
