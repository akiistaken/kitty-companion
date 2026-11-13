import { LifeStage, SoundStyle } from '../types/kitten';

interface StageVoiceProfile {
  mewBase: number;
  trillBase: number;
  purrLow: number;
  purrLfo: number;
  jumpStart: number;
  jumpEnd: number;
  landStart: number;
  yawnStart: number;
  pokeFreq: number;
  mewSpeed: number;
}

const STAGE_VOICES: Record<LifeStage, StageVoiceProfile> = {
  tiny_kitten: {
    mewBase: 920,
    trillBase: 740,
    purrLow: 74,
    purrLfo: 32,
    jumpStart: 420,
    jumpEnd: 780,
    landStart: 190,
    yawnStart: 620,
    pokeFreq: 980,
    mewSpeed: 0.85,
  },
  junior_kitten: {
    mewBase: 700,
    trillBase: 560,
    purrLow: 64,
    purrLfo: 28,
    jumpStart: 330,
    jumpEnd: 620,
    landStart: 155,
    yawnStart: 500,
    pokeFreq: 760,
    mewSpeed: 0.95,
  },
  young_cat: {
    mewBase: 530,
    trillBase: 440,
    purrLow: 56,
    purrLfo: 25,
    jumpStart: 270,
    jumpEnd: 510,
    landStart: 130,
    yawnStart: 410,
    pokeFreq: 580,
    mewSpeed: 1.05,
  },
  grown_cat: {
    mewBase: 390,
    trillBase: 330,
    purrLow: 46,
    purrLfo: 21,
    jumpStart: 210,
    jumpEnd: 400,
    landStart: 105,
    yawnStart: 310,
    pokeFreq: 420,
    mewSpeed: 1.2,
  },
};

class ChiptuneAudio {
  private ctx: AudioContext | null = null;
  private lastPlayedAt = new Map<string, number>();
  private _enabled = true;
  public volume = 0.25;
  public stage: LifeStage = 'tiny_kitten';
  public style: SoundStyle = 'chiptune';

  get enabled(): boolean {
    return this._enabled;
  }

  set enabled(value: boolean) {
    this._enabled = value;
    if (!value && this.ctx && this.ctx.state === 'running') {
      void this.ctx.suspend().catch(() => {});
    }
  }

  public setStage(stage: LifeStage) {
    this.stage = stage;
  }

  private voice(): StageVoiceProfile {
    return STAGE_VOICES[this.stage] ?? STAGE_VOICES.tiny_kitten;
  }

