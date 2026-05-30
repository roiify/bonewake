import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { initSave } from './lib/db';
import { useProfile } from './store/profile';
import { sendMail } from './lib/mail';
import { maybeAutoBackup, maybeNagToExportBackup, maybeOfferGhostWipeRescue, restoreFromMirror } from './lib/backup';
import { maybeNotifyPatchNotes } from './lib/patchNotes';
import SettingsPage from './pages/SettingsPage';
import MissionPassPage from './pages/MissionPassPage';
import SpiritBombPage from './pages/SpiritBombPage';
import EchoesPage from './pages/EchoesPage';
import BattleLogPage from './pages/BattleLogPage';
import TrialsPage from './pages/TrialsPage';
import CompassPage from './pages/CompassPage';
import ChapterMapPage from './pages/ChapterMapPage';
import ProfilePage from './pages/ProfilePage';
import BossCheckPage from './pages/BossCheckPage';
import EnemyCheckPage from './pages/EnemyCheckPage';
import { useHeroes } from './store/heroes';
import { useItems } from './store/items';
import { Shell } from './components/Shell';
import HomePage from './pages/HomePage';
import ModesPage from './pages/ModesPage';
import HeroesPage from './pages/HeroesPage';
import HeroDetailPage from './pages/HeroDetailPage';
import SummonPage from './pages/SummonPage';
import BattlePage from './pages/BattlePage';
import StagePrebattlePage from './pages/StagePrebattlePage';
import BattlePlayPage from './pages/BattlePlayPage';
import MorePage from './pages/MorePage';
import TasksPage from './pages/TasksPage';
import BagPage from './pages/BagPage';
import DebugPage from './pages/DebugPage';
import FragmentsPage from './pages/FragmentsPage';
import CraftPage from './pages/CraftPage';
import EquipForgePage from './pages/EquipForgePage';
import TowerPage from './pages/TowerPage';
import TrainingPage from './pages/TrainingPage';
import AchievementsPage from './pages/AchievementsPage';
import MailPage from './pages/MailPage';
import ShopPage from './pages/ShopPage';
import DungeonsPage from './pages/DungeonsPage';
import WorldBossPage from './pages/WorldBossPage';
import TalentsPage from './pages/TalentsPage';
import ResetPage from './pages/ResetPage';
import Splash from './components/Splash';

export default function App() {
  const [ready, setReady] = useState(false);
  const loadProfile = useProfile(s => s.load);
  const loadHeroes = useHeroes(s => s.load);
  const loadItems = useItems(s => s.load);

  useEffect(() => {
    (async () => {
      await initSave();
      await loadProfile();
      await loadHeroes();
      await loadItems();
      // One-time: any gems that ended up on hero.gems (during the brief
      // hero-bound experiment) come back to the player's inventory. Gems
      // live on equipment again — re-socket them per-piece.
      try {
        const { migrateHeroGemsToInventory } = await import('./lib/gems');
        await migrateHeroGemsToInventory();
      } catch (e) {
        console.warn('gem migration failed', e);
      }
      // First-launch welcome mail with starter rewards
      const p = useProfile.getState().profile;
      if (!p.welcomeMailSent) {
        await sendMail({
          subject: 'Welcome, Hero!',
          body: 'Your journey begins.\n\nPull from the Novice banner for a guaranteed S-tier hero, then clear stages to grow your power. Features unlock as you level up:\n\n• L5: Material Dungeons\n• L8: Tower of Trials\n• L10: Ultimate Crafting\n• L15: World Boss\n\nHere\'s a starter pack to get you going.',
          rewards: { gold: 2000, gems: 200, friendPoints: 50, energy: 100 },
        });
        await useProfile.getState().patch({ welcomeMailSent: true });
      }
      // Rotating auto-backup (no-op if last backup is <22h old)
      await maybeAutoBackup();
      // Patch-notes mail when build SHA changes
      await maybeNotifyPatchNotes();
      // Nag the user to download an off-device backup every 3 days
      await maybeNagToExportBackup();
      // Disaster recovery: profile exists but heroes/equipment all empty, AND we
      // have a localStorage mirror with real data → offer one-tap restore.
      const ghost = await maybeOfferGhostWipeRescue();
      if (ghost.found && typeof window !== 'undefined') {
        const yes = window.confirm(
          `⚠ Save anomaly detected\n\nYour profile is here but heroes/items are empty.\nA localStorage backup from ${ghost.mirrorDate} has ${ghost.heroCount} hero(es).\n\nRestore from that mirror now?`
        );
        if (yes) {
          const res = await restoreFromMirror();
          if (res.ok) window.location.reload();
          else alert('Restore failed: ' + res.error);
        }
      }
      setReady(true);
    })();
  }, [loadProfile, loadHeroes, loadItems]);

  // Track last-closed-at via visibilitychange instead of beforeunload — the
  // latter raced with /reset and rewrote the wiped profile from memory.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden' && !(window as any).__resetting) {
        useProfile.getState().patch({ lastClosedAt: Date.now() }).catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, []);

  if (!ready) {
    return <Splash visible={true} />;
  }

  // BrowserRouter basename mirrors Vite's base so GitHub Pages subpath works.
  const basename = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');

  return (
    <BrowserRouter basename={basename || undefined}>
      <Routes>
        <Route element={<Shell />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/modes" element={<ModesPage />} />
          <Route path="/heroes" element={<HeroesPage />} />
          <Route path="/heroes/:id" element={<HeroDetailPage />} />
          <Route path="/summon" element={<SummonPage />} />
          <Route path="/battle" element={<BattlePage />} />
          <Route path="/battle/stage/:stageId" element={<StagePrebattlePage />} />
          <Route path="/more" element={<MorePage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/bag" element={<BagPage />} />
          <Route path="/fragments" element={<FragmentsPage />} />
          <Route path="/craft" element={<CraftPage />} />
          <Route path="/forge" element={<EquipForgePage />} />
          <Route path="/tower" element={<TowerPage />} />
          <Route path="/training" element={<TrainingPage />} />
          <Route path="/achievements" element={<AchievementsPage />} />
          <Route path="/mail" element={<MailPage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/dungeons" element={<DungeonsPage />} />
          <Route path="/worldboss" element={<WorldBossPage />} />
          <Route path="/heroes/:heroId/talents" element={<TalentsPage />} />
          <Route path="/debug" element={<DebugPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/pass" element={<MissionPassPage />} />
          <Route path="/spirit" element={<SpiritBombPage />} />
          <Route path="/echoes" element={<EchoesPage />} />
          <Route path="/log" element={<BattleLogPage />} />
          <Route path="/trials" element={<TrialsPage />} />
          <Route path="/compass" element={<CompassPage />} />
          <Route path="/map" element={<ChapterMapPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/boss-check" element={<BossCheckPage />} />
          <Route path="/enemy-check" element={<EnemyCheckPage />} />
        </Route>
        <Route path="/battle/play/:stageId" element={
          <div className="h-full max-w-[420px] mx-auto bg-zinc-950">
            <BattlePlayPage />
          </div>
        } />
        <Route path="/reset" element={<ResetPage />} />
      </Routes>
    </BrowserRouter>
  );
}
