import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { SHOP_ITEMS, type ShopItem } from '../data/shop';
import { buyShopItem, getBuysToday, getBuysThisWeek } from '../lib/shop';
import { useProfile } from '../store/profile';
import { useItems } from '../store/items';
import { db } from '../lib/db';
import { MAT_SOULSHARD } from '../data/ultimateGear';
import PageHeader from '../components/ui/PageHeader';

const CATEGORIES: { id: ShopItem['category'] | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'currency', label: 'Currency' },
  { id: 'materials', label: 'Materials' },
  { id: 'tickets', label: 'Tickets' },
  { id: 'gear', label: 'Gear' },
];

function costIcon(c: string) {
  return c === 'gold' ? '🪙' : c === 'gems' ? '💎' : c === 'friendPoints' ? '🤝' : '💠';
}

export default function ShopPage() {
  const navigate = useNavigate();
  const profile = useProfile(s => s.profile);
  const refreshItems = useItems(s => s.refresh);
  const [cat, setCat] = useState<ShopItem['category'] | 'all'>('all');
  const [buys, setBuys] = useState<Record<string, { daily: number; weekly: number }>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [shardCount, setShardCount] = useState(0);

  const refreshBuys = async () => {
    const out: Record<string, { daily: number; weekly: number }> = {};
    for (const it of SHOP_ITEMS) {
      out[it.id] = {
        daily: it.dailyLimit ? await getBuysToday(it.id) : 0,
        weekly: it.weeklyLimit ? await getBuysThisWeek(it.id) : 0,
      };
    }
    setBuys(out);
    const shards = await db.items.get(MAT_SOULSHARD);
    setShardCount(shards?.count ?? 0);
  };

  useEffect(() => { refreshBuys(); }, [profile.gold, profile.gems]);

  const visible = useMemo(() =>
    SHOP_ITEMS.filter(i => cat === 'all' || i.category === cat),
    [cat]
  );

  async function onBuy(item: ShopItem) {
    const result = await buyShopItem(item);
    if (result.ok) {
      setToast(`✓ Got ${result.granted}`);
      setTimeout(() => setToast(null), 1800);
    } else {
      setToast(result.error ?? 'Cannot buy');
      setTimeout(() => setToast(null), 1800);
    }
    await refreshBuys();
    await refreshItems();
  }

  return (
    <div className="p-3 space-y-3">
      <button onClick={() => navigate(-1)} className="text-xs text-zinc-400">← Back</button>
      <PageHeader
        title="🏪 Shop"
        tagline="Spend gold/gems · daily resets at midnight"
        glow="#fbbf24"
      />

      <div className="flex gap-1 overflow-x-auto pb-1">
        {CATEGORIES.map(c => (
          <button
            key={c.id}
            className={`text-[10px] font-pixel px-2 py-1 rounded border whitespace-nowrap ${cat === c.id ? 'border-amber-400 bg-amber-400/20 text-amber-300' : 'border-zinc-700 text-zinc-400'}`}
            onClick={() => setCat(c.id)}
          >{c.label}</button>
        ))}
      </div>

      <div className="space-y-2">
        {visible.map(item => {
          const used = buys[item.id] ?? { daily: 0, weekly: 0 };
          const dailyLeft = item.dailyLimit ? item.dailyLimit - used.daily : null;
          const weeklyLeft = item.weeklyLimit ? item.weeklyLimit - used.weekly : null;
          const outOfStock = (dailyLeft != null && dailyLeft <= 0) || (weeklyLeft != null && weeklyLeft <= 0);
          const balance = item.cost.currency === 'gold' ? profile.gold
            : item.cost.currency === 'gems' ? profile.gems
            : item.cost.currency === 'friendPoints' ? profile.friendPoints
            : shardCount;
          const canAfford = balance >= item.cost.amount;
          return (
            <div key={item.id} className="rounded-md border border-zinc-800 bg-zinc-900 p-3 flex gap-3">
              <div className="w-12 h-12 rounded bg-zinc-950 flex items-center justify-center text-3xl shrink-0">{item.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-pixel">{item.name}</div>
                <div className="text-[10px] text-zinc-400 mt-0.5">{item.description}</div>
                <div className="text-[9px] text-zinc-500 mt-1">
                  {dailyLeft != null && <span className={dailyLeft <= 0 ? 'text-rose-400' : ''}>{dailyLeft}/{item.dailyLimit} today</span>}
                  {weeklyLeft != null && <span className={weeklyLeft <= 0 ? 'text-rose-400 ml-2' : 'ml-2'}>{weeklyLeft}/{item.weeklyLimit} weekly</span>}
                </div>
              </div>
              <button
                className={`btn-pixel ${canAfford && !outOfStock ? 'primary' : ''} shrink-0 self-center`}
                disabled={!canAfford || outOfStock}
                onClick={() => onBuy(item)}
              >
                {outOfStock ? 'Out' : `${item.cost.amount}${costIcon(item.cost.currency)}`}
              </button>
            </div>
          );
        })}
      </div>

      {toast && (
        <div className="fixed bottom-20 left-0 right-0 max-w-[420px] mx-auto px-3 z-50">
          <div className="rounded-md border border-emerald-700 bg-emerald-900/80 text-emerald-100 text-[11px] font-pixel p-2 text-center">{toast}</div>
        </div>
      )}
    </div>
  );
}
