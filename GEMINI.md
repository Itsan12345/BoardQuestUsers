# Strict Sprite & Boss Animation Protection Rules

> **CRITICAL INVARIANT**: All sprite animations, attack effects, frame configurations, lunges, reset delays, impact delays, and sound effect bindings in BoardQuest across **BOTH Boss-Battle Mode and Learning Mode** have been fully tested, verified, and approved by the user. Under NO circumstances should any agent alter, revert, override, cross-contaminate, or degrade these sprite animation systems in either game mode without explicit user instruction.

---

## 1. Verified & Permanently Locked Enemy Sprite Configurations

### Clinical Chemistry
- **Acid Slime (Stage 1 Minion - `cc-1`)**: All original attack animations, lunges, frame timings, and sound effects (`AcidSlimeNormal&HeavyAttack.mp3`) are permanently locked.
- **Hyperglycemic Mutant (Stage 2 Mini-Boss - `cc-2`)**:
  - `miniBossIdleSpriteUrl`: `/images/bosses/clinchem_chapterOneMiniBoss_idleAnimation.png` (9 frames, 183x194, 0.9s loop)
  - `miniBossAttackSpriteUrl`: `/images/bosses/clinchem_chapterOneMiniBoss_normalAttackAnimation.png` (8 frames, 250x210, 0.80s duration) with claw slash lunge (`min(-40px, calc(-100cqw + 310px))` / `calc(-100cqw + 460px)`, 42px) attacking right in front of the player and resetting cleanly to `translate(70px, 17px)`
  - `miniBossHeavyAttackSpriteUrl`: `/images/bosses/clinchem_chapterOneMiniBoss_heavyAttackAnimation.png` (8 frames, 190x154, 0.95s duration) with soaring leap dive ground shockwave slam lunge (`min(-50px, calc(-100cqw + 180px))` / `calc(-100cqw + 310px)`, -10px) slamming cleanly onto player and resetting cleanly to `translate(7px, -41px)`
  - Scale & Positioning: `effectiveScale = scale * 1.55` with resting alignment `translate-x-[40px] sm:translate-x-[50px] md:translate-x-[80px] -translate-y-[45px] md:-translate-y-[55px]` in `src/app/quest/page.tsx` keeping the HP card on the right side and centering the mutant vertically in between its HP bar and the ground.
  - Sound effects: `normalAttackSfxUrl: /SoundEffects/SickleCellNormalAttack.mp3`, `heavyAttackSfxUrl: /SoundEffects/AcidSlimeNormal&HeavyAttack.mp3`, with preloaded handlers via `preloadHyperglycemicMutantSounds` and `playHyperglycemicMutantAttack`.
  - All animations, frame dimensions, timings, scale, position, delays, and sound effects are permanently locked to not change, alter, modify, or cross-contaminate. Must NEVER leak into other stages.
- **Ketoacidosis Colossus (Stage 3 Chapter Boss - `cc-3`)**:
  - `idleSpriteUrl`: `/images/bosses/clinchem_chapterOneBoss_idleAnimation.png` (7 frames, 304x273, 1.0s loop)
  - `attackSpriteUrl`: `/images/bosses/clinchem_chapterOneBoss_normalAttackAnimation.png` (7 frames, 379x307, 0.70s duration) with `KetoacidosisColossusNormalAttack.mp3` and forward lunge target (`min(-40px, calc(-100cqw + 350px))` / `calc(-100cqw + 470px)`, -35px) hitting cleanly in front of player
  - `heavyAttackSpriteUrl`: `/images/bosses/clinchem_chapterOneBoss_heavyAttackAnimation.png` (8 frames, 493x639, 0.85s duration) with `KetoacidosisColossusHeavyAttack.mp3`, repositioned to the top (`-270px` resting/reset, `-280px` slam) and forward lunge target (`min(-50px, calc(-100cqw + 475px))` / `calc(-100cqw + 570px)`, -280px) hitting cleanly in front of player
  - Scale & Positioning: `effectiveScale = scale * 1.18` with resting alignment `translate-x-[85px] sm:translate-x-[115px] md:translate-x-[165px] -translate-y-[68px] md:-translate-y-[80px]` in `src/app/quest/page.tsx` keeping the HP card on the right side, centered directly under its HP card and vertically centered between its HP bar and the ground.
  - All animations, frame dimensions, timings, scale, position, delays, lunges, and sound effects are permanently locked to not change, alter, modify, or cross-contaminate. Must NEVER leak into other stages.
