# Graph Report - /Users/kiddos/Developer/bonewake  (2026-07-02)

## Corpus Check
- Large corpus: 955 files · ~1,713,326 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 984 nodes · 2606 edges · 84 communities (75 shown, 9 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.69)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 76|Community 76]]

## God Nodes (most connected - your core abstractions)
1. `useProfile` - 76 edges
2. `useHeroes` - 57 edges
3. `useItems` - 33 edges
4. `resolveBattle()` - 29 edges
5. `db` - 29 edges
6. `addMaterial()` - 26 edges
7. `asset()` - 25 edges
8. `genLoot()` - 20 edges
9. `compilerOptions` - 18 edges
10. `addGemToInventory()` - 16 edges

## Surprising Connections (you probably didn't know these)
- `resolveBattle()` --indirect_call--> `unit()`  [INFERRED]
  src/lib/combat.ts → src/lib/combat.test.ts
- `PageHeader()` --calls--> `asset()`  [EXTRACTED]
  src/components/ui/PageHeader.tsx → src/lib/assetPath.ts
- `BondDef` --references--> `LootStat`  [EXTRACTED]
  src/data/bonds.ts → src/data/loot.ts
- `BOSS_SPRITE()` --calls--> `asset()`  [EXTRACTED]
  src/pages/EchoesPage.tsx → src/lib/assetPath.ts
- `App()` --calls--> `useHeroes`  [EXTRACTED]
  src/App.tsx → src/store/heroes.ts

## Import Cycles
- 2-file cycle: `src/lib/backup.ts -> src/lib/db.ts -> src/lib/backup.ts`
- 3-file cycle: `src/lib/crafting.ts -> src/lib/lifetime.ts -> src/lib/mail.ts -> src/lib/crafting.ts`
- 3-file cycle: `src/lib/gems.ts -> src/store/profile.ts -> src/lib/stats.ts -> src/lib/gems.ts`
- 3-file cycle: `src/lib/backup.ts -> src/lib/mail.ts -> src/lib/db.ts -> src/lib/backup.ts`
- 3-file cycle: `src/lib/backup.ts -> src/store/heroes.ts -> src/lib/db.ts -> src/lib/backup.ts`
- 3-file cycle: `src/lib/backup.ts -> src/store/items.ts -> src/lib/db.ts -> src/lib/backup.ts`
- 3-file cycle: `src/lib/backup.ts -> src/store/profile.ts -> src/lib/db.ts -> src/lib/backup.ts`
- 4-file cycle: `src/lib/backup.ts -> src/lib/mail.ts -> src/lib/crafting.ts -> src/lib/db.ts -> src/lib/backup.ts`
- 4-file cycle: `src/lib/backup.ts -> src/lib/mail.ts -> src/store/profile.ts -> src/lib/db.ts -> src/lib/backup.ts`
- 4-file cycle: `src/lib/backup.ts -> src/store/profile.ts -> src/lib/stats.ts -> src/lib/db.ts -> src/lib/backup.ts`
- 5-file cycle: `src/lib/backup.ts -> src/lib/mail.ts -> src/lib/crafting.ts -> src/lib/lifetime.ts -> src/lib/db.ts -> src/lib/backup.ts`
- 5-file cycle: `src/lib/backup.ts -> src/lib/mail.ts -> src/lib/crafting.ts -> src/lib/gems.ts -> src/lib/db.ts -> src/lib/backup.ts`
- 5-file cycle: `src/lib/backup.ts -> src/store/profile.ts -> src/lib/stats.ts -> src/lib/gems.ts -> src/lib/db.ts -> src/lib/backup.ts`
- 5-file cycle: `src/lib/backup.ts -> src/lib/mail.ts -> src/lib/crafting.ts -> src/store/heroes.ts -> src/lib/db.ts -> src/lib/backup.ts`
- 5-file cycle: `src/lib/backup.ts -> src/lib/mail.ts -> src/lib/crafting.ts -> src/store/items.ts -> src/lib/db.ts -> src/lib/backup.ts`
- 5-file cycle: `src/lib/backup.ts -> src/lib/mail.ts -> src/lib/crafting.ts -> src/store/profile.ts -> src/lib/db.ts -> src/lib/backup.ts`
- 5-file cycle: `src/lib/backup.ts -> src/lib/mail.ts -> src/store/profile.ts -> src/lib/stats.ts -> src/lib/db.ts -> src/lib/backup.ts`
- 5-file cycle: `src/lib/backup.ts -> src/store/profile.ts -> src/lib/stats.ts -> src/lib/loot.ts -> src/lib/db.ts -> src/lib/backup.ts`

## Communities (84 total, 9 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (37): PrimaryButton(), Props, Variant, COMPASS_REWARD, CompassClue, compassHints(), CompassReward, pickHotStages() (+29 more)

