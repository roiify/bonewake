// Shared archetype + element badges used by every screen that lists
// heroes (HeroesPage grid, SquadPicker, HeroDetail, Summon reveal,
// pre-battle pickers, etc.) so the visual language is uniform.

const ARCH_BADGE: Record<string, { glyph: string; color: string }> = {
  warrior:  { glyph: '⚔', color: '#fca5a5' },
  mage:     { glyph: '✦', color: '#a78bfa' },
  tank:     { glyph: '🛡', color: '#fbbf24' },
  healer:   { glyph: '✚', color: '#86efac' },
  assassin: { glyph: '🗡', color: '#c4b5fd' },
};

const ELEMENT_BADGE: Record<string, { glyph: string; color: string }> = {
  fire:  { glyph: '🔥', color: '#fb923c' },
  water: { glyph: '💧', color: '#38bdf8' },
  earth: { glyph: '🌿', color: '#84cc16' },
  light: { glyph: '✨', color: '#fde047' },
  dark:  { glyph: '🌙', color: '#a78bfa' },
};

interface BadgeProps {
  /** Optional size override. Default 20 (w-5 h-5). */
  size?: number;
}

export function ArchetypeBadge({ archetype, size = 20 }: BadgeProps & { archetype: string }) {
  const b = ARCH_BADGE[archetype];
  if (!b) return null;
  return (
    <div
      className="rounded-full flex items-center justify-center leading-none"
      style={{
        width: size,
        height: size,
        fontSize: Math.max(8, size - 11),
        background: '#0a0a0aee',
        border: `1px solid ${b.color}`,
        color: b.color,
        boxShadow: `0 0 4px ${b.color}aa`,
      }}
      title={archetype}
    >
      {b.glyph}
    </div>
  );
}

export function ElementBadge({ element, size = 20 }: BadgeProps & { element?: string }) {
  if (!element) return null;
  const b = ELEMENT_BADGE[element];
  if (!b) return null;
  return (
    <div
      className="rounded-full flex items-center justify-center leading-none"
      style={{
        width: size,
        height: size,
        fontSize: Math.max(8, size - 10),
        background: '#0a0a0aee',
        border: `1px solid ${b.color}`,
        boxShadow: `0 0 4px ${b.color}88`,
      }}
      title={element}
    >
      {b.glyph}
    </div>
  );
}

/**
 * Stacked archetype + element badges anchored to a position.
 * Use inside a `relative` parent. Same look across every hero card.
 */
export function HeroBadges({ archetype, element, size = 20 }: BadgeProps & { archetype: string; element?: string }) {
  return (
    <div className="flex flex-col items-end gap-0.5 pointer-events-none">
      <ArchetypeBadge archetype={archetype} size={size} />
      {element && <ElementBadge element={element} size={size} />}
    </div>
  );
}
