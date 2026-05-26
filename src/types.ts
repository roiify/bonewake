export type Element = 'fire' | 'water' | 'earth' | 'light' | 'dark';
export type Archetype = 'warrior' | 'mage' | 'healer' | 'tank' | 'assassin';
export type Rarity = 3 | 4 | 5;
export type EquipSlot = 'weapon' | 'armor' | 'helm' | 'boots' | 'accessory';

export interface HeroTemplate {
  id: string;
  name: string;
  rarity: Rarity;
  element: Element;
  archetype: Archetype;
  baseStats: { hp: number; atk: number; def: number; spd: number; crit: number };
  ultimateId: string;
  emoji: string; // placeholder sprite (single emoji)
  color: string; // hex
  flavor: string;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  damageMultiplier: number;
  targeting: 'single' | 'all' | 'lowest' | 'self';
  effect?: { type: 'heal' | 'shield' | 'burn' | 'stun' | 'buff_atk' | 'revive'; value: number; duration?: number };
}

export interface EquipmentTemplate {
  id: string;
  name: string;
  slot: EquipSlot;
  rarity: Rarity;
  stats: { hp?: number; atk?: number; def?: number; spd?: number; crit?: number };
  emoji: string;
}

export interface Stage {
  id: string;
  chapter: number;
  num: number;
  name: string;
  enemyTeam: { templateId: string; level: number; star: number }[];
  energyCost: number;
  rewards: { gold: number; exp: number; items?: Record<string, number> };
  firstClearBonus: { gems: number };
}

export type SummonKind = 'hero' | 'equipment' | 'socket' | 'material';

export interface SummonPool {
  id: string;
  name: string;
  description: string;
  // Defaults to 'hero' when omitted. Non-hero pools use their own reward
  // generators and ignore rates/pityFive.
  kind?: SummonKind;
  cost: { currency: 'gold' | 'gems' | 'friendPoints'; amount: number };
  rates: { 3: number; 4: number; 5: number };
  pityFive: number | null;
  featuredHeroId?: string;
  // Equipment pool — item level fed to genLoot + minimum rarity floor.
  equipmentItemLevel?: number;
  equipmentMinRarity?: 1 | 2 | 3 | 4 | 5;
  // Socket pool — max gem tier this pool can roll (1-4).
  socketMaxTier?: 1 | 2 | 3 | 4;
  // Material pool — soulshard yield range + chance to also drop a hero essence.
  materialSoulshardMin?: number;
  materialSoulshardMax?: number;
  materialEssenceChance?: number;
}

// Combat
export interface ActiveEffect {
  kind: 'burn' | 'shield' | 'buff_atk' | 'stun';
  value: number;        // damage tick / shield amount / buff %
  remaining: number;    // turns remaining
}

export interface CombatUnit {
  id: string; // instance id
  templateId: string;
  side: 'player' | 'enemy';
  name: string;
  emoji: string;
  color: string;
  element: Element;
  archetype: Archetype;
  rarity: Rarity;
  level: number;
  star: number;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  spd: number;
  crit: number;
  energy: number;
  ultimateId: string;
  ultLevel?: number;
  alive: boolean;
  effects?: ActiveEffect[];
}

export interface BattleAction {
  tick: number;
  src: string;
  dst: string;
  dmg: number;
  crit: boolean;
  ult: boolean;
  heal?: number;
  // Mid-power skill (between basic attack and ultimate). Plays the
  // `skill` sprite strip but at a faster pace than an ult cast and
  // without the full-screen flash overlay.
  skill?: boolean;
  // Continuation entry — same logical cast as the previous entry (e.g.
  // multi-target ult hits each target as its own log entry). Playback
  // applies the effect immediately but doesn't re-play the animation
  // or wait the full action duration.
  cont?: boolean;
  // Energy snapshots after this action resolves — used by the UI to
  // animate the per-unit energy bar in lockstep with the log replay.
  srcEnergyAfter?: number;
  dstEnergyAfter?: number;
  // Element-matchup tag for damage floats: 'strong' = 1.5× super-effective,
  // 'weak' = 0.75× resisted, undefined for neutral. UI surfaces this as
  // a small badge next to the floating damage number.
  ele?: 'strong' | 'weak';
}

export interface BattleResult {
  seed: string;
  winner: 'player' | 'enemy';
  log: BattleAction[];
  initial: { player: CombatUnit[]; enemy: CombatUnit[] };
}
