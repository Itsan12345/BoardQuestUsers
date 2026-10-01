# Strict Sprite & Boss Animation Protection Rules

> **CRITICAL INVARIANT**: All sprite animations, attack effects, frame configurations, lunges, and sound effect bindings in BoardQuest have been fully tested, verified, and approved by the user. Under NO circumstances should any agent alter, revert, override, or degrade these sprite animation systems without explicit user instruction.

---

## 1. Verified & Permanently Locked Enemy Sprite Configurations

### Clinical Chemistry
- **Acid Slime (Ch 1 Minion)**: All original attack animations, lunges, frame timings, and sound effects (`AcidSlimeNormal&HeavyAttack.mp3`) are permanently locked.
- **Hyperglycemic Mutant (Ch 1 Mini-Boss)**: All claw slam timings (430ms delay), normal/heavy attacks, and sound effects are permanently locked.
- **Ketoacidosis Colossus (Ch 1 Boss)**: All original animations, lunges, and audio effects (`KetoacidosisColossusNormalAttack.mp3`, `KetoacidosisColossusHeavyAttack.mp3`) are permanently locked.
- **Hyperglycemic Specter (Ch 3 Final Boss - `cc-3`)**: Scoped strictly to Chapter 3 with normal attack projectile, heavy beam attack, and sound effects permanently locked.

### Microbiology
- **Microbe Swarm (Ch 1 Minion)**: Full animation sequences and sound effects (`MicrobeSwarmNormalAttack.mp3`, `MicrobeSwarmHeavyAttack.wav`) are permanently locked.
- **Staph Sentinel (Ch 1 Mini-Boss)**: All animations, frame dimensions, delays, and sound effects are permanently locked.
- **Gram Positive Overlord (Ch 1 Boss)**: Dual-strike cycle animations, frame dimensions, and sound effects (`GramPositiveNormal&HeavyAttack.mp3`) are permanently locked.
- **Biohazard Overlord (Ch 3 Final Boss - `mb-3`)**: All animations, multi-strike lunges, frame dimensions, and sound effects (`BiohazardOverlordNormalAttack.mp3`, `BiohazardOverlordHeavyAttack.mp3`) are permanently locked.

### Hematology
- **Sickle Cell (Ch 1 Minion)**: Full idle, normal attack, heavy attack animations, and sound effects (`SickleCellNormalAttack.mp3`, `SickleCellHeavyAttack.mp3`) are permanently locked.
- **Anemia Shade (Ch 1 Mini-Boss)**:
  - `miniBossIdleSpriteUrl`: `/images/bosses/hematology_chapterOneMiniBoss_idleAnimation.png` (7 frames, 128x128, 1.0s loop)
  - `miniBossAttackSpriteUrl`: `/images/bosses/hematology_chapterOneMiniBoss_normalAttackAnimation.png` (18 frames, 128x128, 1.25s) with lunge and 430ms SFX timing
  - `miniBossHeavyAttackSpriteUrl`: `/images/bosses/hematology_chapterOneMiniBoss_heavyAttack_DashAnimation.png` (15 frames, 128x128) with 3-phase execution (Dash 0-620ms -> Disappear 620-1380ms -> Smooth Idle 1380ms+)
  - `miniBossSlashSpriteUrl`: `/images/bosses/hematology_chapterOneMiniBoss_heavyAttack_SlashAnimation.png` (15 frames, 128x128 via `AnemiaSlashAnimator` on player body from 620ms to 1360ms with impact at 750ms)
  - Preloaded sound effects via `preloadAnemiaShadeSounds` and `playAnemiaShadeAttack` permanently locked.
- **Sickle-Cell Reaper (Ch 3 Final Boss - `hem-3`)**:
  - `idleSpriteUrl`: `/images/bosses/hematology_finalboss_idleAnimation.png` (6 frames, 128x128)
  - `attackSpriteUrl`: `/images/bosses/hematology_finalboss_normalAttackGlintAnimation.png` (6 frames, 128x128)
  - `undergroundSpikesUrl`: `/images/bosses/hematology_finalboss_normalAttackUndergroundSpikesAnimation.png` (8 frames)
  - Sound effects: `SickleCellReaperNormalAttack.mp3`, `SickleCellReaperHeavyAttack.mp3`
  - Must NEVER leak into Chapter 1 (Minion Sickle Cell / Erythrocyte Colossus) or Chapter 2.

