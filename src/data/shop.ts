// Shop catalog. Items live in the items table when granted; some are equipment crates that
// produce loot when "opened" (handled in ShopPage logic).

export type ShopCurrency = 'gold' | 'gems' | 'friendPoints' | 'soulshard';
export type ShopGrantKind =
  | { kind: 'energy'; amount: number }
  | { kind: 'gold'; amount: number }
  | { kind: 'gems'; amount: number }
  | { kind: 'friendPoints'; amount: number }
  | { kind: 'soulshard'; amount: number }
  | { kind: 'equipmentCrate'; minRarity: 1 | 2 | 3 | 4 | 5; count: number }
  | { kind: 'summonTicketStandard'; count: number }   // free standard pulls
  | { kind: 'summonTicketStellar'; count: number }   // free premium pulls
  | { kind: 'heroFragment'; heroId: string; count: number };

export interface ShopItem {
  id: string;
  category: 'currency' | 'materials' | 'tickets' | 'gear' | 'fragments';
  name: string;
  description: string;
  emoji: string;
  cost: { currency: ShopCurrency; amount: number };
  grant: ShopGrantKind;
  // Purchase limits — undefined means unlimited
  dailyLimit?: number;
  weeklyLimit?: number;
}

export const SHOP_ITEMS: ShopItem[] = [
  // Currency conversion
  { id: 'energy_small',  category: 'currency', name: 'Energy Flask',  description: 'Restore 60 energy.', emoji: '⚡',
    cost: { currency: 'gems', amount: 30 }, grant: { kind: 'energy', amount: 60 }, dailyLimit: 5 },
  { id: 'energy_large',  category: 'currency', name: 'Energy Tonic',  description: 'Restore 200 energy.', emoji: '🍶',
    cost: { currency: 'gems', amount: 80 }, grant: { kind: 'energy', amount: 200 }, dailyLimit: 2 },
  { id: 'gold_pile',     category: 'currency', name: 'Pile of Gold',  description: '+5000 gold.', emoji: '💰',
    cost: { currency: 'gems', amount: 50 }, grant: { kind: 'gold', amount: 5000 }, dailyLimit: 3 },
  { id: 'friend_pack',   category: 'currency', name: 'Friend Pack',   description: '+50 friend points.', emoji: '🤝',
    cost: { currency: 'gold', amount: 2000 }, grant: { kind: 'friendPoints', amount: 50 }, dailyLimit: 3 },

  // Materials
  { id: 'shard_small',   category: 'materials', name: 'Soulshard Pouch', description: '+10 Soulshards.', emoji: '💠',
    cost: { currency: 'gems', amount: 100 }, grant: { kind: 'soulshard', amount: 10 }, dailyLimit: 3 },
  { id: 'shard_bulk',    category: 'materials', name: 'Soulshard Chest', description: '+50 Soulshards.', emoji: '🪙',
    cost: { currency: 'gems', amount: 400 }, grant: { kind: 'soulshard', amount: 50 }, weeklyLimit: 2 },

  // Summon tickets
  { id: 'ticket_std',    category: 'tickets', name: 'Standard Ticket', description: '1 free standard wish.', emoji: '🎟️',
    cost: { currency: 'gold', amount: 500 }, grant: { kind: 'summonTicketStandard', count: 1 }, dailyLimit: 5 },
  { id: 'ticket_stellar',category: 'tickets', name: 'Stellar Ticket',  description: '1 free Stellar wish.', emoji: '✨',
    cost: { currency: 'gems', amount: 80 }, grant: { kind: 'summonTicketStellar', count: 1 }, dailyLimit: 2 },

  // Equipment crates
  { id: 'crate_magic',   category: 'gear', name: 'Magic Crate', description: '1 random Magic+ equipment.', emoji: '📦',
    cost: { currency: 'gold', amount: 1500 }, grant: { kind: 'equipmentCrate', minRarity: 2, count: 1 }, dailyLimit: 3 },
  { id: 'crate_rare',    category: 'gear', name: 'Rare Crate',  description: '1 random Rare+ equipment.', emoji: '🎁',
    cost: { currency: 'gems', amount: 60 }, grant: { kind: 'equipmentCrate', minRarity: 3, count: 1 }, dailyLimit: 2 },
  { id: 'crate_epic',    category: 'gear', name: 'Epic Crate',  description: '1 random Epic+ equipment.', emoji: '🪅',
    cost: { currency: 'gems', amount: 200 }, grant: { kind: 'equipmentCrate', minRarity: 4, count: 1 }, weeklyLimit: 3 },
];
