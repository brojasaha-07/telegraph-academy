/**
 * Voice Audio Manager for Miss Sophia Hartwell (Station Master)
 * Handles voice line playback synchronized with typewriter text,
 * respecting master volume, mute, and user voice toggle preferences.
 */

import { telegraphAudio } from './telegraphAudio';

export const SOPHIA_VOICE_TRACKS = {
  step_01: '/assets/aistudio/sophia_01_07311da2.mp3',
  step_02: '/assets/aistudio/sophia_02_6b558792.mp3',
  step_03_prompt: '/assets/aistudio/sophia_03_9a7dbbed.mp3',
  step_03_correct: '/assets/aistudio/sophia_04_24bee5fc.mp3',
  step_03_wrong: '/assets/aistudio/sophia_05_f054a83b.mp3',
  step_04: '/assets/aistudio/sophia_06_e0a5c505.mp3',
  step_05: '/assets/aistudio/sophia_07_62e81e11.mp3',
  step_06: '/assets/aistudio/sophia_08_5a9adf8d.mp3',
  step_07: '/assets/aistudio/sophia_09_8a86d580.mp3',
  step_08: '/assets/aistudio/sophia_10_ac1e5cf5.mp3',
  certificate_victory: '/assets/aistudio/sophia_11_6456a9e9.mp3',
} as const;

export type SophiaVoiceKey = keyof typeof SOPHIA_VOICE_TRACKS;

// Global singleton state for Sophia's voice playback
let currentAudio: HTMLAudioElement | null = null;
let currentProgressFrame: number | null = null;
let hasUserInteracted = false;

// Listeners for voice enabled changes
type VoiceListener = (enabled: boolean) => void;
const voiceListeners = new Set<VoiceListener>();

// Track user interaction to conform to browser autoplay policy
if (typeof window !== 'undefined') {
  const markInteracted = () => {
    hasUserInteracted = true;
    window.removeEventListener('pointerdown', markInteracted, true);
    window.removeEventListener('keydown', markInteracted, true);
    window.removeEventListener('touchstart', markInteracted, true);
  };
  window.addEventListener('pointerdown', markInteracted, { capture: true, passive: true });
  window.addEventListener('keydown', markInteracted, { capture: true, passive: true });
  window.addEventListener('touchstart', markInteracted, { capture: true, passive: true });
}

export function isVoiceEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  const saved = localStorage.getItem('telegraph_voice_enabled');
  return saved === null ? true : saved === 'true';
}

export function setVoiceEnabled(enabled: boolean): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('telegraph_voice_enabled', enabled ? 'true' : 'false');
  }
  if (!enabled) {
    stopSophiaVoice();
  }
  voiceListeners.forEach((listener) => {
    try {
      listener(enabled);
    } catch {
      // ignore
    }
  });
}

export function subscribeVoiceEnabled(listener: VoiceListener): () => void {
  voiceListeners.add(listener);
  return () => {
    voiceListeners.delete(listener);
  };
}

export function stopSophiaVoice(): void {
  if (currentProgressFrame !== null) {
    cancelAnimationFrame(currentProgressFrame);
    currentProgressFrame = null;
  }
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio.removeAttribute('src');
      currentAudio.load();
    } catch {
      // safe fallback
    }
    currentAudio = null;
  }
}

export function syncSophiaVoiceVolume(): void {
  if (currentAudio) {
    const vol = telegraphAudio.getMuted() || !isVoiceEnabled() ? 0 : telegraphAudio.getVolume();
    currentAudio.volume = Math.max(0, Math.min(1, vol));
  }
}

export interface PlayVoiceCallbacks {
  onProgress?: (progress: number, currentTime: number, duration: number) => void;
  onEnded?: () => void;
  onError?: () => void;
}

/**
 * Plays a voice recording URL while syncing progress with onProgress callback.
 * Stops any previously playing audio immediately so recordings never overlap.
 * Respects master volume and mute settings.
 * Safe from autoplay rejections.
 */
export function playSophiaVoice(
  url: string,
  callbacks?: PlayVoiceCallbacks
): () => void {
  // Always stop previous recording first
  stopSophiaVoice();

  // If voice is disabled or sound is muted, do not start audio
  if (!isVoiceEnabled() || telegraphAudio.getMuted()) {
    callbacks?.onError?.();
    return () => {};
  }

  try {
    const audio = new Audio(url);
    currentAudio = audio;
    audio.preload = 'auto';

    // Respect master volume
    const vol = telegraphAudio.getVolume();
    audio.volume = Math.max(0, Math.min(1, vol));

    let isDisposed = false;

    const stopTracking = () => {
      if (currentProgressFrame !== null) {
        cancelAnimationFrame(currentProgressFrame);
        currentProgressFrame = null;
      }
    };

    const trackProgress = () => {
      if (isDisposed || currentAudio !== audio) return;

      if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
        const progress = Math.min(1, audio.currentTime / audio.duration);
        callbacks?.onProgress?.(progress, audio.currentTime, audio.duration);
      }

      if (!audio.paused && !audio.ended) {
        currentProgressFrame = requestAnimationFrame(trackProgress);
      }
    };

    audio.addEventListener('play', () => {
      if (isDisposed) return;
      stopTracking();
      currentProgressFrame = requestAnimationFrame(trackProgress);
    });

    audio.addEventListener('ended', () => {
      if (isDisposed) return;
      stopTracking();
      if (audio.duration && !isNaN(audio.duration)) {
        callbacks?.onProgress?.(1, audio.duration, audio.duration);
      }
      callbacks?.onEnded?.();
      if (currentAudio === audio) {
        currentAudio = null;
      }
    });

    audio.addEventListener('error', () => {
      if (isDisposed) return;
      stopTracking();
      callbacks?.onError?.();
      if (currentAudio === audio) {
        currentAudio = null;
      }
    });

    // Start playback safely
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          // Playback started successfully
        })
        .catch((err) => {
          // Autoplay policy prevented playback or interrupted by quick navigation
          stopTracking();
          callbacks?.onError?.();
          if (currentAudio === audio) {
            currentAudio = null;
          }
        });
    }

    return () => {
      isDisposed = true;
      stopTracking();
      if (currentAudio === audio) {
        stopSophiaVoice();
      }
    };
  } catch {
    callbacks?.onError?.();
    return () => {};
  }
}