### Community 1 - "Community 1"
Cohesion: 0.08
Nodes (35): ChestReward, Props, RARITY_GLOW, POOL_BY_ID, SUMMON_POOLS, addFragments(), consumeFragments(), DUP_FRAGMENT_VALUE (+27 more)

### Community 2 - "Community 2"
Cohesion: 0.05
Nodes (41): dependencies, clsx, dexie, framer-motion, lucide-react, react, react-dom, react-router-dom (+33 more)

### Community 3 - "Community 3"
Cohesion: 0.07
Nodes (28): ELEMENT_ICON, FloatingNumber, UnitCard(), EQUIP_BY_ID, EQUIPMENT_TEMPLATES, BOSS_AURA_IDS, HERO_SPRITES, PAINTED_BOSS_IDS (+20 more)

### Community 4 - "Community 4"
Cohesion: 0.13
Nodes (22): ULT_GEM_BY_HERO, ULT_GEM_COST_BY_HERO, essenceItemId(), PIECE_BY_ID, SET_BY_HERO, SET_BY_ID, Stats, ULTIMATE_SETS (+14 more)

### Community 5 - "Community 5"
Cohesion: 0.11
Nodes (31): GEM_TIER_NAME, AFFIX_BONUS_CHANCE, AFFIX_COUNT, AFFIX_RANGE, BASE_BY_ID, BASE_CLASS_USERS, BASE_ITEMS, BaseItem (+23 more)

### Community 6 - "Community 6"
Cohesion: 0.12
Nodes (32): skillsForHero(), absorbWithShield(), _activeEchoes, aggregateEquippedEchoes(), applyFirstTurn(), applyOnAttackHeal(), applyOnHit(), applyOnKill() (+24 more)

### Community 7 - "Community 7"
Cohesion: 0.14
Nodes (24): SHOP_ITEMS, ShopCurrency, ShopGrantKind, ShopItem, generateFloor(), isBossFloor(), isEndless(), isMegaBossFloor() (+16 more)

### Community 8 - "Community 8"
Cohesion: 0.14
Nodes (14): loadSquad(), Props, SquadPicker(), ARCH_BADGE, BadgeProps, ELEMENT_BADGE, HeroBadges(), HERO_BY_ID (+6 more)

### Community 9 - "Community 9"
Cohesion: 0.12
Nodes (13): Props, SpriteAnimator(), StaticSprite(), ENEMY_SPRITES, logBattle(), recentBattles(), BattleLogEntry, SOURCE_LABEL (+5 more)

### Community 10 - "Community 10"
Cohesion: 0.11
Nodes (20): GEM_EMOJI, GEM_TIER_COLOR, GemDef, GEMS, GemTier, SOCKETS_BY_RARITY, STAT_VALUES, ULT_GEM_COST (+12 more)

### Community 11 - "Community 11"
Cohesion: 0.14
Nodes (17): EnergyModal(), formatCountdown(), Props, todayStr(), DEFAULT_PROFILE, energyCapForLevel(), exportSave(), GameDB (+9 more)

### Community 12 - "Community 12"
Cohesion: 0.23
Nodes (18): GEM_BY_ID, gemInventoryKey(), addGemToInventory(), craftGem(), ensureSockets(), getGemInventoryMap(), hasUltSocket(), migrateHeroGemsToInventory() (+10 more)

### Community 13 - "Community 13"
Cohesion: 0.13
Nodes (17): SKILL_BY_ID, SKILLS, TowerFloorDef, TRIAL_BY_ID, TrialDef, TRIALS, unit(), setEquippedEchoes() (+9 more)

### Community 14 - "Community 14"
Cohesion: 0.18
Nodes (16): createBackup(), deleteBackup(), downloadBackup(), forceMirrorSnapshot(), formatBackupTime(), gatherSnapshot(), listBackups(), listMirroredBackups() (+8 more)

### Community 15 - "Community 15"
Cohesion: 0.16
Nodes (14): Shell(), UI, earnedTitles(), TITLE_BY_ID, TitleDef, TITLES, DEFAULT_LIFETIME, LifetimeStats (+6 more)

### Community 16 - "Community 16"
Cohesion: 0.16
Nodes (13): essenceMeta(), addMaterial(), db, MailMessage, OwnedItem, claimMail(), markRead(), ultUpgradeCost() (+5 more)

### Community 17 - "Community 17"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection, moduleResolution (+11 more)

### Community 18 - "Community 18"
Cohesion: 0.18
Nodes (13): App(), AppRouter(), maybeNagToExportBackup(), DEFAULT_SETTINGS, GameSettings, migrateLegacyDb(), normalizeSettings(), sendMail() (+5 more)

### Community 19 - "Community 19"
Cohesion: 0.17
Nodes (12): SPLASH, BoneDivider(), Props, HeroFrame(), Props, MaterialIcon(), Props, Panel() (+4 more)

