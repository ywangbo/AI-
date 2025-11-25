// 8-bit Audio Engine using Web Audio API

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private bgmOscillators: OscillatorNode[] = [];
  private isMuted: boolean = false;
  private isInitialized: boolean = false;
  private bgmInterval: number | null = null;

  constructor() {}

  init() {
    if (this.isInitialized) return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioContextClass();
    this.masterGain = this.ctx.createGain();
    this.masterGain.connect(this.ctx.destination);
    this.masterGain.gain.value = 0.3; // Default volume
    this.isInitialized = true;
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.3, this.ctx!.currentTime, 0.1);
    }
    return this.isMuted;
  }

  // Play a short square wave beep (Typewriter effect)
  playBlip() {
    if (!this.ctx || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'square';
    // Randomize pitch slightly for organic mechanical feel
    osc.frequency.setValueAtTime(800 + Math.random() * 200, this.ctx.currentTime);
    
    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  // Play a lower tone for keypress
  playKeystroke() {
    if (!this.ctx || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  playEnter() {
    if (!this.ctx || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  playBootSound() {
    if (!this.ctx) this.init();
    if (this.isMuted || !this.ctx) return;
    
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.linearRampToValueAtTime(880, t + 0.5);
    
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.2, t + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 2);

    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start();
    osc.stop(t + 2);
  }

  // Simple procedural 8-bit Arpeggio BGM
  startBGM() {
    if (!this.ctx || this.bgmInterval) return;
    
    const notes = [110, 130.81, 146.83, 164.81, 196.00, 130.81]; // Am7ish pentatonic
    let noteIdx = 0;

    const playNote = () => {
      if (this.isMuted || !this.ctx) return;
      
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'triangle'; // Softer than square for BGM
      osc.frequency.setValueAtTime(notes[noteIdx], this.ctx.currentTime);
      
      gain.gain.setValueAtTime(0.02, this.ctx.currentTime); // Very quiet
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
      
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.5);

      noteIdx = (noteIdx + 1) % notes.length;
    };

    this.bgmInterval = window.setInterval(playNote, 400); // 150 BPM approx
  }

  stopBGM() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }
}

export const audioService = new AudioEngine();