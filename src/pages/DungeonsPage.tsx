import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DUNGEONS, dungeonsForToday, buildDungeonTeam, weekdayNames, hasClearedDungeon, markDungeonCleared, type DungeonDef, type DungeonTier } from '../data/dungeons';
import { useProfile } from '../store/profile';
import { useHeroes } from '../store/heroes';
import { resolveBattle } from '../lib/combat';
import { toCombatUnit, xpForLevel, effectiveMaxLevel } from '../lib/stats';
import { recordEvent } from '../lib/lifetime';
import { genLoot } from '../lib/loot';
import { addMaterial } from '../lib/crafting';
import { MAT_SOULSHARD, essenceItemId, ULTIMATE_SETS } from '../data/ultimateGear';
import SquadPicker from '../components/SquadPicker';

const SQUAD_KEY = 'bonewake_squad';
function loadSquad(): string[] {
  try { return JSON.parse(localStorage.getItem(SQUAD_KEY) ?? '[]'); } catch { return []; }
}

export default function DungeonsPage() {
  const navigate = useNavigate();
  const profile = useProfile(s => s.profile);
  const heroes = useHeroes(s => s.heroes);
  const equipment = useHeroes(s => s.equipment);
  const updateHero = useHeroes(s => s.updateHero);
  const addEquipment = useHeroes(s => s.addEquipment);
  const [activeDungeon, setActiveDungeon] = useState<DungeonDef | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ won: boolean; rewards?: any } | null>(null);

  const today = dungeonsForToday();
  const todayIds = new Set(today.map(d => d.id));

  async function runTier(def: DungeonDef, tier: DungeonTier) {
    if (busy) return;
    if (profile.energy < tier.energyCost) {
      alert('Not enough energy');
      return;
    }
    setBusy(true);
    await useProfile.getState().spendEnergy(tier.energyCost);
    // Build squad
    const squad = loadSquad()
      .map(id => heroes.find(h => h.id === id))
      .filter((h): h is NonNullable<typeof h> => !!h);
    if (squad.length === 0) {
      alert('Set a squad first.');
      setBusy(false);
      return;
    }
    const playerUnits = squad
      .map((h, i) => toCombatUnit(h, equipment, 'player', `p${i}`))
      .filter((u): u is NonNullable<typeof u> => !!u);
    const enemyUnits = buildDungeonTeam(def, tier);
    const battle = resolveBattle(playerUnits, enemyUnits);
    const won = battle.winner === 'player';
    if (won) {
      const r = tier.rewards;
      if (r.gold) {
        await useProfile.getState().addGold(r.gold);
        await recordEvent({ kind: 'goldEarned', amount: r.gold });
      }
      if (r.exp) {
        // distribute exp to squad
        const playerLevel = useProfile.getState().profile.level;
        for (const id of loadSquad()) {
          const h = heroes.find(x => x.id === id);
          if (!h) continue;
          let lvl = h.level;
          let exp = h.exp + r.exp;
          const cap = effectiveMaxLevel(h.star, playerLevel);
          while (exp >= xpForLevel(lvl) && lvl < cap) {
            exp -= xpForLevel(lvl);
            lvl++;
          }
          await updateHero(h.id, { level: lvl, exp });
        }
        await useProfile.getState().gainExp(r.exp);
      }
      if (r.gems) await useProfile.getState().addGems(r.gems);
      if (r.equipmentCount && r.equipmentMinRarity) {
        for (let i = 0; i < r.equipmentCount; i++) {
          const ilvl = Math.max(10, tier.enemyLevel * 2);
          await addEquipment(genLoot({ itemLevel: ilvl, minRarity: r.equipmentMinRarity, luckBoost: 0.3 }));
        }
      }
      // Tier-3 dungeons drop ult-gear materials too — economy alignment
      // so the gear loop has more sources beyond stage 3-stars + bosses.
      if (r.soulshard) {
        await addMaterial(MAT_SOULSHARD, r.soulshard);
      }
      if (r.essenceRandomCount && r.essenceRandomCount > 0) {
        // Pick a random hero's essence per drop unit. Same probability
        // distribution as boss-stage essence drops.
        for (let i = 0; i < r.essenceRandomCount; i++) {
          const set = ULTIMATE_SETS[Math.floor(Math.random() * ULTIMATE_SETS.length)];
          await addMaterial(essenceItemId(set.heroId), 1);
        }
      }
      // Instant-skip also counts as a clear for unlock purposes (only
      // reachable if it was already unlocked by a manual play-through —
      // but we mark it anyway so the state is self-healing).
      markDungeonCleared(def.id, tier.tier);
      await recordEvent({ kind: 'battleWon' });
      setResult({ won: true, rewards: r });
    } else {
      await recordEvent({ kind: 'battleLost' });
      setResult({ won: false });
    }
    setBusy(false);
  }

  return (
    <div className="p-3 space-y-3">
      <button onClick={() => navigate(-1)} className="text-xs text-zinc-400">← Back</button>
      <div>
        <h2 className="font-pixel text-sm">⛏️ Material Dungeons</h2>
        <p className="text-[10px] text-zinc-500 mt-1">
          Themed farming. Each dungeon is open only on its weekdays. Today is <span className="text-emerald-400 font-pixel">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date().getDay()]}</span>.
        </p>
        <p className="text-[10px] text-zinc-400 mt-2 leading-snug">
          Pure <span className="text-amber-300">resource faucets</span> — pick the dungeon that
          matches what you're short on (gold, XP, gear, or gems) and farm it on its open day.
        </p>
      </div>

      <div className="space-y-2">
        {DUNGEONS.map(def => {
          const open = todayIds.has(def.id);
          const expanded = activeDungeon?.id === def.id;
          return (
            <div
              key={def.id}
              className={`rounded-md border-2 ${expanded ? 'border-amber-500' : open ? 'border-emerald-700' : 'border-zinc-800'} ${open ? 'bg-zinc-900' : 'bg-zinc-900/40 opacity-60'}`}
            >
              <button
                onClick={() => open && setActiveDungeon(expanded ? null : def)}
                className="w-full text-left p-3 flex items-center gap-3"
                disabled={!open}
              >
                <div className="w-12 h-12 rounded bg-zinc-950 flex items-center justify-center text-3xl shrink-0">{def.emoji}</div>
                <div className="flex-1">
                  <div className="text-xs font-pixel">{def.name}</div>
                  <div className="text-[10px] text-zinc-400">{def.description}</div>
                  <div className="text-[9px] text-zinc-500 mt-0.5">
                    Open: <span className={open ? 'text-emerald-400' : 'text-rose-400'}>{weekdayNames(def.availableWeekdays)}</span>
                  </div>
                </div>
              </button>

              {expanded && (
                <div className="px-3 pb-3 space-y-2 border-t border-zinc-800 pt-2">
                  {def.tiers.map(tier => {
                    const r = tier.rewards;
                    const rewardLabel = [
                      r.gold && `${r.gold} 🪙`,
                      r.exp && `${r.exp} xp`,
                      r.gems && `${r.gems} 💎`,
                      r.equipmentCount && `${r.equipmentCount}x gear`,
                    ].filter(Boolean).join(' · ');
                    const canAfford = profile.energy >= tier.energyCost;
                    const cleared = hasClearedDungeon(def.id, tier.tier);
                    return (
                      <div key={tier.tier} className="rounded border border-zinc-700 bg-zinc-950 p-2 flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-pixel flex items-center gap-1">
                            Tier {tier.tier}: {tier.name}
                            {cleared && <span className="text-[8px] text-emerald-400">✓</span>}
                          </div>
                          <div className="text-[9px] text-zinc-500">LVL:{tier.enemyLevel} enemies · {'★'.repeat(tier.enemyStar)}</div>
                          <div className="text-[10px] text-emerald-400 mt-0.5">{rewardLabel}</div>
                        </div>
                        <div className="flex flex-col gap-1 shrink-0">
                          <button
                            className={`btn-pixel ${canAfford ? 'primary' : ''}`}
                            disabled={!canAfford || busy}
                            onClick={() => navigate(`/battle/play/dungeon-${def.id}-${tier.tier}`)}
                            title="Play through the battle"
                          >
                            ▶ Play ⚡{tier.energyCost}
                          </button>
                          {cleared ? (
                            <button
                              className="btn-pixel"
                              disabled={!canAfford || busy}
                              onClick={() => runTier(def, tier)}
                              title="Instant clear (auto-resolve)"
                            >
                              ⏩ Skip
                            </button>
                          ) : (
                            <div
                              className="text-[8px] text-zinc-600 text-center px-1"
                              title="Clear this tier once to unlock instant-skip"
                            >
                              skip locked
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <SquadPicker />

      {result && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setResult(null)}>
          <div className="bg-zinc-900 border-2 rounded-lg p-6 text-center max-w-xs"
            style={{ borderColor: result.won ? '#22c55e' : '#ef4444' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="text-3xl mb-2">{result.won ? '⚒️' : '💀'}</div>
            <div className="font-pixel text-lg mb-2" style={{ color: result.won ? '#86efac' : '#f87171' }}>
              {result.won ? 'CLEARED' : 'DEFEATED'}
            </div>
            {result.won && result.rewards && (
              <div className="text-xs text-zinc-300 space-y-1 mb-3">
                {result.rewards.gold && <div>+{result.rewards.gold} 🪙</div>}
                {result.rewards.exp && <div>+{result.rewards.exp} xp</div>}
                {result.rewards.gems && <div>+{result.rewards.gems} 💎</div>}
                {result.rewards.equipmentCount && <div>+{result.rewards.equipmentCount} equipment</div>}
              </div>
            )}
            <button className="btn-pixel primary w-full" onClick={() => setResult(null)}>OK</button>
          </div>
        </div>
      )}
    </div>
  );
}