### Community 20 - "Community 20"
Cohesion: 0.16
Nodes (15): DUNGEON_BY_ID, currentBoss(), UltPolicy, rollClearDrops(), maybeRollGem(), BASE_URL_PROJECTILE_PREFIX, BattlePlayPage(), makeDungeonVirtualStage() (+7 more)

### Community 21 - "Community 21"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+9 more)

### Community 22 - "Community 22"
Cohesion: 0.21
Nodes (13): buildDungeonTeam(), dungeonClearKey(), DungeonClearMap, DungeonDef, DungeonKind, DUNGEONS, dungeonsForToday(), DungeonTier (+5 more)

### Community 23 - "Community 23"
Cohesion: 0.22
Nodes (10): dayOfSeason(), PASS_TIERS, PassReward, PassTier, seasonEnded(), awardPassXp(), claimPassTier(), ensurePassSeason() (+2 more)

### Community 24 - "Community 24"
Cohesion: 0.26
Nodes (16): download_and_stitch(), extract_text(), find_object_id(), load_ref_b64(), main(), mcp_call(), poll_animation(), poll_review() (+8 more)

### Community 25 - "Community 25"
Cohesion: 0.25
Nodes (12): ACHIEVEMENT_BY_ID, AchievementCat, AchievementDef, ACHIEVEMENTS, CATEGORY_LABEL, claimAchievement(), getClaimedIds(), isClaimed() (+4 more)

### Community 26 - "Community 26"
Cohesion: 0.19
Nodes (13): SHATTER_BOSS_BY_DAY, BOSS_FLAVOR, buildSpiritBossUnit(), currentSpiritBoss(), SPIRIT_BOSSES, SPIRIT_TIERS, SpiritBossDef, SpiritTier (+5 more)

### Community 27 - "Community 27"
Cohesion: 0.23
Nodes (14): equipmentGemStats(), equipStats(), distributeSquadExp(), calcHeroStats(), effectiveMaxLevel(), _equippedEchoIds, HeroStats, levelMult() (+6 more)

### Community 28 - "Community 28"
Cohesion: 0.26
Nodes (10): ArchetypeBadge(), ElementBadge(), goldToLevelUp(), promotionLevelThreshold(), nextTierLabel(), TIER_COLORS, TIER_LABELS, tierColor() (+2 more)

### Community 29 - "Community 29"
Cohesion: 0.18
Nodes (9): FEATURE_GATES, FeatureGate, GATE_BY_PATH, getUnreadCount(), ICON, MODES, ModesPage(), MorePage() (+1 more)

### Community 30 - "Community 30"
Cohesion: 0.27
Nodes (8): HERO_TEMPLATES, HIDDEN_HERO_IDS, MANNY_SUMMON_IDS, OwnedEquipment, OwnedHero, ensureMannySummons(), findOwnedManny(), HeroesState

### Community 31 - "Community 31"
Cohesion: 0.23
Nodes (8): activeBonds(), bondBonusFor(), BondDef, BONDS, BOSS_BANTER, BossBanterLine, loadSquad(), StagePrebattlePage()

### Community 32 - "Community 32"
Cohesion: 0.27
Nodes (9): BRANCH_COLOR, BRANCH_NAME, N, nodesForHeroBranch(), TALENT_BY_ID, TALENT_TREE, TalentBranch, talentPointsForLevel() (+1 more)

### Community 33 - "Community 33"
Cohesion: 0.29
Nodes (11): fetch_url(), get_char_info(), main(), pad_static_to(), parse_animations(), Image, Path, Pad/truncate frames to TARGET_COLS and write horizontally. (+3 more)

### Community 34 - "Community 34"
Cohesion: 0.25
Nodes (9): ECHO_BY_BOSS, ECHO_BY_ID, ECHO_SLOT_UNLOCK_LEVELS, EchoDef, EchoEffect, ECHOES, unlockedEchoSlots(), BOSS_SPRITE() (+1 more)

### Community 35 - "Community 35"
Cohesion: 0.27
Nodes (8): fadeOut(), musicEnabled(), MusicKey, playMusic(), stopMusic(), syncMusicSetting(), TRACKS, VOLUME

### Community 36 - "Community 36"
Cohesion: 0.31
Nodes (9): fetch_url(), file_slug(), get_info(), main(), parse_animations(), Image, Path, Some heroes have versioned files (e.g. reiji_v1_attack.png). (+1 more)

### Community 37 - "Community 37"
Cohesion: 0.25
Nodes (5): PageHeader(), Props, CHAPTER_BG, CHAPTER_EMOJI, CHAPTER_NAMES

### Community 38 - "Community 38"
Cohesion: 0.25
Nodes (5): CardProps, CORNER_BL, CORNER_BR, CORNER_TL, CORNER_TR