  private ensureContext(): AudioContext | null {
    if (!this.enabled || this.volume <= 0.01) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private canPlay(key: string, cooldownMs: number): boolean {
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const prev = this.lastPlayedAt.get(key) ?? 0;
    if (now - prev < cooldownMs) return false;
    this.lastPlayedAt.set(key, now);
    return true;
  }

  private tone(
    freqStart: number,
    freqEnd: number,
    duration: number,
    type: OscillatorType = 'triangle',
    gainPeak = 0.16,
    delay = 0,
  ) {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const resolvedType =
      this.style === 'music_box' && type === 'square' ? 'sine' : type;

    osc.type = resolvedType;
    osc.frequency.setValueAtTime(freqStart, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, freqEnd), now + duration);

    const vol = gainPeak * this.volume;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(vol, now + Math.min(0.018, duration * 0.25));
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.025);
  }

  /**
   * Warm rhythmic LFO-modulated cat purr adapted to the current life stage.
   */
  playPurr(intensity: 'soft' | 'happy' = 'happy') {
    const cooldown = intensity === 'soft' ? 6800 : 850;
    if (!this.canPlay(`purr:${intensity}`, cooldown)) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const v = this.voice();
    const cycles = intensity === 'happy' ? 3 : 2;
    const baseAmp = (intensity === 'happy' ? 0.16 : 0.085) * this.volume;

    for (let i = 0; i < cycles; i++) {
      const start = ctx.currentTime + i * 0.42;
      const dur = 0.34;
      const pitchShift = i % 2 === 0 ? 1 : 0.92;

      const oscLow = ctx.createOscillator();
      const oscHarm = ctx.createOscillator();
      oscLow.type = 'triangle';
      oscHarm.type = 'sine';
      oscLow.frequency.setValueAtTime(v.purrLow * pitchShift, start);
      oscLow.frequency.linearRampToValueAtTime(v.purrLow * 0.87 * pitchShift, start + dur);
      oscHarm.frequency.setValueAtTime(v.purrLow * 2 * pitchShift, start);
      oscHarm.frequency.linearRampToValueAtTime(v.purrLow * 1.74 * pitchShift, start + dur);

      const lfo = ctx.createOscillator();
      const lfoDepth = ctx.createGain();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(v.purrLfo, start);
      lfoDepth.gain.setValueAtTime(baseAmp * 0.48, start);

      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, start);
      env.gain.linearRampToValueAtTime(baseAmp, start + 0.06);
      env.gain.setValueAtTime(baseAmp * 0.85, start + dur * 0.65);
      env.gain.exponentialRampToValueAtTime(0.0001, start + dur);

      const harmGain = ctx.createGain();
      harmGain.gain.setValueAtTime(0.45, start);

      lfo.connect(lfoDepth);
      lfoDepth.connect(env.gain);

      oscLow.connect(env);
      oscHarm.connect(harmGain);
      harmGain.connect(env);
      env.connect(ctx.destination);

      oscLow.start(start);
      oscHarm.start(start);
      lfo.start(start);
      oscLow.stop(start + dur + 0.02);
      oscHarm.stop(start + dur + 0.02);
      lfo.stop(start + dur + 0.02);
    }
  }

  /**
   * Expressive mew adapted to life stage (squeaky tiny kitten -> mellow grown cat).
   */
  playMew(highPitch?: boolean, variant?: number) {
    if (!this.canPlay('mew', 350)) return;
    const v = this.voice();
    const pick = variant ?? Math.floor(Math.random() * 3);
    const base = highPitch ? Math.max(v.mewBase, 840) : v.mewBase;
    const spd = v.mewSpeed;
    const wave: OscillatorType = this.style === 'music_box' ? 'sine' : 'triangle';

    if (pick === 0) {
      this.tone(base, base * 1.32, 0.11 * spd, wave, 0.17, 0);
      this.tone(base * 1.28, base * 0.88, 0.13 * spd, wave, 0.13, 0.09 * spd);
    } else if (pick === 1) {
      this.tone(base * 1.1, base * 1.52, 0.09 * spd, wave, 0.16, 0);
      this.tone(base * 1.48, base * 1.18, 0.07 * spd, 'sine', 0.11, 0.07 * spd);
    } else {
      this.tone(base * 0.95, base * 1.25, 0.07 * spd, wave, 0.14, 0);
      this.tone(base * 1.08, base * 1.38, 0.12 * spd, wave, 0.16, 0.09 * spd);
    }
  }

  /**
   * Playful activation trill ("mrrp!") scaled to growth stage.
   */
  playTrill(highPitch?: boolean) {
    if (!this.canPlay('trill', 900)) return;
    const v = this.voice();
    const base = highPitch ? Math.max(v.trillBase, 680) : v.trillBase;
    const wave: OscillatorType = this.style === 'music_box' ? 'sine' : 'triangle';
    this.tone(base, base * 1.18, 0.045, wave, 0.11, 0);
    this.tone(base * 1.12, base * 1.34, 0.045, wave, 0.12, 0.045);
    this.tone(base * 1.26, base * 1.55, 0.065, wave, 0.13, 0.09);
  }

  /**
   * Surprised cute squeak / sassy mrow when poked!
   */
  playPoke(streak = 1) {
    if (!this.canPlay('poke', 180)) return;
    const v = this.voice();
    const pitchBoost = Math.min(1.24, 1 + (streak - 1) * 0.06);
    const f = v.pokeFreq * pitchBoost;
    if (streak >= 3) {
      // Sassy quick double-mep!
      this.tone(f * 1.08, f * 0.85, 0.065, 'triangle', 0.16, 0);
      this.tone(f * 1.15, f * 1.38, 0.075, 'triangle', 0.15, 0.07);
    } else {
      // Surprised bouncy boop-squeak
      this.tone(f * 0.9, f * 1.42, 0.075, 'triangle', 0.16, 0);
      this.tone(f * 1.35, f * 1.05, 0.055, 'sine', 0.1, 0.06);
    }
  }

  playJump() {
    if (!this.canPlay('jump', 140)) return;
    const v = this.voice();
    this.tone(v.jumpStart, v.jumpEnd, 0.09, 'square', 0.075, 0);
  }

  playSoftLand() {
    if (!this.canPlay('land', 180)) return;
    const v = this.voice();
    this.tone(v.landStart, Math.max(45, v.landStart * 0.45), 0.06, 'triangle', 0.09, 0);
  }

  playToyBat() {
    if (!this.canPlay('toybat', 150)) return;
    const v = this.voice();
    const scale = v.mewBase / 530;
    this.tone(320 * scale, 620 * scale, 0.065, 'triangle', 0.11, 0);
    this.tone(540 * scale, 420 * scale, 0.055, 'sine', 0.08, 0.045);
  }

  playCatch() {
    if (!this.canPlay('catch', 250)) return;
    if (this.style === 'music_box') {
      this.tone(659.25, 659.25, 0.11, 'sine', 0.13, 0);
      this.tone(880.0, 880.0, 0.16, 'sine', 0.14, 0.07);
      this.tone(1046.5, 1046.5, 0.2, 'sine', 0.12, 0.14);
    } else {
      this.tone(440, 690, 0.07, 'square', 0.095, 0);
      this.tone(690, 940, 0.08, 'triangle', 0.11, 0.06);
    }
  }

  playChomp() {
    if (!this.canPlay('chomp', 200)) return;
    const v = this.voice();
    const s = Math.max(0.85, Math.min(1.25, v.mewBase / 550));
    this.tone(360 * s, 210 * s, 0.06, 'square', 0.095, 0);
    this.tone(450 * s, 250 * s, 0.06, 'square', 0.09, 0.08);
    this.tone(520 * s, 660 * s, 0.08, 'triangle', 0.08, 0.16);
  }

  playYawn() {
    if (!this.canPlay('yawn', 9000)) return;
    const v = this.voice();
    this.tone(v.yawnStart, v.yawnStart * 1.16, 0.12, 'sine', 0.075, 0);
    this.tone(v.yawnStart * 1.15, v.yawnStart * 0.52, 0.34, 'sine', 0.08, 0.11);
  }

  playUnlock() {
    if (this.style === 'music_box') {
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
      notes.forEach((n, idx) => {
        this.tone(n, n, idx === notes.length - 1 ? 0.35 : 0.16, 'sine', 0.13, idx * 0.085);
      });
    } else {
      this.tone(523.25, 523.25, 0.1, 'square', 0.11, 0);
      this.tone(659.25, 659.25, 0.1, 'square', 0.11, 0.09);
      this.tone(783.99, 783.99, 0.12, 'square', 0.11, 0.18);
      this.tone(1046.5, 1046.5, 0.24, 'triangle', 0.14, 0.28);
    }
  }

  playFocusDone() {
    const notes = [523.25, 659.25, 783.99, 987.77, 1046.5];
    const wave: OscillatorType = this.style === 'music_box' ? 'sine' : 'triangle';
    notes.forEach((n, idx) => {
      this.tone(n, n, idx === notes.length - 1 ? 0.32 : 0.12, wave, 0.13, idx * 0.095);
    });
  }

  /**
   * Soft stationery chime when tapping Akii's gift letterpad.
   */
  playPaperOpen() {
    if (!this.canPlay('paperOpen', 250)) return;
    const wave: OscillatorType = this.style === 'music_box' ? 'sine' : 'triangle';
    this.tone(587.33, 783.99, 0.09, wave, 0.12, 0);
    this.tone(880.0, 1046.5, 0.14, 'sine', 0.13, 0.07);
  }

  /**
   * Magical soft smoke puff + sparkle arpeggio revealing the basket & dragon egg.
   */
  playSmokePoof() {
    if (!this.canPlay('smokePoof', 300)) return;
    this.tone(240, 95, 0.18, 'triangle', 0.14, 0);
    const notes = [523.25, 659.25, 783.99, 1046.5];
    const wave: OscillatorType = this.style === 'music_box' ? 'sine' : 'triangle';
    notes.forEach((n, idx) => {
      this.tone(n, n * 1.03, 0.14, wave, 0.1, 0.06 + idx * 0.055);
    });
  }

  /**
   * Crisp shell crack tap escalating across the 5-second egg-breaking animation.
   */
  playEggCrack(stage: 1 | 2 | 3 | 4) {
    if (!this.canPlay(`crack:${stage}`, 200)) return;
    const base = 280 + stage * 95;
    this.tone(base * 1.4, base * 0.65, 0.055, 'square', 0.12, 0);
    this.tone(base * 1.8, base * 0.9, 0.06, 'triangle', 0.11, 0.035);
    if (stage >= 3) {
      this.tone(783.99 + stage * 90, 1046.5 + stage * 110, 0.11, 'sine', 0.09, 0.06);
    }
  }

  /**
   * Joyful music-box / sparkle fanfare when the dragon egg hatches to reveal the kitten.
   */
  playHatchFanfare() {
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98];
    const wave: OscillatorType = this.style === 'music_box' ? 'sine' : 'triangle';
    notes.forEach((n, idx) => {
      this.tone(n, n, idx === notes.length - 1 ? 0.42 : 0.15, wave, 0.14, idx * 0.075);
    });
  }

  /**
   * Delicate feather wand bell jingle.
   */
  playBellJingle() {
    if (!this.canPlay('bellJingle', 320)) return;
    this.tone(1318.5, 1396.9, 0.07, 'sine', 0.09, 0);
    this.tone(1760.0, 1760.0, 0.11, 'sine', 0.08, 0.05);
  }

  /**
   * Ascending pentatonic plip when popping lavender soap bubbles.
   */
  playBubblePop(combo = 0) {
    if (!this.canPlay('bubblePop', 70)) return;
    const scale = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66];
    const freq = scale[Math.abs(combo) % scale.length];
    this.tone(freq * 0.85, freq * 1.28, 0.085, 'sine', 0.13, 0);
  }

  /**
   * Cheerful sparkle chime when performing a cat trick!
   */
  playTrickChime() {
    if (!this.canPlay('trickChime', 260)) return;
    const wave: OscillatorType = this.style === 'music_box' ? 'sine' : 'triangle';
    this.tone(587.33, 587.33, 0.08, wave, 0.12, 0);
    this.tone(783.99, 783.99, 0.09, wave, 0.12, 0.065);
    this.tone(1046.5, 1174.66, 0.15, 'sine', 0.13, 0.13);
  }

  /**
   * Gentle soft brush stroke tick.
   */
  playBrushStroke() {
    if (!this.canPlay('brushStroke', 240)) return;
    this.tone(420, 560, 0.06, 'sine', 0.065, 0);
  }
}

export const kittenAudio = new ChiptuneAudio();