- **Hyperglycemic Specter (Stage 4 Final Boss - `cc-4` / legacy `cc-3`)**: Scoped strictly to Final Boss with normal attack projectile, heavy beam attack, and sound effects permanently locked.

### Microbiology
- **Microbe Swarm (Stage 1 Minion - `mb-1`)**: Full animation sequences and sound effects (`MicrobeSwarmNormalAttack.mp3`, `MicrobeSwarmHeavyAttack.wav`) are permanently locked.
- **Staph Sentinel (Stage 2 Mini-Boss - `mb-2`)**: All animations, frame dimensions, delays, and sound effects are permanently locked.
- **Gram Positive Overlord (Stage 3 Chapter Boss - `mb-3`)**: Dual-strike cycle animations, frame dimensions, and sound effects (`GramPositiveNormal&HeavyAttack.mp3`) are permanently locked.
- **Biohazard Overlord (Stage 4 Final Boss - `mb-4` / legacy `mb-3`)**: All animations, multi-strike lunges, frame dimensions, and sound effects (`BiohazardOverlordNormalAttack.mp3`, `BiohazardOverlordHeavyAttack.mp3`) are permanently locked.

### Hematology
- **Sickle Cell (Stage 1 Minion - `hem-1`)**: Full idle, normal attack, heavy attack animations, and sound effects (`SickleCellNormalAttack.mp3`, `SickleCellHeavyAttack.mp3`) are permanently locked.
- **Anemia Shade (Stage 2 Mini-Boss - `hem-2`)**:
  - `miniBossIdleSpriteUrl`: `/images/bosses/hematology_chapterOneMiniBoss_idleAnimation.png` (7 frames, 128x128, 1.0s loop)
  - `miniBossAttackSpriteUrl`: `/images/bosses/hematology_chapterOneMiniBoss_normalAttackAnimation.png` (18 frames, 128x128, 1.25s) with lunge and 430ms SFX timing
  - `miniBossHeavyAttackSpriteUrl`: `/images/bosses/hematology_chapterOneMiniBoss_heavyAttack_DashAnimation.png` (15 frames, 128x128) with 3-phase execution (Dash 0-620ms -> Disappear 620-1380ms -> Smooth Idle 1380ms+)
  - `miniBossSlashSpriteUrl`: `/images/bosses/hematology_chapterOneMiniBoss_heavyAttack_SlashAnimation.png` (15 frames, 128x128 via `AnemiaSlashAnimator` on player body from 620ms to 1360ms with impact at 750ms)
  - Preloaded sound effects via `preloadAnemiaShadeSounds` and `playAnemiaShadeAttack` permanently locked.
- **Erythrocyte Colossus (Stage 3 Chapter Boss - `hem-3` / legacy `hem-1`)**:
  - `idleSpriteUrl`: `/images/bosses/hematology_chapterOneBoss_idleAnimation.png` (8 frames, 128x176, 1.0s loop)
  - `attackSpriteUrl`: `/images/bosses/hematology_chapterOneBoss_normalAttackAnimation.png` (22 frames, 208x176, 1.25s duration, `step-end` with 22 dedicated keyframes)
  - Normal Attack Sequence & Timing:
    - 0–150ms: Swift dash directly in front of the player (`min(-45px, calc(-100cqw + 310px))` / `calc(-100cqw + 420px)`)
    - 0–1250ms: Executes and renders all 22 frames of the normal attack in front of the player, with `BiohazardOverlordNormalAttack.mp3` triggered at the 17th frame (~909ms) and fist impact at 1050ms (`impactDelay = 1050ms`, hit spark, and shake)
    - 1250ms–2184ms: Seamlessly transitions to `idleSpriteUrl` in a dedicated clipped 128x176 window at `left: 34 * effectiveScale px`, pausing for ~1 second in its Idle stance in front of the player
    - 2184ms–2600ms: Smoothly glides back to starting position while in Idle stance, settling cleanly onto its pedestal at 2600ms (`resetDelay = 2600ms`)
  - `heavyAttackSpriteUrl`: `/images/bosses/hematology_chapterOneBoss_heavyAttackGlintAnimation-1.png` (14 frames, 176x196, playing in place as warning glint)
  - `heavyAttackFistUrl`: `/images/bosses/hematology_chapterOneBoss_heavyAttackFistAnimation-2.png` (9 frames, 176x196, scale 2.5 via `ColossusFistAnimator` on player body from 220ms to 940ms, impact at 460ms, reset at 1150ms) with `ErythrocyeColossusHeavyAttack.mp3` triggered at 220ms and smooth fade at end
  - Scale & Positioning: `effectiveScale = scale * 0.90` with vertical alignment `translate-y-[8px] md:translate-y-[12px]` in `src/app/quest/page.tsx` ensuring generous clearance below the Enemy HP bar
  - Sound effects: `normalAttackSfxUrl: /SoundEffects/BiohazardOverlordNormalAttack.mp3`, `heavyAttackSfxUrl: /SoundEffects/ErythrocyeColossusHeavyAttack.mp3`, with preloaded handlers via `preloadErythrocyteColossusSounds`, `playErythrocyteColossusAttack`, and `stopErythrocyteColossusAttack` permanently locked.
  - All animations, timings, scale, position, sound effects, and components are permanently locked. Must NEVER leak into other stages.
