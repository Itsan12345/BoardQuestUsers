# Strict Sprite & Boss Animation Protection Rules

> **CRITICAL INVARIANT**: All sprite animations, attack effects, frame configurations, lunges, and sound effect bindings in BoardQuest have been fully tested, verified, and approved by the user. Under NO circumstances should any agent alter, revert, override, or degrade these sprite animation systems without explicit user instruction.

---

## 1. Verified & Protected Enemy Sprite Configurations

### Clinical Chemistry
- **Acid Slime (Ch 1 Minion)**: All original attack animations, lunges, frame timings, and sound effects are permanently locked.
- **Hyperglycemic Mutant (Ch 1 Mini-Boss)**: All claw slam timings (430ms delay), normal/heavy attacks, and sound effects are permanently locked.
- **Ketoacidosis Colossus (Ch 1 Boss)**: All original animations, lunges, and audio effects are permanently locked.
- **Hyperglycemic Specter (Ch 3 Final Boss)**: Scoped strictly to Chapter 3 (`cc-3`).

### Hematology
- **Sickle-Cell Reaper (Ch 3 Final Boss - `hem-3`)**:
  - `idleSpriteUrl`: `/images/bosses/hematology_finalboss_idleAnimation.png` (6 frames, 128x128)
  - `attackSpriteUrl`: `/images/bosses/hematology_finalboss_normalAttackGlintAnimation.png` (6 frames, 128x128)
  - `undergroundSpikesUrl`: `/images/bosses/hematology_finalboss_normalAttackUndergroundSpikesAnimation.png` (8 frames)
  - Must NEVER leak into Chapter 1 (Minion Sickle Cell / Erythrocyte Colossus) or Chapter 2.

### Clinical Microscopy & Parasitology
- **Reagent Strip Slime (Ch 1 Minion)**: Full animation sequence and sound effects locked.
- **Nitrite Spectre (Ch 1 Mini-Boss)**: Preserved.
- **Urochrome Titan (Ch 1 Boss)**: Preserved.
- **Crystal Golem (Ch 3 Final Boss - `cm-3`)**: Scoped strictly to Chapter 3 with idle, normal, and heavy animations and audio.

### Histopathology and Medtech Laws
- **GMS Fungal Spore (Ch 1 Minion)**: Full animation sequence and sound effects locked.
- **Paraffin Golem (Ch 1 Mini-Boss)** & **Fixation Overlord (Ch 1 Boss)**: Preserved.
- **Legal Beholder (Ch 3 Final Boss - `hp-3`)**:
  - `idleSpriteUrl`: `/images/bosses/hispatho_chapterThreeFinalBoss_idleAnimation.png` (6 frames, 160x140)
  - `attackSpriteUrl`: `/images/bosses/hispatho_chapterThreeFinalBoss_normalAttackGlintAnimation-1.png` (12 frames, 160x140)
  - `hammerAttackUrl`: `/images/bosses/hispatho_chapterThreeFinalBoss_normalAttackHammerAnimation-2.png` (11 frames, 128x128 via `JudicialHammerAnimator`)
  - `heavyAttackSpriteUrl`: `/images/bosses/hispatho_chapterThreeFinalBoss_heavyAttackGlintAnimation-1.png` (18 frames, 160x140)
  - `undergroundBlastUrl`: `/images/bosses/hispatho_chapterThreeFinalBoss_heavyAttackUndergroundBlastAnimation.png` (16 frames, 160x160 via `UndergroundBlastAnimator`)
  - Must NEVER leak into Chapter 1 or Chapter 2.

### Microbiology
- **Microbe Swarm (Ch 1 Minion)**, **Staph Sentinel (Ch 1 Mini-Boss)**, **Gram-Positive Colossus (Ch 1 Boss)**, and **Biohazard Overlord (Ch 3 Final Boss)**: All animations, frame dimensions, and sound effects locked.

### Immunology & Serology and Immunohematology
- **Lymphocyte Swarm (Ch 1 Minion)** and **Anti-Serum Hydra (Ch 3 Final Boss)**: Animations, lightning overlays, and audio effects locked.

---

## 2. Global Subject Metadata Invariant
- **NO Global Subject Sprite Leakage**: `SUBJECT_METADATA` entries in `src/app/quest/page.tsx` must ONLY define general metadata (`name`, `icon`, `color`, `enemy`, `imageUrl`, `backgroundUrl`, `difficulty`, `biome`, `description`).
- Final boss sprites, attack overlays, frame counts, frame dimensions, and boss-specific sound effects MUST NEVER be declared inside global `SUBJECT_METADATA` fallback objects. They must live strictly on their dedicated chapter node configurations (e.g., `hem-3`, `hp-3`, `cm-3`, `mb-3`, `is-3`, `cc-3`).

---

## 3. General Sprite Editing Protocol
- Never modify existing sprite dimensions, frame counts, animation step counts, CSS animations, or sound triggers without explicit, direct instruction from the user.

---

## 4. Explicit User Approval Rule for New Sprite Animations
- **Progressive Addition Allowed**: The user is adding sprite animations for enemies that do not yet have them. Agents may continue making unrelated codebase changes while these are being introduced.
- **Permanent Lock Upon Explicit Approval**: Once the user explicitly states that a sprite animation is approved (e.g., *"The Acid Slime Animations are Approved"*, *"X is approved"*, or any equivalent confirmation), that approved sprite animation configuration—including its spritesheet URLs, frame counts, frame dimensions, lunges, delays, attack overlays, and sound effect bindings—is **IMMEDIATELY and PERMANENTLY LOCKED**.
- **Absolute Non-Interference**: Once approved, no future edits, refactors, optimizations, or feature additions may alter, modify, replace, revert, or affect that approved animation in any way without explicit, direct instruction from the user targeting that specific enemy.
