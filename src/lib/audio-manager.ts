"use client";

// Web Audio API Synthesizer for Retro RPG Sound Effects
// Zero external assets required - lightweight, crisp, and performant.

type SfxType = 'click' | 'correct' | 'wrong' | 'attack' | 'heal' | 'victory' | 'defeat' | 'flee' | 'debuff' | 'poison' | 'specter_normal' | 'specter_heavy' | 'biohazard_normal' | 'biohazard_heavy' | 'staph_sentinel_normal' | 'staph_sentinel_heavy' | 'acid_slime_normal' | 'acid_slime_heavy' | 'crystal_golem_normal' | 'crystal_golem_heavy' | 'microbe_swarm_normal' | 'microbe_swarm_heavy' | 'sickle_cell_minion_normal' | 'sickle_cell_minion_heavy' | 'sickle_reaper_normal' | 'sickle_reaper_heavy' | 'fungal_spore_normal' | 'fungal_spore_heavy' | 'gram_positive_normal' | 'gram_positive_heavy' | 'reagent_strip_slime_normal' | 'reagent_strip_slime_heavy' | 'final_boss_victory' | 'final_boss_defeat' | 'boss_battle_win' | 'boss_battle_lost' | 'learning_win' | 'learning_lost' | 'test_win' | 'test_lost';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => { });
  }
  return audioCtx;
}

export function getSfxVolume(): number {
  if (typeof window === 'undefined') return 0.8;
  try {
    const saved = localStorage.getItem('bq_pref_sfx_vol');
    if (saved !== null) {
      const vol = parseInt(saved, 10);
      return isNaN(vol) ? 0.8 : Math.max(0, Math.min(1, vol / 100));
    }
  } catch (e) { }
  return 0.8;
}

export function isAmbientMusicEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const saved = localStorage.getItem('bq_pref_ambient_music');
    return saved !== 'false';
  } catch (e) { }
  return true;
}

export function playSfx(type: SfxType) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const masterVolume = getSfxVolume();
    if (masterVolume <= 0) return;

    const now = ctx.currentTime;

    switch (type) {
      case 'click': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);

        gain.gain.setValueAtTime(masterVolume * 0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.05);
        break;
      }

      case 'correct': {
        // Melodic 2-tone chime (E5 -> B5)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'triangle';
        osc2.type = 'sine';

        osc1.frequency.setValueAtTime(659.25, now); // E5
        osc1.frequency.setValueAtTime(987.77, now + 0.1); // B5

        osc2.frequency.setValueAtTime(659.25, now);
        osc2.frequency.setValueAtTime(987.77, now + 0.1);

        gain.gain.setValueAtTime(masterVolume * 0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.35);
        osc2.stop(now + 0.35);
        break;
      }

      case 'wrong': {
        // Low descending buzz
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.25);

        gain.gain.setValueAtTime(masterVolume * 0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
        break;
      }

      case 'attack': {
        // Slash impact FM sweep
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(350, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.15);

        gain.gain.setValueAtTime(masterVolume * 0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
        break;
      }

      case 'heal': {
        // Ascending harmonic shimmer
        [440, 554.37, 659.25, 880].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const start = now + i * 0.06;
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, start);

          gain.gain.setValueAtTime(masterVolume * 0.25, start);
          gain.gain.exponentialRampToValueAtTime(0.01, start + 0.2);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + 0.2);
        });
        break;
      }

      case 'victory': {
        // 4-note victory fanfare (C5 -> E5 -> G5 -> C6)
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const start = now + i * 0.12;
          const duration = i === notes.length - 1 ? 0.5 : 0.12;

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, start);

          gain.gain.setValueAtTime(masterVolume * 0.45, start);
          gain.gain.exponentialRampToValueAtTime(0.01, start + duration);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + duration);
        });
        break;
      }

      case 'defeat': {
        // Minor descending cadence
        [440, 392, 349.23, 293.66].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const start = now + i * 0.15;
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, start);

          gain.gain.setValueAtTime(masterVolume * 0.3, start);
          gain.gain.exponentialRampToValueAtTime(0.01, start + 0.25);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + 0.25);
        });
        break;
      }

      case 'flee': {
        try {
          const audio = new Audio('/SoundEffects/Flee_Arena_Btn.mp3');
          audio.volume = masterVolume;
          audio.play().catch(err => {
            console.warn('Audio playback error for flee:', err);
          });
        } catch (e) { }
        break;
      }

      case 'specter_normal': {
        playSpecterAttack('normal');
        break;
      }

      case 'specter_heavy': {
        playSpecterAttack('heavy');
        break;
      }

      case 'biohazard_normal': {
        playBiohazardAttack('normal');
        break;
      }

      case 'biohazard_heavy': {
        playBiohazardAttack('heavy');
        break;
      }

      case 'staph_sentinel_normal': {
        playStaphSentinelAttack('normal');
        break;
      }

      case 'staph_sentinel_heavy': {
        playStaphSentinelAttack('heavy');
        break;
      }

      case 'acid_slime_normal': {
        playAcidSlimeAttack('normal');
        break;
      }

      case 'acid_slime_heavy': {
        playAcidSlimeAttack('heavy');
        break;
      }

      case 'crystal_golem_normal': {
        playCrystalGolemAttack('normal');
        break;
      }

      case 'crystal_golem_heavy': {
        playCrystalGolemAttack('heavy');
        break;
      }

      case 'sickle_cell_minion_normal': {
        playSickleCellMinionAttack('normal');
        break;
      }

      case 'sickle_cell_minion_heavy': {
        playSickleCellMinionAttack('heavy');
        break;
      }

      case 'gram_positive_normal': {
        playGramPositiveAttack('normal');
        break;
      }

      case 'gram_positive_heavy': {
        playGramPositiveAttack('heavy');
        break;
      }

      case 'reagent_strip_slime_normal': {
        playReagentStripSlimeAttack('normal');
        break;
      }

      case 'reagent_strip_slime_heavy': {
        playReagentStripSlimeAttack('heavy');
        break;
      }

      case 'boss_battle_win':
      case 'final_boss_victory': {
        playBossBattleMusic('victory');
        break;
      }

      case 'boss_battle_lost':
      case 'final_boss_defeat': {
        playBossBattleMusic('defeat');
        break;
      }

      case 'learning_win': {
        playLearningModeMusic('victory');
        break;
      }

      case 'learning_lost': {
        playLearningModeMusic('defeat');
        break;
      }

      case 'test_win': {
        playTestModeMusic('victory');
        break;
      }

      case 'test_lost': {
        playTestModeMusic('defeat');
        break;
      }

      case 'debuff':
      case 'poison': {
        playDebuffSound();
        break;
      }

      case 'microbe_swarm_normal': {
        playMicrobeSwarmAttack('normal');
        break;
      }

      case 'microbe_swarm_heavy': {
        playMicrobeSwarmAttack('heavy');
        break;
      }

      case 'sickle_reaper_normal': {
        playSickleCellReaperAttack('normal');
        break;
      }

      case 'sickle_reaper_heavy': {
        playSickleCellReaperAttack('heavy');
        break;
      }

      case 'fungal_spore_normal': {
        playFungalSporeAttack('normal');
        break;
      }

      case 'fungal_spore_heavy': {
        playFungalSporeAttack('heavy');
        break;
      }
    }
  } catch (err) {
    console.warn('Audio playback error:', err);
  }
}

// Preloaded Audio instances for Boss-Battle Mode Victory & Defeat
let bossBattleWonAudio: HTMLAudioElement | null = null;
let bossBattleLostAudio: HTMLAudioElement | null = null;
let currentBossBattleMusic: HTMLAudioElement | null = null;
let bossBattleTimeoutId: NodeJS.Timeout | null = null;
let bossBattleActiveCallback: (() => void) | null = null;

export function preloadBossBattleMusic() {
  if (typeof window === 'undefined') return;
  try {
    if (!bossBattleWonAudio) {
      bossBattleWonAudio = new Audio('/SoundEffects/MusicWhenWonInBossBattleMode.mp3');
      bossBattleWonAudio.preload = 'auto';
      bossBattleWonAudio.load();
    }
    if (!bossBattleLostAudio) {
      bossBattleLostAudio = new Audio('/SoundEffects/MusicWhenLostInBossBattleMode.mp3');
      bossBattleLostAudio.preload = 'auto';
      bossBattleLostAudio.load();
    }
  } catch (e) { }
}

