import type { Skill } from '../types';

// Power-budget rule: an AOE ult hits 3 enemies, so a single-target ult
// at the SAME multiplier is doing 1/3 the work.  Single-target ults must
// be ~2.5-3x the multiplier of an AOE ult to land in the same power band.
export const SKILLS: Skill[] = [
  // AOE ults (targeting: 'all') — multiplier hits each enemy, so effective ≈ mult × 3
  { id: 'arrow_volley',       name: 'Arrow Volley',       description: 'Hail of arrows on all enemies.',                     damageMultiplier: 2.2, targeting: 'all' },
  { id: 'frost_crystal',      name: 'Frost Crystal',      description: 'Crystalline blast on all enemies.',                  damageMultiplier: 2.4, targeting: 'all' },
  { id: 'infernal_cataclysm', name: 'Infernal Cataclysm', description: 'Volcanic blast across all enemies + burn DoT.',      damageMultiplier: 2.4, targeting: 'all', effect: { type: 'burn', value: 200, duration: 3 } },
  { id: 'soul_harvest',       name: 'Soul Harvest',       description: 'Spinning scythe sweeps all enemies in a brutal arc.', damageMultiplier: 2.5, targeting: 'all' },
  { id: 'army_of_the_dead',   name: 'Army of the Dead',   description: 'Necrotic blast tears through all enemies.',           damageMultiplier: 2.6, targeting: 'all', effect: { type: 'burn', value: 150, duration: 3 } },
  { id: 'lich_blast',         name: 'Tomb Blast',         description: "Lich Sovereign's necrotic AOE blast.",                damageMultiplier: 2.2, targeting: 'all' },
  // Reiji's dual-blade arc — white + black katana sweep on every enemy
  { id: 'dual_eclipse',       name: 'Dual Eclipse',       description: 'Twin-katana cross-slash hits every enemy.',           damageMultiplier: 2.4, targeting: 'all' },
  // Twins' joint ult — yin/yang energy detonation
  { id: 'yin_yang_strike',    name: 'Yin-Yang Strike',    description: 'Twin energies converge — every enemy is shattered.',  damageMultiplier: 2.5, targeting: 'all', effect: { type: 'burn', value: 180, duration: 3 } },
  // Single-target ults — bumped to ~3x AOE multiplier so they're competitive
  { id: 'iron_palm',          name: 'Iron Palm',          description: 'Devastating single strike.',                          damageMultiplier: 7.5, targeting: 'single' },
  { id: 'aegis_judgment',     name: 'Aegis Judgment',     description: 'Massive single hit + ally shield.',                    damageMultiplier: 7.0, targeting: 'single', effect: { type: 'shield', value: 400, duration: 2 } },
  { id: 'primal_form',        name: 'Primal Form',        description: "Shapeshift to bear and crush a single enemy.",         damageMultiplier: 7.0, targeting: 'single' },
  { id: 'bone_strike',        name: 'Bone Strike',        description: "Bone King's executioner blow on a single target.",    damageMultiplier: 7.2, targeting: 'single' },
  // Chino's drunken palm — wild single-target nuke + self-buff_atk so his
  // follow-up basic attacks stay strong (the "drunkenness boosts" flavor).
  { id: 'drunken_palm',       name: 'Drunken Palm',       description: 'Reckless palm strike — single hit, leaves him hungrier for the next.', damageMultiplier: 7.0, targeting: 'single', effect: { type: 'buff_atk', value: 80, duration: 3 } },
  // Lowest-HP multi-hit (single target but seeks weakest — useful for finishing)
  { id: 'shadow_dance',       name: 'Shadow Dance',       description: 'Multi-hit on lowest-HP target.',                       damageMultiplier: 6.5, targeting: 'lowest' },
  // Healer / self-targeting
  // Luna's ult: revives one fallen ally at partial HP (40% of maxHP) AND
  // tops up living allies. If no one is dead, falls back to a pure heal.
  // The `value` here is the revive HP percent (40 = 40% of maxHp). The
  // living-ally heal is hardcoded inside combat.ts (700 HP).
  { id: 'dawn_resurrection',  name: 'Dawn Resurrection',  description: 'Revives one fallen ally at 40% HP and heals living allies.', damageMultiplier: 0, targeting: 'self', effect: { type: 'revive', value: 40 } },
];

export const SKILL_BY_ID = Object.fromEntries(SKILLS.map(s => [s.id, s]));