- **Sickle-Cell Reaper (Stage 4 Final Boss - `hem-4` / legacy `hem-3`)**:
  - `idleSpriteUrl`: `/images/bosses/hematology_finalboss_idleAnimation.png` (6 frames, 128x128)
  - `attackSpriteUrl`: `/images/bosses/hematology_finalboss_normalAttackGlintAnimation.png` (6 frames, 128x128)
  - `undergroundSpikesUrl`: `/images/bosses/hematology_finalboss_normalAttackUndergroundSpikesAnimation.png` (8 frames)
  - Sound effects: `SickleCellReaperNormalAttack.mp3`, `SickleCellReaperHeavyAttack.mp3`
  - Must NEVER leak into Minion (Sickle Cell) or Chapter Boss (Erythrocyte Colossus).

### Immunology & Serology and Immunohematology
- **Lymphocyte Swarm (Stage 1 Minion - `is-1`)**: All animations, lightning overlays, and audio effects (`MicrobeSwarmNormalAttack.mp3`, `MicrobeSwarmHeavyAttack.wav`) are permanently locked.
- **Antigen Titan (Stage 2 Mini-Boss - `is-2`)**:
  - `miniBossIdleSpriteUrl`: `/images/bosses/immunohema_chapterOneMiniBoss_idleAnimation.png` (7 frames, 128x128, 1.0s loop)
  - `miniBossAttackSpriteUrl`: `/images/bosses/immunohema_chapterOneMiniBoss_normalAttackAnimation.png` (8 frames, 128x128, 0.70s duration) with swift forward strike lunge (`min(-60px, calc(-100cqw + 260px))` / `calc(-100cqw + 330px)`, 15px, scale 1.12–1.14) hitting cleanly in front of player and resetting cleanly to `translate(0px, 0px)`
  - `miniBossHeavyAttackSpriteUrl`: `/images/bosses/immunohema_chapterOneMiniBoss_heavyAttackAnimation.png` (9 frames, 183x153, 0.85s duration) with overhead ground slam heavy wave lunge (`min(-60px, calc(-100cqw + 245px))` / `calc(-100cqw + 320px)`, 20px, scale 1.16–1.18) hitting cleanly in front of player and resetting cleanly to `translate(0px, 0px)`
  - Scale & Positioning: `effectiveScale = scale * 1.85` with resting alignment `translate-x-[40px] sm:translate-x-[50px] md:translate-x-[80px] -translate-y-[45px] md:-translate-y-[55px]` in `src/app/quest/page.tsx` keeping the HP card on the right side and centering vertically in between its HP bar and the ground.
  - Sound effects: `normalAttackSfxUrl: /SoundEffects/KetoacidosisColossusNormalAttack.mp3`, `heavyAttackSfxUrl: /SoundEffects/CrystalGolemNormalAttack.mp3`, with preloaded handlers via `preloadKetoacidosisSounds` and `preloadCrystalGolemSounds` (heavy SFX impact at 460ms, resetDelay = 750ms normal / 900ms heavy, impactDelay = 280ms normal / 480ms heavy).
  - All animations, frame dimensions, timings, scale, position, delays, lunges, and sound effects are permanently locked to not change, alter, modify, or cross-contaminate. Must NEVER leak into other stages.
