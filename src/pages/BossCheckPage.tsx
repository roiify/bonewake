import { useState } from 'react';
import { ENEMY_SPRITES } from '../data/heroes';
import SpriteAnimator, { StaticSprite } from '../components/SpriteAnimator';

// Dev-only page for visually verifying that the 5 audit-flagged bosses face
// the correct way once rendered in battle. Mirrors the flip logic from
// BattlePlayPage: enemies sit on the right and must face WEST, so any sprite
// painted east-facing is added to EAST_FACING_BOSSES and gets scaleX(-1).
const EAST_FACING_BOSSES_BATTLE = new Set<string>(['plague_doctor', 'soul_reaper']);

interface BossRow {
  id: string;
  label: string;
  audit: string;
  flagged: boolean;
}

const BOSSES: BossRow[] = [
  // Audit-flagged (5)
  { id: 'bonewake_dragon', label: 'Bonewake Dragon',  audit: 'idle right-heavy 1433/2315 · attack right-heavy 254/2146 · NOT in flip set', flagged: true },
  { id: 'plague_hydra',    label: 'Plague Hydra',     audit: 'idle OK · attack right-heavy 191/2655 · NOT in flip set', flagged: true },
  { id: 'rot_phoenix',     label: 'Rot Phoenix',      audit: 'idle OK · attack right-heavy 548/2663 · NOT in flip set', flagged: true },
  { id: 'plague_doctor',   label: 'Plague Doctor',    audit: 'idle right-heavy 294/968 · already in flip set', flagged: true },
  { id: 'soul_reaper',     label: 'Soul Reaper',      audit: 'idle right-heavy 487/1376 · already in flip set', flagged: true },
  // Audit-silent (9) — verifying by eye since the audit missed plague_doctor's attack
  { id: 'bone_titan',      label: 'Bone Titan',       audit: 'audit silent — verify by eye', flagged: false },
  { id: 'bone_cerberus',   label: 'Bone Cerberus',    audit: 'audit silent — verify by eye', flagged: false },
  { id: 'ash_empress',     label: 'Ash Empress',      audit: 'audit silent — verify by eye', flagged: false },
  { id: 'wraith_kraken',   label: 'Wraith Kraken',    audit: 'audit silent — verify by eye', flagged: false },
  { id: 'necro_sphinx',    label: 'Necro Sphinx',     audit: 'audit silent — verify by eye', flagged: false },
  { id: 'crimson_centaur', label: 'Crimson Centaur',  audit: 'audit silent — verify by eye', flagged: false },
  { id: 'lich_king',       label: 'Lich King',        audit: 'audit silent — verify by eye', flagged: false },
  { id: 'voidlord',        label: 'Voidlord',         audit: 'audit silent — verify by eye', flagged: false },
  { id: 'worm_god',        label: 'Worm God',         audit: 'audit silent — verify by eye', flagged: false },
];

const SIZE = 160;

