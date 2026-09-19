class SpecimenAudioPlayer {
  private backgroundMusic: HTMLAudioElement | null = null;
  private isMuted = true;
  private isInitialized = false;

  public init() {
    if (this.isInitialized || typeof window === 'undefined') return;

    this.backgroundMusic = new Audio('/music.mp3');
    this.backgroundMusic.loop = true;
    this.backgroundMusic.preload = 'auto';
    this.backgroundMusic.volume = 0.18;
    this.isInitialized = true;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;

    if (!this.isInitialized && !muted) {
      this.init();
    }

    if (!this.backgroundMusic) return;

    this.backgroundMusic.muted = muted;
    this.backgroundMusic.volume = muted ? 0 : 0.18;

    if (muted) {
      this.backgroundMusic.pause();
      return;
    }

    // This is called from the landing-page click, so playback is allowed by
    // browser autoplay policies. Ignore rejection if the browser still blocks it.
    void this.backgroundMusic.play().catch(() => {
      console.warn('Background music could not start. Check that public/music.mp3 exists.');
    });
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public triggerEvolutionPulse() {
    // Keep the existing evolution sound effect synthesized with Web Audio.
    if (typeof window === 'undefined') return;

    try {
      const AudioCtx = window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const sweepOsc = ctx.createOscillator();
      const sweepGain = ctx.createGain();

      sweepOsc.type = 'sine';
      sweepOsc.frequency.setValueAtTime(880, now);
      sweepOsc.frequency.exponentialRampToValueAtTime(110, now + 0.18);

      sweepGain.gain.setValueAtTime(0.06, now);
      sweepGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      sweepOsc.connect(sweepGain);
      sweepGain.connect(ctx.destination);

      sweepOsc.start(now);
      sweepOsc.stop(now + 0.2);
      sweepOsc.addEventListener('ended', () => void ctx.close(), { once: true });
    } catch {
      console.warn('Web Audio API is not supported in this environment.');
    }
  }
}

export const specimenAudio = new SpecimenAudioPlayer();