### Immunology & Serology and Immunohematology
- **Lymphocyte Swarm (Ch 1 Minion)**: All animations, lightning overlays, and audio effects (`MicrobeSwarmNormalAttack.mp3`, `MicrobeSwarmHeavyAttack.wav`) are permanently locked.
- **Antigen Titan (Ch 1 Mini-Boss)**:
  - `miniBossIdleSpriteUrl`: `/images/bosses/immunohema_chapterOneMiniBoss_idleAnimation.png` (7 frames, 128x128, scale 1.85, centered position)
  - `miniBossAttackSpriteUrl`: `/images/bosses/immunohema_chapterOneMiniBoss_normalAttackAnimation.png` (8 frames, 128x128) with `KetoacidosisColossusNormalAttack.mp3`
  - `miniBossHeavyAttackSpriteUrl`: `/images/bosses/immunohema_chapterOneMiniBoss_heavyAttackAnimation.png` (9 frames, 128x128) with `CrystalGolemNormalAttack.mp3`
  - All animations, timings, scale, position, and audio effects are permanently locked.
- **Anti-Serum Hydra (Ch 3 Final Boss - `is-3`)**: All animations, lightning effects, frame dimensions, vertical spritesheet configuration, and audio effects are permanently locked.

### Clinical Microscopy & Parasitology
- **Reagent Strip Slime (Ch 1 Minion)**: Full animation sequence, lunges, and sound effects (`ReagentStripSlimeNormal&HeavyAttack.mp3`) are permanently locked.
- **Crystal Golem (Ch 3 Final Boss - `cm-3`)**: Scoped strictly to Chapter 3 with idle, normal, and heavy animations and audio (`CrystalGolemNormalAttack.mp3`, `CrystalGolemHeavyAttack.mp3`) permanently locked.

### Histopathology and Medtech Laws
- **GMS Fungal Spore (Ch 1 Minion)**: Full animation sequence, lunges, and sound effects (`FungalSporeNormalAttack.mp3`, `FungalSporeHeavyAttack.mp3`) are permanently locked.
- **Legal Beholder (Ch 3 Final Boss - `hp-3`)**:
  - `idleSpriteUrl`: `/images/bosses/hispatho_chapterThreeFinalBoss_idleAnimation.png` (6 frames, 160x140)
  - `attackSpriteUrl`: `/images/bosses/hispatho_chapterThreeFinalBoss_normalAttackGlintAnimation-1.png` (12 frames, 160x140)
  - `hammerAttackUrl`: `/images/bosses/hispatho_chapterThreeFinalBoss_normalAttackHammerAnimation-2.png` (11 frames, 128x128 via `JudicialHammerAnimator`)
  - `heavyAttackSpriteUrl`: `/images/bosses/hispatho_chapterThreeFinalBoss_heavyAttackGlintAnimation-1.png` (18 frames, 160x140)
  - `undergroundBlastUrl`: `/images/bosses/hispatho_chapterThreeFinalBoss_heavyAttackUndergroundBlastAnimation.png` (16 frames, 160x160 via `UndergroundBlastAnimator`)
  - Must NEVER leak into Chapter 1 or Chapter 2.

---

## 2. Global Subject Metadata Invariant
- **NO Global Subject Sprite Leakage**: `SUBJECT_METADATA` entries in `src/app/quest/page.tsx` must ONLY define general metadata (`name`, `icon`, `color`, `enemy`, `imageUrl`, `backgroundUrl`, `difficulty`, `biome`, `description`).
- Final boss sprites, attack overlays, frame counts, frame dimensions, and boss-specific sound effects MUST NEVER be declared inside global `SUBJECT_METADATA` fallback objects. They must live strictly on their dedicated chapter node configurations (e.g., `hem-3`, `hp-3`, `cm-3`, `mb-3`, `is-3`, `cc-3`).

---

## 3. General Sprite Editing Protocol
- Never modify existing sprite dimensions, frame counts, animation step counts, CSS animations, or sound triggers without explicit, direct instruction from the user.

---

## 4. Absolute Non-Interference with Approved Sprite Animations
- **Permanent Lock**: All the above verified and approved enemy sprite animations, spritesheets, audio files, frame timings, lunges, delays, and overlays are **PERMANENTLY LOCKED**.
- **Progressive Addition Only**: When adding new sprite animations for enemies that do not yet have them, all code changes must be strictly isolated. Under NO circumstances should any approved enemy configuration be modified, replaced, reverted, degraded, or cross-contaminated.
