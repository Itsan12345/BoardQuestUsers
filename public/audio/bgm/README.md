# BoardQuest Background Music (BGM) Assets

Place your 5 background music MP3 files in this directory (`public/audio/bgm/`):

1. **`map_selection.mp3`**
   - Played during **Map Selection** (when viewing the Chapter Overworld Map).

2. **`learning_mode_battle.mp3`**
   - Played during **Learning Mode** battle simulations across all stages/waves.

3. **`test_mode_battle.mp3`**
   - Played during **Test Mode** battle simulations.

4. **`boss_battle_regular.mp3`**
   - Played during **Boss-Battle Mode** for Stage 1 (Minion), Stage 2 (Mini-Boss), and Stage 3 (Chapter Boss).

5. **`boss_battle_final.mp3`**
   - Played during **Boss-Battle Mode** specifically for Stage 4 (Final Boss Only).

---
### Audio Specifications & Features:
- **Format**: `.mp3` (or any browser-supported audio format mapped to these filenames)
- **Playback**: Auto-looping enabled (`loop = true`)
- **Volume & Controls**:
  - Independent **BGM Volume Slider** (default 60%) in both Profile Settings and In-Arena Settings
  - Respects the **Background Ambient Music** toggle switch
  - Automatically fades/stops during Victory / Defeat jingles and when fleeing the arena
  - Graceful fallback: If an audio file is not yet placed, the game continues seamlessly without errors.