export function stopBossBattleMusic() {
  try {
    if (bossBattleTimeoutId) {
      clearTimeout(bossBattleTimeoutId);
      bossBattleTimeoutId = null;
    }
    bossBattleActiveCallback = null;

    if (currentBossBattleMusic) {
      currentBossBattleMusic.onended = null;
      currentBossBattleMusic.pause();
      currentBossBattleMusic.currentTime = 0;
      currentBossBattleMusic = null;
    }
    if (bossBattleWonAudio) {
      bossBattleWonAudio.onended = null;
      bossBattleWonAudio.pause();
      bossBattleWonAudio.currentTime = 0;
    }
    if (bossBattleLostAudio) {
      bossBattleLostAudio.onended = null;
      bossBattleLostAudio.pause();
      bossBattleLostAudio.currentTime = 0;
    }
  } catch (e) { }
}

export function playBossBattleMusic(outcome: 'victory' | 'defeat', onEnded?: () => void) {
  if (typeof window === 'undefined') {
    if (onEnded) onEnded();
    return;
  }

  try {
    const targetSrc = outcome === 'victory'
      ? '/SoundEffects/MusicWhenWonInBossBattleMode.mp3'
      : '/SoundEffects/MusicWhenLostInBossBattleMode.mp3';

    const triggerCompletion = () => {
      if (bossBattleTimeoutId) {
        clearTimeout(bossBattleTimeoutId);
        bossBattleTimeoutId = null;
      }
      if (bossBattleActiveCallback) {
        const cb = bossBattleActiveCallback;
        bossBattleActiveCallback = null;
        try {
          cb();
        } catch (e) {
          console.error('Error executing boss battle onEnded callback:', e);
        }
      }
    };

    // If this exact music is already actively playing, let it continue smoothly and attach callback!
    if (currentBossBattleMusic && !currentBossBattleMusic.paused && currentBossBattleMusic.src.includes(targetSrc)) {
      if (onEnded) {
        bossBattleActiveCallback = onEnded;

        // If it already finished or reached the end:
        if (currentBossBattleMusic.ended || (currentBossBattleMusic.duration && currentBossBattleMusic.currentTime >= currentBossBattleMusic.duration)) {
          triggerCompletion();
          return;
        }

        currentBossBattleMusic.onended = triggerCompletion;

        // Safety fallback timer based on remaining audio duration
        if (bossBattleTimeoutId) clearTimeout(bossBattleTimeoutId);
        const durationSec = (currentBossBattleMusic.duration && !isNaN(currentBossBattleMusic.duration) && currentBossBattleMusic.duration > 0)
          ? currentBossBattleMusic.duration
          : (outcome === 'victory' ? 10.6 : 11.1);
        const remainingMs = Math.max(500, ((durationSec - currentBossBattleMusic.currentTime) * 1000) + 500);
        bossBattleTimeoutId = setTimeout(triggerCompletion, remainingMs);
      }
      return;
    }

    stopBossBattleMusic();

    bossBattleActiveCallback = onEnded || null;

    const masterVolume = getSfxVolume();
    const baseAudio = outcome === 'victory' ? bossBattleWonAudio : bossBattleLostAudio;
    let audio: HTMLAudioElement;

    if (baseAudio) {
      audio = baseAudio;
      audio.currentTime = 0;
    } else {
      audio = new Audio(targetSrc);
    }

    audio.volume = Math.max(0, Math.min(1, masterVolume));
    currentBossBattleMusic = audio;

    if (onEnded) {
      audio.onended = triggerCompletion;

      // Safety fallback timer: fires after full duration + small buffer in case ended event drops
      const expectedSec = outcome === 'victory' ? 10.6 : 11.1;
      const totalSec = (audio.duration && !isNaN(audio.duration) && audio.duration > 0) ? audio.duration : expectedSec;
      bossBattleTimeoutId = setTimeout(triggerCompletion, (totalSec * 1000) + 500);
    }

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(err => {
        console.warn('Playback error for boss battle ' + outcome + ' music:', err);
        // Autoplay blocked or error: ensure game does not hang
        if (bossBattleActiveCallback) {
          setTimeout(triggerCompletion, 2000);
        }
      });
    }
  } catch (err) {
    console.warn('Failed to play boss battle music:', err);
    if (onEnded) {
      onEnded();
    }
  }
}

// Aliases for backwards compatibility with previous final boss naming
export const preloadFinalBossMusic = preloadBossBattleMusic;
export const stopFinalBossMusic = stopBossBattleMusic;
export const playFinalBossMusic = playBossBattleMusic;

// Preloaded Audio instances for Learning Mode Win & Lost
let learningModeWinAudio: HTMLAudioElement | null = null;
let learningModeLostAudio: HTMLAudioElement | null = null;
let currentLearningModeMusic: HTMLAudioElement | null = null;
let learningModeTimeoutId: NodeJS.Timeout | null = null;
let learningModeActiveCallback: (() => void) | null = null;

export function preloadLearningModeMusic() {
  if (typeof window === 'undefined') return;
  try {
    if (!learningModeWinAudio) {
      learningModeWinAudio = new Audio('/SoundEffects/MusicWhenWinInLearningMode.mp3');
      learningModeWinAudio.preload = 'auto';
      learningModeWinAudio.load();
    }
    if (!learningModeLostAudio) {
      learningModeLostAudio = new Audio('/SoundEffects/MusicWhenLostInLearningMode.mp3');
      learningModeLostAudio.preload = 'auto';
      learningModeLostAudio.load();
    }
  } catch (e) { }
}

export function stopLearningModeMusic() {
  try {
    if (learningModeTimeoutId) {
      clearTimeout(learningModeTimeoutId);
      learningModeTimeoutId = null;
    }
    learningModeActiveCallback = null;

    if (currentLearningModeMusic) {
      currentLearningModeMusic.onended = null;
      currentLearningModeMusic.pause();
      currentLearningModeMusic.currentTime = 0;
      currentLearningModeMusic = null;
    }
    if (learningModeWinAudio) {
      learningModeWinAudio.onended = null;
      learningModeWinAudio.pause();
      learningModeWinAudio.currentTime = 0;
    }
    if (learningModeLostAudio) {
      learningModeLostAudio.onended = null;
      learningModeLostAudio.pause();
      learningModeLostAudio.currentTime = 0;
    }
  } catch (e) { }
}

export function playLearningModeMusic(outcome: 'victory' | 'defeat', onEnded?: () => void) {
  if (typeof window === 'undefined') {
    if (onEnded) onEnded();
    return;
  }

  try {
    const targetSrc = outcome === 'victory'
      ? '/SoundEffects/MusicWhenWinInLearningMode.mp3'
      : '/SoundEffects/MusicWhenLostInLearningMode.mp3';

    const triggerCompletion = () => {
      if (learningModeTimeoutId) {
        clearTimeout(learningModeTimeoutId);
        learningModeTimeoutId = null;
      }
      if (learningModeActiveCallback) {
        const cb = learningModeActiveCallback;
        learningModeActiveCallback = null;
        try {
          cb();
        } catch (e) {
          console.error('Error executing learning mode onEnded callback:', e);
        }
      }
    };

    // If this exact music is already actively playing, let it continue smoothly and attach callback!
    if (currentLearningModeMusic && !currentLearningModeMusic.paused && currentLearningModeMusic.src.includes(targetSrc)) {
      if (onEnded) {
        learningModeActiveCallback = onEnded;

        // If it already finished or reached the end:
        if (currentLearningModeMusic.ended || (currentLearningModeMusic.duration && currentLearningModeMusic.currentTime >= currentLearningModeMusic.duration)) {
          triggerCompletion();
          return;
        }

        currentLearningModeMusic.onended = triggerCompletion;

        // Safety fallback timer based on remaining audio duration
        if (learningModeTimeoutId) clearTimeout(learningModeTimeoutId);
        const durationSec = (currentLearningModeMusic.duration && !isNaN(currentLearningModeMusic.duration) && currentLearningModeMusic.duration > 0)
          ? currentLearningModeMusic.duration
          : (outcome === 'victory' ? 10.5 : 12.9);
        const remainingMs = Math.max(500, ((durationSec - currentLearningModeMusic.currentTime) * 1000) + 500);
        learningModeTimeoutId = setTimeout(triggerCompletion, remainingMs);
      }
      return;
    }

    stopLearningModeMusic();

    learningModeActiveCallback = onEnded || null;

    const masterVolume = getSfxVolume();
    const baseAudio = outcome === 'victory' ? learningModeWinAudio : learningModeLostAudio;
    let audio: HTMLAudioElement;

    if (baseAudio) {
      audio = baseAudio;
      audio.currentTime = 0;
    } else {
      audio = new Audio(targetSrc);
    }

    audio.volume = Math.max(0, Math.min(1, masterVolume));
    currentLearningModeMusic = audio;

    if (onEnded) {
      audio.onended = triggerCompletion;

      // Safety fallback timer: fires after full duration + buffer in case ended event drops
      const expectedSec = outcome === 'victory' ? 10.5 : 12.9;
      const totalSec = (audio.duration && !isNaN(audio.duration) && audio.duration > 0) ? audio.duration : expectedSec;
      learningModeTimeoutId = setTimeout(triggerCompletion, (totalSec * 1000) + 500);
    }

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(err => {
        console.warn('Playback error for learning mode ' + outcome + ' music:', err);
        if (learningModeActiveCallback) {
          setTimeout(triggerCompletion, 2000);
        }
      });
    }
  } catch (err) {
    console.warn('Failed to play learning mode music:', err);
    if (onEnded) {
      onEnded();
    }
  }
}

