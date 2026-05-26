import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useProfile } from '../store/profile';
import { useHeroes } from '../store/heroes';
import { useItems } from '../store/items';
import {
  ULTIMATE_SETS,
  MAT_SOULSHARD,
  MATERIAL_META,
  essenceItemId,
  essenceMeta,
  MYTHIC_COLOR,
  type SetPieceDef,
} from '../data/ultimateGear';
import { HERO_BY_ID, HERO_PORTRAITS } from '../data/heroes';
import { StaticSprite } from '../components/SpriteAnimator';
import { craftSetPiece, craftUltimateGem, convertEssence, ESSENCE_CONVERT_RATE } from '../lib/crafting';
import { enchantUltGear, enchantCost, MAX_ENCHANT_LEVEL } from '../lib/equipmentMgmt';
import { useItems as useItemsStore } from '../store/items';
import { ULT_GEM_BY_HERO, ULT_GEM_COST_BY_HERO, gemInventoryKey } from '../data/gems';

function statRowFromStats(stats: Record<string, number>): string {
  return Object.entries(stats).map(([k, v]) =>
    k === 'crit'
      ? `+${((v as number) * 100).toFixed(0)}% CRIT`
      : `+${v} ${k.toUpperCase()}`
  ).join(' · ');
}

export default function CraftPage() {
  const navigate = useNavigate();
  const profile = useProfile(s => s.profile);
  const heroes = useHeroes(s => s.heroes);
  const equipment = useHeroes(s => s.equipment);
  const items = useItems(s => s.items);
  const [activeHeroId, setActiveHeroId] = useState<string>(ULTIMATE_SETS[0].heroId);
  const [crafting, setCrafting] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [tab, setTab] = useState<'forge' | 'convert' | 'enchant'>('forge');
  const refreshItems = useItemsStore(s => s.refresh);

  const set = useMemo(() => ULTIMATE_SETS.find(s => s.heroId === activeHeroId)!, [activeHeroId]);
  const hero = heroes.find(h => h.templateId === activeHeroId);
  const tpl = HERO_BY_ID[activeHeroId];

  const soulshards = items.find(i => i.templateId === MAT_SOULSHARD)?.count ?? 0;
  const essence = items.find(i => i.templateId === essenceItemId(activeHeroId))?.count ?? 0;
  const craftedSet = new Set(equipment.filter(e => e.craftedPieceId).map(e => e.craftedPieceId!));

  const craft = async (piece: SetPieceDef) => {
    if (crafting) return;
    setCrafting(piece.id);
    const result = await craftSetPiece(piece.id);
    setCrafting(null);
    if (result) {
      setToast(`✓ Crafted ${piece.name}`);
      setTimeout(() => setToast(null), 2500);
    } else {
      setToast('Missing materials, gold, or hero not owned');
      setTimeout(() => setToast(null), 2500);
    }
  };

  return (
    <div className="p-3 space-y-3">
      <button onClick={() => navigate(-1)} className="text-xs text-zinc-400">← Back</button>
      <div>
        <h2 className="font-pixel text-sm">⚒️ Forge</h2>
        <p className="text-[10px] text-zinc-500 mt-1">
          Craft, enchant, and convert. Soulshards and per-hero Essences fuel every action here.
        </p>
      </div>

      {/* Tab bar */}
      <div className="grid grid-cols-3 gap-1 rounded-md border border-zinc-800 bg-zinc-950 p-1">
        {(['forge', 'convert', 'enchant'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`text-[10px] font-pixel py-1.5 rounded transition uppercase ${
              tab === t ? 'bg-amber-500/20 text-amber-300' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {t === 'forge' ? '⚒ Craft' : t === 'convert' ? '🔮 Convert' : '✨ Enchant'}
          </button>
        ))}
      </div>

      {tab === 'convert' && (
        <ConvertTab
          essenceCounts={Object.fromEntries(ULTIMATE_SETS.map(s => [
            s.heroId,
            items.find(i => i.templateId === essenceItemId(s.heroId))?.count ?? 0,
          ]))}
          onConvert={async (source, target, amount) => {
            const result = await convertEssence(source, target, amount);
            if (result.ok) {
              await refreshItems();
              setToast(`✓ Converted ${amount} → ${result.gained} ${HERO_BY_ID[target].name} essence`);
            } else {
              setToast(`✗ ${result.error}`);
            }
            setTimeout(() => setToast(null), 2800);
          }}
        />
      )}

      {tab === 'enchant' && (
        <EnchantTab
          heroes={heroes}
          equipment={equipment}
          soulshards={soulshards}
          gold={profile.gold}
          onEnchant={async (eqId) => {
            const result = await enchantUltGear(eqId);
            setToast(result.ok ? `✓ Enchanted +1` : `✗ ${result.error}`);
            setTimeout(() => setToast(null), 2500);
          }}
        />
      )}

      {tab === 'forge' && (<div className="space-y-3">
      {/* Material wallet */}
      <div className="rounded-md border border-rose-700 bg-rose-900/15 p-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="text-2xl">{MATERIAL_META[MAT_SOULSHARD].emoji}</span>
            <span className="font-pixel text-xs text-rose-300">{soulshards}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-2xl">{essenceMeta(activeHeroId).emoji}</span>
            <span className="font-pixel text-xs text-rose-300">{essence}</span>
            <span className="text-[10px] text-zinc-500">({tpl.name} essence)</span>
          </div>
        </div>
      </div>

      {/* Hero selector */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {ULTIMATE_SETS.map(s => {
          const h = HERO_BY_ID[s.heroId];
          const active = s.heroId === activeHeroId;
          const craftedCount = s.pieces.filter(p => craftedSet.has(p.id)).length;
          return (
            <button
              key={s.heroId}
              onClick={() => setActiveHeroId(s.heroId)}
              className={`shrink-0 rounded border-2 p-1.5 text-center ${active ? 'ring-2 ring-amber-400' : ''}`}
              style={{ borderColor: h.color, background: active ? '#1f1d12' : '#09090b' }}
            >
              {HERO_PORTRAITS[s.heroId] ? (
                <StaticSprite src={HERO_PORTRAITS[s.heroId]} size={42} />
              ) : (
                <div className="text-2xl">{h.emoji}</div>
              )}
              <div className="text-[9px] font-pixel mt-0.5" style={{ color: h.color }}>{h.name}</div>
              <div className="text-[8px] text-zinc-500">{craftedCount}/5</div>
            </button>
          );
        })}
      </div>

      {/* Set header */}
      <div className="rounded-lg border-2 p-3" style={{ borderColor: MYTHIC_COLOR, background: '#1c1217' }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-pixel text-sm" style={{ color: MYTHIC_COLOR }}>{set.name}</div>
            <div className="text-[10px] text-zinc-400 italic mt-0.5">"{set.description}"</div>
          </div>
          {!hero && (
            <div className="text-[10px] text-amber-300 font-pixel">Pull {tpl.name} to craft</div>
          )}
        </div>

        {/* Set bonuses */}
        <div className="mt-3 space-y-1">
          <div className="text-[10px] font-pixel text-rose-300">SET BONUSES</div>
          {set.bonuses.map((b, i) => {
            const piecesEquipped = hero
              ? equipment.filter(e => e.equippedTo === hero.id && e.craftedPieceId && set.pieces.some(p => p.id === e.craftedPieceId)).length
              : 0;
            const active = piecesEquipped >= b.atPieces;
            return (
              <div
                key={i}
                className={`text-[10px] flex gap-2 ${active ? 'text-emerald-300' : 'text-zinc-500'}`}
              >
                <span className="font-pixel">[{b.atPieces}-pc]</span>
                <span>{b.description}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ultimate Socket Gem (one per hero) */}
      {(() => {
        const ultGem = ULT_GEM_BY_HERO[activeHeroId];
        const ultGemCost = ULT_GEM_COST_BY_HERO[activeHeroId];
        if (!ultGem || !ultGemCost) return null;
        // Count copies across inventory + every socketed slot (normal +
        // ult sockets). Ult gems are unique per hero — only one may
        // exist at a time, mirroring how ult gear works.
        const ownedInInv = items.find(i => i.templateId === gemInventoryKey(ultGem.id))?.count ?? 0;
        let ownedSocketed = 0;
        for (const eq of equipment) {
          if (eq.ultSocket === ultGem.id) ownedSocketed++;
          if (eq.sockets) {
            for (const g of eq.sockets) if (g === ultGem.id) ownedSocketed++;
          }
        }
        const owned = ownedInInv + ownedSocketed;
        const alreadyOwned = owned > 0;
        const canAfford = soulshards >= ultGemCost.soulshard && essence >= ultGemCost.essence && profile.gold >= ultGemCost.gold && !!hero && !alreadyOwned;
        const isCrafting = crafting === ultGem.id;
        return (
          <div
            className="rounded-md border-2 p-3 mb-2"
            style={{ borderColor: owned > 0 ? '#fb7185' : '#3f3f46', background: owned > 0 ? '#1c1217' : '#18181b' }}
          >
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded bg-zinc-950 flex items-center justify-center text-3xl shrink-0">{ultGem.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="text-xs font-pixel truncate" style={{ color: '#fb7185' }}>{ultGem.name}</div>
                  <span className="text-[9px] font-pixel text-rose-300">★ ULT SOCKET</span>
                  {owned > 0 && <span className="text-[9px] font-pixel text-emerald-400">✓ x{owned}</span>}
                </div>
                <div className="text-[9px] text-zinc-500">Socket gem — fits any item</div>
                <div className="text-[10px] text-zinc-300 mt-1">
                  {ultGem.stat === 'crit' ? `+${(ultGem.value * 100).toFixed(0)}% CRIT` : `+${ultGem.value} ${ultGem.stat.toUpperCase()}`}
                  {ultGem.bonusStats && Object.entries(ultGem.bonusStats).map(([k, v]) => (
                    <span key={k}> · {k === 'crit' ? `+${(v as number * 100).toFixed(0)}% CRIT` : `+${v} ${k.toUpperCase()}`}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 text-[10px] text-zinc-400 space-x-2">
                <span className={soulshards >= ultGemCost.soulshard ? 'text-emerald-400' : 'text-rose-400'}>💠{ultGemCost.soulshard}</span>
                <span className={essence >= ultGemCost.essence ? 'text-emerald-400' : 'text-rose-400'}>🔮{ultGemCost.essence}</span>
                <span className={profile.gold >= ultGemCost.gold ? 'text-emerald-400' : 'text-rose-400'}>🪙{ultGemCost.gold.toLocaleString()}</span>
              </div>
              <button
                className="btn-pixel primary shrink-0"
                disabled={!canAfford || isCrafting}
                onClick={async () => {
                  if (crafting) return;
                  setCrafting(ultGem.id);
                  const ok = await craftUltimateGem(activeHeroId);
                  setCrafting(null);
                  setToast(ok ? `✓ Crafted ${ultGem.name}` : 'Missing materials, gold, or hero not owned');
                  setTimeout(() => setToast(null), 2500);
                }}
              >
                {isCrafting ? '…' : alreadyOwned ? '✓ Owned' : 'Craft'}
              </button>
            </div>
          </div>
        );
      })()}

      {/* Pieces */}
      <div className="space-y-2">
        {set.pieces.map(piece => {
          const crafted = craftedSet.has(piece.id);
          const canAfford = soulshards >= piece.cost.soulshard && essence >= piece.cost.essence && profile.gold >= piece.cost.gold && !!hero;
          const isCrafting = crafting === piece.id;
          return (
            <div
              key={piece.id}
              className="rounded-md border-2 p-3"
              style={{
                borderColor: crafted ? MYTHIC_COLOR : '#3f3f46',
                background: crafted ? '#1c1217' : '#18181b',
              }}
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded bg-zinc-950 flex items-center justify-center text-3xl shrink-0">
                  {piece.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="text-xs font-pixel truncate" style={{ color: MYTHIC_COLOR }}>{piece.name}</div>
                    {piece.isUltimateWeapon && <span className="text-[9px] font-pixel text-amber-400">★ ULT</span>}
                    {crafted && <span className="text-[9px] font-pixel text-emerald-400">✓ CRAFTED</span>}
                  </div>
                  <div className="text-[9px] text-zinc-500 capitalize">{piece.slot}</div>
                  <div className="text-[10px] text-zinc-300 mt-1">{statRowFromStats(piece.stats)}</div>
                  <div className="text-[10px] italic text-zinc-500 mt-1">"{piece.flavor}"</div>
                </div>
              </div>
              {!crafted && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 text-[10px] text-zinc-400 space-x-2">
                    <span className={soulshards >= piece.cost.soulshard ? 'text-emerald-400' : 'text-rose-400'}>
                      💠{piece.cost.soulshard}
                    </span>
                    <span className={essence >= piece.cost.essence ? 'text-emerald-400' : 'text-rose-400'}>
                      🔮{piece.cost.essence}
                    </span>
                    <span className={profile.gold >= piece.cost.gold ? 'text-emerald-400' : 'text-rose-400'}>
                      🪙{piece.cost.gold.toLocaleString()}
                    </span>
                  </div>
                  <button
                    className="btn-pixel primary shrink-0"
                    disabled={!canAfford || isCrafting}
                    onClick={() => craft(piece)}
                  >
                    {isCrafting ? '…' : 'Craft'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {toast && (
        <div className="fixed bottom-20 left-0 right-0 max-w-[420px] mx-auto px-3 z-50">
          <div className="rounded-md border border-emerald-700 bg-emerald-900/80 backdrop-blur text-emerald-100 text-[11px] font-pixel p-2 text-center">
            {toast}
          </div>
        </div>
      )}

      <Link to="/heroes" className="block text-center text-[10px] text-zinc-500 underline pt-2">
        Equip crafted items in Heroes →
      </Link>
      </div>)}
    </div>
  );
}

// === Convert tab — burn N essence of any hero into 1 essence of chosen target ===
function ConvertTab({
  essenceCounts,
  onConvert,
}: {
  essenceCounts: Record<string, number>;
  onConvert: (sourceId: string, targetId: string, amount: number) => Promise<void>;
}) {
  const heroesWithEssence = ULTIMATE_SETS.filter(s => (essenceCounts[s.heroId] ?? 0) > 0);
  const [sourceId, setSourceId] = useState<string>(heroesWithEssence[0]?.heroId ?? '');
  const [targetId, setTargetId] = useState<string>(
    ULTIMATE_SETS.find(s => s.heroId !== heroesWithEssence[0]?.heroId)?.heroId ?? ''
  );
  const [batches, setBatches] = useState(1);

  const sourceHave = essenceCounts[sourceId] ?? 0;
  const maxBatches = Math.floor(sourceHave / ESSENCE_CONVERT_RATE);
  const sourceCost = batches * ESSENCE_CONVERT_RATE;
  const targetGain = batches;
  const canConvert = sourceId && targetId && sourceId !== targetId && maxBatches >= 1 && batches >= 1;

  return (
    <div className="space-y-3">
      <div className="rounded-md border border-rose-700 bg-rose-900/15 p-3 text-[10px] text-zinc-300 leading-snug">
        <span className="text-rose-300 font-pixel">CROSS-CONVERSION</span> — burn{' '}
        <span className="text-amber-300 font-pixel">{ESSENCE_CONVERT_RATE}</span> essence of any hero to gain{' '}
        <span className="text-emerald-300 font-pixel">1</span> essence of your chosen target hero. Solves the
        random-hero drop bottleneck.
      </div>

      <div>
        <div className="text-[10px] font-pixel text-zinc-400 mb-1">FROM (burn)</div>
        <div className="grid grid-cols-4 gap-1.5">
          {ULTIMATE_SETS.map(s => {
            const h = HERO_BY_ID[s.heroId];
            const c = essenceCounts[s.heroId] ?? 0;
            const disabled = c < ESSENCE_CONVERT_RATE;
            const active = s.heroId === sourceId;
            return (
              <button
                key={s.heroId}
                disabled={disabled}
                onClick={() => setSourceId(s.heroId)}
                className={`rounded border-2 p-1.5 text-center transition ${active ? 'ring-2 ring-rose-400' : ''} ${disabled ? 'opacity-30' : ''}`}
                style={{ borderColor: h.color, background: active ? '#2a1418' : '#0c0a09' }}
              >
                {HERO_PORTRAITS[s.heroId]
                  ? <StaticSprite src={HERO_PORTRAITS[s.heroId]} size={38} />
                  : <div className="text-xl">{h.emoji}</div>}
                <div className="text-[9px] font-pixel mt-0.5 truncate" style={{ color: h.color }}>{h.name}</div>
                <div className="text-[8px] text-zinc-500">{c}🔮</div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="text-[10px] font-pixel text-zinc-400 mb-1">TO (gain)</div>
        <div className="grid grid-cols-4 gap-1.5">
          {ULTIMATE_SETS.map(s => {
            const h = HERO_BY_ID[s.heroId];
            const c = essenceCounts[s.heroId] ?? 0;
            const disabled = s.heroId === sourceId;
            const active = s.heroId === targetId;
            return (
              <button
                key={s.heroId}
                disabled={disabled}
                onClick={() => setTargetId(s.heroId)}
                className={`rounded border-2 p-1.5 text-center transition ${active ? 'ring-2 ring-emerald-400' : ''} ${disabled ? 'opacity-30' : ''}`}
                style={{ borderColor: h.color, background: active ? '#142a18' : '#0c0a09' }}
              >
                {HERO_PORTRAITS[s.heroId]
                  ? <StaticSprite src={HERO_PORTRAITS[s.heroId]} size={38} />
                  : <div className="text-xl">{h.emoji}</div>}
                <div className="text-[9px] font-pixel mt-0.5 truncate" style={{ color: h.color }}>{h.name}</div>
                <div className="text-[8px] text-zinc-500">{c}🔮</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-md border border-zinc-700 bg-zinc-900 p-3 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-pixel">
          <span className="text-rose-300">Burn {sourceCost} 🔮</span>
          <span className="text-zinc-500">→</span>
          <span className="text-emerald-300">+{targetGain} 🔮</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="btn-pixel"
            disabled={batches <= 1}
            onClick={() => setBatches(b => Math.max(1, b - 1))}
          >−</button>
          <input
            type="range"
            min={1}
            max={Math.max(1, maxBatches)}
            value={batches}
            onChange={e => setBatches(parseInt(e.target.value, 10))}
            className="flex-1"
          />
          <button
            className="btn-pixel"
            disabled={batches >= maxBatches}
            onClick={() => setBatches(b => Math.min(maxBatches, b + 1))}
          >+</button>
          <button
            className="btn-pixel"
            disabled={maxBatches <= 1}
            onClick={() => setBatches(maxBatches)}
          >MAX</button>
        </div>
        <button
          className="btn-pixel primary w-full"
          disabled={!canConvert}
          onClick={() => onConvert(sourceId, targetId, sourceCost)}
        >
          {canConvert ? `Convert ${sourceCost} → ${targetGain}` : maxBatches < 1 ? `Need ${ESSENCE_CONVERT_RATE}+ essence` : 'Pick a different target'}
        </button>
      </div>
    </div>
  );
}

// === Enchant tab — sink soulshards into crafted ult pieces for +1..+10 ===
function EnchantTab({
  heroes,
  equipment,
  soulshards,
  gold,
  onEnchant,
}: {
  heroes: Array<{ id: string; templateId: string; level: number; star: number }>;
  equipment: Array<{ id: string; craftedPieceId?: string; setId?: string; name?: string; upgradeLevel?: number; emoji?: string; slot?: string; isUltimateWeapon?: boolean; primary?: { stat: string; value: number }; affixes?: { stat: string; value: number }[]; equippedTo: string | null }>;
  soulshards: number;
  gold: number;
  onEnchant: (eqId: string) => Promise<void>;
}) {
  const [activeHeroId, setActiveHeroId] = useState<string>(ULTIMATE_SETS[0].heroId);
  const set = ULTIMATE_SETS.find(s => s.heroId === activeHeroId)!;
  const hero = heroes.find(h => h.templateId === activeHeroId);
  const craftedPieces = set.pieces
    .map(p => equipment.find(e => e.craftedPieceId === p.id))
    .filter((e): e is NonNullable<typeof e> => !!e);

  return (
    <div className="space-y-3">
      <div className="rounded-md border border-amber-700 bg-amber-900/15 p-3 text-[10px] text-zinc-300 leading-snug">
        <span className="text-amber-300 font-pixel">ENCHANT</span> — sink soulshards + gold into crafted ult
        pieces for <span className="text-emerald-300">+12% stat per level</span>, up to +{MAX_ENCHANT_LEVEL}{' '}
        (+{MAX_ENCHANT_LEVEL * 12}% total). Cost scales quadratically; full enchant of one piece ≈
        {' '}1,100 shards.
      </div>

      {/* Hero selector — only show ones with at least one crafted piece */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {ULTIMATE_SETS.map(s => {
          const h = HERO_BY_ID[s.heroId];
          const heroEntry = heroes.find(hr => hr.templateId === s.heroId);
          const piecesCrafted = s.pieces.filter(p =>
            equipment.some(e => e.craftedPieceId === p.id)
          ).length;
          const active = s.heroId === activeHeroId;
          const disabled = piecesCrafted === 0;
          return (
            <button
              key={s.heroId}
              disabled={disabled}
              onClick={() => setActiveHeroId(s.heroId)}
              className={`shrink-0 rounded border-2 p-1.5 text-center ${active ? 'ring-2 ring-amber-400' : ''} ${disabled ? 'opacity-30' : ''}`}
              style={{ borderColor: h.color, background: active ? '#1f1d12' : '#09090b' }}
            >
              {HERO_PORTRAITS[s.heroId]
                ? <StaticSprite src={HERO_PORTRAITS[s.heroId]} size={42} />
                : <div className="text-2xl">{h.emoji}</div>}
              <div className="text-[9px] font-pixel mt-0.5" style={{ color: h.color }}>{h.name}</div>
              <div className="text-[8px] text-zinc-500">{piecesCrafted}/5{heroEntry ? '' : ' (locked)'}</div>
            </button>
          );
        })}
      </div>

      {craftedPieces.length === 0 ? (
        <div className="rounded-md border border-zinc-800 bg-zinc-900 p-6 text-center text-[11px] text-zinc-500">
          No crafted pieces for {HERO_BY_ID[activeHeroId].name} yet. Forge them on the Craft tab first.
        </div>
      ) : (
        <div className="space-y-2">
          {craftedPieces.map(eq => {
            const lvl = eq.upgradeLevel ?? 0;
            const maxed = lvl >= MAX_ENCHANT_LEVEL;
            const cost = enchantCost(eq);
            const canEnchant = !maxed && soulshards >= cost.soulshard && gold >= cost.gold && !!hero;
            return (
              <div
                key={eq.id}
                className="rounded-md border-2 p-3"
                style={{ borderColor: maxed ? '#a3e635' : '#3f3f46', background: maxed ? '#0f1c0e' : '#18181b' }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded bg-zinc-950 flex items-center justify-center text-3xl shrink-0">
                    {eq.emoji ?? '⚒'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="text-xs font-pixel truncate" style={{ color: '#f9a8d4' }}>{eq.name ?? eq.slot}</div>
                      {eq.isUltimateWeapon && <span className="text-[9px] font-pixel text-amber-400">★ ULT</span>}
                      <span className={`text-[10px] font-pixel ${maxed ? 'text-lime-300' : 'text-amber-300'}`}>+{lvl}{maxed ? ' MAX' : ''}</span>
                    </div>
                    <div className="text-[10px] text-zinc-300 mt-1">
                      Current stat boost: +{lvl * 12}% (crafted base × {1 + lvl * 0.12})
                    </div>
                    {!maxed && (
                      <div className="text-[10px] text-zinc-400 mt-1 space-x-2">
                        Cost:
                        <span className={soulshards >= cost.soulshard ? 'text-emerald-400' : 'text-rose-400'}>{' '}💠{cost.soulshard}</span>
                        <span className={gold >= cost.gold ? 'text-emerald-400' : 'text-rose-400'}>🪙{cost.gold.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                  <button
                    className="btn-pixel primary shrink-0 self-center"
                    disabled={!canEnchant}
                    onClick={() => onEnchant(eq.id)}
                  >
                    {maxed ? '✓' : `+1`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