- **Immune Archon (Stage 3 Chapter Boss - `is-3` / legacy `is-1`)**:
  - `idleSpriteUrl`: `/images/bosses/immunohema_chapterOneBoss_idleAnimation.png` (7 frames, 284x220, 1.0s loop)
  - `attackSpriteUrl`: `/images/bosses/immunohema_chapterOneBoss_normalAttackAnimation.png` (11 frames, 252x177, 0.90s duration) with `ImmuneArchonNormalAttack.mp3` and forward whip strike lunge (`min(-60px, calc(-100cqw + 320px))` / `calc(-100cqw + 420px)`, 8px) hitting cleanly in front of player (impactDelay = 380ms, resetDelay = 900ms)
  - `heavyAttackSpriteUrl`: `/images/bosses/immunohema_chapterOneBoss_heavyAttackAnimation.png` (18 frames, 247x228, 1.05s duration) playing in-place as a warning glint animation (no lunge)
  - `lightningAttackUrl`: `/images/bosses/immunohema_chapterOneBoss_heavyAttackThunderAnimation.png` (12 frames, 192x192 via `ArchonThunderAnimator`, scale 2.8, 720ms duration, and `AntiSerumHydraHeavyAttack.mp3` at 2.0x speed via `playImmuneArchonAttack`)
  - Heavy Attack Sequence & Timing:
    - 0–250ms: Immune Archon summons the thunder storm while executing its warning glint animation on its pedestal (no forward lunge).
    - 250–970ms: Renders all 12 frames of the thunder animation directly centered over the aspirant's body with `AntiSerumHydraHeavyAttack.mp3` at 2.0x speed, impacting at 420ms (`impactDelay = 420ms`, hit spark, and shake).
    - 970–1120ms: Frame 12 clears cleanly with a smooth fade-out settling at `resetDelay = 1120ms`.
  - Scale & Positioning: `effectiveScale = scale * 1.35` with resting alignment `translate-x-[85px] sm:translate-x-[115px] md:translate-x-[165px] -translate-y-[68px] md:-translate-y-[80px]` in `src/app/quest/page.tsx` keeping the HP card on the right side, centered directly under its HP card and vertically centered between its HP bar and the ground.
  - Sound effects: `normalAttackSfxUrl: /SoundEffects/ImmuneArchonNormalAttack.mp3`, `heavyAttackSfxUrl: /SoundEffects/AntiSerumHydraHeavyAttack.mp3` (in 2x speed), with preloaded handlers permanently locked.
  - All animations, frame dimensions, timings, scale, position, delays, lunges, animator components (`ArchonThunderAnimator`), and sound effect bindings are permanently locked to not change, alter, modify, degrade, or cross-contaminate. Must NEVER leak into other stages.
- **Anti-Serum Hydra (Stage 4 Final Boss - `is-4` / legacy `is-3`)**: All animations, lightning effects, frame dimensions, vertical spritesheet configuration, and audio effects are permanently locked.

### Clinical Microscopy & Parasitology
- **Reagent Strip Slime (Stage 1 Minion - `cm-1`)**: Full animation sequence, lunges, and sound effects (`ReagentStripSlimeNormal&HeavyAttack.mp3`) are permanently locked.
- **Urochrome Titan (Stage 3 Chapter Boss - `cm-3` / legacy `cm-1`)**:
  - `idleSpriteUrl`: `/images/bosses/clinmicro_chapterOneBoss_idleAnimation.png` (14 frames, 77x99, 1.0s loop)
  - `attackSpriteUrl`: `/images/bosses/clinmicro_chapterOneBoss_normalAttackAnimation.png` (14 frames, 219x128, 1.25s duration, `step-end` with 14 dedicated keyframes)
  - Normal Attack Sequence & Timing:
    - 0–150ms: Swift dash directly in front of the player (`min(-45px, calc(-100cqw + 590px))` / `calc(-100cqw + 720px)`)
    - 0–1250ms: Executes and renders all 14 frames of the normal claw strike attack in front of the player, with `BiohazardOverlordNormalAttack.mp3` triggered at ~350ms and claw impact at 420ms (`impactDelay = 420ms`, hit spark, and shake)
    - 1250ms–2184ms: Seamlessly transitions to `idleSpriteUrl` in a dedicated clipped 77x99 window at `left: 51 * effectiveScale px, top: 29 * effectiveScale px`, pausing for ~1 second in its Idle stance in front of the player
    - 2184ms–2600ms: Smoothly glides back to starting position while in Idle stance, settling cleanly onto its pedestal at 2600ms (`resetDelay = 2600ms`)
  - `heavyAttackSpriteUrl`: `/images/bosses/clinmicro_chapterOneBoss_heavyAttackAnimation.png` (14 frames, 151x128, 1.25s duration, `step-end` with 14 dedicated keyframes)
  - Heavy Attack Sequence & Timing:
    - 0–150ms: Swift dash directly in front of the player (`min(-45px, calc(-100cqw + 420px))` / `calc(-100cqw + 550px)`)
    - 0–1250ms: Executes and renders all 14 frames of the heavy claw ground slam attack in front of the player, with `CrystalGolemNormalAttack.mp3` triggered at ~420ms and slam impact at 450ms (`impactDelay = 450ms`, hit spark, and shake)
    - 1250ms–2184ms: Seamlessly transitions to `idleSpriteUrl` in a dedicated clipped 77x99 window at `left: 51 * effectiveScale px, top: 29 * effectiveScale px`, pausing for ~1 second in its Idle stance in front of the player
    - 2184ms–2600ms: Smoothly glides back to starting position while in Idle stance, settling cleanly onto its pedestal at 2600ms (`resetDelay = 2600ms`)
  - Scale & Positioning: `effectiveScale = scale * 2.55` with vertical alignment `translate-y-[16px] md:translate-y-[20px]` in `src/app/quest/page.tsx` ensuring generous clearance below the Enemy HP bar and SHIELDED badge while matching the physical body size and silhouette of Crystal Golem.
  - Sound effects: `normalAttackSfxUrl: /SoundEffects/BiohazardOverlordNormalAttack.mp3`, `heavyAttackSfxUrl: /SoundEffects/CrystalGolemNormalAttack.mp3`, with preloaded handlers via `preloadBiohazardSounds` and `preloadCrystalGolemSounds` permanently locked.
  - All animations, timings, frame dimensions, delays, scales, positions, keyframes, and sound effect bindings are permanently locked to not modify, alter, degrade, or cross-contaminate. Must NEVER leak into other stages.