// Preloaded Audio instances for Test Mode Win & Lost
let testModeWinAudio: HTMLAudioElement | null = null;
let testModeLostAudio: HTMLAudioElement | null = null;
let currentTestModeMusic: HTMLAudioElement | null = null;
let testModeTimeoutId: NodeJS.Timeout | null = null;
let testModeActiveCallback: (() => void) | null = null;

export function preloadTestModeMusic() {
  if (typeof window === 'undefined') return;
  try {
    if (!testModeWinAudio) {
      testModeWinAudio = new Audio('/SoundEffects/MusicWhenWinInTestMode.mp3');
      testModeWinAudio.preload = 'auto';
      testModeWinAudio.load();
    }
    if (!testModeLostAudio) {
      testModeLostAudio = new Audio('/SoundEffects/MusicWhenLostInTestMode.mp3');
      testModeLostAudio.preload = 'auto';
      testModeLostAudio.load();
    }
  } catch (e) { }
}

export function stopTestModeMusic() {
  try {
    if (testModeTimeoutId) {
      clearTimeout(testModeTimeoutId);
      testModeTimeoutId = null;
    }
    testModeActiveCallback = null;

    if (currentTestModeMusic) {
      currentTestModeMusic.onended = null;
      currentTestModeMusic.pause();
      currentTestModeMusic.currentTime = 0;
      currentTestModeMusic = null;
    }
    if (testModeWinAudio) {
      testModeWinAudio.onended = null;
      testModeWinAudio.pause();
      testModeWinAudio.currentTime = 0;
    }
    if (testModeLostAudio) {
      testModeLostAudio.onended = null;
      testModeLostAudio.pause();
      testModeLostAudio.currentTime = 0;
    }
  } catch (e) { }
}

export function playTestModeMusic(outcome: 'victory' | 'defeat', onEnded?: () => void) {
  if (typeof window === 'undefined') {
    if (onEnded) onEnded();
    return;
  }

  try {
    const targetSrc = outcome === 'victory'
      ? '/SoundEffects/MusicWhenWinInTestMode.mp3'
      : '/SoundEffects/MusicWhenLostInTestMode.mp3';

    const triggerCompletion = () => {
      if (testModeTimeoutId) {
        clearTimeout(testModeTimeoutId);
        testModeTimeoutId = null;
      }
      if (testModeActiveCallback) {
        const cb = testModeActiveCallback;
        testModeActiveCallback = null;
        try {
          cb();
        } catch (e) {
          console.error('Error executing test mode onEnded callback:', e);
        }
      }
    };

    // If this exact music is already actively playing, let it continue smoothly and attach callback!
    if (currentTestModeMusic && !currentTestModeMusic.paused && currentTestModeMusic.src.includes(targetSrc)) {
      if (onEnded) {
        testModeActiveCallback = onEnded;

        // If it already finished or reached the end:
        if (currentTestModeMusic.ended || (currentTestModeMusic.duration && currentTestModeMusic.currentTime >= currentTestModeMusic.duration)) {
          triggerCompletion();
          return;
        }

        currentTestModeMusic.onended = triggerCompletion;

        // Safety fallback timer based on remaining audio duration
        if (testModeTimeoutId) clearTimeout(testModeTimeoutId);
        const durationSec = (currentTestModeMusic.duration && !isNaN(currentTestModeMusic.duration) && currentTestModeMusic.duration > 0)
          ? currentTestModeMusic.duration
          : (outcome === 'victory' ? 5.4 : 5.1);
        const remainingMs = Math.max(500, ((durationSec - currentTestModeMusic.currentTime) * 1000) + 500);
        testModeTimeoutId = setTimeout(triggerCompletion, remainingMs);
      }
      return;
    }

    stopTestModeMusic();

    testModeActiveCallback = onEnded || null;

    const masterVolume = getSfxVolume();
    const baseAudio = outcome === 'victory' ? testModeWinAudio : testModeLostAudio;
    let audio: HTMLAudioElement;

    if (baseAudio) {
      audio = baseAudio;
      audio.currentTime = 0;
    } else {
      audio = new Audio(targetSrc);
    }

    audio.volume = Math.max(0, Math.min(1, masterVolume));
    currentTestModeMusic = audio;

    if (onEnded) {
      audio.onended = triggerCompletion;

      // Safety fallback timer: fires after full duration + buffer in case ended event drops
      const expectedSec = outcome === 'victory' ? 5.4 : 5.1;
      const totalSec = (audio.duration && !isNaN(audio.duration) && audio.duration > 0) ? audio.duration : expectedSec;
      testModeTimeoutId = setTimeout(triggerCompletion, (totalSec * 1000) + 500);
    }

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(err => {
        console.warn('Playback error for test mode ' + outcome + ' music:', err);
        if (testModeActiveCallback) {
          setTimeout(triggerCompletion, 2000);
        }
      });
    }
  } catch (err) {
    console.warn('Failed to play test mode music:', err);
    if (onEnded) {
      onEnded();
    }
  }
}

// Preloaded Audio instances for smooth, zero-latency playback
let specterHeavyAudio: HTMLAudioElement | null = null;
let specterNormalAudio: HTMLAudioElement | null = null;

export function preloadSpecterSounds() {
  if (typeof window === 'undefined') return;
  try {
    if (!specterHeavyAudio) {
      specterHeavyAudio = new Audio('/SoundEffects/HyperglemicSpecterHeavyAttack.mp3');
      specterHeavyAudio.preload = 'auto';
      specterHeavyAudio.load();
    }
    if (!specterNormalAudio) {
      specterNormalAudio = new Audio('/SoundEffects/HyperglemicSpecterNormalAttack.mp3');
      specterNormalAudio.preload = 'auto';
      specterNormalAudio.load();
    }
  } catch (e) { }
}

export function playSpecterAttack(type: 'normal' | 'heavy') {
  if (typeof window === 'undefined') return;
  try {
    const masterVolume = getSfxVolume();
    if (masterVolume <= 0) return;

    const src = type === 'heavy'
      ? '/SoundEffects/HyperglemicSpecterHeavyAttack.mp3'
      : '/SoundEffects/HyperglemicSpecterNormalAttack.mp3';

    const baseAudio = type === 'heavy' ? specterHeavyAudio : specterNormalAudio;
    let audio: HTMLAudioElement;

    if (baseAudio) {
      baseAudio.currentTime = 0;
      audio = baseAudio;
    } else {
      audio = new Audio(src);
    }

    audio.volume = Math.max(0, Math.min(1, masterVolume));
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(err => {
        console.warn('Playback error for specter ' + type + ' attack:', err);
      });
    }
  } catch (err) {
    console.warn('Failed to play specter attack sound:', err);
  }
}

export function playAudioFile(src: string, customVolume?: number) {
  if (typeof window === 'undefined') return;
  try {
    const volume = customVolume !== undefined ? customVolume : getSfxVolume();
    if (volume <= 0) return;
    const audio = new Audio(src);
    audio.volume = Math.max(0, Math.min(1, volume));
    audio.play().catch(err => {
      console.warn('Audio playback error for ' + src + ':', err);
    });
  } catch (err) {
    console.warn('Failed to play audio file:', err);
  }
}

