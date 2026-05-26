import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../store/profile';
import { useHeroes } from '../store/heroes';
import { HERO_TEMPLATES } from '../data/heroes';
import { EQUIPMENT_TEMPLATES } from '../data/equipment';
import { db, exportSave, importSave, wipeSave, summarizeImport } from '../lib/db';
import { uid as genId } from '../lib/id';
import { addFragments, DUP_FRAGMENT_VALUE } from '../lib/fragments';
import { useItems } from '../store/items';
import { HERO_BY_ID } from '../data/heroes';
import { genLoot } from '../lib/loot';
import { addMaterial } from '../lib/crafting';
import { MAT_SOULSHARD, essenceItemId, ULTIMATE_SETS } from '../data/ultimateGear';
import { STAGES } from '../data/stages';
import { sendMail } from '../lib/mail';
import { addGemToInventory, removeGemFromInventory } from '../lib/gems';
import { GEMS, ULT_GEM_BY_HERO } from '../data/gems';
import { MAX_STAR } from '../lib/fragments';
import { maxLevelForStar } from '../lib/stats';
import { MAX_ULT_LEVEL } from '../lib/ultLeveling';
import { TALENT_TREE } from '../data/talents';
import { craftSetPiece } from '../lib/crafting';
import type { LootStat } from '../data/loot';

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
    a.download = `bonewake-save-${new Date().toISOString().slice(0, 10)}.json`;
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
      // Validate + summarize before destroying current data.
      let summary;
      try {
        summary = summarizeImport(text);
      } catch (e) {
        alert('Import refused — invalid backup file:\n\n' + (e as Error).message);
        return;
      }
      const msg =
        `Import will REPLACE all current data with:\n\n` +
        `• ${summary.heroes} heroes\n` +
        `• ${summary.equipment} equipment\n` +
        `• ${summary.items} items\n` +
        `• ${summary.stageClears} stage clears\n` +
        `• ${summary.pullLogs} pull logs\n` +
        `• ${summary.tasks} tasks\n` +
        `• ${summary.mail} mail\n\n` +
        (summary.heroes === 0
          ? `⚠ WARNING: Backup has 0 heroes — your current heroes will be lost.\n\n`
          : '') +
        `A pre-import backup will be saved automatically so you can undo this.\n\n` +
        `Proceed?`;
      if (!confirm(msg)) return;
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

  // TESTING ONLY — unlock every hero at MAX_STAR / max level / max ult,
  // unlock every talent, craft and auto-equip every ultimate set piece,
  // craft and socket every hero's ultimate socket gem, top up currencies.
  async function maxEverything() {
    if (!confirm('TESTING — Max everything?\n\nGrants all heroes at max stats, crafts every ultimate set + socket gem, auto-equips, sockets ult gems into ult weapons.')) return;

    // 1. Top up currencies + materials so crafts never fail mid-flight,
    //    and slam the player profile to level 999.
    await patch({ level: 999, exp: 0, gold: 999_999_999, gems: 9_999_999, energy: 100, friendPoints: 99_999 });
    await addMaterial(MAT_SOULSHARD, 10_000);
    for (const s of ULTIMATE_SETS) await addMaterial(essenceItemId(s.heroId), 10_000);

    // 2. Grant any missing hero. For owned ones, push to max state.
    const owned = await db.heroes.toArray();
    const ownedByTpl = new Map(owned.map(h => [h.templateId, h]));
    for (const tpl of HERO_TEMPLATES) {
      const allTalents = TALENT_TREE.filter(t => t.heroId === tpl.id).map(t => t.id);
      const existing = ownedByTpl.get(tpl.id);
      const maxLevel = maxLevelForStar(MAX_STAR);
      if (existing) {
        await db.heroes.update(existing.id, {
          star: MAX_STAR,
          level: maxLevel,
          exp: 0,
          talents: allTalents,
          ultLevel: MAX_ULT_LEVEL,
        });
      } else {
        await db.heroes.add({
          id: genId(),
          templateId: tpl.id,
          level: maxLevel,
          exp: 0,
          star: MAX_STAR,
          equipped: {},
          obtainedAt: Date.now(),
          talents: allTalents,
          ultLevel: MAX_ULT_LEVEL,
        });
      }
    }
    await reload();

    // 3. Craft every ultimate set piece (skip already-crafted).
    const equipped = await db.equipment.toArray();
    const craftedIds = new Set(equipped.map(e => e.craftedPieceId).filter(Boolean));
    for (const set of ULTIMATE_SETS) {
      for (const piece of set.pieces) {
        if (craftedIds.has(piece.id)) continue;
        await craftSetPiece(piece.id);
      }
    }
    await reload();

    // 4. Grant every ultimate socket gem (skip the craft flow — direct add).
    for (const heroId of Object.keys(ULT_GEM_BY_HERO)) {
      await addGemToInventory(ULT_GEM_BY_HERO[heroId].id, 1);
    }
    // Plus a healthy stock of tier-4 gems for filling other sockets.
    for (const g of GEMS) {
      if (g.tier === 4) await addGemToInventory(g.id, 30);
    }

    // 5. For each hero: equip their five set pieces. Then for each
    // equipped piece, fill normal sockets with tier-4 gems matching the
    // piece's primary stat (or atk fallback), and put the hero's ult
    // gem into the ult socket on the ultimate weapon.
    const allHeroes = await db.heroes.toArray();
    const heroByTpl = new Map(allHeroes.map(h => [h.templateId, h]));
    for (const set of ULTIMATE_SETS) {
      const hero = heroByTpl.get(set.heroId);
      if (!hero) continue;
      const newEquipped: Partial<Record<string, string>> = {};
      let ultWeaponId: string | null = null;
      for (const piece of set.pieces) {
        const eq = (await db.equipment.toArray()).find(e => e.craftedPieceId === piece.id);
        if (!eq) continue;
        await db.equipment.update(eq.id, { equippedTo: hero.id });
        newEquipped[piece.slot] = eq.id;
        if (eq.isUltimateWeapon) ultWeaponId = eq.id;
      }
      await db.heroes.update(hero.id, { equipped: newEquipped });

      // Socket the ult gem into the ult weapon's dedicated ult socket
      // (mythic pieces don't otherwise have it filled).
      if (ultWeaponId) {
        const ultGem = ULT_GEM_BY_HERO[set.heroId];
        if (ultGem) {
          const ok = await removeGemFromInventory(ultGem.id, 1);
          if (ok) await db.equipment.update(ultWeaponId, { ultSocket: ultGem.id });
        }
      }
      // Fill normal sockets on every equipped piece with a tier-4 gem
      // matching the piece's primary stat.
      for (const [, eqId] of Object.entries(newEquipped)) {
        if (!eqId) continue;
        const eq = await db.equipment.get(eqId);
        if (!eq) continue;
        const totalSockets = (eq.sockets?.length ?? 0);
        const primaryStat = (eq.primary?.stat ?? 'atk') as LootStat;
        const fillerId = `gem_${primaryStat}_4`;
        const sockets: (string | null)[] = [...(eq.sockets ?? Array(totalSockets).fill(null))];
        let changed = false;
        for (let i = 0; i < sockets.length; i++) {
          if (sockets[i]) continue;
          const ok = await removeGemFromInventory(fillerId, 1);
          if (!ok) break;
          sockets[i] = fillerId;
          changed = true;
        }
        if (changed) await db.equipment.update(eqId, { sockets });
      }
    }

    // 6. Unlock every stage at 3 stars so the whole chapter map is open
    // for testing. Idempotent — preserves existing higher clear counts.
    const existingClears = await db.stageClears.toArray();
    const clearByStage = new Map(existingClears.map(c => [c.stageId, c]));
    for (const s of STAGES) {
      const prev = clearByStage.get(s.id);
      await db.stageClears.put({
        stageId: s.id,
        stars: Math.max(3, prev?.stars ?? 0),
        clears: Math.max(1, prev?.clears ?? 0),
        lastClearedAt: prev?.lastClearedAt ?? Date.now(),
      });
    }

    await reload();
    alert('MAX EVERYTHING applied — all heroes maxed, ult gear crafted & equipped, hero gem slots filled, every stage 3-starred.');
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

      {/* Big red TEST button — skips all the unlock grind so animations,
          UI, and balance can be verified in a single click. */}
      <div className="rounded-md border-2 border-rose-500 bg-rose-900/30 p-3">
        <div className="font-pixel text-xs mb-2 text-rose-300">TESTING — Skip the grind</div>
        <button
          className="btn-pixel danger w-full text-base py-3"
          onClick={async () => { await maxEverything(); }}
        >🚀 MAX EVERYTHING</button>
        <div className="text-[9px] text-rose-200/70 mt-1">
          Grants all heroes at MAX_STAR / max level / max ult, unlocks every talent,
          crafts every ultimate set + socket gem, auto-equips, sockets ult gems into
          ult weapons. Use only for testing.
        </div>
      </div>

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
