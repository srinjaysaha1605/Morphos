import { Genome } from '../types/genome';

class SpecimenAudioSynthesizer {
  private ctx: AudioContext | null = null;
  private oscillators: OscillatorNode[] = [];
  private gainNode: GainNode | null = null;
  private isMuted = true;
  private isInitialized = false;

  public init() {
    if (this.isInitialized) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.setValueAtTime(0, this.ctx.currentTime);
      this.gainNode.connect(this.ctx.destination);
      this.isInitialized = true;
    } catch {
      console.warn('Web Audio API not supported in this environment.');
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (!this.isInitialized && !muted) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended' && !muted) {
      void this.ctx.resume();
    }
    if (this.gainNode && this.ctx) {
      const targetGain = muted ? 0 : 0.08; // Quiet ambient volume
      this.gainNode.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.1);
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public updateSpecimenTone(genome: Genome) {
    if (this.isMuted || !this.ctx || !this.gainNode) return;

    // Stop current oscillators
    this.stopOscillators();

    const now = this.ctx.currentTime;
    
    // Calculate base frequency from symmetry & harmonic frequency
    // Microtonal mapping: 55Hz (A1) to 440Hz (A4)
    const baseFreq = 65 + (genome.symmetry * 18) + (genome.harmonicFrequency * 12);
    
    // Fundamental drone
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(baseFreq, now);

    // Harmonic overtone
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'triangle';
    const overtoneRatio = 1 + (genome.branches * 0.25) + (genome.harmonicAmplitude * 0.02);
    osc2.frequency.setValueAtTime(baseFreq * overtoneRatio, now);

    // Sub-bass pulse
    const osc3 = this.ctx.createOscillator();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(baseFreq * 0.5, now);

    // LFO modulator for organic pulse
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.2 + (genome.harmonicFrequency * 0.15), now);

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(0.02, now);

    lfo.connect(lfoGain);
    lfoGain.connect(this.gainNode.gain);

    const specGain = this.ctx.createGain();
    specGain.gain.setValueAtTime(0.04, now);

    osc1.connect(specGain);
    osc2.connect(specGain);
    osc3.connect(specGain);
    specGain.connect(this.gainNode);

    osc1.start(now);
    osc2.start(now);
    osc3.start(now);
    lfo.start(now);

    this.oscillators = [osc1, osc2, osc3, lfo];
  }

  public triggerEvolutionPulse() {
    if (this.isMuted || !this.ctx || !this.gainNode) return;
    const now = this.ctx.currentTime;
    
    // Short crisp high frequency resonance sweep for evolution trigger
    const sweepOsc = this.ctx.createOscillator();
    const sweepGain = this.ctx.createGain();

    sweepOsc.type = 'sine';
    sweepOsc.frequency.setValueAtTime(880, now);
    sweepOsc.frequency.exponentialRampToValueAtTime(110, now + 0.18);

    sweepGain.gain.setValueAtTime(0.06, now);
    sweepGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    sweepOsc.connect(sweepGain);
    sweepGain.connect(this.ctx.destination);

    sweepOsc.start(now);
    sweepOsc.stop(now + 0.2);
  }

  private stopOscillators() {
    this.oscillators.forEach(osc => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // Ignored if already stopped
      }
    });
    this.oscillators = [];
  }
}

export const specimenAudio = new SpecimenAudioSynthesizer();
