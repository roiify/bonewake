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
import { craftSetPiece, craftUltimateGem } from '../lib/crafting';
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
        <h2 className="font-pixel text-sm">⚒️ Ultimate Crafting</h2>
        <p className="text-[10px] text-zinc-500 mt-1">
          3-star clears drop Soulshards and Essences. Forge each hero's signature gear set.
        </p>
      </div>

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
    </div>
  );
}