// Preloaded Audio instances for Biohazard Overlord attacks
let biohazardHeavyAudio: HTMLAudioElement | null = null;
let biohazardNormalAudio: HTMLAudioElement | null = null;

export function preloadBiohazardSounds() {
  if (typeof window === 'undefined') return;
  try {
    if (!biohazardHeavyAudio) {
      biohazardHeavyAudio = new Audio('/SoundEffects/BiohazardOverlordHeavyAttack.mp3');
      biohazardHeavyAudio.preload = 'auto';
      biohazardHeavyAudio.load();
    }
    if (!biohazardNormalAudio) {
      biohazardNormalAudio = new Audio('/SoundEffects/BiohazardOverlordNormalAttack.mp3');
      biohazardNormalAudio.preload = 'auto';
      biohazardNormalAudio.load();
    }
  } catch (e) { }
}

export function playBiohazardAttack(type: 'normal' | 'heavy') {
  if (typeof window === 'undefined') return;
  try {
    const masterVolume = getSfxVolume();
    if (masterVolume <= 0) return;

    const src = type === 'heavy'
      ? '/SoundEffects/BiohazardOverlordHeavyAttack.mp3'
      : '/SoundEffects/BiohazardOverlordNormalAttack.mp3';

    const baseAudio = type === 'heavy' ? biohazardHeavyAudio : biohazardNormalAudio;
    let audio: HTMLAudioElement;

    if (baseAudio) {
      baseAudio.currentTime = 0;
      audio = baseAudio;
    } else {
      audio = new Audio(src);
    }

    audio.volume = Math.max(0, Math.min(1, masterVolume));
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(err => {
        console.warn('Playback error for biohazard ' + type + ' attack:', err);
      });
    }
  } catch (err) {
    console.warn('Failed to play biohazard attack sound:', err);
  }
}

// Preloaded Audio instances for Staph Sentinel attacks
// Uses BiohazardOverlordNormalAttack.mp3 for Normal Attack, and plays it twice smoothly at normal speed for Heavy Attack
let staphSentinelAudio1: HTMLAudioElement | null = null;
let staphSentinelAudio2: HTMLAudioElement | null = null;

export function preloadStaphSentinelSounds() {
  if (typeof window === 'undefined') return;
  try {
    if (!staphSentinelAudio1) {
      staphSentinelAudio1 = new Audio('/SoundEffects/BiohazardOverlordNormalAttack.mp3');
      staphSentinelAudio1.preload = 'auto';
      staphSentinelAudio1.load();
    }
    if (!staphSentinelAudio2) {
      staphSentinelAudio2 = new Audio('/SoundEffects/BiohazardOverlordNormalAttack.mp3');
      staphSentinelAudio2.preload = 'auto';
      staphSentinelAudio2.load();
    }
  } catch (e) { }
}

export function playStaphSentinelAttack(type: 'normal' | 'heavy') {
  if (typeof window === 'undefined') return;
  try {
    const masterVolume = getSfxVolume();
    if (masterVolume <= 0) return;

    const playStrike = (baseAudio: HTMLAudioElement | null) => {
      let audio: HTMLAudioElement;
      if (baseAudio && baseAudio.paused) {
        baseAudio.currentTime = 0;
        audio = baseAudio;
      } else {
        audio = new Audio('/SoundEffects/BiohazardOverlordNormalAttack.mp3');
      }
      audio.playbackRate = 1.0;
      audio.defaultPlaybackRate = 1.0;
      audio.volume = Math.max(0, Math.min(1, masterVolume));
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.warn('Playback error for Staph Sentinel attack:', err);
        });
      }
    };

    // First strike plays immediately at normal 1.0x speed
    playStrike(staphSentinelAudio1);

    // For Heavy Attack: play the audio twice with normal speed, timed smoothly with the second strike (480ms)
    if (type === 'heavy') {
      setTimeout(() => {
        playStrike(staphSentinelAudio2);
      }, 480);
    }
  } catch (err) {
    console.warn('Failed to play Staph Sentinel attack sound:', err);
  }
}

// Preloaded Audio instances for Acid Slime attacks (Clinical Chemistry Minion)
let acidSlimeAudio1: HTMLAudioElement | null = null;
let acidSlimeAudio2: HTMLAudioElement | null = null;
let acidSlimeHeavyTimeoutId: NodeJS.Timeout | null = null;

export function preloadAcidSlimeSounds() {
  if (typeof window === 'undefined') return;
  try {
    if (!acidSlimeAudio1) {
      acidSlimeAudio1 = new Audio('/SoundEffects/AcidSlimeNormal&HeavyAttack.mp3');
      acidSlimeAudio1.preload = 'auto';
      acidSlimeAudio1.playbackRate = 1.0;
      acidSlimeAudio1.load();
    }
    if (!acidSlimeAudio2) {
      acidSlimeAudio2 = new Audio('/SoundEffects/AcidSlimeNormal&HeavyAttack.mp3');
      acidSlimeAudio2.preload = 'auto';
      acidSlimeAudio2.playbackRate = 1.0;
      acidSlimeAudio2.load();
    }
  } catch (e) { }
}

export function playAcidSlimeAttack(type: 'normal' | 'heavy') {
  if (typeof window === 'undefined') return;
  try {
    const masterVolume = getSfxVolume();
    if (masterVolume <= 0) return;

    if (acidSlimeHeavyTimeoutId) {
      clearTimeout(acidSlimeHeavyTimeoutId);
      acidSlimeHeavyTimeoutId = null;
    }

    const src = '/SoundEffects/AcidSlimeNormal&HeavyAttack.mp3';

    // First strike plays immediately at 0ms latency
    const audio1 = acidSlimeAudio1 || new Audio(src);
    audio1.currentTime = 0;
    audio1.playbackRate = 1.0;
    audio1.defaultPlaybackRate = 1.0;
    audio1.volume = Math.max(0, Math.min(1, masterVolume));
    const playPromise1 = audio1.play();
    if (playPromise1 !== undefined) {
      playPromise1.catch(err => {
        console.warn('Playback error for acid slime first strike:', err);
      });
    }

    // Heavy Attack plays the sound effect twice for the double-cycle lunge
    if (type === 'heavy') {
      acidSlimeHeavyTimeoutId = setTimeout(() => {
        try {
          const vol = getSfxVolume();
          if (vol <= 0) return;
          const audio2 = acidSlimeAudio2 || new Audio(src);
          audio2.currentTime = 0;
          audio2.playbackRate = 1.0;
          audio2.defaultPlaybackRate = 1.0;
          audio2.volume = Math.max(0, Math.min(1, vol));
          const playPromise2 = audio2.play();
          if (playPromise2 !== undefined) {
            playPromise2.catch(err => {
              console.warn('Playback error for acid slime heavy second strike:', err);
            });
          }
        } catch (err) {
          console.warn('Failed to play acid slime heavy second strike:', err);
        }
      }, 380);
    }
  } catch (err) {
    console.warn('Failed to play acid slime attack sound:', err);
  }
}

// Preloaded Audio instances for Crystal Golem attacks
let crystalGolemHeavyAudio: HTMLAudioElement | null = null;
let crystalGolemNormalAudio: HTMLAudioElement | null = null;

export function preloadCrystalGolemSounds() {
  if (typeof window === 'undefined') return;
  try {
    if (!crystalGolemHeavyAudio) {
      crystalGolemHeavyAudio = new Audio('/SoundEffects/CrystalGolemHeavyAttack.mp3');
      crystalGolemHeavyAudio.preload = 'auto';
      crystalGolemHeavyAudio.load();
    }
    if (!crystalGolemNormalAudio) {
      crystalGolemNormalAudio = new Audio('/SoundEffects/CrystalGolemNormalAttack.mp3');
      crystalGolemNormalAudio.preload = 'auto';
      crystalGolemNormalAudio.load();
    }
  } catch (e) { }
}

export function playCrystalGolemAttack(type: 'normal' | 'heavy') {
  if (typeof window === 'undefined') return;
  try {
    const masterVolume = getSfxVolume();
    if (masterVolume <= 0) return;

    const src = type === 'heavy'
      ? '/SoundEffects/CrystalGolemHeavyAttack.mp3'
      : '/SoundEffects/CrystalGolemNormalAttack.mp3';

    const baseAudio = type === 'heavy' ? crystalGolemHeavyAudio : crystalGolemNormalAudio;
    let audio: HTMLAudioElement;

    if (baseAudio) {
      baseAudio.currentTime = 0;
      audio = baseAudio;
    } else {
      audio = new Audio(src);
    }

    audio.volume = Math.max(0, Math.min(1, masterVolume));
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(err => {
        console.warn('Playback error for crystal golem ' + type + ' attack:', err);
      });
    }
  } catch (err) {
    console.warn('Failed to play crystal golem attack sound:', err);
  }
}

