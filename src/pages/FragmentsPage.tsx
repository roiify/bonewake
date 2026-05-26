import { useNavigate, Link } from 'react-router-dom';
import { useHeroes } from '../store/heroes';
import { useItems } from '../store/items';
import { HERO_TEMPLATES, HERO_PORTRAITS } from '../data/heroes';
import { StaticSprite } from '../components/SpriteAnimator';
import { fragmentItemId, STAR_UP_COST, MAX_STAR } from '../lib/fragments';
import { tierLabel, tierColor, nextTierLabel } from '../lib/tier';
import { promotionLevelThreshold } from '../lib/stats';
import PageHeader from '../components/ui/PageHeader';

export default function FragmentsPage() {
  const navigate = useNavigate();
  const heroes = useHeroes(s => s.heroes);
  const items = useItems(s => s.items);

  const rows = HERO_TEMPLATES.map(tpl => {
    const fragCount = items.find(i => i.templateId === fragmentItemId(tpl.id))?.count ?? 0;
    const owned = heroes.find(h => h.templateId === tpl.id);
    const ownedStar = owned?.star ?? 0;
    const cost = owned ? (STAR_UP_COST[ownedStar] ?? null) : null;
    const atMaxStar = ownedStar >= MAX_STAR;
    const levelGated = owned && cost != null && owned.level < promotionLevelThreshold(ownedStar);
    const canPromote = !!owned && cost != null && !atMaxStar && fragCount >= cost && !levelGated;
    return { tpl, fragCount, owned, ownedStar, cost, atMaxStar, levelGated, canPromote };
  }).sort((a, b) => b.fragCount - a.fragCount);

  return (
    <div className="p-3 space-y-3">
      <button onClick={() => navigate(-1)} className="text-xs text-zinc-400">← Back</button>
      <PageHeader
        title="🧩 Fragments"
        tagline="Duplicate pulls fuel star promotions"
        glow="#22d3ee"
      />
      <p className="text-[10px] text-zinc-400 px-2 leading-snug">
        Reach a hero's <span className="text-amber-300">tier-cap level</span> first
        (star × 10), then spend fragments to promote.
      </p>

      {rows.map(({ tpl, fragCount, owned, ownedStar, cost, atMaxStar, levelGated, canPromote }) => (
        <div key={tpl.id} className="rounded-md border border-zinc-800 bg-zinc-900 p-3">
          <div className="flex items-center gap-3">
            <Link to={owned ? `/heroes/${owned.id}` : '/summon'} className="shrink-0">
              {HERO_PORTRAITS[tpl.id] ? (
                <StaticSprite src={HERO_PORTRAITS[tpl.id]} size={56} />
              ) : (
                <div className="text-3xl">{tpl.emoji}</div>
              )}
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <div className="text-sm font-pixel" style={{ color: tpl.color }}>{tpl.name}</div>
                {owned ? (
                  <div className="text-[10px] font-pixel" style={{ color: tierColor(ownedStar) }}>
                    {tierLabel(ownedStar)} · LVL:{owned.level}
                  </div>
                ) : (
                  <div className="text-[10px] text-zinc-500">Not owned</div>
                )}
              </div>

              {atMaxStar ? (
                <div className="text-[10px] text-amber-300 mt-1">Maxed at {tierLabel(MAX_STAR)} — fragments unused (save for future content)</div>
              ) : owned && cost != null ? (
                <>
                  <div className="h-1.5 bg-zinc-800 rounded mt-1.5 overflow-hidden">
                    <div className="h-full bg-cyan-400" style={{ width: `${Math.min(100, (fragCount / cost) * 100)}%` }} />
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-1">
                    🧩 {fragCount} / {cost} → <span style={{ color: tierColor(ownedStar + 1) }}>{nextTierLabel(ownedStar)}</span>
                    {levelGated && (
                      <span className="text-amber-400 ml-1.5">need LVL:{promotionLevelThreshold(ownedStar)}</span>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-[10px] text-zinc-500 mt-1">
                  Pull from any banner to recruit. You have 🧩 {fragCount} waiting.
                </div>
              )}
            </div>
            {canPromote && owned && (
              <Link to={`/heroes/${owned.id}`} className="btn-pixel success shrink-0">
                Promote
              </Link>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