### Community 39 - "Community 39"
Cohesion: 0.46
Nodes (7): bulkSalvageBelow(), bulkSalvageRarities(), grantSalvage(), salvageEquipment(), salvageValue(), SalvageYield, equipPower()

### Community 40 - "Community 40"
Cohesion: 0.29
Nodes (6): WORLD_BOSS_BY_DAY, BOSS_FLAVOR, REWARD_TIERS, RewardTier, WORLD_BOSSES, WorldBossDef

### Community 41 - "Community 41"
Cohesion: 0.48
Nodes (5): deletePreset(), loadPresets(), savePresets(), SquadPreset, upsertPreset()

### Community 42 - "Community 42"
Cohesion: 0.57
Nodes (6): load(), main(), mcp(), save(), status_of(), submit_next()

### Community 43 - "Community 43"
Cohesion: 0.48
Nodes (6): fetch_url(), get_info(), main(), parse_animation_frames(), Image, stitch()

### Community 44 - "Community 44"
Cohesion: 0.43
Nodes (6): fetch_url(), get_info(), main(), parse_animation_frames(), Image, Find `  <anim_name> (<direction>, Nf) ...` followed by a frames: line.

### Community 45 - "Community 45"
Cohesion: 0.47
Nodes (4): Pill(), PillProps, PillVariant, formatCompact()

### Community 46 - "Community 46"
Cohesion: 0.33
Nodes (5): HERO_SKILL_BY_ID, HERO_SKILLS, HeroSkillDef, SkillEffect, SkillTrigger

### Community 47 - "Community 47"
Cohesion: 0.67
Nodes (5): call(), is_rate_limit(), main(), merged(), submit()

### Community 48 - "Community 48"
Cohesion: 0.40
Nodes (3): StageClear, MODE_BOSS_ICON, MODE_STORY_ICON

### Community 49 - "Community 49"
Cohesion: 0.50
Nodes (3): check(), edge_density(), Return fraction of opaque pixels in left or right 25% column of frame 0.

### Community 50 - "Community 50"
Cohesion: 0.60
Nodes (4): generate(), main(), _post(), Path

### Community 51 - "Community 51"
Cohesion: 0.60
Nodes (4): generate(), main(), _post(), Path

### Community 53 - "Community 53"
Cohesion: 0.83
Nodes (3): call(), is_rate_limit(), main()

### Community 54 - "Community 54"
Cohesion: 0.83
Nodes (3): call(), is_rate_limit(), main()

### Community 55 - "Community 55"
Cohesion: 0.83
Nodes (3): call(), is_rate_limit(), main()

### Community 56 - "Community 56"
Cohesion: 0.83
Nodes (3): call(), is_rate_limit(), main()

### Community 57 - "Community 57"
Cohesion: 0.83
Nodes (3): build_html(), fetch_rotations(), main()

### Community 58 - "Community 58"
Cohesion: 0.83
Nodes (3): build_html(), fetch(), main()

### Community 59 - "Community 59"
Cohesion: 0.83
Nodes (3): call_tool(), main(), _post()

### Community 60 - "Community 60"
Cohesion: 0.67
Nodes (3): main(), Path, strip_one()

### Community 61 - "Community 61"
Cohesion: 0.67
Nodes (3): cols_of(), main(), Path

### Community 62 - "Community 62"
Cohesion: 0.67
Nodes (3): cols_of(), main(), Path

## Knowledge Gaps
- **201 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+196 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useProfile` connect `Community 18` to `Community 0`, `Community 1`, `Community 3`, `Community 4`, `Community 6`, `Community 7`, `Community 8`, `Community 10`, `Community 11`, `Community 12`, `Community 14`, `Community 15`, `Community 16`, `Community 20`, `Community 22`, `Community 23`, `Community 25`, `Community 26`, `Community 27`, `Community 28`, `Community 29`, `Community 31`, `Community 34`, `Community 35`, `Community 39`, `Community 52`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Why does `useHeroes` connect `Community 8` to `Community 0`, `Community 1`, `Community 3`, `Community 4`, `Community 5`, `Community 6`, `Community 7`, `Community 10`, `Community 11`, `Community 12`, `Community 14`, `Community 15`, `Community 16`, `Community 18`, `Community 20`, `Community 22`, `Community 23`, `Community 26`, `Community 27`, `Community 28`, `Community 30`, `Community 31`, `Community 32`, `Community 39`, `Community 52`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `resolveBattle()` connect `Community 6` to `Community 7`, `Community 8`, `Community 13`, `Community 20`, `Community 52`, `Community 22`, `Community 26`, `Community 31`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _209 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06826241134751773 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.07610993657505286 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.047619047619047616 - nodes in this community are weakly interconnected._