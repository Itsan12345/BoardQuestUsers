"use client";

// Web Audio API Synthesizer for Retro RPG Sound Effects
// Zero external assets required - lightweight, crisp, and performant.

type SfxType = 'click' | 'correct' | 'wrong' | 'attack' | 'heal' | 'victory' | 'defeat' | 'flee' | 'debuff' | 'poison' | 'specter_normal' | 'specter_heavy' | 'biohazard_normal' | 'biohazard_heavy' | 'crystal_golem_normal' | 'crystal_golem_heavy' | 'microbe_swarm_normal' | 'microbe_swarm_heavy' | 'sickle_reaper_normal' | 'sickle_reaper_heavy' | 'final_boss_victory' | 'final_boss_defeat' | 'boss_battle_win' | 'boss_battle_lost' | 'learning_win' | 'learning_lost' | 'test_win' | 'test_lost';

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

      case 'crystal_golem_normal': {
        playCrystalGolemAttack('normal');
        break;
      }

      case 'crystal_golem_heavy': {
        playCrystalGolemAttack('heavy');
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
      baseAudio.currentTime = 0;
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

