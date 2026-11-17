import { loadPreferences, updatePreferences } from '../prefs/prefs';

let audioCtx: AudioContext | null = null;
let lastAudioContextClass: unknown = null;
let soundMuted = !loadPreferences().sound;

export function isSoundMuted(): boolean {
  return soundMuted;
}

export function setSoundMuted(muted: boolean): void {
  soundMuted = muted;
  updatePreferences({ sound: !muted });
}

export function toggleSoundMuted(): boolean {
  soundMuted = !soundMuted;
  updatePreferences({ sound: !soundMuted });
  return soundMuted;
}

export function syncSoundFromPreferences(): boolean {
  soundMuted = !loadPreferences().sound;
  return soundMuted;
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const AudioContextClass =
    window.AudioContext ||
    // @ts-expect-error fallback for webkitAudioContext
    window.webkitAudioContext;

  if (!AudioContextClass) {
    audioCtx = null;
    lastAudioContextClass = null;
    return null;
  }

  if (!audioCtx || lastAudioContextClass !== AudioContextClass) {
    try {
      audioCtx = new (AudioContextClass as any)();
      lastAudioContextClass = AudioContextClass;
    } catch {
      try {
        audioCtx = (AudioContextClass as any)();
        lastAudioContextClass = AudioContextClass;
      } catch {
        return null;
      }
    }
  }

  return audioCtx;
}

export function playTone(kind: 'correct' | 'incorrect'): void {
  try {
    if (soundMuted) {
      return;
    }
    const ctx = getAudioContext();
    if (!ctx) {
      return;
    }

    if (ctx.state === 'suspended' && typeof ctx.resume === 'function') {
      void ctx.resume();
    }

    const now = ctx.currentTime ?? 0;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (kind === 'correct') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(660, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.start(now);
      osc.stop(now + 0.2);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.15);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.start(now);
      osc.stop(now + 0.2);
    }
  } catch {
    // Audio is a nice-to-have, never block the game flow
  }
}