export default function BossCheckPage() {
  const [anim, setAnim] = useState<'idle' | 'attack'>('attack');

  return (
    <div style={{ minHeight: '100vh', background: '#0b0f1a', color: '#e2e8f0', padding: 16, fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <h1 style={{ fontSize: 22, color: '#f59e0b', margin: '0 0 4px' }}>Boss Direction Check</h1>
        <div style={{ color: '#94a3b8', marginBottom: 10, fontSize: 13 }}>
          Compares each boss's <b>native sprite</b> (the PNG as drawn) against its <b>battle render</b> (with the
          enemy-side <code>scaleX(-1)</code> flip rule from <code>BattlePlayPage</code>). Enemies must face <b>WEST (left, ←)</b>.
        </div>
        <div style={{ background: '#1f2937', borderLeft: '3px solid #22c55e', padding: '8px 12px', marginBottom: 14, fontSize: 13 }}>
          Battle flip rule today: only <code>plague_doctor</code> + <code>soul_reaper</code> are in <code>EAST_FACING_BOSSES</code>. The
          three world-boss painted creatures are NOT flipped, so if their PNGs face east they will render east on the enemy side too.
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 13, color: '#94a3b8' }}>Animation:</span>
          {(['idle', 'attack'] as const).map(a => (
            <button
              key={a}
              onClick={() => setAnim(a)}
              style={{
                background: anim === a ? '#22d3ee' : '#1f2937',
                color: anim === a ? '#0b0f1a' : '#e2e8f0',
                border: '1px solid #374151',
                borderRadius: 4,
                padding: '6px 14px',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {a}
            </button>
          ))}
        </div>

        {BOSSES.map((boss, idx) => {
          const sprites = ENEMY_SPRITES[boss.id as keyof typeof ENEMY_SPRITES];
          if (!sprites) return null;
          const src = anim === 'idle' ? sprites.idle : (sprites.attack ?? sprites.idle);
          const cols = anim === 'idle' ? sprites.cols : (sprites.attackCols ?? sprites.cols);
          const rows = sprites.rows;
          const isFlipped = EAST_FACING_BOSSES_BATTLE.has(boss.id);
          const showFlaggedHeader = idx === 0;
          const showSilentHeader = !boss.flagged && (idx === 0 || BOSSES[idx - 1].flagged);

          return (
            <div key={boss.id}>
              {showFlaggedHeader && (
                <div style={{ marginTop: 18, padding: '8px 12px', background: '#7f1d1d', borderRadius: 4, fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>
                  AUDIT-FLAGGED (5)
                </div>
              )}
              {showSilentHeader && (
                <div style={{ marginTop: 24, padding: '8px 12px', background: '#1e293b', borderRadius: 4, fontSize: 12, fontWeight: 700, letterSpacing: 1, color: '#94a3b8' }}>
                  AUDIT-SILENT — VERIFY BY EYE (9)
                </div>
              )}
              <div style={{ margin: '12px 0', padding: 14, background: '#0f172a', border: `1px solid ${boss.flagged ? '#7f1d1d' : '#1f2937'}`, borderRadius: 6 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 4 }}>
                  <h2 style={{ margin: 0, fontSize: 17, color: '#22d3ee' }}>{boss.label}</h2>
                  <code style={{ fontSize: 11, color: '#64748b' }}>{boss.id}</code>
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 12, fontFamily: 'ui-monospace, monospace' }}>{boss.audit}</div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
                {/* What actually shows up in battle (with current flip rule) */}
                <Panel title="IN-BATTLE RENDER" sub={isFlipped ? 'flipped (already in EAST_FACING_BOSSES)' : 'NOT flipped (no rule for this boss)'} highlight>
                  <div style={{ width: SIZE, height: SIZE, transform: isFlipped ? 'scaleX(-1)' : undefined }}>
                    {anim === 'idle' ? (
                      <StaticSprite src={src} size={SIZE} />
                    ) : (
                      <SpriteAnimator src={src} cols={cols} rows={rows} size={SIZE} fps={10} loop />
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 6 }}>← should face LEFT (west)</div>
                </Panel>

                {/* Raw PNG (unflipped, as drawn) for reference */}
                <Panel title="Raw PNG" sub="as the artist drew it">
                  {anim === 'idle' ? (
                    <StaticSprite src={src} size={SIZE} />
                  ) : (
                    <SpriteAnimator src={src} cols={cols} rows={rows} size={SIZE} fps={10} loop />
                  )}
                </Panel>
              </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Panel({ title, sub, children, tint, highlight }: { title: string; sub: string; children: React.ReactNode; tint?: string; highlight?: boolean }) {
  return (
    <div style={{
      background: tint ?? '#0b0f1a',
      border: `1px solid ${highlight ? '#f59e0b' : '#1f2937'}`,
      borderRadius: 4,
      padding: 10,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 6,
    }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: highlight ? '#f59e0b' : '#94a3b8' }}>{title}</div>
      <div style={{ fontSize: 10, color: '#64748b' }}>{sub}</div>
      <div style={{ background: '#000', padding: 4, borderRadius: 3, marginTop: 4 }}>{children}</div>
    </div>
  );
}