- **Crystal Golem (Stage 4 Final Boss - `cm-4` / legacy `cm-3`)**: Scoped strictly to Final Boss with idle, normal, and heavy animations and audio (`CrystalGolemNormalAttack.mp3`, `CrystalGolemHeavyAttack.mp3`) permanently locked.

### Histopathology and Medtech Laws
- **GMS Fungal Spore (Stage 1 Minion - `hp-1`)**: Full animation sequence, lunges, and sound effects (`FungalSporeNormalAttack.mp3`, `FungalSporeHeavyAttack.mp3`) are permanently locked.
- **Paraffin Golem (Stage 2 Mini-Boss - `hp-2`)**:
  - `miniBossIdleSpriteUrl`: `/images/bosses/hispatho_chapterOneMiniBoss_idleAnimation.png` (7 frames, 128x128, 1.0s loop)
  - `miniBossAttackSpriteUrl`: `/images/bosses/hispatho_chapterOneMiniBoss_normalAttackAnimation.png` (17 frames, 160x128, 1.25s duration, `step-end` with 17 dedicated keyframes)
  - Normal Attack Sequence & Timing:
    - 0–156ms: Swift dash directly in front of the player (`min(-45px, calc(-100cqw + 400px))` / `calc(-100cqw + 520px)`)
    - 0–1250ms: Executes and renders all 17 frames of the normal attack in front of the player, with `BiohazardOverlordNormalAttack.mp3` triggered at blade thrust frame (~750ms) and blade impact at 750ms (`impactDelay = 750ms`, hit spark, and shake)
    - 1250ms–2184ms: Seamlessly transitions to `idleSpriteUrl` in a dedicated clipped 128x128 window at `left: 36 * effectiveScale px`, pausing for ~1 second in its Idle stance in front of the player
    - 2184ms–2600ms: Smoothly glides back to starting position while in Idle stance, settling cleanly onto its pedestal at 2600ms (`resetDelay = 2600ms`)
  - `miniBossHeavyAttackSpriteUrl`: `/images/bosses/hispatho_chapterOneMiniBoss_heavyAttackGlintAnimation-1.png` (13 frames, 128x128, playing in place as warning glint animation with no lunge)
  - `miniBossHeavyAttackBallsUrl`: `/images/bosses/hispatho_chapterOneMiniBoss_heavyAttackBallsAnimation-2.png` (12 frames, 192x192 via `ParaffinBallsAnimator` at scale 2.0 positioned on player body from 240ms to 1060ms, piercing impact at frame 7 ~718ms with `LegalBeholderHeavyAttack.mp3` and reset at 1150ms)
  - Scale & Positioning: `effectiveScale = scale * 1.50` with vertical alignment `-translate-y-[8px] md:-translate-y-[12px]` in `src/app/quest/page.tsx`
  - Sound effects: `normalAttackSfxUrl: /SoundEffects/BiohazardOverlordNormalAttack.mp3`, `heavyAttackSfxUrl: /SoundEffects/LegalBeholderHeavyAttack.mp3`
  - All animations, timings, frame dimensions, delays, scales, positions, and sound effect bindings are permanently locked to not modify, alter, degrade, or cross-contaminate. Must NEVER leak into other stages.
