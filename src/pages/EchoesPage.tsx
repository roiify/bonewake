import { useNavigate } from 'react-router-dom';
import { useProfile } from '../store/profile';
import { ECHOES, unlockedEchoSlots, ECHO_SLOT_UNLOCK_LEVELS } from '../data/echoes';
import { asset } from '../lib/assetPath';
import PageHeader from '../components/ui/PageHeader';

const BOSS_SPRITE = (bossId: string) => asset(`sprites/bosses/${bossId}_idle.png`);

export default function EchoesPage() {
  const navigate = useNavigate();
  const profile = useProfile(s => s.profile);
  const patch = useProfile(s => s.patch);

  const owned = new Set(profile.ownedEchoes ?? []);
  const equipped = profile.equippedEchoes ?? [];
  const slots = unlockedEchoSlots(profile.level);

  async function toggleEquip(id: string) {
    if (!owned.has(id)) return;
    if (equipped.includes(id)) {
      await patch({ equippedEchoes: equipped.filter(e => e !== id) });
      return;
    }
    if (equipped.length >= slots) return;            // slot cap
    await patch({ equippedEchoes: [...equipped, id] });
  }

  return (
    <div className="p-3 space-y-3 pb-5">
      <button onClick={() => navigate(-1)} className="text-xs text-zinc-400">← Back</button>

      <PageHeader
        title="💀 Boss Echoes"
        tagline="Memories of the bosses you've broken — equip for account-wide passives"
        glow="#fbbf24"
      />
      <p className="text-[10px] text-zinc-400 px-2 leading-snug">
        <span className="text-amber-300">Drop rule:</span> the first kill of a World Boss or
        Shatter is a guaranteed Echo drop. Repeat kills only roll a {Math.round(0.15 * 100)}% chance.
      </p>

      {/* Collection summary */}
      <div className="rounded-md border border-zinc-800 bg-zinc-900 p-3">
        <div className="flex items-center justify-between text-[11px] font-pixel">
          <span className="text-emerald-300">Collected {owned.size}/{ECHOES.length}</span>
          <span className="text-cyan-300">Equipped {equipped.length}/{slots}</span>
        </div>
        <div className="mt-2 text-[9px] text-zinc-500">
          Slot unlocks at player level: {ECHO_SLOT_UNLOCK_LEVELS.join(' · ')}
        </div>
      </div>

      {/* Loadout slots */}
      <div className="rounded-md border border-emerald-900/40 bg-emerald-950/15 p-3">
        <div className="font-pixel text-[10px] text-emerald-300 mb-2">LOADOUT</div>
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 5 }).map((_, i) => {
            const id = equipped[i];
            const echo = id ? ECHOES.find(e => e.id === id) : null;
            const locked = i >= slots;
            return (
              <button
                key={i}
                onClick={() => echo && toggleEquip(echo.id)}
                disabled={locked || !echo}
                className={`aspect-square rounded border-2 flex flex-col items-center justify-center text-[8px] p-1 ${
                  locked ? 'border-zinc-800 bg-zinc-950 opacity-40'
                  : echo ? 'border-amber-400 bg-amber-950/20 hover:scale-105'
                  : 'border-dashed border-zinc-700 bg-zinc-950'
                } transition`}
                title={echo ? `${echo.name} — ${echo.effectText} (tap to unequip)` : locked ? `Unlock at lvl ${ECHO_SLOT_UNLOCK_LEVELS[i]}` : 'Empty slot'}
              >
                {locked ? (
                  <div className="text-2xl text-zinc-700">🔒</div>
                ) : echo ? (
                  <>
                    <img src={BOSS_SPRITE(echo.bossId)} alt={echo.name} className="w-[80%] h-[60%] object-contain" style={{ imageRendering: 'pixelated' }} />
                    <div className="text-[8px] text-amber-300 font-pixel truncate w-full">{echo.name}</div>
                  </>
                ) : (
                  <div className="text-xl text-zinc-700">+</div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Collection grid */}
      <div className="font-pixel text-[10px] text-zinc-400 mt-2">COLLECTION</div>
      <div className="grid grid-cols-2 gap-2">
        {ECHOES.map(echo => {
          const isOwned = owned.has(echo.id);
          const isEquipped = equipped.includes(echo.id);
          return (
            <button
              key={echo.id}
              onClick={() => toggleEquip(echo.id)}
              disabled={!isOwned}
              className={`rounded-md border-2 p-2 text-left transition ${
                isEquipped ? 'border-amber-400 bg-amber-950/30'
                : isOwned   ? 'border-zinc-700 bg-zinc-900 hover:border-amber-500'
                            : 'border-zinc-800 bg-zinc-950/60 opacity-60'
              }`}
            >
              <div className="flex items-center gap-2">
                <img
                  src={BOSS_SPRITE(echo.bossId)}
                  alt={echo.name}
                  className="w-14 h-14 object-contain shrink-0"
                  style={{
                    imageRendering: 'pixelated',
                    filter: isOwned ? 'none' : 'brightness(0.3) grayscale(1)',
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className={`text-[10px] font-pixel truncate ${isOwned ? 'text-amber-300' : 'text-zinc-500'}`}>
                    {isOwned ? echo.name : '???'}
                  </div>
                  <div className="text-[8px] text-zinc-500 truncate">
                    from {echo.bossName}
                  </div>
                  {isOwned && (
                    <div className="text-[9px] text-emerald-300 mt-0.5 leading-snug">
                      {echo.effectText}
                    </div>
                  )}
                </div>
                {isEquipped && (
                  <span className="text-amber-300 font-pixel text-[10px] shrink-0">✓</span>
                )}
              </div>
              {isOwned && (
                <div className="text-[8px] text-zinc-500 italic mt-1 truncate">"{echo.flavor}"</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
