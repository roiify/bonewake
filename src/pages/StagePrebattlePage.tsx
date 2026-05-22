import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { STAGE_BY_ID } from '../data/stages';
import { useHeroes } from '../store/heroes';
import { useProfile } from '../store/profile';
import { HERO_BY_ID, HERO_PORTRAITS, ENEMY_SPRITES, HIDDEN_HERO_IDS } from '../data/heroes';
import { ensureMannySummons, MANNY_TPL } from '../lib/mannySummons';
import { buildEnemyUnit, calcHeroStats, toCombatUnit, xpForLevel } from '../lib/stats';
import { tierLabel } from '../lib/tier';
import { resolveBattle } from '../lib/combat';
import { db } from '../lib/db';
import { genLoot } from '../lib/loot';
import { recordEvent } from '../lib/lifetime';
import { incrementTask } from '../lib/tasks';
import { rollClearDrops, addMaterial } from '../lib/crafting';
import { MAT_SOULSHARD, essenceItemId } from '../data/ultimateGear';
import { activeBonds } from '../data/bonds';
import { loadPresets } from '../lib/squadPresets';
import { BOSS_BANTER } from '../data/bossBanter';

const SQUAD_KEY = 'bonewake_squad';

function loadSquad(): string[] {
  try { return JSON.parse(localStorage.getItem(SQUAD_KEY) ?? '[]'); } catch { return []; }
}
function saveSquad(ids: string[]) { localStorage.setItem(SQUAD_KEY, JSON.stringify(ids)); }