- **Fixation Overlord (Stage 3 Chapter Boss - `hp-3` / legacy `hp-1`)**:
  - `idleSpriteUrl`: `/images/bosses/hispatho_chapterOneBoss_idleAnimation.png` (8 frames, 128x128, 1.0s loop)
  - `attackSpriteUrl`: `/images/bosses/hispatho_chapterOneBoss_normalAttackAnimation.png` (15 frames, 256x176, 1.25s duration, `step-end` with 15 dedicated keyframes)
  - Normal Attack Sequence & Timing:
    - 0–150ms: Swift dash directly in front of the player (`min(-45px, calc(-100cqw + 350px))` / `calc(-100cqw + 460px)`)
    - 0–1250ms: Executes and renders all 15 frames of the normal attack in front of the player, with `BiohazardOverlordNormalAttack.mp3` triggered at blade swing frame (~750ms) and blade impact at 750ms (`impactDelay = 750ms`, hit spark, and shake)
    - 1250ms–2184ms: Seamlessly transitions to `idleSpriteUrl` in a dedicated clipped 128x128 window at `left: 77 * effectiveScale px, top: 39 * effectiveScale px`, pausing for ~1 second in its Idle stance in front of the player
    - 2184ms–2600ms: Smoothly glides back to starting position while in Idle stance, settling cleanly onto its pedestal at 2600ms (`resetDelay = 2600ms`)
  - `heavyAttackSpriteUrl`: `/images/bosses/hispatho_chapterOneBoss_heavtAttackGlintAnimation-1.png` (10 frames, 144x191, playing in place as warning glint animation with no lunge, outer container `overflow-visible`, inner container `overflow-hidden` at `bottom: 0`, `left: -6 * effectiveScale px`)
  - `heavyAttackNailedUrl`: `/images/bosses/hispatho_chapterOneBoss_heavtAttackNailedAnimation-2.png` (15 frames, 256x128 via `FixationNailedAnimator` at scale 2.2 positioned on player body from 240ms to 1200ms with piercing impact at frame 7 ~688ms, holding frame 14 until 1260ms, smooth fade-out from 1260ms to 1480ms, and `resetDelay = 1550ms`)
  - Scale & Positioning: `effectiveScale = scale * 1.50` with vertical alignment `translate-y-[52px] md:translate-y-[60px]` in `src/app/quest/page.tsx` ensuring generous clearance below the Enemy HP bar and SHIELDED badge
  - Sound effects: `normalAttackSfxUrl: /SoundEffects/BiohazardOverlordNormalAttack.mp3`, `heavyAttackSfxUrl: /SoundEffects/LegalBeholderHeavyAttack.mp3`
  - All animations, timings, frame dimensions, delays, scales, positions, and sound effect bindings are permanently locked to not modify, alter, degrade, or cross-contaminate. Must NEVER leak into other stages.
- **Legal Beholder (Stage 4 Final Boss - `hp-4` / legacy `hp-3`)**:
  - `idleSpriteUrl`: `/images/bosses/hispatho_chapterThreeFinalBoss_idleAnimation.png` (6 frames, 160x140)
  - `attackSpriteUrl`: `/images/bosses/hispatho_chapterThreeFinalBoss_normalAttackGlintAnimation-1.png` (12 frames, 160x140)
  - `hammerAttackUrl`: `/images/bosses/hispatho_chapterThreeFinalBoss_normalAttackHammerAnimation-2.png` (11 frames, 128x128 via `JudicialHammerAnimator`)
  - `heavyAttackSpriteUrl`: `/images/bosses/hispatho_chapterThreeFinalBoss_heavyAttackGlintAnimation-1.png` (18 frames, 160x140)
  - `undergroundBlastUrl`: `/images/bosses/hispatho_chapterThreeFinalBoss_heavyAttackUndergroundBlastAnimation.png` (16 frames, 160x160 via `UndergroundBlastAnimator`)
  - Must NEVER leak into Stage 1, Stage 2, or Stage 3.

---

