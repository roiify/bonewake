import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { useHeroes } from '../store/heroes';
import { HERO_BY_ID, HERO_SPRITES } from '../data/heroes';
import { StaticSprite } from '../components/SpriteAnimator';
import { TALENT_TREE, BRANCH_COLOR, BRANCH_NAME, nodesForHeroBranch, talentPointsForLevel, type TalentBranch } from '../data/talents';

export default function TalentsPage() {
  const { heroId } = useParams();
  const navigate = useNavigate();
  const heroes = useHeroes(s => s.heroes);
  const updateHero = useHeroes(s => s.updateHero);
  const hero = heroes.find(h => h.id === heroId);
  const [toast, setToast] = useState<string | null>(null);

  if (!hero) return <div className="p-6 text-center text-zinc-500">Hero not found. <Link className="text-amber-400 underline" to="/heroes">Back</Link></div>;

  const tpl = HERO_BY_ID[hero.templateId];
  const totalPoints = talentPointsForLevel(hero.level);
  const unlocked = new Set(hero.talents ?? []);
  const spent = Array.from(unlocked).reduce((s, id) => {
    const node = TALENT_TREE.find(t => t.id === id);
    return s + (node?.cost ?? 0);
  }, 0);
  const available = totalPoints - spent;

  async function unlock(nodeId: string) {
    const node = TALENT_TREE.find(t => t.id === nodeId);
    if (!node) return;
    if (unlocked.has(nodeId)) return;
    if (node.cost > available) { setToast('Not enough points'); setTimeout(() => setToast(null), 1500); return; }
    // Must have unlocked previous ranks in this branch first
    if (node.rank > 1) {
      const prev = TALENT_TREE.find(t => t.branch === node.branch && t.rank === node.rank - 1);
      if (prev && !unlocked.has(prev.id)) {
        setToast(`Unlock ${prev.name} first`);
        setTimeout(() => setToast(null), 1800);
        return;
      }
    }
    const next = [...(hero!.talents ?? []), nodeId];
    await updateHero(hero!.id, { talents: next });
    setToast(`✓ ${node.name} unlocked`);
    setTimeout(() => setToast(null), 1500);
  }

  async function resetTalents() {
    if (!confirm('Reset all talents for this hero?')) return;
    await updateHero(hero!.id, { talents: [] });
  }

  return (
    <div className="p-3 space-y-3">
      <button onClick={() => navigate(-1)} className="text-xs text-zinc-400">← Back</button>

      <div className="rounded-lg border-2 bg-zinc-900 p-3 flex items-center gap-3" style={{ borderColor: tpl.color }}>
        {HERO_SPRITES[tpl.id] ? <StaticSprite src={HERO_SPRITES[tpl.id].idle} size={56} /> : <div className="text-3xl">{tpl.emoji}</div>}
        <div className="flex-1">
          <div className="font-pixel text-sm" style={{ color: tpl.color }}>{tpl.name}</div>
          <div className="text-[10px] text-zinc-400">LVL:{hero.level} · Talent points: <span className="font-pixel text-amber-400">{available}/{totalPoints}</span></div>
        </div>
        {spent > 0 && (
          <button className="btn-pixel danger" onClick={resetTalents}>Reset</button>
        )}
      </div>

      {totalPoints === 0 && (
        <div className="rounded-md border border-amber-700 bg-amber-900/15 p-3 text-center">
          <div className="text-[11px] text-amber-300">Earn talent points by leveling past L10.</div>
          <div className="text-[9px] text-zinc-500 mt-1">1 point per level beyond 10.</div>
        </div>
      )}

      {(['might', 'finesse', 'endurance'] as TalentBranch[]).map(branch => {
        const color = BRANCH_COLOR[branch];
        const nodes = nodesForHeroBranch(hero.templateId, branch);
        return (
          <div key={branch} className="rounded-md border-2 p-3" style={{ borderColor: color, background: '#0c0c0e' }}>
            <div className="font-pixel text-xs mb-2" style={{ color }}>{BRANCH_NAME[branch]}</div>
            <div className="space-y-2">
              {nodes.map(node => {
                const isUnlocked = unlocked.has(node.id);
                const prev = nodes.find(n => n.rank === node.rank - 1);
                const prevUnlocked = !prev || unlocked.has(prev.id);
                const canAfford = node.cost <= available;
                const canUnlock = !isUnlocked && prevUnlocked && canAfford;
                return (
                  <div
                    key={node.id}
                    className={`rounded border p-2 flex items-center gap-2 ${isUnlocked ? 'opacity-80' : prevUnlocked ? '' : 'opacity-40'}`}
                    style={{
                      borderColor: isUnlocked ? color : '#3f3f46',
                      background: isUnlocked ? `${color}15` : '#18181b',
                    }}
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0" style={{ background: isUnlocked ? color : '#27272a', color: isUnlocked ? '#000' : color }}>
                      {node.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-pixel">{node.name}</div>
                      <div className="text-[10px] text-zinc-400">{node.description}</div>
                    </div>
                    {isUnlocked ? (
                      <span className="text-[10px] text-emerald-400 font-pixel">✓</span>
                    ) : (
                      <button
                        className={`btn-pixel ${canUnlock ? 'success' : ''}`}
                        disabled={!canUnlock}
                        onClick={() => unlock(node.id)}
                      >
                        {node.cost} pt
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {toast && (
        <div className="fixed bottom-20 left-0 right-0 max-w-[420px] mx-auto px-3 z-50">
          <div className="rounded-md border border-amber-700 bg-amber-900/80 text-amber-100 text-[11px] font-pixel p-2 text-center">{toast}</div>
        </div>
      )}
    </div>
  );
}