// Preloaded Audio instance for Debuff / Poison
let debuffAudio: HTMLAudioElement | null = null;

export function preloadDebuffSound() {
  if (typeof window === 'undefined') return;
  try {
    if (!debuffAudio) {
      debuffAudio = new Audio('/SoundEffects/debuff.wav');
      debuffAudio.preload = 'auto';
      debuffAudio.load();
    }
  } catch (e) { }
}

export function playDebuffSound() {
  if (typeof window === 'undefined') return;
  try {
    const masterVolume = getSfxVolume();
    if (masterVolume <= 0) return;

    let audio: HTMLAudioElement;
    if (debuffAudio) {
      if (debuffAudio.paused) {
        debuffAudio.currentTime = 0;
        audio = debuffAudio;
      } else {
        audio = debuffAudio.cloneNode(true) as HTMLAudioElement;
      }
    } else {
      audio = new Audio('/SoundEffects/debuff.wav');
    }

    audio.volume = Math.max(0, Math.min(1, masterVolume));
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(err => {
        console.warn('Playback error for debuff sound:', err);
      });
    }
  } catch (err) {
    console.warn('Failed to play debuff sound:', err);
  }
}

// Preloaded Audio instances for Microbe Swarm attacks
let microbeSwarmHeavyAudio: HTMLAudioElement | null = null;
let microbeSwarmNormalAudio: HTMLAudioElement | null = null;

export function preloadMicrobeSwarmSounds() {
  if (typeof window === 'undefined') return;
  try {
    if (!microbeSwarmHeavyAudio) {
      microbeSwarmHeavyAudio = new Audio('/SoundEffects/MicrobeSwarmHeavyAttack.wav');
      microbeSwarmHeavyAudio.preload = 'auto';
      microbeSwarmHeavyAudio.playbackRate = 0.5;
      microbeSwarmHeavyAudio.load();
    }
    if (!microbeSwarmNormalAudio) {
      microbeSwarmNormalAudio = new Audio('/SoundEffects/MicrobeSwarmNormalAttack.mp3');
      microbeSwarmNormalAudio.preload = 'auto';
      microbeSwarmNormalAudio.playbackRate = 2.0;
      microbeSwarmNormalAudio.load();
    }
  } catch (e) { }
}

export function playMicrobeSwarmAttack(type: 'normal' | 'heavy') {
  if (typeof window === 'undefined') return;
  try {
    const masterVolume = getSfxVolume();
    if (masterVolume <= 0) return;

    const src = type === 'heavy'
      ? '/SoundEffects/MicrobeSwarmHeavyAttack.wav'
      : '/SoundEffects/MicrobeSwarmNormalAttack.mp3';

    const baseAudio = type === 'heavy' ? microbeSwarmHeavyAudio : microbeSwarmNormalAudio;
    let audio: HTMLAudioElement;

    if (baseAudio) {
      baseAudio.currentTime = 0;
      audio = baseAudio;
    } else {
      audio = new Audio(src);
    }

    // Set designated playback speed: fast 2x for Normal Attack, 0.5 for Heavy Attack
    const targetRate = type === 'normal' ? 2.0 : 0.5;
    audio.playbackRate = targetRate;
    audio.defaultPlaybackRate = targetRate;

    audio.volume = Math.max(0, Math.min(1, masterVolume));
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(err => {
        console.warn('Playback error for microbe swarm ' + type + ' attack:', err);
      });
    }
  } catch (err) {
    console.warn('Failed to play microbe swarm attack sound:', err);
  }
}

// Preloaded Audio instances for Sickle-Cell Reaper attacks
let sickleReaperHeavyAudio: HTMLAudioElement | null = null;
let sickleReaperNormalAudio: HTMLAudioElement | null = null;

export function preloadSickleCellReaperSounds() {
  if (typeof window === 'undefined') return;
  try {
    if (!sickleReaperHeavyAudio) {
      sickleReaperHeavyAudio = new Audio('/SoundEffects/SickleCellReaperHeavyAttack.mp3');
      sickleReaperHeavyAudio.preload = 'auto';
      sickleReaperHeavyAudio.playbackRate = 1.0;
      sickleReaperHeavyAudio.load();
    }
    if (!sickleReaperNormalAudio) {
      sickleReaperNormalAudio = new Audio('/SoundEffects/SickleCellReaperNormalAttack.mp3');
      sickleReaperNormalAudio.preload = 'auto';
      sickleReaperNormalAudio.playbackRate = 2.0;
      sickleReaperNormalAudio.load();
    }
  } catch (e) { }
}

export function playSickleCellReaperAttack(type: 'normal' | 'heavy') {
  if (typeof window === 'undefined') return;
  try {
    const masterVolume = getSfxVolume();
    if (masterVolume <= 0) return;

    const src = type === 'heavy'
      ? '/SoundEffects/SickleCellReaperHeavyAttack.mp3'
      : '/SoundEffects/SickleCellReaperNormalAttack.mp3';

    const baseAudio = type === 'heavy' ? sickleReaperHeavyAudio : sickleReaperNormalAudio;
    let audio: HTMLAudioElement;

    if (baseAudio) {
      try {
        baseAudio.currentTime = 0;
      } catch (e) { }
      audio = baseAudio;
    } else {
      audio = new Audio(src);
    }

    // Set designated playback speed: 2x for Normal Attack, normal 1.0x for Heavy Attack
    const targetRate = type === 'normal' ? 2.0 : 1.0;
    audio.playbackRate = targetRate;
    audio.defaultPlaybackRate = targetRate;

    audio.volume = Math.max(0, Math.min(1, masterVolume));
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(err => {
        console.warn('Playback error for sickle reaper ' + type + ' attack:', err);
      });
    }
  } catch (err) {
    console.warn('Failed to play sickle reaper attack sound:', err);
  }
}

// Preloaded Audio instances for Chapter 1 Sickle Cell minion attacks
let sickleCellMinionHeavyAudio: HTMLAudioElement | null = null;
let sickleCellMinionNormalAudio: HTMLAudioElement | null = null;

export function preloadSickleCellMinionSounds() {
  if (typeof window === 'undefined') return;
  try {
    if (!sickleCellMinionHeavyAudio) {
      sickleCellMinionHeavyAudio = new Audio('/SoundEffects/SickleCellHeavyAttack.mp3');
      sickleCellMinionHeavyAudio.preload = 'auto';
      sickleCellMinionHeavyAudio.playbackRate = 1.5;
      sickleCellMinionHeavyAudio.load();
    }
    if (!sickleCellMinionNormalAudio) {
      sickleCellMinionNormalAudio = new Audio('/SoundEffects/SickleCellNormalAttack.mp3');
      sickleCellMinionNormalAudio.preload = 'auto';
      sickleCellMinionNormalAudio.playbackRate = 1.0;
      sickleCellMinionNormalAudio.load();
    }
  } catch (e) { }
}

export function playSickleCellMinionAttack(type: 'normal' | 'heavy') {
  if (typeof window === 'undefined') return;
  try {
    const masterVolume = getSfxVolume();
    if (masterVolume <= 0) return;

    const src = type === 'heavy'
      ? '/SoundEffects/SickleCellHeavyAttack.mp3'
      : '/SoundEffects/SickleCellNormalAttack.mp3';

    const baseAudio = type === 'heavy' ? sickleCellMinionHeavyAudio : sickleCellMinionNormalAudio;
    let audio: HTMLAudioElement;

    if (baseAudio) {
      baseAudio.currentTime = 0;
      audio = baseAudio;
    } else {
      audio = new Audio(src);
    }

    // Normal attack in normal speed (1.0x), Heavy attack in 1.5x speed
    const targetRate = type === 'heavy' ? 1.5 : 1.0;
    audio.playbackRate = targetRate;
    audio.defaultPlaybackRate = targetRate;

    audio.volume = Math.max(0, Math.min(1, masterVolume));
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(err => {
        console.warn('Playback error for sickle cell minion ' + type + ' attack:', err);
      });
    }
  } catch (err) {
    console.warn('Failed to play sickle cell minion attack sound:', err);
  }
}

