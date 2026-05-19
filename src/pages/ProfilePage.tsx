import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../store/profile';
import { useHeroes } from '../store/heroes';
import { TITLES, TITLE_BY_ID, earnedTitles } from '../data/titles';
import { DEFAULT_LIFETIME } from '../lib/db';

export default function ProfilePage() {
  const navigate = useNavigate();
  const profile = useProfile(s => s.profile);
  const patch = useProfile(s => s.patch);
  const heroes = useHeroes(s => s.heroes);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile.displayName ?? 'Hero');
  const [showTitlePicker, setShowTitlePicker] = useState(false);

  const lifetime = { ...DEFAULT_LIFETIME, ...(profile.lifetime ?? {}) };
  const earned = new Set(earnedTitles(lifetime));
  const activeTitle = profile.activeTitle ? TITLE_BY_ID[profile.activeTitle] : null;

  async function saveName() {
    const clean = nameInput.trim().slice(0, 16);
    if (clean.length === 0) return;
    await patch({ displayName: clean });
    setEditingName(false);
  }

  async function setTitle(id: string | null) {
    await patch({ activeTitle: id });
    setShowTitlePicker(false);
  }

  return (
    <div className="p-3 space-y-3 pb-5">
      <button onClick={() => navigate(-1)} className="text-xs text-zinc-400">← Back</button>

      {/* Player card */}
      <div className="rounded-lg border-2 border-amber-600 bg-gradient-to-br from-amber-950/40 to-zinc-900 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-2xl font-pixel text-zinc-900">
            {profile.level}
          </div>
          <div className="flex-1 min-w-0">
            {editingName ? (
              <div className="flex gap-1 items-center">
                <input
                  className="flex-1 bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-sm font-pixel text-zinc-100"
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  maxLength={16}
                />
                <button className="btn-pixel success" onClick={saveName}>✓</button>
                <button className="btn-pixel" onClick={() => { setEditingName(false); setNameInput(profile.displayName); }}>✕</button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <div className="text-sm font-pixel text-zinc-100 truncate">{profile.displayName}</div>
                <button onClick={() => setEditingName(true)} className="text-zinc-500 hover:text-zinc-300 text-xs">✏</button>
              </div>
            )}
            <button onClick={() => setShowTitlePicker(true)} className="text-[11px] font-pixel mt-1" style={{ color: activeTitle?.color ?? '#71717a' }}>
              {activeTitle ? activeTitle.label : '— No title —'}
              <span className="text-[9px] text-zinc-500 ml-1">tap to change</span>
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <Stat icon="🪙" label="Gold" value={profile.gold.toLocaleString()} />
          <Stat icon="💎" label="Gems" value={profile.gems.toLocaleString()} />
          <Stat icon="👥" label="Heroes Owned" value={heroes.length.toString()} />
          <Stat icon="⏱" label="Days Since" value={daysSince(profile.createdAt)} />
        </div>
      </div>

      {/* Lifetime stats */}
      <div className="rounded-md border border-zinc-800 bg-zinc-900 p-3">
        <div className="font-pixel text-xs text-amber-300 mb-2">Lifetime Stats</div>
        <div className="grid grid-cols-2 gap-1.5">
          <LtStat label="Battles Won"      value={lifetime.battlesWon} />
          <LtStat label="Battles Lost"     value={lifetime.battlesLost} />
          <LtStat label="Stages Cleared"   value={lifetime.stagesCleared} />
          <LtStat label="3★ Clears"        value={lifetime.threeStarClears} />
          <LtStat label="Heroes Summoned"  value={lifetime.summons} />
          <LtStat label="SSS Pulls"        value={lifetime.ssspulls} />
          <LtStat label="Mythics Crafted"  value={lifetime.mythicsCrafted} />
          <LtStat label="Legendaries"      value={lifetime.legendariesDropped} />
          <LtStat label="Top Tower Floor"  value={lifetime.towerMaxFloor} />
          <LtStat label="Gold Earned"      value={lifetime.goldEarned} />
        </div>
        <div className="text-[10px] text-emerald-400 font-pixel text-center mt-3">
          {earned.size} / {TITLES.length} titles earned
        </div>
      </div>

      {/* Title picker */}
      {showTitlePicker && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end" onClick={() => setShowTitlePicker(false)}>
          <div className="w-full max-w-[420px] mx-auto bg-zinc-900 border-t border-zinc-700 rounded-t-2xl p-4 max-h-[75vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="font-pixel text-xs mb-3">Choose a title</div>
            <button
              onClick={() => setTitle(null)}
              className="w-full text-left rounded border border-zinc-700 p-2 mb-2 hover:border-zinc-500"
            >
              <div className="text-xs text-zinc-400">— No title —</div>
            </button>
            <div className="space-y-1.5">
              {TITLES.map(t => {
                const isEarned = earned.has(t.id);
                const isActive = profile.activeTitle === t.id;
                const progress = (lifetime[t.requirement.source] as number) ?? 0;
                return (
                  <button
                    key={t.id}
                    disabled={!isEarned}
                    onClick={() => setTitle(t.id)}
                    className={`w-full text-left rounded border-2 p-2 ${
                      isActive ? 'ring-2 ring-amber-400' : ''
                    } ${isEarned ? 'bg-zinc-950' : 'bg-zinc-900/40 opacity-50 cursor-not-allowed'}`}
                    style={{ borderColor: t.color }}
                  >
                    <div className="text-xs font-pixel" style={{ color: t.color }}>{t.label}</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">{t.description}</div>
                    {!isEarned && (
                      <div className="text-[9px] text-zinc-500 mt-1">{progress.toLocaleString()} / {t.requirement.goal.toLocaleString()}</div>
                    )}
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

function Stat({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded border border-zinc-800 bg-zinc-950 p-2">
      <span className="text-base">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-[9px] text-zinc-500">{label}</div>
        <div className="text-[11px] font-pixel text-zinc-100 truncate">{value}</div>
      </div>
    </div>
  );
}

function LtStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between border-b border-zinc-800/60 py-1 text-[11px]">
      <span className="text-zinc-500">{label}</span>
      <span className="font-pixel text-zinc-200">{value.toLocaleString()}</span>
    </div>
  );
}

function daysSince(epoch: number): string {
  const days = Math.floor((Date.now() - epoch) / (24 * 60 * 60 * 1000));
  return `${days} day${days === 1 ? '' : 's'}`;
}
