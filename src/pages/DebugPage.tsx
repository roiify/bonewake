import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../store/profile';
import { useHeroes } from '../store/heroes';
import { HERO_TEMPLATES } from '../data/heroes';
import { EQUIPMENT_TEMPLATES } from '../data/equipment';
import { db, exportSave, importSave, wipeSave } from '../lib/db';
import { uid as genId } from '../lib/id';
import { addFragments, DUP_FRAGMENT_VALUE } from '../lib/fragments';
import { useItems } from '../store/items';
import { HERO_BY_ID } from '../data/heroes';
import { genLoot } from '../lib/loot';
import { addMaterial } from '../lib/crafting';
import { MAT_SOULSHARD, essenceItemId, ULTIMATE_SETS } from '../data/ultimateGear';
import { sendMail } from '../lib/mail';
import { addGemToInventory } from '../lib/gems';
import { GEMS } from '../data/gems';

export default function DebugPage() {
  const navigate = useNavigate();
  const profile = useProfile(s => s.profile);
  const patch = useProfile(s => s.patch);
  const addHero = useHeroes(s => s.addHero);
  const addEquipment = useHeroes(s => s.addEquipment);
  const heroesStore = useHeroes;
  const [pickHero, setPickHero] = useState(false);
  const [pickEq, setPickEq] = useState(false);

  async function reload() {
    await heroesStore.getState().load();
    await useItems.getState().refresh();
  }

  async function dedupeHeroes() {
    const allHeroes = await db.heroes.toArray();
    const byTemplate = new Map<string, typeof allHeroes>();
    for (const h of allHeroes) {
      const list = byTemplate.get(h.templateId) ?? [];
      list.push(h);
      byTemplate.set(h.templateId, list);
    }
    let kept = 0;
    let convertedFrags = 0;
    for (const [tplId, list] of byTemplate.entries()) {
      if (list.length <= 1) { kept++; continue; }
      // Keep highest-star, then highest-level
      list.sort((a, b) => b.star - a.star || b.level - a.level);
      kept++;
      for (const loser of list.slice(1)) {
        const tpl = HERO_BY_ID[tplId];
        const fragValue = DUP_FRAGMENT_VALUE[tpl?.rarity ?? 3];
        await addFragments(tplId, fragValue);
        convertedFrags += fragValue;
        // unequip any equipment from loser back to inventory
        for (const eqId of Object.values(loser.equipped)) {
          if (eqId) await db.equipment.update(eqId, { equippedTo: null });
        }
        await db.heroes.delete(loser.id);
      }
    }
    await reload();
    alert(`Kept ${kept} unique heroes. Converted dupes to ${convertedFrags} total fragments.`);
  }

  async function grantAllHeroes() {
    for (const tpl of HERO_TEMPLATES) {
      await addHero({
        id: genId(),
        templateId: tpl.id,
        level: 30,
        exp: 0,
        star: 5, // SSS tier
        equipped: {},
        obtainedAt: Date.now(),
      });
    }
  }
  async function grantAllEquipment() {
    // Drop 20 randomized ARPG-style items at iLevel 20, with some luck boost
    for (let i = 0; i < 20; i++) {
      await addEquipment(genLoot({ itemLevel: 20, luckBoost: 0.5 }));
    }
  }

  async function doExport() {
    const json = await exportSave();
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `pixel-fighter-save-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  }

  async function doImport() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        await importSave(text);
        alert('Save imported! Reloading…');
        window.location.reload();
      } catch (e) {
        alert('Import failed: ' + (e as Error).message);
      }
    };
    input.click();
  }

  async function doWipe() {
    if (!confirm('Wipe ALL save data? This cannot be undone.')) return;
    await wipeSave();
    alert('Save wiped. Reloading…');
    window.location.reload();
  }

  async function resetDaily() {
    await patch({ lastDailyClaim: '' });
    await db.tasks.clear();
    alert('Daily reset.');
  }

  return (
    <div className="p-3 space-y-3">
      <button onClick={() => navigate(-1)} className="text-xs text-zinc-400">← Back</button>
      <h2 className="font-pixel text-sm">Debug Menu</h2>

      <div className="rounded-md border border-amber-700 bg-amber-900/20 p-3">
        <div className="font-pixel text-xs mb-2">Currencies</div>
        <div className="grid grid-cols-2 gap-2">
          <button className="btn-pixel" onClick={() => patch({ gold: profile.gold + 1000 })}>+1000 🪙</button>
          <button className="btn-pixel" onClick={() => patch({ gems: profile.gems + 100 })}>+100 💎</button>
          <button className="btn-pixel" onClick={() => patch({ energy: 100, lastEnergyTick: Date.now() })}>Refill ⚡</button>
          <button className="btn-pixel" onClick={() => patch({ friendPoints: profile.friendPoints + 50 })}>+50 🤝</button>
        </div>
      </div>

      <div className="rounded-md border border-violet-700 bg-violet-900/20 p-3">
        <div className="font-pixel text-xs mb-2">Heroes & Equipment</div>
        <div className="grid grid-cols-2 gap-2">
          <button className="btn-pixel" onClick={() => setPickHero(true)}>Grant Hero…</button>
          <button className="btn-pixel" onClick={() => setPickEq(true)}>Grant Equip…</button>
          <button className="btn-pixel" onClick={async () => { await grantAllHeroes(); await reload(); alert('All heroes granted at L30 SSS'); }}>All Heroes</button>
          <button className="btn-pixel" onClick={async () => { await grantAllEquipment(); await reload(); alert('20 random loot drops added'); }}>Drop 20 Loot</button>
          <button className="btn-pixel" onClick={async () => {
            // Drop a guaranteed Legendary
            for (let i = 0; i < 5; i++) await addEquipment(genLoot({ itemLevel: 30, minRarity: 5 }));
            await reload();
            alert('5 legendaries dropped');
          }}>5 Legendaries</button>
        </div>
      </div>

      <div className="rounded-md border border-emerald-700 bg-emerald-900/20 p-3">
        <div className="font-pixel text-xs mb-2">Resets</div>
        <div className="grid grid-cols-2 gap-2">
          <button className="btn-pixel" onClick={resetDaily}>Reset Daily</button>
          <button className="btn-pixel" onClick={() => patch({ pityCounter: 79 })}>Pity → 79</button>
          <button className="btn-pixel success col-span-2" onClick={dedupeHeroes}>Dedupe Heroes → Fragments</button>
          <button className="btn-pixel col-span-2" onClick={async () => {
            await addMaterial(MAT_SOULSHARD, 1000);
            for (const s of ULTIMATE_SETS) await addMaterial(essenceItemId(s.heroId), 500);
            await useItems.getState().refresh();
            alert('+1000 Soulshards · +500 Essence per hero');
          }}>+ Crafting Materials</button>
          <button className="btn-pixel" onClick={async () => {
            for (const g of GEMS) await addGemToInventory(g.id, 5);
            await useItems.getState().refresh();
            alert('+5 of every gem');
          }}>+ Gems Bag</button>
          <button className="btn-pixel" onClick={async () => {
            await sendMail({ subject: 'Welcome back!', body: 'Thanks for playing.\n\nHere are some rewards.', rewards: { gold: 5000, gems: 100, soulshard: 20, energy: 50 } });
            await sendMail({ subject: 'Tower Reward', body: 'Your tower attempts have refreshed.', rewards: { gems: 30 } });
            alert('2 test mails sent');
          }}>Send Test Mail</button>
        </div>
      </div>

      <div className="rounded-md border border-zinc-700 bg-zinc-900 p-3">
        <div className="font-pixel text-xs mb-2">Save Management</div>
        <div className="grid grid-cols-2 gap-2">
          <button className="btn-pixel" onClick={doExport}>Export JSON</button>
          <button className="btn-pixel" onClick={doImport}>Import JSON</button>
          <button className="btn-pixel danger col-span-2" onClick={doWipe}>WIPE ALL DATA</button>
        </div>
      </div>

      {/* Hero picker */}
      {pickHero && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end" onClick={() => setPickHero(false)}>
          <div className="w-full max-w-[420px] mx-auto bg-zinc-900 border-t border-zinc-700 rounded-t-2xl p-3 max-h-[70vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="font-pixel text-xs mb-3">Pick hero to grant</div>
            <div className="grid grid-cols-3 gap-2">
              {HERO_TEMPLATES.map(tpl => (
                <button
                  key={tpl.id}
                  className="rounded border-2 p-2 bg-zinc-950 text-center"
                  style={{ borderColor: tpl.color }}
                  onClick={async () => {
                    await addHero({ id: genId(), templateId: tpl.id, level: 1, exp: 0, star: tpl.rarity, equipped: {}, obtainedAt: Date.now() });
                    setPickHero(false);
                  }}
                >
                  <div className="text-3xl">{tpl.emoji}</div>
                  <div className="text-[10px] truncate" style={{ color: tpl.color }}>{tpl.name}</div>
                  <div className="text-[9px] text-amber-400">S</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Equip picker */}
      {pickEq && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end" onClick={() => setPickEq(false)}>
          <div className="w-full max-w-[420px] mx-auto bg-zinc-900 border-t border-zinc-700 rounded-t-2xl p-3 max-h-[70vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="font-pixel text-xs mb-3">Pick equipment</div>
            <div className="grid grid-cols-3 gap-2">
              {EQUIPMENT_TEMPLATES.map(eq => (
                <button
                  key={eq.id}
                  className="rounded border-2 p-2 bg-zinc-950 text-center"
                  style={{ borderColor: eq.rarity === 5 ? '#f59e0b' : eq.rarity === 4 ? '#a855f7' : '#52525b' }}
                  onClick={async () => {
                    await addEquipment({ id: genId(), templateId: eq.id, level: 1, equippedTo: null });
                    setPickEq(false);
                  }}
                >
                  <div className="text-2xl">{eq.emoji}</div>
                  <div className="text-[10px] truncate">{eq.name}</div>
                  <div className="text-[9px] text-amber-400">{'★'.repeat(eq.rarity)}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