// Preloaded Audio instances for GMS Fungal Spore attacks (Histopathology Chapter 1)
let fungalSporeHeavyAudio: HTMLAudioElement | null = null;
let fungalSporeNormalAudio: HTMLAudioElement | null = null;

export function preloadFungalSporeSounds() {
  if (typeof window === 'undefined') return;
  try {
    if (!fungalSporeHeavyAudio) {
      fungalSporeHeavyAudio = new Audio('/SoundEffects/FungalSporeHeavyAttack.mp3');
      fungalSporeHeavyAudio.preload = 'auto';
      fungalSporeHeavyAudio.playbackRate = 1.5;
      fungalSporeHeavyAudio.defaultPlaybackRate = 1.5;
      fungalSporeHeavyAudio.load();
    }
    if (!fungalSporeNormalAudio) {
      fungalSporeNormalAudio = new Audio('/SoundEffects/FungalSporeNormalAttack.mp3');
      fungalSporeNormalAudio.preload = 'auto';
      fungalSporeNormalAudio.playbackRate = 2.0;
      fungalSporeNormalAudio.defaultPlaybackRate = 2.0;
      fungalSporeNormalAudio.load();
    }
  } catch (e) { }
}

export function playFungalSporeAttack(type: 'normal' | 'heavy') {
  if (typeof window === 'undefined') return;
  try {
    const masterVolume = getSfxVolume();
    if (masterVolume <= 0) return;

    const src = type === 'heavy'
      ? '/SoundEffects/FungalSporeHeavyAttack.mp3'
      : '/SoundEffects/FungalSporeNormalAttack.mp3';

    const baseAudio = type === 'heavy' ? fungalSporeHeavyAudio : fungalSporeNormalAudio;
    let audio: HTMLAudioElement;

    if (baseAudio) {
      try {
        baseAudio.currentTime = 0;
      } catch (e) { }
      audio = baseAudio;
    } else {
      audio = new Audio(src);
    }

    // Normal attack in 2.0x speed, Heavy attack in 1.5x speed
    const targetRate = type === 'normal' ? 2.0 : 1.5;
    audio.playbackRate = targetRate;
    audio.defaultPlaybackRate = targetRate;

    audio.volume = Math.max(0, Math.min(1, masterVolume));
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(err => {
        console.warn('Playback error for fungal spore ' + type + ' attack:', err);
      });
    }
  } catch (err) {
    console.warn('Failed to play fungal spore attack sound:', err);
  }
}

// Preloaded Audio instances for Chapter 1 Boss Gram Positive Overlord attacks (Microbiology)
let gramPositiveAudio1: HTMLAudioElement | null = null;
let gramPositiveAudio2: HTMLAudioElement | null = null;
let gramPositiveHeavyTimeoutId: NodeJS.Timeout | null = null;

export function preloadGramPositiveSounds() {
  if (typeof window === 'undefined') return;
  try {
    if (!gramPositiveAudio1) {
      gramPositiveAudio1 = new Audio('/SoundEffects/GramPositiveNormal&HeavyAttack.mp3');
      gramPositiveAudio1.preload = 'auto';
      gramPositiveAudio1.playbackRate = 1.0;
      gramPositiveAudio1.load();
    }
    if (!gramPositiveAudio2) {
      gramPositiveAudio2 = new Audio('/SoundEffects/GramPositiveNormal&HeavyAttack.mp3');
      gramPositiveAudio2.preload = 'auto';
      gramPositiveAudio2.playbackRate = 1.0;
      gramPositiveAudio2.load();
    }
  } catch (e) { }
}

export function playGramPositiveAttack(type: 'normal' | 'heavy') {
  if (typeof window === 'undefined') return;
  try {
    const masterVolume = getSfxVolume();
    if (masterVolume <= 0) return;

    if (gramPositiveHeavyTimeoutId) {
      clearTimeout(gramPositiveHeavyTimeoutId);
      gramPositiveHeavyTimeoutId = null;
    }

    const src = '/SoundEffects/GramPositiveNormal&HeavyAttack.mp3';

    // First strike plays immediately at 0ms latency
    const audio1 = gramPositiveAudio1 || new Audio(src);
    audio1.currentTime = 0;
    audio1.playbackRate = 1.0;
    audio1.defaultPlaybackRate = 1.0;
    audio1.volume = Math.max(0, Math.min(1, masterVolume));
    const playPromise1 = audio1.play();
    if (playPromise1 !== undefined) {
      playPromise1.catch(err => {
        console.warn('Playback error for gram positive first strike:', err);
      });
    }

    // Heavy Attack plays the sound effect twice for the 2-cycle attack
    if (type === 'heavy') {
      gramPositiveHeavyTimeoutId = setTimeout(() => {
        try {
          const vol = getSfxVolume();
          if (vol <= 0) return;
          const audio2 = gramPositiveAudio2 || new Audio(src);
          audio2.currentTime = 0;
          audio2.playbackRate = 1.0;
          audio2.defaultPlaybackRate = 1.0;
          audio2.volume = Math.max(0, Math.min(1, vol));
          const playPromise2 = audio2.play();
          if (playPromise2 !== undefined) {
            playPromise2.catch(err => {
              console.warn('Playback error for gram positive heavy second strike:', err);
            });
          }
        } catch (err) {
          console.warn('Failed to play gram positive heavy second strike:', err);
        }
      }, 580);
    }
  } catch (err) {
    console.warn('Failed to play gram positive attack sound:', err);
  }
}

// Preloaded Audio instances for Reagent Strip Slime attacks (Clinical Microscopy Chapter 1 Minion)
let reagentSlimeNormalAudio1: HTMLAudioElement | null = null;
let reagentSlimeNormalAudio2: HTMLAudioElement | null = null;
let reagentSlimeHeavyAudio1: HTMLAudioElement | null = null;
let reagentSlimeHeavyAudio2: HTMLAudioElement | null = null;
let reagentSlimeHeavyAudio3: HTMLAudioElement | null = null;
let reagentSlimeHeavyAudio4: HTMLAudioElement | null = null;
let reagentSlimeTimeoutIds: ReturnType<typeof setTimeout>[] = [];

export function preloadReagentStripSlimeSounds() {
  if (typeof window === 'undefined') return;
  try {
    const src = '/SoundEffects/ReagentStripSlimeNormal&HeavyAttack.mp3';
    if (!reagentSlimeNormalAudio1) {
      reagentSlimeNormalAudio1 = new Audio(src);
      reagentSlimeNormalAudio1.preload = 'auto';
      reagentSlimeNormalAudio1.playbackRate = 1.0;
      reagentSlimeNormalAudio1.load();
    }
    if (!reagentSlimeNormalAudio2) {
      reagentSlimeNormalAudio2 = new Audio(src);
      reagentSlimeNormalAudio2.preload = 'auto';
      reagentSlimeNormalAudio2.playbackRate = 1.0;
      reagentSlimeNormalAudio2.load();
    }
    if (!reagentSlimeHeavyAudio1) {
      reagentSlimeHeavyAudio1 = new Audio(src);
      reagentSlimeHeavyAudio1.preload = 'auto';
      reagentSlimeHeavyAudio1.playbackRate = 2.0;
      reagentSlimeHeavyAudio1.load();
    }
    if (!reagentSlimeHeavyAudio2) {
      reagentSlimeHeavyAudio2 = new Audio(src);
      reagentSlimeHeavyAudio2.preload = 'auto';
      reagentSlimeHeavyAudio2.playbackRate = 2.0;
      reagentSlimeHeavyAudio2.load();
    }
    if (!reagentSlimeHeavyAudio3) {
      reagentSlimeHeavyAudio3 = new Audio(src);
      reagentSlimeHeavyAudio3.preload = 'auto';
      reagentSlimeHeavyAudio3.playbackRate = 2.0;
      reagentSlimeHeavyAudio3.load();
    }
    if (!reagentSlimeHeavyAudio4) {
      reagentSlimeHeavyAudio4 = new Audio(src);
      reagentSlimeHeavyAudio4.preload = 'auto';
      reagentSlimeHeavyAudio4.playbackRate = 2.0;
      reagentSlimeHeavyAudio4.load();
    }
  } catch (e) { }
}

