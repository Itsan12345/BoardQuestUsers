"use client";

// Web Audio API Synthesizer for Retro RPG Sound Effects
// Zero external assets required - lightweight, crisp, and performant.

type SfxType = 'click' | 'correct' | 'wrong' | 'attack' | 'heal' | 'victory' | 'defeat';

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
    audioCtx.resume().catch(() => {});
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
  } catch (e) {}
  return 0.8;
}

export function isAmbientMusicEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const saved = localStorage.getItem('bq_pref_ambient_music');
    return saved !== 'false';
  } catch (e) {}
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
    }
  } catch (err) {
    console.warn('Audio playback error:', err);
  }
}