## 2. Global Subject Metadata Invariant
- **NO Global Subject Sprite Leakage**: `SUBJECT_METADATA` entries in `src/app/quest/page.tsx` must ONLY define general metadata (`name`, `icon`, `color`, `enemy`, `imageUrl`, `backgroundUrl`, `difficulty`, `biome`, `description`).
- Final boss sprites, attack overlays, frame counts, frame dimensions, and boss-specific sound effects MUST NEVER be declared inside global `SUBJECT_METADATA` fallback objects. They must live strictly on their dedicated chapter node configurations (e.g., `hem-4`, `hp-4`, `cm-4`, `mb-4`, `is-4`, `cc-4` or legacy `*-3`).

---

## 3. General Sprite Editing Protocol
- Never modify existing sprite dimensions, frame counts, animation step counts, CSS animations, or sound triggers without explicit, direct instruction from the user.

---

## 4. Absolute Non-Interference with Approved Sprite Animations (Both Modes)
- **Permanent Lock Across All Game Modes**: All the above verified and approved enemy sprite animations, spritesheets, audio files, frame timings, lunges, delays, and overlays are **PERMANENTLY LOCKED across both Boss-Battle Mode and Learning Mode**.
- **Mode Parity Enforcement**: Sprite animations, forward lunges, sound effect timings, delays, and overlays in Learning Mode must look, sound, and behave 100% identically to Boss-Battle Mode. Under NO circumstances should any approved enemy configuration in either mode be modified, replaced, reverted, degraded, or cross-contaminated.
- **Progressive Addition Only**: When adding new sprite animations for enemies that do not yet have them, all code changes must be strictly isolated. Under NO circumstances should any approved enemy configuration be modified, replaced, reverted, degraded, or cross-contaminated.

---

## 5. Permitted Reading & Cross-Referencing
- **Reference Permitted & Encouraged**: Agents **are fully permitted and encouraged to read, inspect, and cross-reference** the approved configurations, frame dimensions, keyframe animations, delay patterns, and animator components in `AGENTS.md` and `GEMINI.md` to guide new implementations.
- **Strict Read-Only Constraint**: Cross-referencing is strictly for guidance and architectural alignment. Agents must NEVER alter, edit, mutate, overwrite, or cross-contaminate any verified and approved sprite animation code or documentation.

---

## 6. Animation Timing, Smoothness & Pace Standard (Golden Reference)
- **Benchmark Components & Golden References**: When building or tuning any new sprite attack animations (both boss body animations and overlay animators), agents must match the smooth timing, natural pace, and complete frame rendering of:
  - `JudicialHammerAnimator` (`src/components/game/JudicialHammerAnimator.tsx`): Benchmark for smooth, readable pacing and complete frame playback without skipping or rushing.
  - `ColossusFistAnimator` (`src/components/game/ColossusFistAnimator.tsx`): Benchmark for heavy strike pacing, allowing every single frame of the descending slam to render fluidly and legibly before impact.
  - **Forward Lunge Attack Benchmark (`hematology_chapterOneBoss_normalAttackAnimation.png`)**: The Erythrocyte Colossus Normal Attack is the **definitive golden standard** for all enemy attacks that lunge forward towards the player. All forward-lunging attacks must mirror this smooth 4-phase timing and choreography:
    1. **Swift Forward Dash** (0–6% of movement / ~150ms): Fast, decisive dash directly in front of the player.
    2. **Full In-Place Attack Execution**: Renders and plays all frames of the attack sequence completely in front of the player without skipping or rushing (with impact synchronized to hit reactions/sparks).
    3. **1-Second Idle Pause in Front of Player**: Seamlessly transitions to the enemy's Idle stance in a dedicated frame window and pauses in front of the player for ~1 second, creating dramatic weight and presence.
    4. **Smooth Glide Return**: While remaining in Idle stance, smoothly glides back to its home pedestal using a fluid easing curve (e.g. `cubic-bezier(0.25, 1, 0.5, 1)`) and settles cleanly into position before the reset delay expires.
- **Execution Rules**:
  - **Full Frame Playback**: Never rush or compress animation durations so short that intermediate frames are skipped, truncated, or blurred.
  - **Impact Synchronization**: Time hit sparks, player hit reactions, and screen shakes to sync precisely with the visual impact frame of the animation.
  - **Smooth Transitions**: Ensure multi-phase movements (lunges, glides, pauses, returns) use smooth easing curves and settle cleanly onto their starting pedestal.

---