export function playReagentStripSlimeAttack(type: 'normal' | 'heavy') {
  if (typeof window === 'undefined') return;
  try {
    const masterVolume = getSfxVolume();
    if (masterVolume <= 0) return;

    // Clear any previous queued strike timeouts for a clean restart
    reagentSlimeTimeoutIds.forEach(id => clearTimeout(id));
    reagentSlimeTimeoutIds = [];

    const src = '/SoundEffects/ReagentStripSlimeNormal&HeavyAttack.mp3';

    const playStrike = (baseAudio: HTMLAudioElement | null, rate: number = 1.0) => {
      try {
        const vol = getSfxVolume();
        if (vol <= 0) return;
        let audio: HTMLAudioElement;
        if (baseAudio && baseAudio.paused) {
          baseAudio.currentTime = 0;
          audio = baseAudio;
        } else if (baseAudio) {
          audio = baseAudio.cloneNode(true) as HTMLAudioElement;
        } else {
          audio = new Audio(src);
        }
        audio.playbackRate = rate;
        audio.defaultPlaybackRate = rate;
        audio.volume = Math.max(0, Math.min(1, vol));
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(err => {
            console.warn('Playback error for Reagent Strip Slime strike:', err);
          });
        }
      } catch (err) {
        console.warn('Failed to play Reagent Strip Slime strike:', err);
      }
    };

    if (type === 'normal') {
      // Normal Attack: play sound effect twice at normal 1.0x speed
      playStrike(reagentSlimeNormalAudio1, 1.0);

      const timeoutId = setTimeout(() => {
        playStrike(reagentSlimeNormalAudio2, 1.0);
      }, 340);
      reagentSlimeTimeoutIds.push(timeoutId);
    } else {
      // Heavy Attack: play sound effect four times in 2x speed
      playStrike(reagentSlimeHeavyAudio1, 2.0);

      const t1 = setTimeout(() => {
        playStrike(reagentSlimeHeavyAudio2, 2.0);
      }, 175);
      reagentSlimeTimeoutIds.push(t1);

      const t2 = setTimeout(() => {
        playStrike(reagentSlimeHeavyAudio3, 2.0);
      }, 350);
      reagentSlimeTimeoutIds.push(t2);

      const t3 = setTimeout(() => {
        playStrike(reagentSlimeHeavyAudio4, 2.0);
      }, 525);
      reagentSlimeTimeoutIds.push(t3);
    }
  } catch (err) {
    console.warn('Failed to play Reagent Strip Slime attack sound:', err);
  }
}

// Preloaded Audio instances for Anti-Serum Hydra attacks (Immunology Final Boss)
let hydraNormalAudio: HTMLAudioElement | null = null;
let hydraHeavyAudio: HTMLAudioElement | null = null;
let hydraFadeInterval: NodeJS.Timeout | null = null;

export function preloadHydraSounds() {
  if (typeof window === 'undefined') return;
  try {
    if (!hydraNormalAudio) {
      hydraNormalAudio = new Audio('/SoundEffects/AntiSerumHydraNormalAttack.mp3');
      hydraNormalAudio.preload = 'auto';
      hydraNormalAudio.playbackRate = 1.0;
      hydraNormalAudio.defaultPlaybackRate = 1.0;
      hydraNormalAudio.load();
    }
    if (!hydraHeavyAudio) {
      hydraHeavyAudio = new Audio('/SoundEffects/AntiSerumHydraHeavyAttack.mp3');
      hydraHeavyAudio.preload = 'auto';
      hydraHeavyAudio.playbackRate = 2.0;
      hydraHeavyAudio.defaultPlaybackRate = 2.0;
      hydraHeavyAudio.load();
    }
  } catch (e) { }
}

export function playHydraAttack(type: 'normal' | 'heavy') {
  if (typeof window === 'undefined') return;
  try {
    const masterVolume = getSfxVolume();
    if (masterVolume <= 0) return;

    if (hydraFadeInterval) {
      clearInterval(hydraFadeInterval);
      hydraFadeInterval = null;
    }

    if (type === 'normal') {
      const src = '/SoundEffects/AntiSerumHydraNormalAttack.mp3';
      const audio = hydraNormalAudio || new Audio(src);
      audio.currentTime = 0;
      audio.playbackRate = 1.0;
      audio.defaultPlaybackRate = 1.0;
      audio.volume = Math.max(0, Math.min(1, masterVolume));
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.warn('Playback error for Anti-Serum Hydra normal attack:', err);
        });
      }
    } else {
      const src = '/SoundEffects/AntiSerumHydraHeavyAttack.mp3';
      const audio = hydraHeavyAudio || new Audio(src);
      audio.currentTime = 0;
      // Play Heavy attack in x2 speed as requested
      audio.defaultPlaybackRate = 2.0;
      audio.playbackRate = 2.0;
      audio.volume = Math.max(0, Math.min(1, masterVolume));
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.warn('Playback error for Anti-Serum Hydra heavy attack:', err);
        });
      }
    }
  } catch (err) {
    console.warn('Failed to play Anti-Serum Hydra attack sound:', err);
  }
}

export function stopHydraAttack(type?: 'normal' | 'heavy', fadeDurationMs = 300) {
  if (typeof window === 'undefined') return;
  try {
    if (hydraFadeInterval) {
      clearInterval(hydraFadeInterval);
      hydraFadeInterval = null;
    }

    const audios = type === 'normal'
      ? [hydraNormalAudio]
      : type === 'heavy'
      ? [hydraHeavyAudio]
      : [hydraNormalAudio, hydraHeavyAudio];

    audios.forEach(audio => {
      if (!audio || audio.paused) return;
      if (fadeDurationMs <= 0) {
        audio.pause();
        audio.currentTime = 0;
        return;
      }
      const initialVol = audio.volume;
      const stepTime = 30;
      const steps = Math.max(1, Math.floor(fadeDurationMs / stepTime));
      let currentStep = 0;
      hydraFadeInterval = setInterval(() => {
        currentStep++;
        const nextVol = initialVol * (1 - currentStep / steps);
        if (currentStep >= steps || nextVol <= 0.02) {
          if (hydraFadeInterval) {
            clearInterval(hydraFadeInterval);
            hydraFadeInterval = null;
          }
          audio.pause();
          audio.currentTime = 0;
          audio.volume = initialVol;
        } else {
          audio.volume = nextVol;
        }
      }, stepTime);
    });
  } catch (err) {
    console.warn('Failed to stop/fade Hydra attack sound:', err);
  }
}

// Preloaded Audio instances for Ketoacidosis Colossus attacks (Clinical Chemistry Chapter 1 Boss)
let ketoacidosisNormalAudio: HTMLAudioElement | null = null;
let ketoacidosisHeavyAudio: HTMLAudioElement | null = null;

export function preloadKetoacidosisSounds() {
  if (typeof window === 'undefined') return;
  try {
    if (!ketoacidosisNormalAudio) {
      ketoacidosisNormalAudio = new Audio('/SoundEffects/KetoacidosisColossusNormalAttack.mp3');
      ketoacidosisNormalAudio.preload = 'auto';
      ketoacidosisNormalAudio.playbackRate = 1.0;
      ketoacidosisNormalAudio.defaultPlaybackRate = 1.0;
      ketoacidosisNormalAudio.load();
    }
    if (!ketoacidosisHeavyAudio) {
      ketoacidosisHeavyAudio = new Audio('/SoundEffects/KetoacidosisColossusHeavyAttack.mp3');
      ketoacidosisHeavyAudio.preload = 'auto';
      ketoacidosisHeavyAudio.playbackRate = 1.0;
      ketoacidosisHeavyAudio.defaultPlaybackRate = 1.0;
      ketoacidosisHeavyAudio.load();
    }
  } catch (e) { }
}

export function playKetoacidosisAttack(type: 'normal' | 'heavy') {
  if (typeof window === 'undefined') return;
  try {
    const masterVolume = getSfxVolume();
    if (masterVolume <= 0) return;

    if (type === 'normal') {
      const src = '/SoundEffects/KetoacidosisColossusNormalAttack.mp3';
      const audio = ketoacidosisNormalAudio || new Audio(src);
      audio.currentTime = 0;
      audio.playbackRate = 1.0;
      audio.defaultPlaybackRate = 1.0;
      audio.volume = Math.max(0, Math.min(1, masterVolume));
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.warn('Playback error for Ketoacidosis Colossus normal attack:', err);
        });
      }
    } else {
      const src = '/SoundEffects/KetoacidosisColossusHeavyAttack.mp3';
      const audio = ketoacidosisHeavyAudio || new Audio(src);
      audio.currentTime = 0;
      audio.playbackRate = 1.0;
      audio.defaultPlaybackRate = 1.0;
      audio.volume = Math.max(0, Math.min(1, masterVolume));
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.warn('Playback error for Ketoacidosis Colossus heavy attack:', err);
        });
      }
    }
  } catch (err) {
    console.warn('Failed to play Ketoacidosis Colossus attack sound:', err);
  }
}

