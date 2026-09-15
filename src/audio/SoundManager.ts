/**
 * High-performance Web Audio API Sound Synthesizer for 3D Zombie Survival
 * Completely procedural - no external audio files required, zero latency!
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private heartbeatOsc: OscillatorNode | null = null;
  private heartbeatGain: GainNode | null = null;
  private isHeartbeatPlaying = false;
  private heliOsc1: OscillatorNode | null = null;
  private heliGain: GainNode | null = null;
  private isHeliPlaying = false;
  private sharedNoiseBuffer: AudioBuffer | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();

      this.masterGain.gain.value = 0.8;
      this.sfxGain.gain.value = 0.9;

      this.sfxGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      // Pre-generate 1-second white noise buffer once
      const bufferSize = this.ctx.sampleRate;
      this.sharedNoiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = this.sharedNoiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(volume: number) {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  // --- WEAPONS SOUNDS ---

  public playGunshot(weaponType: 'pistol' | 'shotgun' | 'rifle' | 'marksman' | 'flamethrower' | 'arc_rifle') {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain || !this.sharedNoiseBuffer) return;

      const t = this.ctx.currentTime;

      // Re-use cached noise buffer
      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = this.sharedNoiseBuffer;

      // Filter noise based on gun archetype
      const filter = this.ctx.createBiquadFilter();
      const noiseGain = this.ctx.createGain();

      // Pitch oscillator for the mechanical "punch"
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();

      if (weaponType === 'pistol') {
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1400, t);
        filter.Q.setValueAtTime(1.8, t);

        noiseGain.gain.setValueAtTime(0.7, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, t);
        osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);

        oscGain.gain.setValueAtTime(0.6, t);
        oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

        whiteNoise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.sfxGain);

        osc.connect(oscGain);
        oscGain.connect(this.sfxGain);

        whiteNoise.start(t);
        whiteNoise.stop(t + 0.19);
        osc.start(t);
        osc.stop(t + 0.13);

      } else if (weaponType === 'shotgun') {
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1800, t);
        filter.frequency.exponentialRampToValueAtTime(200, t + 0.35);

        noiseGain.gain.setValueAtTime(1.1, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, t);
        osc.frequency.exponentialRampToValueAtTime(30, t + 0.28);

        oscGain.gain.setValueAtTime(0.8, t);
        oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

        whiteNoise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.sfxGain);

        osc.connect(oscGain);
        oscGain.connect(this.sfxGain);

        whiteNoise.start(t);
        whiteNoise.stop(t + 0.4);
        osc.start(t);
        osc.stop(t + 0.3);

      } else if (weaponType === 'rifle') {
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(600, t);
        filter.frequency.exponentialRampToValueAtTime(100, t + 0.14);

        noiseGain.gain.setValueAtTime(0.65, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(260, t);
        osc.frequency.exponentialRampToValueAtTime(50, t + 0.1);

        oscGain.gain.setValueAtTime(0.5, t);
        oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

        whiteNoise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.sfxGain);

        osc.connect(oscGain);
        oscGain.connect(this.sfxGain);

        whiteNoise.start(t);
        whiteNoise.stop(t + 0.16);
        osc.start(t);
        osc.stop(t + 0.11);

      } else if (weaponType === 'flamethrower') {
        // Continuous chemical roaring flame hiss & ignition
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(950, t);
        filter.frequency.linearRampToValueAtTime(1400, t + 0.08);

        noiseGain.gain.setValueAtTime(0.85, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(75, t);
        osc.frequency.linearRampToValueAtTime(40, t + 0.2);

        oscGain.gain.setValueAtTime(0.5, t);
        oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

        whiteNoise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.sfxGain);

        osc.connect(oscGain);
        oscGain.connect(this.sfxGain);

        whiteNoise.start(t);
        whiteNoise.stop(t + 0.25);
        osc.start(t);
        osc.stop(t + 0.22);

      } else if (weaponType === 'arc_rifle') {
        // High voltage plasma crackle
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(800, t);

        noiseGain.gain.setValueAtTime(0.6, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(2400, t);
        osc.frequency.exponentialRampToValueAtTime(120, t + 0.16);

        oscGain.gain.setValueAtTime(0.7, t);
        oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

        whiteNoise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.sfxGain);

        osc.connect(oscGain);
        oscGain.connect(this.sfxGain);

        whiteNoise.start(t);
        whiteNoise.stop(t + 0.19);
        osc.start(t);
        osc.stop(t + 0.17);

      } else {
        // Marksman (heavy punch & echo)
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1100, t);

        noiseGain.gain.setValueAtTime(0.9, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(450, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.22);

        oscGain.gain.setValueAtTime(0.7, t);
        oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

        whiteNoise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.sfxGain);

        osc.connect(oscGain);
        oscGain.connect(this.sfxGain);

        whiteNoise.start(t);
        whiteNoise.stop(t + 0.42);
        osc.start(t);
        osc.stop(t + 0.25);
      }
    } catch {
      // AudioContext fallback
    }
  }

  public playTrapDeploy() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;

      // Heavy metallic thud
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.15);
      gain.gain.setValueAtTime(0.7, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.16);

      // Metal latch click
      const click = this.ctx.createOscillator();
      const clickGain = this.ctx.createGain();
      click.type = 'square';
      click.frequency.setValueAtTime(1200, t + 0.05);
      click.frequency.exponentialRampToValueAtTime(300, t + 0.1);
      clickGain.gain.setValueAtTime(0.4, t + 0.05);
      clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      click.connect(clickGain);
      clickGain.connect(this.sfxGain);
      click.start(t + 0.05);
      click.stop(t + 0.11);
    } catch {}
  }

  public playTrapSnap() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain || !this.sharedNoiseBuffer) return;
      const t = this.ctx.currentTime;

      // Sharp steel clamp noise
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.sharedNoiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1600, t);
      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(1.0, t);
      nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      noise.connect(filter);
      filter.connect(nGain);
      nGain.connect(this.sfxGain);
      noise.start(t);
      noise.stop(t + 0.13);

      // Resonant metal clang
      const clang = this.ctx.createOscillator();
      const cGain = this.ctx.createGain();
      clang.type = 'sawtooth';
      clang.frequency.setValueAtTime(880, t);
      clang.frequency.exponentialRampToValueAtTime(220, t + 0.25);
      cGain.gain.setValueAtTime(0.7, t);
      cGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      clang.connect(cGain);
      cGain.connect(this.sfxGain);
      clang.start(t);
      clang.stop(t + 0.26);
    } catch {}
  }

  public playCraftSuccess() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;

      // Ascending chord chime
      const freqs = [440, 554.37, 659.25, 880];
      freqs.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const start = t + idx * 0.06;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.35, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(start);
        osc.stop(start + 0.32);
      });
    } catch {}
  }

  public playDryFire() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.exponentialRampToValueAtTime(200, t + 0.04);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.04);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.05);
    } catch {}
  }

  public playReload() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;

      // Mag out click
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.frequency.setValueAtTime(400, t);
      osc1.frequency.exponentialRampToValueAtTime(150, t + 0.08);
      gain1.gain.setValueAtTime(0.3, t);
      gain1.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
      osc1.connect(gain1);
      gain1.connect(this.sfxGain);
      osc1.start(t);
      osc1.stop(t + 0.09);

      // Mag in click (at +0.5s)
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.frequency.setValueAtTime(200, t + 0.5);
      osc2.frequency.exponentialRampToValueAtTime(600, t + 0.58);
      gain2.gain.setValueAtTime(0.4, t + 0.5);
      gain2.gain.exponentialRampToValueAtTime(0.01, t + 0.58);
      osc2.connect(gain2);
      gain2.connect(this.sfxGain);
      osc2.start(t + 0.5);
      osc2.stop(t + 0.6);

      // Slide rack (at +0.9s)
      const osc3 = this.ctx.createOscillator();
      const gain3 = this.ctx.createGain();
      osc3.type = 'triangle';
      osc3.frequency.setValueAtTime(700, t + 0.9);
      osc3.frequency.exponentialRampToValueAtTime(300, t + 1.05);
      gain3.gain.setValueAtTime(0.35, t + 0.9);
      gain3.gain.exponentialRampToValueAtTime(0.01, t + 1.05);
      osc3.connect(gain3);
      gain3.connect(this.sfxGain);
      osc3.start(t + 0.9);
      osc3.stop(t + 1.1);
    } catch {}
  }

  // --- HIT FEEDBACK ---

  public playHitMarker(isHeadshot: boolean) {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      if (isHeadshot) {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1400, t);
        osc.frequency.exponentialRampToValueAtTime(1800, t + 0.12);
        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
      } else {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(550, t);
        osc.frequency.exponentialRampToValueAtTime(350, t + 0.08);
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
      }

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.15);
    } catch {}
  }

  // --- ZOMBIE SOUNDS ---

  public playZombieGroan(type: 'walker' | 'runner' | 'brute') {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      if (type === 'brute') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(70, t);
        osc.frequency.exponentialRampToValueAtTime(45, t + 0.8);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300, t);
        gain.gain.setValueAtTime(0.45, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.9);
      } else if (type === 'runner') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(280, t);
        osc.frequency.linearRampToValueAtTime(380, t + 0.2);
        osc.frequency.exponentialRampToValueAtTime(120, t + 0.5);
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(600, t);
        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
      } else {
        // Walker
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(110, t);
        osc.frequency.linearRampToValueAtTime(90, t + 0.3);
        osc.frequency.exponentialRampToValueAtTime(60, t + 0.65);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, t);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.7);
      }

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.95);
    } catch {}
  }

  public playZombieAttack() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.exponentialRampToValueAtTime(70, t + 0.2);
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.22);
    } catch {}
  }

  // --- PLAYER SOUNDS ---

  public playFootstep(isSprinting: boolean) {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(isSprinting ? 95 : 75, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.06);
      gain.gain.setValueAtTime(isSprinting ? 0.22 : 0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.06);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.07);
    } catch {}
  }

  public playJump() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, t);
      osc.frequency.exponentialRampToValueAtTime(240, t + 0.12);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.13);
    } catch {}
  }

  public playHurt() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(50, t + 0.25);
      gain.gain.setValueAtTime(0.5, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.26);
    } catch {}
  }

  public updateHeartbeat(healthPercent: number) {
    try {
      this.initContext();
      if (!this.ctx || !this.masterGain) return;

      if (healthPercent <= 0.35 && !this.isHeartbeatPlaying) {
        this.isHeartbeatPlaying = true;
        this.heartbeatOsc = this.ctx.createOscillator();
        this.heartbeatGain = this.ctx.createGain();
        this.heartbeatOsc.type = 'sine';
        this.heartbeatOsc.frequency.value = 55;
        this.heartbeatGain.gain.value = 0.18;
        this.heartbeatOsc.connect(this.heartbeatGain);
        this.heartbeatGain.connect(this.masterGain);
        this.heartbeatOsc.start();
      } else if (healthPercent > 0.35 && this.isHeartbeatPlaying) {
        if (this.heartbeatOsc) {
          try {
            this.heartbeatOsc.stop();
            this.heartbeatOsc.disconnect();
          } catch {}
          this.heartbeatOsc = null;
        }
        this.isHeartbeatPlaying = false;
      }
    } catch {}
  }

  // --- ITEM & OBJECTIVE SOUNDS ---

  public playPickup(type: 'ammo' | 'health' | 'armor' | 'cash' | 'weapon') {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';

      if (type === 'health') {
        osc.frequency.setValueAtTime(440, t);
        osc.frequency.exponentialRampToValueAtTime(880, t + 0.15);
      } else if (type === 'armor') {
        osc.frequency.setValueAtTime(300, t);
        osc.frequency.exponentialRampToValueAtTime(600, t + 0.15);
      } else if (type === 'cash') {
        osc.frequency.setValueAtTime(660, t);
        osc.frequency.exponentialRampToValueAtTime(990, t + 0.12);
      } else {
        osc.frequency.setValueAtTime(520, t);
        osc.frequency.exponentialRampToValueAtTime(780, t + 0.12);
      }

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.2);
    } catch {}
  }

  public playCrateOpen() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.linearRampToValueAtTime(320, t + 0.15);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.22);
    } catch {}
  }

  public playWaveAlert() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.linearRampToValueAtTime(440, t + 0.4);
      osc.frequency.linearRampToValueAtTime(220, t + 0.8);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.9);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.95);
    } catch {}
  }

  // --- ENVIRONMENTAL HAZARDS ---

  public playExplosion() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;

      // 1. Deep punch sub-bass oscillator
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'triangle';
      subOsc.frequency.setValueAtTime(140, t);
      subOsc.frequency.exponentialRampToValueAtTime(24, t + 0.6);
      subGain.gain.setValueAtTime(1.0, t);
      subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.85);

      subOsc.connect(subGain);
      subGain.connect(this.sfxGain);
      subOsc.start(t);
      subOsc.stop(t + 0.9);

      // 2. Blast noise burst with lowpass filter sweep
      const bufferSize = this.ctx.sampleRate * 1.4;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, t);
      filter.frequency.exponentialRampToValueAtTime(80, t + 1.2);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(1.2, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 1.35);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.sfxGain);

      noise.start(t);
      noise.stop(t + 1.4);
    } catch {}
  }

  public playElectricArc() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;

      // High voltage buzzing pulse
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, t);
      // FM modulation flutter
      const lfo = this.ctx.createOscillator();
      lfo.frequency.setValueAtTime(30, t);
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(60, t);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1800, t);
      filter.Q.setValueAtTime(3, t);

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      lfo.start(t);
      lfo.stop(t + 0.36);
      osc.start(t);
      osc.stop(t + 0.36);
    } catch {}
  }

  public playHazardTrip() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;

      // Metallic breaker switch snap
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(650, t);
      osc.frequency.exponentialRampToValueAtTime(180, t + 0.1);
      gain.gain.setValueAtTime(0.5, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.12);
    } catch {}
  }

  public playExtractionSiren() {
    try {
      this.initContext();
      if (!this.ctx || !this.masterGain) return;
      const t = this.ctx.currentTime;

      // Heli thumping sound
      if (!this.isHeliPlaying) {
        this.isHeliPlaying = true;
        this.heliOsc1 = this.ctx.createOscillator();
        this.heliGain = this.ctx.createGain();
        this.heliOsc1.type = 'sawtooth';
        this.heliOsc1.frequency.value = 40;
        this.heliGain.gain.value = 0.25;
        this.heliOsc1.connect(this.heliGain);
        this.heliGain.connect(this.masterGain);
        this.heliOsc1.start(t);
      }
    } catch {}
  }

  public stopAmbient() {
    if (this.heartbeatOsc) {
      try { this.heartbeatOsc.stop(); } catch {}
      this.heartbeatOsc = null;
      this.isHeartbeatPlaying = false;
    }
    if (this.heliOsc1) {
      try { this.heliOsc1.stop(); } catch {}
      this.heliOsc1 = null;
      this.isHeliPlaying = false;
    }
  }

  public playSkillPointEarned() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;

      // Ascending three-tone chime (C5 -> E5 -> G5)
      const freqs = [523.25, 659.25, 783.99, 1046.5];
      freqs.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + idx * 0.08);

        gain.gain.setValueAtTime(0, t + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.4, t + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.35);

        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(t + idx * 0.08);
        osc.stop(t + idx * 0.08 + 0.36);
      });
    } catch {}
  }

  public playSkillUpgrade() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;

      // Resonant power-up chord
      const freqs = [220, 329.63, 440, 554.37];
      freqs.forEach((freq) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq * 0.9, t);
        osc.frequency.exponentialRampToValueAtTime(freq, t + 0.15);

        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);

        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(t);
        osc.stop(t + 0.56);
      });
    } catch {}
  }

  public playSkillReset() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(480, t);
      osc.frequency.exponentialRampToValueAtTime(140, t + 0.22);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.25);
    } catch {}
  }

  // --- AUDIO LOGS NARRATIVE & CASSETTE SOUNDS ---

  private tapeStaticNode: AudioBufferSourceNode | null = null;
  private tapeStaticGain: GainNode | null = null;
  private tapeHumOsc: OscillatorNode | null = null;

  public playTapeClick() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;

      // Heavy tactile mechanical click (plastic button snap + metal spring)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.06);

      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.08);

      // High click transient
      const clickOsc = this.ctx.createOscillator();
      const clickGain = this.ctx.createGain();
      clickOsc.type = 'sawtooth';
      clickOsc.frequency.setValueAtTime(2400, t);
      clickOsc.frequency.exponentialRampToValueAtTime(800, t + 0.03);

      clickGain.gain.setValueAtTime(0.25, t);
      clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

      clickOsc.connect(clickGain);
      clickGain.connect(this.sfxGain);
      clickOsc.start(t);
      clickOsc.stop(t + 0.04);
    } catch {}
  }

  public playRadioSquelch() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain || !this.sharedNoiseBuffer) return;
      const t = this.ctx.currentTime;

      // Filtered burst of radio noise
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.sharedNoiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2800, t);
      filter.Q.setValueAtTime(2.5, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      noise.start(t);
      noise.stop(t + 0.17);

      // Walkie-talkie chirp beep
      const beep = this.ctx.createOscillator();
      const beepGain = this.ctx.createGain();
      beep.type = 'sine';
      beep.frequency.setValueAtTime(1760, t + 0.02);
      beep.frequency.setValueAtTime(2200, t + 0.06);

      beepGain.gain.setValueAtTime(0.18, t + 0.02);
      beepGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

      beep.connect(beepGain);
      beepGain.connect(this.sfxGain);
      beep.start(t + 0.02);
      beep.stop(t + 0.13);
    } catch {}
  }

  public startTapeHiss() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain || !this.sharedNoiseBuffer) return;
      this.stopTapeHiss();

      const t = this.ctx.currentTime;
      this.tapeStaticNode = this.ctx.createBufferSource();
      this.tapeStaticNode.buffer = this.sharedNoiseBuffer;
      this.tapeStaticNode.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1800, t);
      filter.Q.setValueAtTime(1.2, t);

      this.tapeStaticGain = this.ctx.createGain();
      this.tapeStaticGain.gain.setValueAtTime(0.01, t);
      this.tapeStaticGain.gain.linearRampToValueAtTime(0.045, t + 0.3);

      this.tapeHumOsc = this.ctx.createOscillator();
      this.tapeHumOsc.type = 'sine';
      this.tapeHumOsc.frequency.setValueAtTime(110, t); // 110Hz tape motor hum

      const humGain = this.ctx.createGain();
      humGain.gain.setValueAtTime(0.02, t);
      this.tapeHumOsc.connect(humGain);
      humGain.connect(this.tapeStaticGain);

      this.tapeStaticNode.connect(filter);
      filter.connect(this.tapeStaticGain);
      this.tapeStaticGain.connect(this.sfxGain);

      this.tapeStaticNode.start(t);
      this.tapeHumOsc.start(t);
    } catch {}
  }

  public stopTapeHiss() {
    try {
      if (this.ctx && this.tapeStaticGain) {
        const t = this.ctx.currentTime;
        this.tapeStaticGain.gain.linearRampToValueAtTime(0.001, t + 0.15);
      }
      setTimeout(() => {
        if (this.tapeStaticNode) {
          try { this.tapeStaticNode.stop(); } catch {}
          this.tapeStaticNode.disconnect();
          this.tapeStaticNode = null;
        }
        if (this.tapeHumOsc) {
          try { this.tapeHumOsc.stop(); } catch {}
          this.tapeHumOsc.disconnect();
          this.tapeHumOsc = null;
        }
        this.tapeStaticGain = null;
      }, 160);
    } catch {}
  }

  /**
   * Narrate log text using Web Speech API (with character vocal tuning)
   * while layered over tape hiss and radio chirps.
   */
  public speakAudioLog(
    text: string,
    voiceConfig: { pitch: number; rate: number },
    onEnd?: () => void
  ) {
    this.playTapeClick();
    this.playRadioSquelch();
    this.startTapeHiss();

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.pitch = voiceConfig.pitch || 1.0;
        utterance.rate = voiceConfig.rate || 0.95;
        utterance.volume = 0.9;

        // Pick an English voice if available
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          const engVoice = voices.find((v) => v.lang.startsWith('en') && !v.name.includes('Google')) ||
            voices.find((v) => v.lang.startsWith('en')) ||
            voices[0];
          if (engVoice) utterance.voice = engVoice;
        }

        utterance.onend = () => {
          this.stopTapeHiss();
          this.playRadioSquelch();
          if (onEnd) onEnd();
        };

        utterance.onerror = () => {
          this.stopTapeHiss();
          if (onEnd) onEnd();
        };

        window.speechSynthesis.speak(utterance);
        return;
      } catch {
        // Fallback handled below
      }
    }

    // Fallback if speechSynthesis is unavailable
    setTimeout(() => {
      this.stopTapeHiss();
      this.playRadioSquelch();
      if (onEnd) onEnd();
    }, 12000);
  }

  public stopAudioLog() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    this.stopTapeHiss();
    this.playTapeClick();
  }
}

export const soundManager = new SoundManager();