export default function StagePrebattlePage() {
  const { stageId } = useParams();
  const navigate = useNavigate();
  const stage = stageId ? STAGE_BY_ID[stageId] : null;
  const heroes = useHeroes(s => s.heroes);
  const equipment = useHeroes(s => s.equipment);
  const updateHero = useHeroes(s => s.updateHero);
  const addEquipment = useHeroes(s => s.addEquipment);
  const profile = useProfile(s => s.profile);
  const [squad, setSquad] = useState<string[]>(loadSquad());
  const [picker, setPicker] = useState(false);
  const [instantBusy, setInstantBusy] = useState(false);
  const [stageClear, setStageClear] = useState<{ stars: number } | null>(null);

  useEffect(() => { saveSquad(squad); }, [squad]);

  useEffect(() => {
    if (!stage) return;
    db.stageClears.get(stage.id).then(c => setStageClear(c ? { stars: c.stars } : null));
  }, [stage?.id]);

  const enemies = useMemo(() =>
    stage?.enemyTeam.map((e, i) => buildEnemyUnit(e.templateId, e.level, e.star, `e${i}`)) ?? [],
    [stageId]
  );

  if (!stage) return <div className="p-6 text-center">Stage not found.</div>;

  const playerUnits = squad
    .map(id => heroes.find(h => h.id === id))
    .filter((h): h is NonNullable<typeof h> => !!h)
    .map((h, i, arr) => toCombatUnit(h, equipment, 'player', `p${i}`, arr.map(x => x.templateId)))
    .filter((u): u is NonNullable<typeof u> => !!u);

  async function autoFormation() {
    // Auto picks the top 3 by power, excluding the auto-managed summons.
    // If Manny lands in the top 3, his lore takes over: the squad becomes
    // the locked solo lineup [Manny, Bone King, Lich Sovereign] instead of
    // mixing him with other heroes.
    const ranked = [...heroes]
      .filter(h => !HIDDEN_HERO_IDS.has(h.templateId))
      .map(h => ({ h, p: calcHeroStats(h, equipment).power }))
      .sort((a, b) => b.p - a.p);
    const top3 = ranked.slice(0, 3);
    const mannyPick = top3.find(x => x.h.templateId === MANNY_TPL);
    if (mannyPick) {
      const summonIds = await ensureMannySummons();
      // Drop into the solo lineup regardless of who else was in top 3.
      setSquad([mannyPick.h.id, ...summonIds]);
      return;
    }
    setSquad(top3.map(x => x.h.id));
  }

  async function toggleHeroInSquad(heroId: string) {
    const h = heroes.find(x => x.id === heroId);
    const isManny = h?.templateId === MANNY_TPL;
    const mannyInSquad = squad.some(id => heroes.find(x => x.id === id)?.templateId === MANNY_TPL);

    // Removing Manny clears his summons too (the locked solo lineup is all-or-nothing).
    if (squad.includes(heroId)) {
      if (isManny) {
        setSquad([]);
      } else {
        setSquad(squad.filter(id => id !== heroId));
      }
      return;
    }

    // Adding Manny: auto-fill summons and lock the squad to [manny, bone_king, lich_sovereign].
    if (isManny) {
      const summonIds = await ensureMannySummons();
      setSquad([heroId, ...summonIds]);
      return;
    }

    // Can't add other heroes while Manny is in the squad — he fights alone.
    if (mannyInSquad) return;

    if (squad.length < 3) setSquad([...squad, heroId]);
  }

  async function loadPresetSquad(heroIds: string[]) {
    const valid = heroIds.filter(id => heroes.some(h => h.id === id));
    // If the preset includes Manny, enforce the locked solo lineup so
    // an old preset can't bypass the Manny-fights-alone rule.
    const mannyId = valid.find(id => heroes.find(h => h.id === id)?.templateId === MANNY_TPL);
    if (mannyId) {
      const summonIds = await ensureMannySummons();
      setSquad([mannyId, ...summonIds]);
      return;
    }
    setSquad(valid);
  }

  async function savePresetSquad() {
    const name = prompt('Preset name (max 16 chars):', `Squad ${new Date().toLocaleDateString()}`);
    if (!name || squad.length === 0) return;
    const { upsertPreset } = await import('../lib/squadPresets');
    upsertPreset(name.trim().slice(0, 16), squad);
    alert(`Saved "${name}"`);
  }

  async function startBattle() {
    if (!stage) return;
    if (squad.length === 0) { alert('Pick at least 1 hero!'); return; }
    // TESTING: energy check disabled (unlimited energy mode).
    navigate(`/battle/play/${stage.id}`);
  }

  // Instant Clear: only available if stage has been 3-starred. Skips animation, grants rewards.
  async function instantClear(count: number = 1) {
    if (!stage) return;
    if (squad.length === 0) { alert('Pick at least 1 hero!'); return; }
    // TESTING: energy check disabled (unlimited energy mode).
    setInstantBusy(true);
    let totalGold = 0, totalExp = 0;
    const droppedItems: number[] = [];
    for (let i = 0; i < count; i++) {
      // Sim a battle for correctness (cheap — just to get the seed/log if needed for stats)
      const playerSquad = squad.map(id => heroes.find(h => h.id === id)).filter((h): h is NonNullable<typeof h> => !!h);
      const playerUnitsSim = playerSquad.map((h, idx) => toCombatUnit(h, equipment, 'player', `p${idx}`)).filter((u): u is NonNullable<typeof u> => !!u);
      const enemyUnits = stage.enemyTeam.map((e, idx) => buildEnemyUnit(e.templateId, e.level, e.star, `e${idx}`));
      const battle = resolveBattle(playerUnitsSim, enemyUnits);
      if (battle.winner !== 'player') {
        alert('Squad lost! Instant clear stopped. Strengthen your team.');
        setInstantBusy(false);
        return;
      }
      // Apply rewards
      await useProfile.getState().spendEnergy(stage.energyCost);
      await useProfile.getState().addGold(stage.rewards.gold);
      totalGold += stage.rewards.gold;
      totalExp += stage.rewards.exp;
      for (const hid of squad) {
        const h = heroes.find(x => x.id === hid);
        if (!h) continue;
        let lvl = h.level;
        let exp = h.exp + stage.rewards.exp;
        while (exp >= xpForLevel(lvl) && lvl < 100) { exp -= xpForLevel(lvl); lvl++; }
        await updateHero(h.id, { level: lvl, exp });
      }
      await useProfile.getState().gainExp(stage.rewards.exp);
      // Stage clears: count clears, but stars stay (already 3-starred)
      const existing = await db.stageClears.get(stage.id);
      await db.stageClears.put({
        stageId: stage.id,
        stars: existing?.stars ?? 3,
        clears: (existing?.clears ?? 0) + 1,
        lastClearedAt: Date.now(),
      });
      // Loot — 1 item (no boss bonus on instant)
      const ilvl = Math.max(1, (stage.chapter - 1) * 10 + stage.num * 2);
      const item = genLoot({ itemLevel: ilvl, minRarity: 1, luckBoost: stage.chapter * 0.08 });
      await addEquipment(item);
      droppedItems.push(item.rarity ?? 1);
      // 3-star mats
      const mats = rollClearDrops(stage.chapter, stage.num === 5);
      if (mats.soulshards > 0) await addMaterial(MAT_SOULSHARD, mats.soulshards);
      for (const ess of mats.essences) await addMaterial(essenceItemId(ess.heroId), ess.count);
      await recordEvent({ kind: 'battleWon' });
      await recordEvent({ kind: 'stageCleared', stars: 3 });
      await recordEvent({ kind: 'goldEarned', amount: stage.rewards.gold });
      await incrementTask('daily_battles', 1);
      await incrementTask('daily_threestar', 1);
    }
    setInstantBusy(false);
    alert(`Instant-cleared ${count}× · +${totalGold.toLocaleString()} 🪙 · +${totalExp.toLocaleString()} xp · ${droppedItems.length} drops`);
  }

  return (
    <div className="p-3 space-y-3">
      <button onClick={() => navigate(-1)} className="text-xs text-zinc-400">← Back</button>
      <div className="text-center">
        <div className="font-pixel text-[10px] text-zinc-400">Stage {stage.chapter}-{stage.num}</div>
        <h2 className="font-pixel text-base text-amber-300 mt-1">{stage.name}</h2>
      </div>

      {/* Boss banter — only on boss stages with defined banter */}
      {BOSS_BANTER[stage.id] && (
        <div className="rounded-lg border-2 border-rose-700 bg-gradient-to-b from-rose-950/40 to-zinc-900 p-3 space-y-1.5">
          {BOSS_BANTER[stage.id].map((line, i) => (
            <div key={i} className="text-[11px] leading-snug">
              {line.speaker === 'narrator' ? (
                <span className="italic text-zinc-400">{line.line}</span>
              ) : (
                <span className="text-rose-200"><span className="text-rose-400">▸</span> "{line.line}"</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Enemies */}
      <div className="rounded-lg border border-rose-900/50 bg-gradient-to-b from-rose-950/30 to-zinc-900 p-3">
        <div className="font-pixel text-[10px] text-rose-300 mb-2">Enemy</div>
        <div className="grid grid-cols-3 gap-2">
          {enemies.map(e => {
            const sprite = ENEMY_SPRITES[e.templateId as keyof typeof ENEMY_SPRITES];
            return (
              <div key={e.id} className="rounded border-2 p-2 text-center bg-zinc-950" style={{ borderColor: e.color }}>
                <div className="aspect-square flex items-center justify-center overflow-hidden">
                  {sprite
                    ? <img src={sprite.idle} alt={e.name} className="w-[90%] h-[90%] object-contain scale-x-[-1]" style={{ imageRendering: 'pixelated' }} />
                    : <div className="text-3xl">{e.emoji}</div>}
                </div>
                <div className="text-[10px] mt-1 truncate" style={{ color: e.color }}>{e.name}</div>
                <div className="text-[9px] text-zinc-400">LVL:{e.level} {tierLabel(e.star)}</div>
                <div className="text-[9px] text-rose-400 mt-0.5">HP {e.maxHp}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Your squad */}
      <div className="rounded-lg border border-emerald-900/50 bg-gradient-to-b from-emerald-950/30 to-zinc-900 p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="font-pixel text-[10px] text-emerald-300">Your Squad ({squad.length}/3)</div>
          <div className="flex gap-1 shrink-0">
            <button className="btn-pixel" onClick={autoFormation}>Auto</button>
            <button className="btn-pixel" onClick={() => setPicker(true)}>Edit</button>
            <button className="btn-pixel" onClick={savePresetSquad} disabled={squad.length === 0}>💾</button>
            <button
              className="btn-pixel danger"
              onClick={() => setSquad([])}
              disabled={squad.length === 0}
              title="Remove all heroes from squad"
            >🗑️</button>
          </div>
        </div>
        {/* Preset chips */}
        {(() => {
          const presets = loadPresets();
          if (presets.length === 0) return null;
          return (
            <div className="flex gap-1 mb-2 overflow-x-auto pb-1">
              {presets.map(p => (
                <button
                  key={p.name}
                  onClick={() => loadPresetSquad(p.heroIds)}
                  className="text-[10px] font-pixel px-2 py-1 rounded border border-zinc-700 bg-zinc-900 hover:border-emerald-500 whitespace-nowrap shrink-0"
                >📋 {p.name}</button>
              ))}
            </div>
          );
        })()}
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map(i => {
            const u = playerUnits[i];
            if (!u) return (
              <div key={i} className="rounded border-2 border-dashed border-zinc-700 p-2 text-center bg-zinc-950 aspect-square flex items-center justify-center">
                <span className="text-[10px] text-zinc-600">empty</span>
              </div>
            );
            const portrait = HERO_PORTRAITS[u.templateId];
            return (
              <div key={u.id} className="rounded border-2 p-2 text-center bg-zinc-950" style={{ borderColor: u.color }}>
                <div className="aspect-square flex items-center justify-center overflow-hidden">
                  {portrait
                    ? <img src={portrait} alt={u.name} className="w-[90%] h-[90%] object-contain" style={{ imageRendering: 'pixelated' }} />
                    : <div className="text-3xl">{u.emoji}</div>}
                </div>
                <div className="text-[10px] mt-1 truncate" style={{ color: u.color }}>{u.name}</div>
                <div className="text-[9px] text-zinc-400">LVL:{u.level} {tierLabel(u.star)}</div>
                <div className="text-[9px] text-emerald-400 mt-0.5">HP {u.maxHp}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active bonds preview */}
      {(() => {
        const squadIds = playerUnits.map(u => u.templateId);
        if (squadIds.length < 2) return null;
        const bonds = activeBonds(squadIds);
        if (bonds.length === 0) return null;
        return (
          <div className="rounded-md border border-amber-700 bg-amber-900/15 p-2 space-y-1">
            <div className="text-[10px] font-pixel text-amber-300">ACTIVE BONDS</div>
            {bonds.map(b => (
              <div key={b.id} className="text-[10px] text-zinc-300 flex items-center gap-2">
                <span>{b.emoji}</span>
                <span className="font-pixel text-amber-300">{b.name}</span>
                <span className="text-zinc-500 text-[9px] flex-1 truncate">{b.description}</span>
              </div>
            ))}
          </div>
        );
      })()}
      <div className="text-center text-xs text-zinc-400">Energy cost: ⚡{stage.energyCost} (you have {profile.energy})</div>
      <button className="btn-pixel primary w-full text-base" onClick={startBattle}>Start Battle</button>
      {stageClear?.stars === 3 && (
        <div className="rounded-md border border-emerald-700 bg-emerald-900/15 p-2.5 space-y-2">
          <div className="text-[10px] text-emerald-300 font-pixel text-center">⚡ INSTANT CLEAR (3★ unlocked)</div>
          <div className="flex gap-1.5">
            <button className="btn-pixel flex-1" disabled={instantBusy} onClick={() => instantClear(1)}>×1 ⚡{stage.energyCost}</button>
            <button className="btn-pixel flex-1" disabled={instantBusy || profile.energy < stage.energyCost * 5} onClick={() => instantClear(5)}>×5 ⚡{stage.energyCost * 5}</button>
            <button className="btn-pixel flex-1" disabled={instantBusy || profile.energy < stage.energyCost * 10} onClick={() => instantClear(10)}>×10 ⚡{stage.energyCost * 10}</button>
          </div>
        </div>
      )}

      {picker && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end justify-center" onClick={() => setPicker(false)}>
          <div className="bg-zinc-900 w-full max-w-[420px] rounded-t-2xl border-t border-zinc-700 p-3 max-h-[70vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div className="font-pixel text-xs">Pick Squad ({squad.length}/3)</div>
              <button className="btn-pixel" onClick={() => setPicker(false)}>Done</button>
            </div>
            {heroes.length === 0 && <div className="text-xs text-zinc-500 text-center py-6">No heroes. Try Summon.</div>}
            {/* Hide Manny's summons — they're not pickable, they auto-fill when Manny enters the squad. */}
            <div className="grid grid-cols-3 gap-2">
              {heroes.filter(h => !HIDDEN_HERO_IDS.has(h.templateId)).map(h => {
                const tpl = HERO_BY_ID[h.templateId];
                const inSquad = squad.includes(h.id);
                const stats = calcHeroStats(h, equipment);
                const mannyInSquad = squad.some(sid => heroes.find(x => x.id === sid)?.templateId === MANNY_TPL);
                const locked = mannyInSquad && h.templateId !== MANNY_TPL;
                return (
                  <button
                    key={h.id}
                    onClick={() => toggleHeroInSquad(h.id)}
                    disabled={locked}
                    className={`relative rounded p-2 text-center transition-all ${inSquad ? 'scale-105 ring-4 ring-amber-300' : ''} ${locked ? 'opacity-30 grayscale' : ''}`}
                    style={{
                      borderWidth: inSquad ? 3 : 2,
                      borderStyle: 'solid',
                      borderColor: inSquad ? '#fbbf24' : tpl.color,
                      background: inSquad ? `${tpl.color}33` : '#09090b',
                      boxShadow: inSquad ? `0 0 18px ${tpl.color}, 0 0 8px #fbbf24` : undefined,
                    }}
                  >
                    {inSquad && (
                      <div className="absolute -top-2 -right-2 z-10 w-6 h-6 rounded-full bg-amber-400 border-2 border-zinc-950 flex items-center justify-center text-zinc-950 font-pixel text-xs">
                        ✓
                      </div>
                    )}
                    <div className="aspect-square flex items-center justify-center overflow-hidden">
                      {HERO_PORTRAITS[tpl.id]
                        ? <img src={HERO_PORTRAITS[tpl.id]} alt={tpl.name} className="w-[90%] h-[90%] object-contain" style={{ imageRendering: 'pixelated' }} />
                        : <div className="text-3xl">{tpl.emoji}</div>}
                    </div>
                    <div className="text-[10px] mt-1 truncate font-pixel" style={{ color: inSquad ? '#fde68a' : tpl.color }}>{tpl.name}</div>
                    <div className="text-[9px] text-zinc-400">LVL:{h.level} ⚔{stats.power}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