// Preloaded Audio instances for Legal Beholder attacks (Histopathology & MedTech Laws Chapter 3 Final Boss)
let legalBeholderNormalAudio: HTMLAudioElement | null = null;
let legalBeholderHeavyAudio: HTMLAudioElement | null = null;
let legalBeholderFadeInterval: NodeJS.Timeout | null = null;

export function preloadLegalBeholderSounds() {
  if (typeof window === 'undefined') return;
  try {
    if (!legalBeholderNormalAudio) {
      legalBeholderNormalAudio = new Audio('/SoundEffects/LegalBeholderNormalAttack.mp3');
      legalBeholderNormalAudio.preload = 'auto';
      legalBeholderNormalAudio.playbackRate = 1.0;
      legalBeholderNormalAudio.defaultPlaybackRate = 1.0;
      legalBeholderNormalAudio.load();
    }
    if (!legalBeholderHeavyAudio) {
      legalBeholderHeavyAudio = new Audio('/SoundEffects/LegalBeholderHeavyAttack.mp3');
      legalBeholderHeavyAudio.preload = 'auto';
      legalBeholderHeavyAudio.playbackRate = 1.0;
      legalBeholderHeavyAudio.defaultPlaybackRate = 1.0;
      legalBeholderHeavyAudio.load();
    }
  } catch (e) { }
}

export function playLegalBeholderAttack(type: 'normal' | 'heavy') {
  if (typeof window === 'undefined') return;
  try {
    const masterVolume = getSfxVolume();
    if (masterVolume <= 0) return;

    if (legalBeholderFadeInterval) {
      clearInterval(legalBeholderFadeInterval);
      legalBeholderFadeInterval = null;
    }

    if (type === 'normal') {
      const src = '/SoundEffects/LegalBeholderNormalAttack.mp3';
      const audio = legalBeholderNormalAudio || new Audio(src);
      audio.currentTime = 0;
      audio.playbackRate = 1.0;
      audio.defaultPlaybackRate = 1.0;
      audio.volume = Math.max(0, Math.min(1, masterVolume));
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.warn('Playback error for Legal Beholder normal attack:', err);
        });
      }
    } else {
      const src = '/SoundEffects/LegalBeholderHeavyAttack.mp3';
      const audio = legalBeholderHeavyAudio || new Audio(src);
      audio.currentTime = 0;
      audio.playbackRate = 1.0;
      audio.defaultPlaybackRate = 1.0;
      audio.volume = Math.max(0, Math.min(1, masterVolume));
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.warn('Playback error for Legal Beholder heavy attack:', err);
        });
      }
    }
  } catch (err) {
    console.warn('Failed to play Legal Beholder attack sound:', err);
  }
}

export function stopLegalBeholderAttack(type?: 'normal' | 'heavy', fadeDurationMs = 250) {
  if (typeof window === 'undefined') return;
  try {
    if (legalBeholderFadeInterval) {
      clearInterval(legalBeholderFadeInterval);
      legalBeholderFadeInterval = null;
    }

    const audios = type === 'normal'
      ? [legalBeholderNormalAudio]
      : type === 'heavy'
      ? [legalBeholderHeavyAudio]
      : [legalBeholderNormalAudio, legalBeholderHeavyAudio];

    audios.forEach(audio => {
      if (!audio || audio.paused) return;
      if (fadeDurationMs <= 0) {
        audio.pause();
        audio.currentTime = 0;
        return;
      }
      const initialVol = audio.volume;
      const stepTime = 30;
      const steps = Math.max(1, Math.floor(fadeDurationMs / stepTime));
      let currentStep = 0;
      legalBeholderFadeInterval = setInterval(() => {
        currentStep++;
        const nextVol = initialVol * (1 - currentStep / steps);
        if (currentStep >= steps || nextVol <= 0.02) {
          if (legalBeholderFadeInterval) {
            clearInterval(legalBeholderFadeInterval);
            legalBeholderFadeInterval = null;
          }
          audio.pause();
          audio.currentTime = 0;
          audio.volume = initialVol;
        } else {
          audio.volume = nextVol;
        }
      }, stepTime);
    });
  } catch (err) {
    console.warn('Failed to stop/fade Legal Beholder attack sound:', err);
  }
}

// Preloaded Audio instances for Hyperglycemic Mutant attacks (Clinical Chemistry Chapter 1 Mini-Boss)
let hyperglycemicMutantNormalAudio: HTMLAudioElement | null = null;
let hyperglycemicMutantHeavyAudio: HTMLAudioElement | null = null;

export function preloadHyperglycemicMutantSounds() {
  if (typeof window === 'undefined') return;
  try {
    if (!hyperglycemicMutantNormalAudio) {
      hyperglycemicMutantNormalAudio = new Audio('/SoundEffects/SickleCellNormalAttack.mp3');
      hyperglycemicMutantNormalAudio.preload = 'auto';
      hyperglycemicMutantNormalAudio.playbackRate = 1.0;
      hyperglycemicMutantNormalAudio.defaultPlaybackRate = 1.0;
      hyperglycemicMutantNormalAudio.load();
    }
    if (!hyperglycemicMutantHeavyAudio) {
      hyperglycemicMutantHeavyAudio = new Audio('/SoundEffects/AcidSlimeNormal&HeavyAttack.mp3');
      hyperglycemicMutantHeavyAudio.preload = 'auto';
      hyperglycemicMutantHeavyAudio.playbackRate = 1.0;
      hyperglycemicMutantHeavyAudio.defaultPlaybackRate = 1.0;
      hyperglycemicMutantHeavyAudio.load();
    }
  } catch (e) { }
}

export function playHyperglycemicMutantAttack(type: 'normal' | 'heavy') {
  if (typeof window === 'undefined') return;
  try {
    const masterVolume = getSfxVolume();
    if (masterVolume <= 0) return;

    if (type === 'normal') {
      const src = '/SoundEffects/SickleCellNormalAttack.mp3';
      try {
        if (hyperglycemicMutantNormalAudio) {
          hyperglycemicMutantNormalAudio.currentTime = 0;
          hyperglycemicMutantNormalAudio.volume = Math.max(0, Math.min(1, masterVolume));
          const p = hyperglycemicMutantNormalAudio.play();
          if (p !== undefined) {
            p.catch(() => {
              const freshAudio = new Audio(src);
              freshAudio.volume = Math.max(0, Math.min(1, masterVolume));
              freshAudio.play().catch(() => {});
            });
          }
        } else {
          const freshAudio = new Audio(src);
          freshAudio.volume = Math.max(0, Math.min(1, masterVolume));
          freshAudio.play().catch(() => {});
        }
      } catch {
        const freshAudio = new Audio(src);
        freshAudio.volume = Math.max(0, Math.min(1, masterVolume));
        freshAudio.play().catch(() => {});
      }
    } else {
      const src = '/SoundEffects/AcidSlimeNormal&HeavyAttack.mp3';
      try {
        if (hyperglycemicMutantHeavyAudio) {
          hyperglycemicMutantHeavyAudio.currentTime = 0;
          hyperglycemicMutantHeavyAudio.volume = Math.max(0, Math.min(1, masterVolume));
          const p = hyperglycemicMutantHeavyAudio.play();
          if (p !== undefined) {
            p.catch(() => {
              const freshAudio = new Audio(src);
              freshAudio.volume = Math.max(0, Math.min(1, masterVolume));
              freshAudio.play().catch(() => {});
            });
          }
        } else {
          const freshAudio = new Audio(src);
          freshAudio.volume = Math.max(0, Math.min(1, masterVolume));
          freshAudio.play().catch(() => {});
        }
      } catch {
        const freshAudio = new Audio(src);
        freshAudio.volume = Math.max(0, Math.min(1, masterVolume));
        freshAudio.play().catch(() => {});
      }
    }
  } catch (err) {
    console.warn('Failed to play Hyperglycemic Mutant attack sound:', err);
  }
}




