/**
 * Web Audio Engine for Victorian Telegraph Key
 * Generates tactile mechanical clicks, clacks, and warm telegraph wire tones.
 */

class TelegraphAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private toneOsc: OscillatorNode | null = null;
  private toneGain: GainNode | null = null;
  private toneHarmonicOsc: OscillatorNode | null = null;
  private toneHarmonicGain: GainNode | null = null;

  private isKeyHeld = false;
  private volume = 0.75;
  private isMuted = false;
  private pitch = 600; // Hz
  private trainSoundsEnabled = true;

  constructor() {
    // Load persisted audio settings
    if (typeof window !== 'undefined') {
      const savedVol = localStorage.getItem('telegraph_volume');
      if (savedVol !== null) this.volume = parseFloat(savedVol);
      const savedMute = localStorage.getItem('telegraph_muted');
      if (savedMute !== null) this.isMuted = savedMute === 'true';
      const savedPitch = localStorage.getItem('telegraph_pitch');
      if (savedPitch !== null) this.pitch = parseInt(savedPitch, 10);
      const savedTrain = localStorage.getItem('telegraph_train_sounds');
      if (savedTrain !== null) this.trainSoundsEnabled = savedTrain === 'true';
    }
  }

  public init(): AudioContext {
    if (!this.ctx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(
        this.isMuted ? 0 : this.volume,
        this.ctx.currentTime
      );
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public unlock(): void {
    try {
      this.init();
    } catch (e) {
      console.warn('Audio unlock failed:', e);
    }
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    localStorage.setItem('telegraph_volume', this.volume.toString());
    if (this.ctx && this.masterGain && !this.isMuted) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    localStorage.setItem('telegraph_muted', this.isMuted ? 'true' : 'false');
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setValueAtTime(
        this.isMuted ? 0 : this.volume,
        this.ctx.currentTime
      );
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setPitch(freqHz: number): void {
    this.pitch = Math.max(300, Math.min(1200, freqHz));
    localStorage.setItem('telegraph_pitch', this.pitch.toString());
    if (this.toneOsc && this.ctx) {
      this.toneOsc.frequency.setValueAtTime(this.pitch, this.ctx.currentTime);
    }
    if (this.toneHarmonicOsc && this.ctx) {
      this.toneHarmonicOsc.frequency.setValueAtTime(this.pitch * 2, this.ctx.currentTime);
    }
  }

  public getPitch(): number {
    return this.pitch;
  }

  public setTrainSoundsEnabled(enabled: boolean): void {
    this.trainSoundsEnabled = enabled;
    localStorage.setItem('telegraph_train_sounds', enabled ? 'true' : 'false');
  }

  public getTrainSoundsEnabled(): boolean {
    return this.trainSoundsEnabled;
  }

  /**
   * Procedural steam locomotive chuff sound (short lowpass noise puff).
   * Automatically ducked to zero when telegraph key is held so Morse tone is never obscured.
   */
  public playTrainChuff(intensity = 0.25): void {
    if (this.isMuted || !this.trainSoundsEnabled || this.isKeyHeld) return;
    try {
      const ctx = this.init();
      const duration = 0.08;
      const bufferSize = Math.floor(ctx.sampleRate * duration);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, ctx.currentTime);
      filter.Q.setValueAtTime(1.2, ctx.currentTime);

      const gain = ctx.createGain();
      const now = ctx.currentTime;
      gain.gain.setValueAtTime(intensity * 0.35 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      noise.connect(filter);
      filter.connect(gain);
      if (this.masterGain) gain.connect(this.masterGain);

      noise.start(now);
      noise.stop(now + duration);
    } catch {
      // safe fallback
    }
  }

  /**
   * Distant Victorian steam train whistle (dual sine tones).
   */
  public playTrainWhistle(): void {
    if (this.isMuted || !this.trainSoundsEnabled || this.isKeyHeld) return;
    try {
      const ctx = this.init();
      const now = ctx.currentTime;
      const duration = 0.7;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(440, now);
      osc2.frequency.setValueAtTime(554, now); // Major third interval

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.18 * this.volume, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc1.connect(gain);
      osc2.connect(gain);
      if (this.masterGain) gain.connect(this.masterGain);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + duration);
      osc2.stop(now + duration);
    } catch {
      // safe fallback
    }
  }

  /**
   * Heavy mechanical stamp thud for Victorian red ink seals.
   */
  public playStampThud(): void {
    if (this.isMuted) return;
    try {
      const ctx = this.init();
      const now = ctx.currentTime;
      const duration = 0.22;

      // Deep wood/parchment impact thud (low sine thump)
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.exponentialRampToValueAtTime(32, now + duration);

      const thudGain = ctx.createGain();
      thudGain.gain.setValueAtTime(0.55 * this.volume, now);
      thudGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      // Paper friction burst (filtered noise)
      const bufferSize = Math.floor(ctx.sampleRate * 0.05);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.3 * this.volume, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(thudGain);
      if (this.masterGain) thudGain.connect(this.masterGain);

      noise.connect(filter);
      filter.connect(noiseGain);
      if (this.masterGain) noiseGain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + duration);
      noise.start(now);
      noise.stop(now + 0.05);
    } catch {
      // safe fallback
    }
  }

  /**
   * Long steam hiss when locomotive glides safely onto the siding.
   */
  public playSteamHiss(): void {
    if (this.isMuted || !this.trainSoundsEnabled) return;
    try {
      const ctx = this.init();
      const duration = 1.4;
      const bufferSize = Math.floor(ctx.sampleRate * duration);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, ctx.currentTime);
      filter.Q.setValueAtTime(0.8, ctx.currentTime);

      const gain = ctx.createGain();
      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.22 * this.volume, now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      noise.connect(filter);
      filter.connect(gain);
      if (this.masterGain) gain.connect(this.masterGain);

      noise.start(now);
      noise.stop(now + duration);
    } catch {
      // safe fallback
    }
  }

  /**
   * Generates a mechanical tactile click or clack using filtered noise burst.
   * @param isPress true for sharper contact click, false for softer release clack
   */
  private playMechanicalClick(isPress: boolean): void {
    if (this.isMuted) return;
    const ctx = this.init();
    const duration = isPress ? 0.016 : 0.022; // seconds
    const sampleRate = ctx.sampleRate;
    const bufferSize = Math.floor(sampleRate * duration);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(isPress ? 1800 : 950, ctx.currentTime);
    filter.Q.setValueAtTime(isPress ? 3.0 : 1.8, ctx.currentTime);

    const clickGain = ctx.createGain();
    const now = ctx.currentTime;
    clickGain.gain.setValueAtTime(isPress ? 0.9 : 0.45, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    whiteNoise.connect(filter);
    filter.connect(clickGain);
    if (this.masterGain) {
      clickGain.connect(this.masterGain);
    }

    whiteNoise.start(now);
    whiteNoise.stop(now + duration);
  }

  /**
   * Starts the 600Hz tone with 5ms attack ramp to avoid pops.
   */
  public startTone(): void {
    if (this.isKeyHeld) return;
    this.isKeyHeld = true;

    const ctx = this.init();
    this.playMechanicalClick(true);

    if (this.isMuted) return;

    const now = ctx.currentTime;

    // Primary wire tone (sine)
    this.toneOsc = ctx.createOscillator();
    this.toneOsc.type = 'sine';
    this.toneOsc.frequency.setValueAtTime(this.pitch, now);

    this.toneGain = ctx.createGain();
    this.toneGain.gain.setValueAtTime(0.0001, now);
    // 5ms smooth attack ramp
    this.toneGain.gain.linearRampToValueAtTime(0.35, now + 0.005);

    // Warm subtle 2nd harmonic for brassy wire character
    this.toneHarmonicOsc = ctx.createOscillator();
    this.toneHarmonicOsc.type = 'triangle';
    this.toneHarmonicOsc.frequency.setValueAtTime(this.pitch * 2, now);

    this.toneHarmonicGain = ctx.createGain();
    this.toneHarmonicGain.gain.setValueAtTime(0.0001, now);
    this.toneHarmonicGain.gain.linearRampToValueAtTime(0.08, now + 0.005);

    this.toneOsc.connect(this.toneGain);
    this.toneHarmonicOsc.connect(this.toneHarmonicGain);

    if (this.masterGain) {
      this.toneGain.connect(this.masterGain);
      this.toneHarmonicGain.connect(this.masterGain);
    }

    this.toneOsc.start(now);
    this.toneHarmonicOsc.start(now);
  }

  /**
   * Stops the tone with 5ms release ramp to avoid audio pops.
   */
  public stopTone(): void {
    if (!this.isKeyHeld) return;
    this.isKeyHeld = false;

    if (!this.ctx) return;
    this.playMechanicalClick(false);

    const now = this.ctx.currentTime;
    const oscToStop = this.toneOsc;
    const harmonicToStop = this.toneHarmonicOsc;
    const gainToFade = this.toneGain;
    const harmGainToFade = this.toneHarmonicGain;

    if (gainToFade) {
      gainToFade.gain.setValueAtTime(gainToFade.gain.value, now);
      gainToFade.gain.linearRampToValueAtTime(0.0001, now + 0.005);
    }
    if (harmGainToFade) {
      harmGainToFade.gain.setValueAtTime(harmGainToFade.gain.value, now);
      harmGainToFade.gain.linearRampToValueAtTime(0.0001, now + 0.005);
    }

    setTimeout(() => {
      try {
        oscToStop?.stop();
        oscToStop?.disconnect();
        harmonicToStop?.stop();
        harmonicToStop?.disconnect();
      } catch {
        // safely ignore already stopped
      }
    }, 15);

    this.toneOsc = null;
    this.toneHarmonicOsc = null;
    this.toneGain = null;
    this.toneHarmonicGain = null;
  }

  /**
   * Plays an automated Morse code sequence with visual animation callbacks.
   * Returns a cancel function.
   */
  public playSequence(
    sequence: string,
    onStateChange?: (active: boolean) => void,
    onComplete?: () => void,
    unitMs = 85
  ): () => void {
    let isCancelled = false;
    const timeouts: NodeJS.Timeout[] = [];

    let currentDelay = 0;
    const symbols = sequence.split('');

    symbols.forEach((sym, index) => {
      const isDot = sym === '.';
      const toneDuration = isDot ? unitMs : unitMs * 3;

      // Schedule tone start
      const tStart = setTimeout(() => {
        if (isCancelled) return;
        this.startTone();
        onStateChange?.(true);
      }, currentDelay);
      timeouts.push(tStart);

      currentDelay += toneDuration;

      // Schedule tone stop
      const tStop = setTimeout(() => {
        if (isCancelled) return;
        this.stopTone();
        onStateChange?.(false);
      }, currentDelay);
      timeouts.push(tStop);

      // Gap between symbols within the character (1 unit)
      if (index < symbols.length - 1) {
        currentDelay += unitMs;
      }
    });

    // Schedule completion
    const tComplete = setTimeout(() => {
      if (isCancelled) return;
      onComplete?.();
    }, currentDelay + unitMs * 2);
    timeouts.push(tComplete);

    return () => {
      isCancelled = true;
      timeouts.forEach((t) => clearTimeout(t));
      this.stopTone();
      onStateChange?.(false);
    };
  }
}

export const telegraphAudio = new TelegraphAudioEngine();
