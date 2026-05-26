import { motion, AnimatePresence } from 'framer-motion';
import { formatCompact } from '../../lib/format';

type PillVariant = 'gold' | 'gem' | 'energy' | 'rose' | 'neutral';

/**
 * Embossed currency / stat chip. Pure CSS via `.pill-embossed` for the
 * inner-shadow + bevel look. Optional onClick turns it into a button.
 */
interface PillProps {
  icon: string;             // emoji or short text inside the badge
  value?: number;           // numeric value (compact-formatted)
  label?: string;           // optional label override (no compact format)
  color?: string;           // color of the icon glyph
  variant?: PillVariant;
  onClick?: () => void;
  title?: string;
  /** Show a "+" hint after the value (used for "tap to refill" affordance). */
  plus?: boolean;
}

export default function Pill({ icon, value, label, color, variant = 'neutral', onClick, title, plus }: PillProps) {
  const className = `pill-embossed pill-embossed--${variant}`;
  const titleAttr = title ?? (value != null ? value.toLocaleString() : undefined);

  const inner = (
    <>
      <span className="text-sm" style={{ color, textShadow: color ? `0 0 6px ${color}88` : undefined }}>
        {icon}
      </span>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={value ?? label}
          initial={{ y: -6, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 6, opacity: 0 }}
          transition={{ duration: 0.14 }}
          className="text-zinc-100"
        >
          {label ?? (value != null ? formatCompact(value) : '')}
        </motion.span>
      </AnimatePresence>
      {plus && <span className="text-[8px] text-zinc-500">+</span>}
    </>
  );

  if (onClick) {
    return (
      <button onClick={onClick} className={className} title={titleAttr}>
        {inner}
      </button>
    );
  }
  return (
    <div className={className} title={titleAttr}>{inner}</div>
  );
}
