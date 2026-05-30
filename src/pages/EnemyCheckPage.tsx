import { useState } from 'react';
import { ENEMY_SPRITES } from '../data/heroes';
import SpriteAnimator, { StaticSprite } from '../components/SpriteAnimator';

// Mirrors BossCheckPage but for the regular enemy roster. Regular enemies
// don't get any flip in BattlePlayPage (only the painted bosses do), so the
// IN-BATTLE RENDER column shows the sprite exactly as it ships.

interface Group {
  title: string;
  slugs: string[];
}

const GROUPS: Group[] = [
  { title: 'CH 1–6 — Foundation (Echoes basic + worldboss_1)', slugs: ['worldboss_1', 'shambler', 'boneknight', 'fastghoul', 'graveyardlich'] },
  { title: 'CH 7 — Undead Vanguard',                            slugs: ['undead_archer', 'plague_caster', 'fallen_captain', 'skeletal_warhorse', 'carrion_spider', 'phantom_knight', 'wailing_wraith'] },
  { title: 'CH 8 — Zombie Legion',                              slugs: ['zombie_knight', 'zombie_berserker', 'shield_bearer', 'zombie_mage', 'grave_channeler', 'soul_leech', 'rotwolf', 'bone_bear'] },
  { title: "CH 9 — Necromancer's Court",                        slugs: ['possessed_corpse', 'grave_digger', 'plague_monk', 'necromancer'] },
  { title: 'CH 10–14 — Necropolis Royalty',                     slugs: ['royal_lich', 'bone_executioner', 'gilded_revenant', 'crypt_assassin', 'plague_priest'] },
  { title: 'CH 15–19 — Abyssal Crypts',                         slugs: ['void_zombie', 'abyssal_warden', 'shade_caller', 'dread_knight', 'corpse_hound'] },
  { title: 'CH 20–24 — Cosmic Corruption',                      slugs: ['starfall_lich', 'void_juggernaut', 'astral_archer', 'orb_caster', 'soul_devourer'] },
  { title: 'CH 25–29 — Final Apocalypse',                       slugs: ['apocalypse_horror', 'world_eater_husk', 'blood_titan', 'ash_lord', 'final_revenant'] },
];

const SIZE = 140;

export default function EnemyCheckPage() {
  const [anim, setAnim] = useState<'idle' | 'attack'>('attack');

  return (
    <div style={{ minHeight: '100vh', background: '#0b0f1a', color: '#e2e8f0', padding: 16, fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <h1 style={{ fontSize: 22, color: '#f59e0b', margin: '0 0 4px' }}>Enemy Direction Check</h1>
        <div style={{ color: '#94a3b8', marginBottom: 10, fontSize: 13 }}>
          44 regular enemies grouped by chapter. Enemies render with <b>no flip</b> in battle, so the LEFT panel is exactly what shows up on the enemy side. They must face <b>WEST (left, ←)</b> to look at the hero on the left side of the screen.
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

        {GROUPS.map(group => (
          <div key={group.title} style={{ marginTop: 20 }}>
            <div style={{ padding: '8px 12px', background: '#1e293b', borderRadius: 4, fontSize: 12, fontWeight: 700, letterSpacing: 1, color: '#22d3ee', marginBottom: 10 }}>
              {group.title}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
              {group.slugs.map(slug => {
                const sprites = ENEMY_SPRITES[slug as keyof typeof ENEMY_SPRITES];
                if (!sprites) {
                  return (
                    <div key={slug} style={{ padding: 10, background: '#0f172a', border: '1px solid #7f1d1d', borderRadius: 4 }}>
                      <code style={{ fontSize: 11, color: '#fca5a5' }}>{slug}</code>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>missing in ENEMY_SPRITES</div>
                    </div>
                  );
                }
                const src = anim === 'idle' ? sprites.idle : (sprites.attack ?? sprites.idle);
                const cols = anim === 'idle' ? sprites.cols : sprites.cols;
                const rows = sprites.rows;
                return (
                  <div key={slug} style={{ padding: 10, background: '#0f172a', border: '1px solid #1f2937', borderRadius: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
                      <code style={{ fontSize: 12, color: '#22d3ee', fontWeight: 600 }}>{slug}</code>
                    </div>
                    <div style={{ background: '#000', padding: 4, borderRadius: 3, display: 'inline-block' }}>
                      {anim === 'idle' ? (
                        <StaticSprite src={src} size={SIZE} />
                      ) : (
                        <SpriteAnimator src={src} cols={cols} rows={rows} size={SIZE} fps={14} loop />
                      )}
                    </div>
                    <div style={{ fontSize: 10, color: '#f59e0b', marginTop: 4 }}>← should face LEFT</div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