## 7. Learning Mode & Boss-Battle Mode Absolute Parity & Wave Stage Isolation Rules
- **Universal Mode Parity**: All approved sprite animations, lunges, frame counts, frame dimensions, audio bindings, impact delays, reset delays, and attack overlays verified in Boss-Battle Mode are **PERMANENTLY LOCKED in Learning Mode as well**.
- **Mode-Identical Visual & Audio Behavior**: Under no circumstances should any enemy sprite animation behave differently, skip frames, truncate timings, rush lunges, alter scale, shift vertical alignment, or trigger mismatched sound effects in Learning Mode compared to Boss-Battle Mode. Both modes must render identical visual choreography and timing.
- **Strict Wave Stage Isolation in Learning Mode**:
  - **Wave 1 (Minion Stage)**: Strictly renders only approved Minion sprite animations and sound effects. Never leaks Mini-Boss, Boss, or Final Boss overlays or timings.
  - **Wave 2 (Mini-Boss Stage)**: Strictly renders only approved Mini-Boss sprite animations and sound effects. Never leaks Minion, Boss, or Chapter 3 Final Boss overlays or timings.
  - **Wave 3 (Boss / Final Boss Stage)**: Strictly renders only the dedicated Chapter Boss (e.g. `hp-3` / `hp-1` Fixation Overlord, `hem-3` / `hem-1` Erythrocyte Colossus) or Final Boss (e.g. `hp-4` / `hp-3` Legal Beholder, `hem-4` / `hem-3` Sickle-Cell Reaper).
  - **Zero Overlay Leakage**: Final Boss overlay animators (`JudicialHammerAnimator`, `UndergroundBlastAnimator`, `UndergroundSpikesAnimator`, `HydraLightningAnimator`) MUST NEVER render during Minion, Mini-Boss, or Chapter Boss encounters in Learning Mode.
- **Zero Fallback Cross-Contamination**: Fallback logic (such as `|| ch3Node?.hammerAttackUrl`, `|| ch3Node?.undergroundBlastUrl`, `|| (quizMode === 'learning' && waveState?.waveStage === 3)`, or `|| (quizMode === 'learning' && currentWaveStage === 3)`) must NEVER inject Final Boss attack assets, overlay animators, or spike timing into Minion, Mini-Boss, or Chapter Boss encounters in Learning Mode.
- **Permanent Lock Across Both Modes**: Every verified animation timing, forward lunge sequence, idle pause, glide return, and animator component is permanently locked and protected across both Boss-Battle Mode and Learning Mode without exception.

---

## 8. Test Mode Random Encounter & Full Mode Parity Rules (Option B)
- **Random Candidate Selection**: When a player starts Test Mode for a chosen subject, the game constructs a candidate pool exclusively from that subject's approved elite roster:
  1. **Mini-Boss** (`tier: 'mini-boss'`, e.g. Anemia Shade, Paraffin Golem, Staph Sentinel, Antigen Titan, Hyperglycemic Mutant)
  2. **Chapter 1 Boss** (`tier: 'boss'`, e.g. Erythrocyte Colossus, Fixation Overlord, Gram Positive Overlord, Ketoacidosis Colossus, Immune Archon, Urochrome Titan)
  3. **Chapter 3 Final Boss** (`tier: 'final-boss'`, e.g. Sickle-Cell Reaper, Legal Beholder, Biohazard Overlord, Crystal Golem, Hyperglycemic Specter, Anti-Serum Hydra)
- **Minion Exclusion**: Minions are strictly reserved for Wave 1 of Learning/Boss modes and are excluded from the Test Mode candidate pool.
- **100% Identical Choreography, Timings & Sound Effects**: The chosen enemy runs with complete parity to Boss-Battle and Learning Mode: identical frame dimensions, step-end keyframes, golden standard 4-phase lunges (swift forward dash, full in-place attack execution, 1-second idle pause, smooth glide return), impact delays, reset delays, hit sparks, screen shakes, overlay animators (`JudicialHammerAnimator`, `UndergroundBlastAnimator`, `UndergroundSpikesAnimator`, `HydraLightningAnimator`, `ArchonThunderAnimator`, `ParaffinBallsAnimator`, `FixationNailedAnimator`, `ColossusFistAnimator`, `AnemiaSlashAnimator`), and dedicated sound effect bindings.
- **Alternating Attack Variety**: On player mistakes in Test Mode, the enemy alternates between normal attack and heavy attack (`Math.random() < 0.5`), rendering the authentic animations, overlays, and sound effects for each attack tier.


